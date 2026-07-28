package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long profileId;

    private String fullName;

    @Column(length = 1000)
    private String bio;

    private String linkedInUrl;
    private String githubUrl;
    private String profilePictureUrl;

    @Column(length = 1000)
    private String skills; // e.g. Java, Spring Boot, React, Python

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // Getters and Setters
    public Long getProfileId() { return profileId; }
    public void setProfileId(Long profileId) { this.profileId = profileId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getLinkedInUrl() { return linkedInUrl; }
    public void setLinkedInUrl(String linkedInUrl) { this.linkedInUrl = linkedInUrl; }

    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUserEmail() {
        return (user != null) ? user.getEmail() : null;
    }

    // Check if profile is complete (Full Name, Bio, and Skills are filled)
    public boolean isComplete() {
        return fullName != null && !fullName.trim().isEmpty() &&
                bio != null && !bio.trim().isEmpty() &&
                skills != null && !skills.trim().isEmpty();
    }
}