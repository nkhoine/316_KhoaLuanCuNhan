package vn.edu.huit.foodnutritionbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.huit.foodnutritionbackend.entity.MealLogDetail;

@Repository
public interface MealLogDetailRepository extends JpaRepository<MealLogDetail, Long> {
    java.util.List<MealLogDetail> findByMealLogIdOrderById(Long mealLogId);
}