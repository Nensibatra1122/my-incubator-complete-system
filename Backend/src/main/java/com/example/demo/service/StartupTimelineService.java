package com.example.demo.service;

import com.example.demo.model.StartupTimeline;
import com.example.demo.model.ActivityLog;
import com.example.demo.repository.StartupTimelineRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class StartupTimelineService {

    @Autowired
    private StartupTimelineRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public List<StartupTimeline> getAll() {
        return repository.findAll();
    }

    public StartupTimeline save(StartupTimeline timeline, Authentication auth) {
        StartupTimeline savedTimeline = repository.save(timeline);

        // Activity Log for StartupTimeline save/create
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_STARTUP_TIMELINE");
            log.setDescription("Startup timeline record saved/updated successfully.");
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception so main transaction doesn't fail
        }

        return savedTimeline;
    }
}