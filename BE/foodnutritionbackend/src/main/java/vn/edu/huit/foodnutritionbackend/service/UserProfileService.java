package vn.edu.huit.foodnutritionbackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.edu.huit.foodnutritionbackend.entity.User;
import vn.edu.huit.foodnutritionbackend.entity.UserProfile;
import vn.edu.huit.foodnutritionbackend.repository.UserProfileRepository;
import vn.edu.huit.foodnutritionbackend.repository.UserRepository;

@Service
public class UserProfileService {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

    // 1. Lấy hồ sơ theo ID người dùng
    public UserProfile getProfileByUserId(Long userId) {
        return userProfileRepository.findById(userId).orElse(null);
    }

    // 2. Tạo mới hoặc Cập nhật hồ sơ (Save or Update)
    public UserProfile saveOrUpdateProfile(Long userId, UserProfile profileData) {
        // Kiểm tra xem User có tồn tại trong hệ thống không
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null; // Trả về null nếu không tìm thấy User
        }

        // Tìm xem Profile đã có sẵn chưa
        UserProfile existingProfile = userProfileRepository.findById(userId).orElse(null);
        
        if (existingProfile == null) {
            // Nếu chưa có -> Tạo mới
            profileData.setUser(user);
            profileData.setUserId(userId);
            return userProfileRepository.save(profileData);
        } else {
            // Nếu đã có -> Cập nhật thông tin
            existingProfile.setHeightCm(profileData.getHeightCm());
            existingProfile.setWeightKg(profileData.getWeightKg());
            existingProfile.setGoal(profileData.getGoal());
            existingProfile.setTargetCalories(profileData.getTargetCalories());
            existingProfile.setTargetProtein(profileData.getTargetProtein());
            existingProfile.setTargetCarbs(profileData.getTargetCarbs());
            existingProfile.setTargetFat(profileData.getTargetFat());
            
            return userProfileRepository.save(existingProfile);
        }
    }
}