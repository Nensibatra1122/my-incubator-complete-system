package com.example.demo.dto;

public class IncubationProgressDTO {
    private Double progressPercentage;
    private Double fundingRaised;
    private String valuation;
    private String category;
    private String timelineLog;
    private String currentPhase; // <-- Yeh field add ki hai

    // Default Constructor
    public IncubationProgressDTO() {}

    // Getters and Setters
    public Double getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Double progressPercentage) { this.progressPercentage = progressPercentage; }

    public Double getFundingRaised() { return fundingRaised; }
    public void setFundingRaised(Double fundingRaised) { this.fundingRaised = fundingRaised; }

    public String getValuation() { return valuation; }
    public void setValuation(String valuation) { this.valuation = valuation; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getTimelineLog() { return timelineLog; }
    public void setTimelineLog(String timelineLog) { this.timelineLog = timelineLog; }

    // Naye getters aur setters jo aapne mange hain
    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }
}