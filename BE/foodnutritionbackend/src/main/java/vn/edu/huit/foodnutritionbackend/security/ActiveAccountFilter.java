package vn.edu.huit.foodnutritionbackend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;

public class ActiveAccountFilter extends OncePerRequestFilter {
	private final UserRepository users;

	public ActiveAccountFilter(UserRepository users) {
		this.users = users;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
			throws ServletException, IOException {
		var auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
			var u = users.findByEmailIgnoreCase(auth.getName());
			if (u == null || !"ACTIVE".equals(u.getStatus())
					|| auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_" + u.getRole()))) {
				var session = req.getSession(false);
				if (session != null)
					session.invalidate();
				SecurityContextHolder.clearContext();
				res.setStatus(401);
				res.setContentType("application/json;charset=UTF-8");
				res.getWriter().write("{\"message\":\"Phiên đăng nhập không còn hợp lệ\"}");
				return;
			}
		}
		chain.doFilter(req, res);
	}
}
