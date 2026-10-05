package vn.edu.huit.foodnutritionbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.huit.foodnutritionbackend.entity.Category;
import vn.edu.huit.foodnutritionbackend.repository.CategoryRepository;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    // 1. Lấy danh sách tất cả danh mục (Read all)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // 2. Lấy 1 danh mục theo ID (Read one)
    public Category getCategoryById(Long id) {
        Optional<Category> category = categoryRepository.findById(id);
        return category.orElse(null);
    }

    // 3. Thêm mới danh mục (Create)
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    // 4. Cập nhật danh mục (Update)
    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = getCategoryById(id);
        if (category != null) {
            category.setName(categoryDetails.getName());
            category.setDescription(categoryDetails.getDescription());
            return categoryRepository.save(category);
        }
        return null;
    }

    // 5. Xóa danh mục (Delete)
    public boolean deleteCategory(Long id) {
        Category category = getCategoryById(id);
        if (category != null) {
            categoryRepository.delete(category);
            return true;
        }
        return false;
    }
}