package com.example.demo.controller;

import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "http://localhost:5173")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ActivityLog> getAllLogs() {
        return logRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ActivityLog createLog(@RequestBody ActivityLog activityLog, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        activityLog.setUser(user);
        activityLog.setCreatedByEmail(email);
        activityLog.setTimestamp(LocalDateTime.now());

        return logRepository.save(activityLog);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ActivityLog> updateLog(@PathVariable Long id, @RequestBody ActivityLog logDetails) {
        return logRepository.findById(id).map(log -> {
            log.setAction(logDetails.getAction());
            log.setDescription(logDetails.getDescription());
            return ResponseEntity.ok(logRepository.save(log));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteLog(@PathVariable Long id) {
        if (logRepository.existsById(id)) {
            logRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}