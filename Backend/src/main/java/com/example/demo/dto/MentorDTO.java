package com.example.demo.dto;

import java.util.List;

public class MentorDTO {

    private Long mentorId;
    private String name;
    private String email;
    private String expertise;
    private String bio;
    private String assignedStartup;
    private List<StartupInfo> startups; // Agar multiple startups ya list use ho rahi ho

    public Long getMentorId() {
        return mentorId;
    }

    public void setMentorId(Long mentorId) {
        this.mentorId = mentorId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getExpertise() {
        return expertise;
    }

    public void setExpertise(String expertise) {
        this.expertise = expertise;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAssignedStartup() {
        return assignedStartup;
    }

    public void setAssignedStartup(String assignedStartup) {
        this.assignedStartup = assignedStartup;
    }

    public List<StartupInfo> getStartups() {
        return startups;
    }

    public void setStartups(List<StartupInfo> startups) {
        this.startups = startups;
    }

    // Inner class ya separate model agar startups ki list mapping ke liye chahiye ho
    public static class StartupInfo {
        private String userEmail;

        public String getUserEmail() {
            return userEmail;
        }

        public void setUserEmail(String userEmail) {
            this.userEmail = userEmail;
        }
    }
}