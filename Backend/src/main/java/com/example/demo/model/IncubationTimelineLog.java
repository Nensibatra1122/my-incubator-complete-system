package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incubation_timeline_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class IncubationTimelineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    private String phaseTitle;
    private Double progressPercentage;

    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incubation_id", nullable = false)
    private Incubation incubation;
}