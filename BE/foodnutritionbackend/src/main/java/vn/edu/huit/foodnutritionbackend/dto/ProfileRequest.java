package vn.edu.huit.foodnutritionbackend.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ProfileRequest(@NotNull @DecimalMin("30") @DecimalMax("300") Float heightCm,
		@NotNull @DecimalMin("1") @DecimalMax("700") Float weightKg,
		@NotBlank @Pattern(regexp = "LOSE_WEIGHT|MAINTAIN|GAIN_MUSCLE|GAIN_WEIGHT") String goal,
		@PositiveOrZero @DecimalMax("999999") Float targetCalories,
		@PositiveOrZero @DecimalMax("999999") Float targetProtein,
		@PositiveOrZero @DecimalMax("999999") Float targetCarbs, @PositiveOrZero @DecimalMax("999999") Float targetFat,
		@Past LocalDate birthDate, @Pattern(regexp = "MALE|FEMALE|OTHER") String gender,
		@Pattern(regexp = "SEDENTARY|LIGHT|MODERATE|ACTIVE|VERY_ACTIVE") String activityLevel) {
}
