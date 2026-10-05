package vn.edu.huit.foodnutritionbackend.controller;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import vn.edu.huit.foodnutritionbackend.dto.*;
import vn.edu.huit.foodnutritionbackend.service.MealLogService;
import vn.edu.huit.foodnutritionbackend.security.CurrentUserService;

@RestController
@RequestMapping("/api/meal-logs")
@RequiredArgsConstructor
public class MealLogController {
	private final MealLogService service;
	private final CurrentUserService current;

	@PostMapping("/add-food")
	@ResponseStatus(HttpStatus.CREATED)
	public MealDetailResponse add(Authentication auth, @Valid @RequestBody AddFoodRequest r) {
		return service.addFoodToMeal(current.requireUser(auth).getId(), r);
	}

	@GetMapping({ "", "/daily" })
	public DailySummaryResponse daily(Authentication auth,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return service.getDailySummary(current.requireUser(auth).getId(), date);
	}

	@PatchMapping("/details/{id}")
	public MealDetailResponse update(Authentication auth, @PathVariable Long id, @Valid @RequestBody WeightRequest r) {
		return service.updateWeight(current.requireUser(auth).getId(), id, r.consumedWeightG());
	}

	@DeleteMapping("/details/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(Authentication auth, @PathVariable Long id) {
		service.deleteDetail(current.requireUser(auth).getId(), id);
	}
}
