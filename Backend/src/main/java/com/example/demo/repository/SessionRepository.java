package com.example.demo.repository;

import com.example.demo.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // 1. Mentor ke sessions dhundne ke liye
    List<Session> findByMentorEmail(String mentorEmail);

    // 2. Student (Mentee) ke sessions dhundne ke liye
    List<Session> findByMenteeEmail(String menteeEmail);

    // 3. Status ke base par session dhundne ke liye (e.g., saare PENDING sessions)
    List<Session> findByStatus(String status);
}