package vn.edu.huit.foodnutritionbackend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.huit.foodnutritionbackend.entity.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {}