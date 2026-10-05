package vn.edu.huit.foodnutritionbackend.controller;

import java.util.Map;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import vn.edu.huit.foodnutritionbackend.dto.AuthUserResponse;
import vn.edu.huit.foodnutritionbackend.entity.User;
import vn.edu.huit.foodnutritionbackend.security.CurrentUserService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final CurrentUserService currentUserService;
	private final vn.edu.huit.foodnutritionbackend.service.AuthService authService;

	@PostMapping("/register")
	@ResponseStatus(org.springframework.http.HttpStatus.CREATED)
	public AuthUserResponse register(
			@jakarta.validation.Valid @RequestBody vn.edu.huit.foodnutritionbackend.dto.RegisterRequest request) {
		return authService.register(request);
	}

	@GetMapping("/csrf")
	public Map<String, String> csrf(CsrfToken csrfToken) {
		return Map.of("headerName", csrfToken.getHeaderName(), "token", csrfToken.getToken());
	}

	@GetMapping("/me")
	public AuthUserResponse me(Authentication authentication) {
		User user = currentUserService.requireUser(authentication);

		return new AuthUserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
	}
}