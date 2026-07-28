package com.example.demo.service;

import com.example.demo.model.Incubation;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class IncubationService {
    @Autowired private IncubationRepository repository;
    @Autowired private ActivityLogRepository logRepository;
    @Autowired private UserRepository userRepository;

    public List<Incubation> getAll() {
        return repository.findAll();
    }

    public Incubation save(Incubation incubation, Authentication auth) {
        Incubation saved = repository.save(incubation);

        // Activity Log for Incubation creation/update
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_INCUBATION");
            log.setDescription("Incubation record saved/updated for: " + (saved.getId() != null ? saved.getId() : "New"));
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                log.setUser(user);
            }
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log errors to prevent failing the main transaction
        }

        return saved;
    }
}