package com.example.demo.controller;

import com.example.demo.model.MentorChatMessage;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.MentorChatRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/api/mentor-chat", "/api/chat", "/api/chat/rooms"})
@CrossOrigin(origins = {"http://localhost:5173", "http://98.94.6.13"}, allowCredentials = "true")
public class MentorChatController {

    @Autowired
    private MentorChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('MENTOR', 'STUDENT', 'ADMIN', 'USER')")
    public ResponseEntity<List<MentorChatMessage>> getAllMessages() {
        List<MentorChatMessage> messages = chatRepository.findAllByOrderByCreatedAtAsc();
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MENTOR', 'STUDENT', 'ADMIN', 'USER')")
    public ResponseEntity<List<MentorChatMessage>> getChatRoomById(@PathVariable Long id) {
        List<MentorChatMessage> messages = chatRepository.findAllByOrderByCreatedAtAsc();
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/rooms/{id}")
    @PreAuthorize("hasAnyRole('MENTOR', 'STUDENT', 'ADMIN', 'USER')")
    public ResponseEntity<List<MentorChatMessage>> getChatRoomPath(@PathVariable Long id) {
        List<MentorChatMessage> messages = chatRepository.findAllByOrderByCreatedAtAsc();
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MENTOR', 'STUDENT', 'ADMIN')")
    public ResponseEntity<MentorChatMessage> sendMessage(@RequestBody MentorChatMessage incoming, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest().build();
        }

        MentorChatMessage chat = new MentorChatMessage();
        chat.setMessage(incoming.getMessage());
        chat.setSenderEmail(email);
        chat.setSenderRole(user.getRole() != null ? user.getRole().name() : "USER");

        MentorChatMessage saved = chatRepository.save(chat);

        // Trigger notification on new message
        if (notificationRepository != null) {
            try {
                Notification notification = new Notification();
                notification.setTitle("New Mentor Chat Message");
                notification.setMessage(user.getRole() + " sent a new message in chat.");
                notification.setCreatedAt(LocalDateTime.now());
                notificationRepository.save(notification);
            } catch (Exception e) {
                // Safeguard against notification entity differences
            }
        }

        return ResponseEntity.ok(saved);
    }
}