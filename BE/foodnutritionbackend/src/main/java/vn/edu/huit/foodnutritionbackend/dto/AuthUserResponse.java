package vn.edu.huit.foodnutritionbackend.dto;

public record AuthUserResponse(
    Long id,
    String email,
    String fullName,
    String role
) {}