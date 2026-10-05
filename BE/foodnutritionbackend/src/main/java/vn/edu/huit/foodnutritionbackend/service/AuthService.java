package vn.edu.huit.foodnutritionbackend.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import vn.edu.huit.foodnutritionbackend.dto.*;
import vn.edu.huit.foodnutritionbackend.entity.User;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {
	private final UserRepository users;
	private final PasswordEncoder encoder;

	@Transactional
	public AuthUserResponse register(RegisterRequest r) {
		String email = r.email().trim().toLowerCase(Locale.ROOT);
		if (r.password().getBytes(StandardCharsets.UTF_8).length > 72)
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu tối đa 72 byte UTF-8");
		if (users.findByEmailIgnoreCase(email) != null)
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được sử dụng");
		User u = new User();
		u.setEmail(email);
		u.setPassword(encoder.encode(r.password()));
		u.setFullName(r.fullName().trim());
		u.setRole("USER");
		u.setStatus("ACTIVE");
		users.saveAndFlush(u);
		return new AuthUserResponse(u.getId(), u.getEmail(), u.getFullName(), u.getRole());
	}
}
