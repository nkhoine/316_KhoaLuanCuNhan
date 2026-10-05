package vn.edu.huit.foodnutritionbackend.dto;

import jakarta.validation.constraints.*;

public record WeightRequest(@NotNull @DecimalMin("0.1") @DecimalMax("10000") Double consumedWeightG) {
}
