package vn.edu.huit.foodnutritionbackend.security;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import vn.edu.huit.foodnutritionbackend.entity.User;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

	private final UserRepository userRepository;

	public User requireUser(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()
				|| authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn chưa đăng nhập");
		}

		User user = userRepository.findByEmailIgnoreCase(authentication.getName());

		if (user == null || !"ACTIVE".equals(user.getStatus())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không hợp lệ");
		}

		return user;
	}
}