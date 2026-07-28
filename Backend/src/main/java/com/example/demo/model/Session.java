package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter @Setter @NoArgsConstructor
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Topic is required")
    @Column(nullable = false)
    private String topic;

    @NotBlank(message = "Mentor email is required")
    @Column(nullable = false)
    private String mentorEmail;

    @NotBlank(message = "Mentee email is required")
    @Column(nullable = false)
    private String menteeEmail;

    // Status ke liye default value "PENDING" set karna sahi rahega
    @Column(nullable = false)
    private String status = "PENDING";

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}