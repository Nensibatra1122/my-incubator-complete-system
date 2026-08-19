package com.example.demo.repository;

import com.example.demo.model.Investor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestorRepository extends JpaRepository<Investor, Long> {

    // Corrected Query: investorId aur ManyToMany relationship (incubations) ke zariye mentor ke assigned investors fetch karne ke liye
    @Query("SELECT DISTINCT i FROM Investor i JOIN i.incubations inc WHERE inc.mentor.id = :mentorUserId")
    List<Investor> findAssignedInvestorsForMentor(@Param("mentorUserId") Long mentorUserId);

    // User email ke zariye investor find karne ke liye
    Optional<Investor> findByUserEmail(String email);

    // User ID ke zariye investor find karne ke liye
    Optional<Investor> findByUserUserId(Long userId);
}