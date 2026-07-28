package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tags")
@Getter @Setter @NoArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tagId;

    @Column(unique = true, nullable = false)
    private String tagName;

    // Kis user ne tag banaya hai, uska email track karne ke liye
    private String createdByEmail;
}