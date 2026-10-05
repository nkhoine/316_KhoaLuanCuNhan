package vn.edu.huit.foodnutritionbackend.controller;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import vn.edu.huit.foodnutritionbackend.dto.ProfileRequest;
import vn.edu.huit.foodnutritionbackend.entity.UserProfile;
import vn.edu.huit.foodnutritionbackend.repository.UserProfileRepository;
import vn.edu.huit.foodnutritionbackend.security.CurrentUserService;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class UserProfileController {
	private final CurrentUserService current;
	private final UserProfileRepository profiles;

	@GetMapping("/me")
	public UserProfile me(Authentication auth) {
		var u = current.requireUser(auth);
		return profiles.findById(u.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có hồ sơ"));
	}

	@PutMapping("/me")
	@Transactional //them de test
	public UserProfile save(Authentication auth, @Valid @RequestBody ProfileRequest r) {
		var u = current.requireUser(auth);
		var p = profiles.findById(u.getId()).orElseGet(UserProfile::new);
		p.setUser(u);
		//p.setUserId(u.getId());
		p.setHeightCm(r.heightCm());
		p.setWeightKg(r.weightKg());
		p.setGoal(r.goal());
		p.setTargetCalories(r.targetCalories());
		p.setTargetProtein(r.targetProtein());
		p.setTargetCarbs(r.targetCarbs());
		p.setTargetFat(r.targetFat());
		p.setBirthDate(r.birthDate());
		p.setGender(r.gender());
		p.setActivityLevel(r.activityLevel());
		return profiles.save(p);
	}
}
