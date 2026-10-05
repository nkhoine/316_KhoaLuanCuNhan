package vn.edu.huit.foodnutritionbackend.controller;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.List;
import vn.edu.huit.foodnutritionbackend.dto.DailySummaryResponse;
import vn.edu.huit.foodnutritionbackend.entity.User;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;
import vn.edu.huit.foodnutritionbackend.service.MealLogService;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminController {
	private final UserRepository users;
	private final MealLogService meals;

	public record UserView(Long id, String email, String fullName, String role, String status) {
	}

	public record StatusRequest(@NotNull @Pattern(regexp = "ACTIVE|INACTIVE") String status) {
	}

	public record NameRequest(@NotBlank @Size(max = 100) String fullName) {
	}

	private UserView view(User u) {
		return new UserView(u.getId(), u.getEmail(), u.getFullName(), u.getRole(), u.getStatus());
	}

	private User get(Long id) {
		return users.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
	}

	@GetMapping
	public List<UserView> list() {
		return users.findAll().stream().map(this::view).toList();
	}

	@PatchMapping("/{id}/status")
	public UserView status(@PathVariable Long id, @Valid @RequestBody StatusRequest r) {
		var u = get(id);
		if ("ADMIN".equals(u.getRole()))
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Không khóa quản trị viên qua API này");
		u.setStatus(r.status());
		return view(users.save(u));
	}

	@PatchMapping("/{id}")
	public UserView name(@PathVariable Long id, @Valid @RequestBody NameRequest r) {
		var u = get(id);
		u.setFullName(r.fullName().trim());
		return view(users.save(u));
	}

	@GetMapping("/{id}/meal-logs")
	public DailySummaryResponse diary(@PathVariable Long id,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		return meals.getDailySummary(id, date);
	}
}
