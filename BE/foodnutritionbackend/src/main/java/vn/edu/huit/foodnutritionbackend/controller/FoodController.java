package vn.edu.huit.foodnutritionbackend.controller;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;
import vn.edu.huit.foodnutritionbackend.service.FoodService;
import vn.edu.huit.foodnutritionbackend.entity.Food;
import vn.edu.huit.foodnutritionbackend.dto.FoodRequest;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class FoodController {
	private final FoodService service;

	@GetMapping
	public List<Food> all(@RequestParam(required = false) String search) {
		return service.getAllFoods(search);
	}

	@GetMapping("/{id}")
	public Food one(@PathVariable Long id) {
		return service.getFoodById(id);
	}

	@GetMapping("/category/{id}")
	public List<Food> category(@PathVariable Long id) {
		return service.getFoodsByCategoryId(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Food create(@Valid @RequestBody FoodRequest r) {
		return service.save(null, r);
	}

	@PutMapping("/{id}")
	public Food update(@PathVariable Long id, @Valid @RequestBody FoodRequest r) {
		return service.save(id, r);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id) {
		service.deleteFood(id);
	}
}
