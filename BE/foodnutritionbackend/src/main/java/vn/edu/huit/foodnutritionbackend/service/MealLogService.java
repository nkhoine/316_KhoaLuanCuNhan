package vn.edu.huit.foodnutritionbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.*;
import vn.edu.huit.foodnutritionbackend.dto.*;
import vn.edu.huit.foodnutritionbackend.entity.*;
import vn.edu.huit.foodnutritionbackend.repository.*;

@Service
@RequiredArgsConstructor
public class MealLogService {
	private final MealLogRepository logs;
	private final MealLogDetailRepository details;
	private final FoodRepository foods;
	private final UserRepository users;

	// All writes for one user are serialized, including creation of the first meal
	// of the day.
	private User lockUser(Long id) {
		return users.lockById(id).orElseThrow(() -> missing());
	}

	private ResponseStatusException missing() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu");
	}

	private MealDetailResponse dto(MealLogDetail d) {
		return new MealDetailResponse(d.getId(), d.getFood().getId(), d.getFood().getName(), d.getConsumedWeightG(),
				d.getActualCalories(), d.getActualProtein(), d.getActualCarbs(), d.getActualFat(), d.getActualFiber(),
				d.getAiConfidenceScore());
	}

	@Transactional
	public MealDetailResponse addFoodToMeal(Long userId, AddFoodRequest r) {
		User u = lockUser(userId);
		Food f = foods.findById(r.getFoodId()).orElseThrow(() -> missing());
		validateWeight(r.getConsumedWeightG());
		if (f.getBaseServingG() == null || f.getBaseServingG() <= 0)
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Món chưa có khẩu phần chuẩn hợp lệ");
		MealLog m = logs.findByUserAndLogDateAndMealType(u, r.getLogDate(), r.getMealType()).orElseGet(() -> {
			MealLog n = new MealLog();
			n.setUser(u);
			n.setLogDate(r.getLogDate());
			n.setMealType(r.getMealType());
			return logs.save(n);
		});
		MealLogDetail d = new MealLogDetail();
		d.setMealLog(m);
		d.setFood(f);
		d.setConsumedWeightG((float) r.getConsumedWeightG());
		d.setActualCalories(NutritionMath.scale(f.getCalories(), r.getConsumedWeightG(), f.getBaseServingG()));
		d.setActualProtein(NutritionMath.scale(f.getProtein(), r.getConsumedWeightG(), f.getBaseServingG()));
		d.setActualCarbs(NutritionMath.scale(f.getCarbs(), r.getConsumedWeightG(), f.getBaseServingG()));
		d.setActualFat(NutritionMath.scale(f.getFat(), r.getConsumedWeightG(), f.getBaseServingG()));
		d.setActualFiber(f.getFiber() == null ? null
				: NutritionMath.scale(f.getFiber(), r.getConsumedWeightG(), f.getBaseServingG()));
		if (r.getAiConfidenceScore() != null)
			d.setAiConfidenceScore(r.getAiConfidenceScore().floatValue());
		details.saveAndFlush(d);
		recalculate(m);
		return dto(d);
	}

	private void validateWeight(double weight) {
		if (!Double.isFinite(weight) || weight < 0.1 || weight > 10000)
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khẩu phần từ 0.1 đến 10000 gram");
	}

	private MealLogDetail ownDetail(Long userId, Long id) {
		var d = details.findById(id).orElseThrow(() -> missing());
		if (!d.getMealLog().getUser().getId().equals(userId))
			throw missing();
		return d;
	}

	@Transactional
	public MealDetailResponse updateWeight(Long userId, Long id, double weight) {
		lockUser(userId);
		validateWeight(weight);
		var d = ownDetail(userId, id);
		// Scale the stored nutrition snapshot, preserving historical food values.
		d.setActualCalories(NutritionMath.scale(d.getActualCalories(), weight, d.getConsumedWeightG()));
		d.setActualProtein(NutritionMath.scale(d.getActualProtein(), weight, d.getConsumedWeightG()));
		d.setActualCarbs(NutritionMath.scale(d.getActualCarbs(), weight, d.getConsumedWeightG()));
		d.setActualFat(NutritionMath.scale(d.getActualFat(), weight, d.getConsumedWeightG()));
		if (d.getActualFiber() != null)
			d.setActualFiber(NutritionMath.scale(d.getActualFiber(), weight, d.getConsumedWeightG()));
		d.setConsumedWeightG((float) weight);
		details.saveAndFlush(d);
		recalculate(d.getMealLog());
		return dto(d);
	}

	@Transactional
	public void deleteDetail(Long userId, Long id) {
		lockUser(userId);
		var d = ownDetail(userId, id);
		var m = d.getMealLog();
		details.delete(d);
		details.flush();
		recalculate(m);
	}

	private void recalculate(MealLog m) {
		float cal = 0, pro = 0, carb = 0, fat = 0, fiber = 0;
		boolean complete = true;
		for (var d : details.findByMealLogIdOrderById(m.getId())) {
			cal += d.getActualCalories();
			pro += d.getActualProtein();
			carb += d.getActualCarbs();
			fat += d.getActualFat();
			if (d.getActualFiber() == null)
				complete = false;
			else
				fiber += d.getActualFiber();
		}
		m.setTotalCalories(cal);
		m.setTotalProtein(pro);
		m.setTotalCarbs(carb);
		m.setTotalFat(fat);
		m.setTotalFiber(complete ? Float.valueOf(fiber) : null);
		logs.save(m);
	}

	@Transactional(readOnly = true)
	public DailySummaryResponse getDailySummary(Long userId, LocalDate date) {
		var u = users.findById(userId).orElseThrow(() -> missing());
		var response = new DailySummaryResponse();
		response.setLogDate(date);
		var meals = new ArrayList<DailySummaryResponse.MealLogDTO>();
		double cal = 0, pro = 0, carb = 0, fat = 0, fiber = 0;
		boolean complete = true;
		for (var m : logs.findByUserAndLogDate(u, date)) {
			var items = details.findByMealLogIdOrderById(m.getId());
			if (items.isEmpty())
				continue;
			var md = new DailySummaryResponse.MealLogDTO();
			md.setMealLogId(m.getId());
			md.setMealType(m.getMealType());
			double mealCal = 0;
			for (var d : items) {
				mealCal += d.getActualCalories();
				cal += d.getActualCalories();
				pro += d.getActualProtein();
				carb += d.getActualCarbs();
				fat += d.getActualFat();
				if (d.getActualFiber() == null)
					complete = false;
				else
					fiber += d.getActualFiber();
			}
			md.setMealCalories(mealCal);
			md.setItems(items.stream().map(this::dto).toList());
			meals.add(md);
		}
		response.setMeals(meals);
		response.setTotalDailyCalories(cal);
		response.setTotalDailyProtein(pro);
		response.setTotalDailyCarbs(carb);
		response.setTotalDailyFat(fat);
		response.setFiberComplete(complete);
		response.setTotalDailyFiber(complete ? Double.valueOf(fiber) : null);
		return response;
	}
}
