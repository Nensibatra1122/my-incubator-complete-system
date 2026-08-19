package com.example.demo.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvestorInterestRequestDTO {
    private Long investorId;
    private String investorEmail;
    private Long ideaId;
    private Long incubationId; // Agar incubation/startup ID ki bhi zaroorat par jaye
    private String status;
}