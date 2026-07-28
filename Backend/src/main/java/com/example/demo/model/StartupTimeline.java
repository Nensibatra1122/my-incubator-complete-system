package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "startup_timelines")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StartupTimeline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "timeline_id") // DB mein column ka naam yehi hai
    private Long id;

    @Column(nullable = false)
    private String eventName;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Column(name = "idea_id", nullable = false) // Database mein idea_id hai, startup_id nahi
    private Long ideaId;

    @Column(name = "created_by_email")
    private String createdByEmail;
}