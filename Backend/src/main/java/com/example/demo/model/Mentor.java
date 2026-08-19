package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentors")
@Getter @Setter @NoArgsConstructor
public class Mentor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mentorId;

    private String name;       // Yeh ab direct mentor ka naam save karega
    private String expertise;
    private String bio;

    // Mentor ki email field add kar di gayi hai taake login email se match ho sake
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public User getUser() {
        // Agar Mentor table mein User ka relation nahi hai balki direct fields hain,
        // toh aap yahan null return kar sakte hain ya Controller mein getName() direct use kar sakte hain.
        return null;
    }
}