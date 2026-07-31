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

    Optional<Incubation> findByIdea_IdeaId(Long ideaId);

    @Query("SELECT i FROM Incubation i WHERE i.idea.ideaId = :ideaId")
    Incubation findByIdeaId(@Param("ideaId") Long ideaId);

    List<Incubation> findByMentor_MentorId(Long mentorId);

    List<Incubation> findByMentor_Email(String email);

    @Query("SELECT i FROM Incubation i WHERE i.idea.createdByEmail = :email")
    List<Incubation> findByIdea_UserEmail(@Param("email") String email);

    @Query("SELECT i.programName FROM Incubation i WHERE i.mentor.mentorId = :mentorId")
    List<String> findStartupNamesByMentorId(@Param("mentorId") Long mentorId);

    // Updated JPQL Query matching Investor ManyToMany relation via Investor entity
    @Query("SELECT i FROM Investor inv JOIN inv.incubations i WHERE inv.user.email = :email")
    List<Incubation> findByInvestorEmail(@Param("email") String email);

}