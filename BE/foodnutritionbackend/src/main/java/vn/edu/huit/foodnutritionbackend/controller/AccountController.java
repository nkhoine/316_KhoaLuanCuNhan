package vn.edu.huit.foodnutritionbackend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.huit.foodnutritionbackend.dto.AuthUserResponse;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;
import vn.edu.huit.foodnutritionbackend.security.CurrentUserService;

@RestController
@RequestMapping("/api/account")
public class AccountController {
	private final UserRepository users;
	private final CurrentUserService current;

	public AccountController(UserRepository users, CurrentUserService current) {
		this.users = users;
		this.current = current;
	}

	public record NameRequest(@NotBlank @Size(max = 100) String fullName) {
	}

	@PatchMapping("/me")
	@Transactional
	public AuthUserResponse updateName(Authentication auth, @Valid @RequestBody NameRequest request) {
		Long id = current.requireUser(auth).getId();
		var user = users.lockById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản"));
		user.setFullName(request.fullName().trim());
		users.save(user);
		return new AuthUserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
	}
}
