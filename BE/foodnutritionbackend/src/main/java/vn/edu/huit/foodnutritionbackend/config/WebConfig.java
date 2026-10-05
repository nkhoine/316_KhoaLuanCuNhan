package vn.edu.huit.foodnutritionbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
	@Value("${foodlens.cors-origins}")
	private String[] origins;

	@Override
	public void addCorsMappings(CorsRegistry r) {
		r.addMapping("/api/**").allowedOrigins(origins)
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS").allowedHeaders("*")
				.allowCredentials(true);
	}
}
