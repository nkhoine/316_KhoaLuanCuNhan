package vn.edu.huit.foodnutritionbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "meal_log_details")
@Getter
@Setter
public class MealLogDetail {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne
	@JoinColumn(name = "meal_log_id")
	private MealLog mealLog;

	@ManyToOne
	@JoinColumn(name = "food_id")
	private Food food;

	@Column(name = "consumed_weight_g", nullable = false)
	private Float consumedWeightG;

	@Column(name = "actual_calories", nullable = false)
	private Float actualCalories;

	@Column(name = "actual_protein", nullable = false)
	private Float actualProtein;

	@Column(name = "actual_carbs", nullable = false)
	private Float actualCarbs;

	@Column(name = "actual_fat", nullable = false)
	private Float actualFat;

	// Lưu độ tự tin của AI (từ 0.0 đến 1.0)
	@Column(name = "ai_confidence_score")
	private Float aiConfidenceScore;
	@Column(name = "actual_fiber")
	private Float actualFiber;
}