package vn.edu.huit.foodnutritionbackend.dto;

public record MealDetailResponse(Long id, Long foodId, String foodName, Float consumedWeightG, Float actualCalories,
		Float actualProtein, Float actualCarbs, Float actualFat, Float actualFiber, Float aiConfidenceScore) {
}
