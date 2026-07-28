package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "ideas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Idea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ideaId;

    @NotBlank(message = "Title cannot be blank")
    private String title;

    @NotBlank(message = "Description cannot be blank")
    @Size(min = 50, message = "Proposal description must contain detailed information (at least 50 characters)")
    @Column(length = 2000)
    private String description;

    @NotBlank(message = "Submitter name is required")
    private String submitterName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String createdByEmail;

    private LocalDate submissionDate = LocalDate.now();

    // Tag field added for filtering and display in pipeline
    private String tagName;

    // Optional field (can be null if not required)
    private Double budget;

    // Proposer fields:
    private String githubUrl;
    private String companyName;

    private String status = "PENDING";

    @OneToMany(mappedBy = "idea", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("idea")
    private List<Incubation> incubations;
}