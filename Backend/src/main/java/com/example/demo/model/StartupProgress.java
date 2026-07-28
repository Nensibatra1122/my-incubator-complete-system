package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "startup_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StartupProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long id;

    @Column(name = "current_phase", nullable = false)
    private String currentPhase;

    @Column(name = "completion_percentage", nullable = false)
    private Integer percentage;

    @Column(name = "startup_id", nullable = false)
    private Long startupId;

    @Column(name = "created_by_email")
    private String createdByEmail;

    // Fixed: Ab ye method sahi value return karega
    public Integer getCompletionPercentage() {
        return this.percentage;
    }
}