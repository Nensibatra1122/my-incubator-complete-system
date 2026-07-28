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

    @Column(length = 1000)
    private String description;

    private LocalDate startDate;
    private String status;

    // Mentor ke sath proper Relationship (Many-to-One)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mentor_id")
    @JsonIgnoreProperties({"incubations", "hibernateLazyInitializer", "handler"})
    private Mentor mentor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idea_id")
    @JsonIgnoreProperties("incubations")
    private Idea idea;

    public Long getId() {
        return this.incubationId;
    }
}