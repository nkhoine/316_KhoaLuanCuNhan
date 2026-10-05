package vn.edu.huit.foodnutritionbackend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
public class AddFoodRequest {
	@NotNull
	private LocalDate logDate;
	@NotBlank
	@Pattern(regexp = "BREAKFAST|LUNCH|DINNER|SNACK")
	private String mealType;
	@NotNull
	@Positive
	private Long foodId;
	@DecimalMin("0.1")
	@DecimalMax("10000")
	private double consumedWeightG;
	@DecimalMin("0.0")
	@DecimalMax("1.0")
	private Double aiConfidenceScore;
}
