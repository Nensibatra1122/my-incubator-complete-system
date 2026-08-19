package com.example.demo.service;

import com.example.demo.dto.SessionResponseDTO;
import com.example.demo.model.Session;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.model.Incubation;
import com.example.demo.repository.SessionRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.IncubationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SessionService {

    @Autowired
    private SessionRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IncubationRepository startupRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public Session createSession(Session session, Authentication auth) {
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        User currentUser = userRepository.findByEmail(email).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null &&
                currentUser.getRole().toString().toUpperCase().contains("ADMIN");

        // Validation: Startup ID is required
        if (session.getStartupId() == null) {
            throw new RuntimeException("Startup ID is required.");
        }

        // 1. Fetch the Incubation / Startup
        Incubation incubation = startupRepository.findById(session.getStartupId())
                .orElseThrow(() -> new RuntimeException("Incubation project not found with ID: " + session.getStartupId()));

        String assignedMentorEmail = null;
        Long assignedMentorId = null;

        // Safely extract mentor info depending on Incubation model structure
        try {
            var mentorObj = incubation.getMentor();
            if (mentorObj != null) {
                assignedMentorEmail = String.valueOf(mentorObj.getClass().getMethod("getEmail").invoke(mentorObj));
                assignedMentorId = (Long) mentorObj.getClass().getMethod("getId").invoke(mentorObj);
            }
        } catch (Exception e) {
            // Ignored if method doesn't match
        }

        // Fallback to session or creator if not found on incubation
        if (assignedMentorEmail == null || assignedMentorEmail.equals("null") || assignedMentorEmail.isEmpty()) {
            assignedMentorEmail = session.getMentorEmail();
        }

        // Permission Check: If logged-in user is a Mentor (not Admin), they can only schedule sessions for their own projects
        if (!isAdmin) {
            if (assignedMentorEmail == null || !assignedMentorEmail.equalsIgnoreCase(email)) {
                throw new RuntimeException("Permission Denied: You are not the assigned mentor for this startup project.");
            }
        }

        // Enforce correct Mentor Email and ID
        if (assignedMentorEmail != null && !assignedMentorEmail.isEmpty() && !assignedMentorEmail.equals("null")) {
            session.setMentorEmail(assignedMentorEmail);
            session.setMentorId(assignedMentorId);
        } else {
            session.setMentorEmail(email);
            if (currentUser != null) session.setMentorId(currentUser.getId());
        }

        // 2. Derive Mentee Email from Incubation Idea owner safely
        String menteeEmail = null;
        try {
            if (incubation.getIdea() != null) {
                menteeEmail = incubation.getIdea().getCreatedByEmail();
            }
        } catch (Exception e) {
            // Fallback
        }

        if (menteeEmail == null || menteeEmail.isEmpty()) {
            menteeEmail = session.getMenteeEmail() != null ? session.getMenteeEmail() : email;
        }
        session.setMenteeEmail(menteeEmail);

        // 3. Status Default
        if (session.getStatus() == null || session.getStatus().isEmpty()) {
            session.setStatus("PENDING");
        }

        // Validation checks for scheduled time
        if (session.getScheduledTime() == null) {
            throw new RuntimeException("Scheduled time is required.");
        }

        Session savedSession = repository.save(session);

        // Subject & Body for Email Notifications
        String subject = "New Mentorship Session Scheduled: " + savedSession.getTopic();
        String body = "A new session has been scheduled.\n\nTopic: " + savedSession.getTopic()
                + "\nScheduled Time: " + savedSession.getScheduledTime()
                + "\nStatus: " + savedSession.getStatus();

        // Send Notifications
        if (savedSession.getMenteeEmail() != null && !savedSession.getMenteeEmail().isEmpty()) {
            sendEmailNotification(savedSession.getMenteeEmail(), subject, body);
        }
        if (savedSession.getMentorEmail() != null && !savedSession.getMentorEmail().isEmpty()) {
            sendEmailNotification(savedSession.getMentorEmail(), subject, body);
        }

        try {
            ActivityLog log = new ActivityLog();
            log.setAction("CREATE_SESSION");
            log.setDescription("New session created with topic: " + savedSession.getTopic());
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            if (currentUser != null) {
                log.setUser(currentUser);
            } else {
                userRepository.findByEmail(email).ifPresent(log::setUser);
            }
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

        if (details.getTopic() != null) session.setTopic(details.getTopic());
        if (details.getStatus() != null) {
            session.setStatus(details.getStatus());

            String statusSubject = "Session Status Update: " + details.getStatus();
            String statusBody = "Your mentorship session (" + session.getTopic() + ") status has been updated to: " + details.getStatus();

            if (session.getMenteeEmail() != null) {
                sendEmailNotification(session.getMenteeEmail(), statusSubject, statusBody);
            }
            if (session.getMentorEmail() != null) {
                sendEmailNotification(session.getMentorEmail(), statusSubject, statusBody);
            }
        }
        if (details.getScheduledTime() != null) session.setScheduledTime(details.getScheduledTime());

        Session updatedSession = repository.save(session);

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

    public List<Session> getSessionsForInvestor(String email) {
        return repository.findAll();
    }

    public List<SessionResponseDTO> getSessionDTOsForInvestor(String email) {
        List<Session> sessions = repository.findAll();
        return sessions.stream().map(this::convertToDTO).toList();
    }

    public List<SessionResponseDTO> getSessionDTOsByMentor(String mentorEmail) {
        List<Session> sessions = repository.findByMentorEmail(mentorEmail);
        return sessions.stream().map(this::convertToDTO).toList();
    }

    public List<SessionResponseDTO> getAllSessionsAsDTO() {
        List<Session> sessions = repository.findAll();
        return sessions.stream().map(this::convertToDTO).toList();
    }

    public List<SessionResponseDTO> getSessionDTOsForUser(Authentication auth) {
        String principal = (auth != null && auth.getName() != null) ? auth.getName() : "";

        Optional<User> userOpt = userRepository.findByEmail(principal);
        List<Session> allSessions = new java.util.ArrayList<>();

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getEmail() != null) {
                allSessions.addAll(repository.findByMentorEmail(user.getEmail()));
            }
            if (user.getId() != null) {
                List<Session> byId = repository.findByMentorId(user.getId());
                if (byId != null) {
                    for (Session s : byId) {
                        if (!allSessions.contains(s)) allSessions.add(s);
                    }
                }
            }
        } else {
            allSessions.addAll(repository.findByMentorEmail(principal));
        }

        return allSessions.stream().distinct().map(this::convertToDTO).toList();
    }

    public SessionResponseDTO convertToDTO(Session session) {
        SessionResponseDTO dto = new SessionResponseDTO();
        dto.setId(session.getId());
        dto.setTopic(session.getTopic());
        dto.setStartupId(session.getStartupId());
        dto.setMentorId(session.getMentorId());
        dto.setMentorEmail(session.getMentorEmail());
        dto.setMenteeEmail(session.getMenteeEmail());
        dto.setScheduledTime(session.getScheduledTime());
        dto.setStatus(session.getStatus());
        dto.setCreatedAt(session.getCreatedAt());

        // 1. Fetch Startup Name safely with multiple fallbacks
        if (session.getStartupId() != null) {
            startupRepository.findById(session.getStartupId()).ifPresent(startup -> {
                String name = startup.getName();
                if (name == null || name.isEmpty()) {
                    name = startup.getProgramName();
                }
                dto.setStartupName(name != null ? name : "Incubation #" + session.getStartupId());
            });
        }

        if (dto.getStartupName() == null && session.getStartupId() != null) {
            dto.setStartupName("Incubation #" + session.getStartupId());
        }

        // 2. Fetch Managed By Name (from mentorEmail)
        if (session.getMentorEmail() != null) {
            userRepository.findByEmail(session.getMentorEmail()).ifPresent(user -> {
                dto.setManagedByName(user.getFullName() != null ? user.getFullName() : user.getEmail());
            });
        }

        return dto;
    }

    public void deleteSession(Long id, Authentication auth) {
        repository.deleteById(id);

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

    private void sendEmailNotification(String toEmail, String subject, String body) {
        if (mailSender == null || toEmail == null || toEmail.isEmpty()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email notification: " + e.getMessage());
        }
    }
}