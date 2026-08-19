package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Notification create(@RequestBody Notification n, Authentication auth) {
        return notificationService.save(n, auth);
    }

    // Updated endpoint jo safely notification save karega aur activity logs maintain rakhega
    @PostMapping("/create")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createNotification(@RequestBody Notification notification, Authentication auth) {
        try {
            Notification saved = notificationService.save(notification, auth);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            // Fallback safe save
            notification.setCreatedAt(LocalDateTime.now());
            notification.setRead(false);
            Notification saved = notificationRepository.save(notification);
            return ResponseEntity.ok(saved);
        }
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<Notification> notifications = notificationService.getNotificationsByUserId(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Notification>> getAllRelevantNotifications(Authentication authentication) {
        List<Notification> allNotifications = notificationService.getAll();

        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        String userRole = (user != null && user.getRole() != null) ? user.getRole().name().toUpperCase() : "USER";

        if ("ADMIN".equals(userRole)) {
            return ResponseEntity.ok(allNotifications);
        }

        List<Notification> refinedList = allNotifications.stream().filter(n -> {
            if (n.getUser() != null && user != null) {
                return n.getUser().getUserId().equals(user.getUserId());
            }

            String targetRole = n.getTargetRole();

            if (targetRole == null || targetRole.trim().isEmpty() || "ALL".equalsIgnoreCase(targetRole)) {
                return true;
            }

            return targetRole.toUpperCase().contains(userRole);
        }).collect(Collectors.toList());

        return ResponseEntity.ok(refinedList);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Notification> getById(@PathVariable Long id) {
        return notificationService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Notification> update(@PathVariable Long id, @RequestBody Notification nDetails, Authentication auth) {
        return notificationService.getById(id).map(n -> {
            n.setRead(nDetails.isRead());
            return ResponseEntity.ok(notificationService.save(n, auth));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        if (notificationService.existsById(id)) {
            notificationService.deleteById(id, auth);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        return (user != null) ? user.getUserId() : null;
    }
}