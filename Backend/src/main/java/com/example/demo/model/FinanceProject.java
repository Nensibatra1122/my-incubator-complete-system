package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "finance_projects")
@Getter
@Setter
@NoArgsConstructor
public class FinanceProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private Double budget;
    private String createdByEmail;

    // Mentor email field add kar di gayi hai taake filtering theek se kaam kare
    private String mentorEmail;

    @OneToMany(mappedBy = "financeProject", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<FinanceTransaction> transactions;

    public String getMentorEmail() {
        return mentorEmail;
    }

    public void setMentorEmail(String mentorEmail) {
        this.mentorEmail = mentorEmail;
    }
}