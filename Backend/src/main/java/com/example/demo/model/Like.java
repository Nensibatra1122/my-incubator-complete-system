package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "likes")
@Getter @Setter @NoArgsConstructor
public class Like {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long likeId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "idea_id")
    private Idea idea;

    private String status;

    // Manual method yahan rahega, lekin isse IDE mein 'Rebuild' karna hoga
    public String getUserEmail() {
        return (this.user != null) ? this.user.getEmail() : null;
    }
}