package com.example.demo.dto;

public class ProjectExpenseDTO {

    private String projectName;
    private Double totalExpense;
    private String message;

    // Default Constructor
    public ProjectExpenseDTO() {
    }

    // Yeh wala Constructor Query mein use ho raha hai
    public ProjectExpenseDTO(String projectName, Double totalExpense, String message) {
        this.projectName = projectName;
        this.totalExpense = totalExpense;
        this.message = message;
    }

    // Getters and Setters...
    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public Double getTotalExpense() { return totalExpense; }
    public void setTotalExpense(Double totalExpense) { this.totalExpense = totalExpense; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}