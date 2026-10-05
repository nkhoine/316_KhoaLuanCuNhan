package vn.edu.huit.foodnutritionbackend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public DaoAuthenticationProvider authenticationProvider(CustomUserDetailsService userDetailsService,
			PasswordEncoder passwordEncoder) {

		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);

		provider.setPasswordEncoder(passwordEncoder);

		return provider;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, DaoAuthenticationProvider provider,
			vn.edu.huit.foodnutritionbackend.repository.UserRepository users) throws Exception {

		http.cors(Customizer.withDefaults())

				.csrf(Customizer.withDefaults())

				.authenticationProvider(provider)
				.addFilterBefore(new ActiveAccountFilter(users),
						org.springframework.security.web.access.intercept.AuthorizationFilter.class)

				.authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

						.requestMatchers("/error").permitAll()

						.requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()

						.requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register").permitAll()

						.requestMatchers("/api/admin/**", "/api/users", "/api/users/**").hasRole("ADMIN")

						.requestMatchers(HttpMethod.GET, "/api/foods", "/api/foods/**", "/api/categories",
								"/api/categories/**")
						.authenticated()

						.requestMatchers("/api/foods", "/api/foods/**", "/api/categories", "/api/categories/**")
						.hasRole("ADMIN")

						.requestMatchers("/api/**").authenticated()

						.anyRequest().denyAll())

				.formLogin(form -> form.loginProcessingUrl("/api/auth/login").usernameParameter("email")
						.passwordParameter("password")

						.successHandler((request, response, authentication) -> {
							response.setStatus(200);
							response.setContentType("application/json;charset=UTF-8");
							response.getWriter().write("{\"message\":\"Đăng nhập thành công\"}");
						})

						.failureHandler((request, response, exception) -> {
							response.setStatus(401);
							response.setContentType("application/json;charset=UTF-8");
							response.getWriter().write("{\"message\":\"Email hoặc mật khẩu không hợp lệ\"}");
						}))

				.logout(logout -> logout.logoutUrl("/api/auth/logout").invalidateHttpSession(true)
						.clearAuthentication(true).deleteCookies("JSESSIONID")

						.logoutSuccessHandler((request, response, authentication) -> {
							response.setStatus(204);
						}))

				.exceptionHandling(errors -> errors.authenticationEntryPoint((request, response, exception) -> {
					response.setStatus(401);
					response.setContentType("application/json;charset=UTF-8");
					response.getWriter().write("{\"message\":\"Bạn chưa đăng nhập\"}");
				})

						.accessDeniedHandler((request, response, exception) -> {
							response.setStatus(403);
							response.setContentType("application/json;charset=UTF-8");
							response.getWriter().write("{\"message\":\"Không có quyền hoặc CSRF token không hợp lệ\"}");
						}))

				.requestCache(cache -> cache.disable());

		return http.build();
	}
}