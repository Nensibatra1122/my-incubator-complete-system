package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Notification create(@RequestBody Notification n, Authentication auth) {
        return notificationService.save(n, auth);
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

        // Agar user ADMIN hai, toh saari notifications dikhao
        if ("ADMIN".equals(userRole)) {
            return ResponseEntity.ok(allNotifications);
        }

        // Refined filtering based on user role and specific recipient/targetRole
        List<Notification> refinedList = allNotifications.stream().filter(n -> {
            // 1. Agar notification directly kisi specific user ko assigned hai, toh sirf usi user ko dikhegi
            if (n.getUser() != null && user != null) {
                return n.getUser().getUserId().equals(user.getUserId());
            }

            String targetRole = n.getTargetRole();

            // 2. Agar targetRole blank ya ALL hai, toh sabhi ko dikhegi
            if (targetRole == null || targetRole.trim().isEmpty() || "ALL".equalsIgnoreCase(targetRole)) {
                return true;
            }

            // 3. Role-based matching (e.g. INVESTOR, USER, STUDENT, etc.)
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