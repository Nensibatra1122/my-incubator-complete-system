package com.example.demo.repository;

import com.example.demo.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByMentorEmail(String mentorEmail);
    List<Session> findByMenteeEmail(String menteeEmail);
    List<Session> findByStatus(String status);
    List<Session> findByMentorId(Long mentorId); // <-- Yeh line lazmi add karein
}