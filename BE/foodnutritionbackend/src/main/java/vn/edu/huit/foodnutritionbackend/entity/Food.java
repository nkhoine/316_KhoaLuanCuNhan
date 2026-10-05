package vn.edu.huit.foodnutritionbackend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "foods")
@Getter
@Setter
public class Food {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// @ManyToOne và @JoinColumn dùng để tạo khóa ngoại (Foreign Key)
	@ManyToOne
	@JoinColumn(name = "category_id")
	private Category category;

	@Column(nullable = false)
	private String name;

	@Column(name = "base_serving_g")
	private Float baseServingG = 100.0f;

	@Column(nullable = false)
	private Float calories;

	@Column(nullable = false)
	private Float protein;

	@Column(nullable = false)
	private Float carbs;

	@Column(nullable = false)
	private Float fat;

	@Column(name = "image_url")
	private String imageUrl;

	// Thêm vào trong class Food.java
	@Column(name = "ai_label")
	private String aiLabel; // Lưu các chuỗi như "pho", "pizza", "hamburger"...
	@Column(name = "fiber")
	private Float fiber;
}