package com.example.demo.service;

import com.example.demo.model.StartupProgress;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.StartupProgressRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class StartupProgressService {

    @Autowired
    private StartupProgressRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public List<StartupProgress> getAll() {
        return repository.findAll();
    }

    public StartupProgress save(StartupProgress progress, Authentication auth) {
        StartupProgress savedProgress = repository.save(progress);

        // Activity Log for StartupProgress save/create
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_STARTUP_PROGRESS");
            log.setDescription("Startup progress record saved/updated successfully.");
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception so main transaction doesn't fail
        }

        return savedProgress;
    }
}