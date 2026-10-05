package vn.edu.huit.foodnutritionbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.huit.foodnutritionbackend.entity.Food;

import java.util.List;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {

	// Khai báo để Spring Boot tự động sinh câu query tìm theo Category ID
	List<Food> findByCategoryId(Long categoryId);

	List<Food> findByAiLabel(String aiLabel);

	List<Food> findByNameContainingIgnoreCase(String name);

	boolean existsByCategoryId(Long id);
}