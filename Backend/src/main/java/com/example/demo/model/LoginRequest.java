package com.example.demo.model;

public class LoginRequest {
    private String email;
    private String password;
    private String role; // Role field bhi hona zaroori hai

    // Default Constructor
    public LoginRequest() {}

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Fixed getRole method
    public String getRole() {
        return role; // Yahan 'return' statement add kiya gaya hai
    }

    public void setRole(String role) {
        this.role = role;
    }
}