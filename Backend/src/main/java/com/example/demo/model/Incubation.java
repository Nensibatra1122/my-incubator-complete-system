package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "incubations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Incubation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long incubationId;

    private String programName;
    private LocalDate startDate;
    private String category;

    // Financial & Tracking Fields
    private String investorEmail;
    private Double funding;
    private String valuation;

    @Column(name = "timeline_log")
    private String timelineLog;

    private Double progressPercentage;

    // Status field (Automatic feedback trigger ke liye)
    private String status = "ACTIVE";

    // User ID field
    private Long userId;

    // Mentor relationship (Fixed to Mentor type)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id")
    @JsonIgnoreProperties({"incubations", "hibernateLazyInitializer", "handler"})
    private Mentor mentor;

    // Investor relationship
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "investor_id")
    @JsonIgnoreProperties({"incubations", "hibernateLazyInitializer", "handler"})
    private Investor investor;

    // Idea relationship
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idea_id")
    @JsonIgnoreProperties("incubations")
    private Idea idea;

    public Long getId() {
        return this.incubationId;
    }

    public void setId(Long incubationId) {
        this.incubationId = incubationId;
    }

    public String getName() {
        if (this.programName != null && !this.programName.isEmpty()) {
            return this.programName;
        }
        if (this.idea != null && this.idea.getTitle() != null) {
            return this.idea.getTitle();
        }
        return "Incubation #" + this.incubationId;
    }
}