package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "finance_transactions")
@Getter @Setter @NoArgsConstructor
public class FinanceTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;
    private String type; // "INCOME" or "EXPENSE"

    private String description; // <--- Kis cheez par kharch hua ya kahan se aayi

    @Column(nullable = false)
    private String createdByEmail;

    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "finance_project_id")
    private FinanceProject financeProject;
}