package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Getter @Setter @NoArgsConstructor
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;
    private String description;
    private String createdByEmail;
    private LocalDateTime timestamp;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = true)
    @JsonIgnoreProperties("activityLogs")
    private User user;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}