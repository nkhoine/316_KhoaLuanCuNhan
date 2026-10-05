package vn.edu.huit.foodnutritionbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.huit.foodnutritionbackend.entity.MealLog;
import vn.edu.huit.foodnutritionbackend.entity.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MealLogRepository extends JpaRepository<MealLog, Long> {
    
    // Đã sửa: Truyền trực tiếp đối tượng User vào thay vì Long userId
    Optional<MealLog> findByUserAndLogDateAndMealType(User user, LocalDate logDate, String mealType);
    
    // Đã sửa: Truyền trực tiếp đối tượng User
    List<MealLog> findByUserAndLogDate(User user, LocalDate logDate);
}