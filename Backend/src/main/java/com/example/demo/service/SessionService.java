package com.example.demo.service;

import com.example.demo.model.Session;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.SessionRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SessionService {

    @Autowired
    private SessionRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public Session createSession(Session session, Authentication auth) {
        // Mentee email automatically login user se lega
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        session.setMenteeEmail(email);
        session.setStatus("PENDING");

        Session savedSession = repository.save(session);

        // Activity Log for Session Creation
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("CREATE_SESSION");
            log.setDescription("New session created with topic: " + savedSession.getTopic());
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }

        return savedSession;
    }

    public List<Session> getSessionsByMentor(String mentorEmail) {
        return repository.findByMentorEmail(mentorEmail);
    }

    public Session updateSession(Long id, Session details, Authentication auth) {
        Session session = repository.findById(id).orElseThrow(() -> new RuntimeException("Session not found"));
        session.setTopic(details.getTopic());
        session.setStatus(details.getStatus()); // e.g., "ACCEPTED"

        Session updatedSession = repository.save(session);

        // Activity Log for Session Update
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("UPDATE_SESSION");
            log.setDescription("Session updated with ID: " + id + " to status: " + updatedSession.getStatus());
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }

        return updatedSession;
    }

    public List<Session> getSessionsByMentee(String menteeEmail) {
        return repository.findByMenteeEmail(menteeEmail);
    }

    public List<Session> getSessionsByStatus(String status) {
        return repository.findByStatus(status);
    }

    public void deleteSession(Long id, Authentication auth) {
        repository.deleteById(id);

        // Activity Log for Session Deletion
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("DELETE_SESSION");
            log.setDescription("Session deleted with ID: " + id);
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }
    }
}