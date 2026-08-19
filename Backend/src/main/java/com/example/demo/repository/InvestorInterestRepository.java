package com.example.demo.repository;

import com.example.demo.model.InvestorInterest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvestorInterestRepository extends JpaRepository<InvestorInterest, Long> {

    List<InvestorInterest> findByStatus(String status);

    List<InvestorInterest> findByInvestor_InvestorId(Long investorId);

    List<InvestorInterest> findByInvestorEmailIgnoreCase(String investorEmail);

    List<InvestorInterest> findByIdea_IdeaId(Long ideaId);

    boolean existsByIdea_IdeaIdAndInvestorEmailIgnoreCase(Long ideaId, String investorEmail);
}