package vn.edu.huit.foodnutritionbackend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class DailySummaryResponse {
	private LocalDate logDate;
	private double totalDailyCalories;
	private double totalDailyProtein;
	private double totalDailyCarbs;
	private double totalDailyFat;
	private Double totalDailyFiber;
	private boolean fiberComplete;
	private List<MealLogDTO> meals;

	@Data
	public static class MealLogDTO {
		private Long mealLogId;
		private String mealType;
		private double mealCalories;
		private List<MealDetailResponse> items;
	}
}