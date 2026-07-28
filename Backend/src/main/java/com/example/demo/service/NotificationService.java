package com.example.demo.service;

import com.example.demo.model.Notification;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Notification> getAll() {
        return repository.findAll();
    }

    public List<Notification> getNotificationsByUserId(Long userId) {
        return repository.findByUserUserId(userId);
    }

    public Optional<Notification> getById(Long id) {
        return repository.findById(id);
    }

    public Notification save(Notification notification, Authentication auth) {
        Notification saved = repository.save(notification);

        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_NOTIFICATION");
            log.setDescription("Notification saved: " + (notification.getMessage() != null ? notification.getMessage() : "Saved successfully"));
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }

        return saved;
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public void deleteById(Long id, Authentication auth) {
        repository.deleteById(id);

        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("DELETE_NOTIFICATION");
            log.setDescription("Notification deleted with ID: " + id);
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }
    }

    public void sendNotification(User user, String message) {
        if (user == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setMessage(message);
        notification.setRead(false);
        notification.setUser(user);

        repository.save(notification);

        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SEND_NOTIFICATION");
            log.setDescription("Notification sent to " + user.getEmail() + ": " + message);
            log.setCreatedByEmail(user.getEmail());
            log.setTimestamp(LocalDateTime.now());
            log.setUser(user);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }
    }
}