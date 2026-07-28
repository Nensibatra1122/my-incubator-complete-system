package com.example.demo.controller;

import com.example.demo.model.MentorChatMessage;
import com.example.demo.model.User;
import com.example.demo.repository.MentorChatRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentor-chat")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class MentorChatController {

    @Autowired
    private MentorChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MentorChatMessage>> getAllMessages() {
        List<MentorChatMessage> messages = chatRepository.findAllByOrderByCreatedAtAsc();
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
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
        return ResponseEntity.ok(saved);
    }
}