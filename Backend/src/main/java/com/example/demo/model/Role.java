package com.example.demo.model;

public enum Role {
    ADMIN,
    USER,
    STUDENT,
    MENTOR,
    INVESTOR;

    // Agar aapko string mein convert karna ho toh standard toString ya name() use hota hai,
    // yahan custom helper method add kar diya gaya hai agar zaroorat ho:
    public String getValue() {
        return this.name().toUpperCase();
    }
}