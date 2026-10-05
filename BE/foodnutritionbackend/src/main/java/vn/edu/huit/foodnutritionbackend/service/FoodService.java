package vn.edu.huit.foodnutritionbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import vn.edu.huit.foodnutritionbackend.entity.Food;
import vn.edu.huit.foodnutritionbackend.dto.FoodRequest;
import vn.edu.huit.foodnutritionbackend.repository.*;

@Service
@RequiredArgsConstructor
public class FoodService {
	private final FoodRepository foods;
	private final CategoryRepository categories;

	public List<Food> getAllFoods(String search) {
		return search == null || search.isBlank() ? foods.findAll()
				: foods.findByNameContainingIgnoreCase(search.trim());
	}

	public Food getFoodById(Long id) {
		return foods.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món"));
	}

	public List<Food> getFoodsByCategoryId(Long id) {
		return foods.findByCategoryId(id);
	}

	@Transactional
	public Food save(Long id, FoodRequest r) {
		var f = id == null ? new Food() : getFoodById(id);
		f.setName(r.name().trim());
		f.setCategory(categories.findById(r.category().id())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh mục không tồn tại")));
		f.setBaseServingG(r.baseServingG());
		f.setCalories(r.calories());
		f.setProtein(r.protein());
		f.setCarbs(r.carbs());
		f.setFat(r.fat());
		f.setFiber(r.fiber());
		f.setAiLabel(r.aiLabel() == null || r.aiLabel().isBlank() ? null : r.aiLabel().trim());
		f.setImageUrl(r.imageUrl());
		return foods.save(f);
	}

	public void deleteFood(Long id) {
		foods.delete(getFoodById(id));
	}
}
