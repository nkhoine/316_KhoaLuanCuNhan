package vn.edu.huit.foodnutritionbackend.entity;

import vn.edu.huit.foodnutritionbackend.security.CurrentUserService;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "meal_logs")
@Getter
@Setter
public class MealLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private User user;

	@Column(name = "log_date", nullable = false)
	private LocalDate logDate;

	@Column(name = "meal_type", length = 20)
	private String mealType;

	@Column(name = "total_calories")
	private Float totalCalories = 0f;

	@Column(name = "total_protein")
	private Float totalProtein = 0f;

	@Column(name = "total_carbs")
	private Float totalCarbs = 0f;

	@Column(name = "total_fat")
	private Float totalFat = 0f;

	// Một MealLog (Bữa sáng) có thể có nhiều MealLogDetail (Cơm, Trứng, Rau...)
	@OneToMany(mappedBy = "mealLog", cascade = CascadeType.ALL)
	@JsonIgnore
	private List<MealLogDetail> mealLogDetails;
	@Column(name = "total_fiber")
	private Float totalFiber;
}