package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Entity
@Table(name = "discussion_messages")
public class DiscussionMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String projectId; // Links message to a specific startup

    @Column(nullable = false)
    private String senderEmail;

    private String senderRole;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private LocalDateTime createdAt;

    // To support multiple mentions and notifications stored as comma-separated string in DB
    @Column(name = "mentioned_user_email", length = 1000)
    private String mentionedUserEmail;

    private boolean isRead = false;

    // Default Constructor
    public DiscussionMessage() {
    }

    // Parameterized Constructor
    public DiscussionMessage(String projectId, String senderEmail, String senderRole, String content, LocalDateTime createdAt, String mentionedUserEmail) {
        this.projectId = projectId;
        this.senderEmail = senderEmail;
        this.senderRole = senderRole;
        this.content = content;
        this.createdAt = createdAt;
        this.mentionedUserEmail = mentionedUserEmail;
        this.isRead = false;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getSenderRole() {
        return senderRole;
    }

    public void setSenderRole(String senderRole) {
        this.senderRole = senderRole;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getMentionedUserEmail() {
        return mentionedUserEmail;
    }

    public void setMentionedUserEmail(String mentionedUserEmail) {
        this.mentionedUserEmail = mentionedUserEmail;
    }

    // 💡 Helper methods to seamlessly support List<String> coming from frontend payload
    public List<String> getMentionedUserEmails() {
        if (mentionedUserEmail == null || mentionedUserEmail.trim().isEmpty()) {
            return List.of();
        }
        return Arrays.stream(mentionedUserEmail.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setMentionedUserEmails(List<String> emails) {
        if (emails == null || emails.isEmpty()) {
            this.mentionedUserEmail = null;
        } else {
            this.mentionedUserEmail = String.join(", ", emails);
        }
    }

    public boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
}