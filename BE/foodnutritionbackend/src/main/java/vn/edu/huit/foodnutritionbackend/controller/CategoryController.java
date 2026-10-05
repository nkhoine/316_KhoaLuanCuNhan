package vn.edu.huit.foodnutritionbackend.controller;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import vn.edu.huit.foodnutritionbackend.repository.*;
import vn.edu.huit.foodnutritionbackend.entity.Category;
import vn.edu.huit.foodnutritionbackend.dto.CategoryRequest;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
	private final CategoryRepository categories;
	private final FoodRepository foods;

	private Category get(Long id) {
		return categories.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));
	}

	@GetMapping
	public List<Category> all() {
		return categories.findAll();
	}

	@GetMapping("/{id}")
	public Category one(@PathVariable Long id) {
		return get(id);
	}

	private Category save(Category c, CategoryRequest r) {
		c.setName(r.name().trim());
		c.setDescription(r.description());
		return categories.save(c);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Category create(@Valid @RequestBody CategoryRequest r) {
		return save(new Category(), r);
	}

	@PutMapping("/{id}")
	public Category update(@PathVariable Long id, @Valid @RequestBody CategoryRequest r) {
		return save(get(id), r);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id) {
		if (foods.existsByCategoryId(id))
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Danh mục còn món ăn; hãy chuyển món trước");
		categories.delete(get(id));
	}
}
