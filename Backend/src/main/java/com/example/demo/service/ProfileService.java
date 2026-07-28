package com.example.demo.service;

import com.example.demo.model.Profile;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.ProfileRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Profile> getAll() {
        return repository.findAll();
    }

    public Profile save(Profile profile, Authentication auth) {
        Profile savedProfile = repository.save(profile);

        // Activity Log for Profile save/create
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_PROFILE");
            log.setDescription("Profile record saved/updated successfully.");
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception so main transaction doesn't fail
        }

        return savedProfile;
    }
}