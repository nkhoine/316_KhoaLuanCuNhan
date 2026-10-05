package vn.edu.huit.foodnutritionbackend.dto;

import jakarta.validation.constraints.*;

public record CategoryRequest(@NotBlank @Size(max = 100) String name, @Size(max = 2000) String description) {
}
