package com.example.demo.repository;

import com.example.demo.model.Incubation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncubationRepository extends JpaRepository<Incubation, Long> {

    Optional<Incubation> findByIdea_IdeaId(Long id);

    @Query("SELECT i FROM Incubation i WHERE i.idea.ideaId = :ideaId")
    Incubation findByIdeaIdCustom(@Param("ideaId") Long ideaId);

    List<Incubation> findByMentor_MentorId(Long mentorId);

    List<Incubation> findByMentor_Email(String email);

    default List<Incubation> findByMentorEmail(String email) {
        return findByMentor_Email(email);
    }

    default List<Incubation> findByMentorId(Long mentorId) {
        return findByMentor_MentorId(mentorId);
    }

    List<Incubation> findByInvestor_InvestorId(Long investorId);

    @Query("SELECT i FROM Incubation i WHERE i.idea.createdByEmail = :email")
    List<Incubation> findByIdea_UserEmail(@Param("email") String email);

    @Query("SELECT i.programName FROM Incubation i WHERE i.mentor.mentorId = :mentorId")
    List<String> findStartupNamesByMentorId(@Param("mentorId") Long mentorId);

    @Query("SELECT i FROM Investor inv JOIN inv.incubations i WHERE inv.user.email = :email")
    List<Incubation> findByInvestorEmail(@Param("email") String email);

    boolean existsByIdea_IdeaId(Long ideaId);

    List<Incubation> findByStatus(String status);
}