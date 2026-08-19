package com.example.demo.repository;

import com.example.demo.model.MentorQuery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentorQueryRepository extends JpaRepository<MentorQuery, Long> {

    // Sabhi broadcasted queries fetch karne ke liye jo sabhi users ko dikhengi
    List<MentorQuery> findByIsBroadcastTrueOrderByAnsweredAtDesc();

    // Specific student ki queries fetch karne ke liye
    List<MentorQuery> findByStudentEmail(String studentEmail);

    // Mentors ke liye pending queries jinsa jawab abhi dena baqi hai
    List<MentorQuery> findByAnswerIsNull();

    long countByStudentEmail(String email);
}