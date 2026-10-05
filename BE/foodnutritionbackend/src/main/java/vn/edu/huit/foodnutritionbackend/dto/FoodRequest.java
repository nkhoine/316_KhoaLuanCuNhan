package vn.edu.huit.foodnutritionbackend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record FoodRequest(@NotBlank @Size(max = 255) String name, @NotNull @Valid CategoryRef category,
		@NotNull @DecimalMin("0.1") @DecimalMax("10000") Float baseServingG,
		@NotNull @PositiveOrZero @DecimalMax("999999") Float calories,
		@NotNull @PositiveOrZero @DecimalMax("999999") Float protein,
		@NotNull @PositiveOrZero @DecimalMax("999999") Float carbs,
		@NotNull @PositiveOrZero @DecimalMax("999999") Float fat, @PositiveOrZero @DecimalMax("999999") Float fiber,
		@Size(max = 100) String aiLabel, @Size(max = 255) String imageUrl) {
	public record CategoryRef(@NotNull @Positive Long id) {
	}
}
