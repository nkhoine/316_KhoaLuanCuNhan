package vn.edu.huit.foodnutritionbackend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@Setter
public class Category {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(columnDefinition = "TEXT")
	private String description;

	// mappedBy = "category" trỏ tới tên biến category bên class Food
	@OneToMany(mappedBy = "category")
	@JsonIgnore // Phải có cái này để khi xuất JSON không bị lặp vô hạn
	private List<Food> foods;
}