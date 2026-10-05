package vn.edu.huit.foodnutritionbackend.security;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import vn.edu.huit.foodnutritionbackend.entity.User;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String email) {
		User user = userRepository.findByEmailIgnoreCase(email);

		if (user == null) {
			throw new UsernameNotFoundException("Không tìm thấy tài khoản");
		}

		String role = user.getRole();

		if (!"ADMIN".equals(role) && !"USER".equals(role)) {
			throw new UsernameNotFoundException("Vai trò tài khoản không hợp lệ");
		}

		return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
				.password(user.getPassword()).roles(role).disabled(!"ACTIVE".equals(user.getStatus())).build();
	}
}