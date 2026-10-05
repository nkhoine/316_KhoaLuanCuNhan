package vn.edu.huit.foodnutritionbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
public class UserProfile {

	@Id
	private Long userId;

	// @MapsId giúp dùng chung ID với bảng User (khỏi cần tạo ID tự tăng riêng)
	@OneToOne
	@MapsId
	@JoinColumn(name = "user_id")
	@com.fasterxml.jackson.annotation.JsonIgnore
	private User user;

	@Column(name = "height_cm")
	private Float heightCm;

	@Column(name = "weight_kg")
	private Float weightKg;

	@Column(length = 50)
	private String goal;

	@Column(name = "target_calories")
	private Float targetCalories;

	@Column(name = "target_protein")
	private Float targetProtein;

	@Column(name = "target_carbs")
	private Float targetCarbs;

	@Column(name = "target_fat")
	private Float targetFat;
	@Column(name = "birth_date")
	private java.time.LocalDate birthDate;
	@Column(name = "gender")
	private String gender;
	@Column(name = "activity_level")
	private String activityLevel;
}