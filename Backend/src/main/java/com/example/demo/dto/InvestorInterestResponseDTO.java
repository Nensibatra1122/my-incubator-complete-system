package com.example.demo.dto;

public class InvestorInterestResponseDTO {
    private Long interestId;
    private Long investorId;
    private String investorEmail;
    private Long incubationId;
    private String startupName;
    private String status;
    private String createdAt;

    // Setters
    public void setId(Long id) {
        this.interestId = id;
    }

    public void setInterestId(Long interestId) {
        this.interestId = interestId;
    }

    public void setInvestorId(Long investorId) {
        this.investorId = investorId;
    }

    public void setInvestorEmail(String investorEmail) {
        this.investorEmail = investorEmail;
    }

    public void setIncubationId(Long incubationId) {
        this.incubationId = incubationId;
    }

    public void setStartupName(String startupName) {
        this.startupName = startupName;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    // Getters
    public Long getId() {
        return interestId;
    }

    public Long getInterestId() {
        return interestId;
    }

    public Long getInvestorId() {
        return investorId;
    }

    public String getInvestorEmail() {
        return investorEmail;
    }

    public Long getIncubationId() {
        return incubationId;
    }

    public String getStartupName() {
        return startupName;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}