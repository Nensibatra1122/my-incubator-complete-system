package com.example.demo.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "ideas")
public class Idea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ideaId;

    private String title;

    @Column(length = 1000)
    private String description;

    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED

    private LocalDate submissionDate;

    private String submitterName;

    private Double budget;

    private String tagName;

    private String createdByEmail;

    private String githubUrl;

    private String companyName;

    // Yeh method automatically database mein insert hone se pehle aaj ki date set kar dega
    @PrePersist
    public void prePersist() {
        if (this.submissionDate == null) {
            this.submissionDate = LocalDate.now();
        }
    }

    // Constructors
    public Idea() {}

    public Idea(String title, String description, String submitterName, Double budget, String tagName, String githubUrl, String companyName) {
        this.title = title;
        this.description = description;
        this.submitterName = submitterName;
        this.budget = budget;
        this.tagName = tagName;
        this.githubUrl = githubUrl;
        this.companyName = companyName;
        this.submissionDate = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() {
        return ideaId;
    }

    public void setId(Long ideaId) {
        this.ideaId = ideaId;
    }

    public Long getIdeaId() {
        return ideaId;
    }

    public void setIdeaId(Long ideaId) {
        this.ideaId = ideaId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(LocalDate submissionDate) {
        this.submissionDate = submissionDate;
    }

    public String getSubmitterName() {
        return submitterName;
    }

    public void setSubmitterName(String submitterName) {
        this.submitterName = submitterName;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public String getCreatedByEmail() {
        return createdByEmail;
    }

    public void setCreatedByEmail(String createdByEmail) {
        this.createdByEmail = createdByEmail;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
}