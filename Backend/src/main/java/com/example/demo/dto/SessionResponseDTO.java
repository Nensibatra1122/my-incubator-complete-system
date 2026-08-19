package com.example.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter
public class SessionResponseDTO {
    private Long id;
    private String topic;
    private Long startupId;
    private String startupName;        // Startup ka naam yahan aayega
    private Long mentorId;
    private String mentorEmail;
    private String managedByName;      // Managed by (Mentor ya Admin ka naam)
    private String menteeEmail;
    private LocalDateTime scheduledTime;
    private String status;
    private LocalDateTime createdAt;
}