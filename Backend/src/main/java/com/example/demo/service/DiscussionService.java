package com.example.demo.service;

import com.example.demo.model.DiscussionMessage;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.DiscussionRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DiscussionService {

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired(required = false)
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    public DiscussionMessage postMessage(DiscussionMessage message) {
        // 1. Message save karein
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);
        DiscussionMessage savedMessage = discussionRepository.save(message);

        // 2. Mentions aur Notifications handle karein using entity's helper method
        List<String> targetEmails = message.getMentionedUserEmails();

        if (targetEmails != null && !targetEmails.isEmpty() && notificationRepository != null) {
            for (String targetEmail : targetEmails) {
                if (targetEmail != null && !targetEmail.trim().isEmpty()) {
                    String cleanEmail = targetEmail.trim();

                    // VALIDATION CHECK: Check karein ke user database mein exist karta hai ya nahi
                    if (userRepository != null) {
                        User targetUser = userRepository.findByEmail(cleanEmail).orElse(null);

                        if (targetUser == null) {
                            // Agar user exist nahi karta toh notification skip kar dein
                            continue;
                        }

                        // Agar user valid hai toh notification create aur save karein
                        Notification notification = new Notification();
                        notification.setTitle("New Mention in Discussion");
                        notification.setMessage(message.getSenderEmail() + " mentioned you in project discussion: " + message.getContent());
                        notification.setRecipientEmail(cleanEmail);
                        notification.setTargetRole("MENTION");
                        notification.setRead(false);
                        notification.setCreatedAt(LocalDateTime.now());
                        notification.setUser(targetUser);

                        notificationRepository.save(notification);
                    }
                }
            }
        }

        return savedMessage;
    }

    public List<DiscussionMessage> getProjectFeed(String projectId) {
        return discussionRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public List<DiscussionMessage> getUnreadMentions(String email) {
        return discussionRepository.findByMentionedUserEmailAndIsReadFalse(email);
    }

    public void markAsRead(Long messageId) {
        DiscussionMessage message = discussionRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Discussion message not found with id: " + messageId));
        message.setRead(true);
        discussionRepository.save(message);
    }
}