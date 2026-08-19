package com.example.demo.controller;

import com.example.demo.dto.SessionResponseDTO;
import com.example.demo.model.Session;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'INVESTOR', 'ROLE_ADMIN', 'ROLE_MENTOR', 'ROLE_INVESTOR')")
    public ResponseEntity<Session> requestSession(@RequestBody Session session, Authentication auth) {
        if (session.getStatus() == null || session.getStatus().isEmpty()) {
            session.setStatus("PENDING");
        }
        Session savedSession = sessionService.createSession(session, auth);
        return ResponseEntity.ok(savedSession);
    }

    @GetMapping("/my-sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'INVESTOR', 'ROLE_ADMIN', 'ROLE_MENTOR', 'ROLE_INVESTOR')")
    public List<SessionResponseDTO> getMySessions(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.getRole() != null) {
            String roleStr = user.getRole().toString().toUpperCase();
            if (roleStr.contains("INVESTOR")) {
                return sessionService.getSessionDTOsForInvestor(email);
            }
            if (roleStr.contains("ADMIN")) {
                return sessionService.getAllSessionsAsDTO();
            }
        }

        return sessionService.getSessionDTOsByMentor(email);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'INVESTOR', 'ROLE_ADMIN', 'ROLE_MENTOR', 'ROLE_INVESTOR')")
    public List<SessionResponseDTO> getAllSessionsForUser(Authentication auth) {
        return sessionService.getAllSessionsAsDTO();
    }

    @GetMapping("/mentee/{email}")
    @PreAuthorize("isAuthenticated()")
    public List<SessionResponseDTO> getByMentee(@PathVariable String email) {
        return sessionService.getSessionsByMentee(email).stream()
                .map(sessionService::convertToDTO)
                .toList();
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'INVESTOR', 'ROLE_ADMIN', 'ROLE_MENTOR', 'ROLE_INVESTOR')")
    public List<SessionResponseDTO> getByStatus(@PathVariable String status) {
        return sessionService.getSessionsByStatus(status).stream()
                .map(sessionService::convertToDTO)
                .toList();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isMentorForSession(#id, authentication)")
    public ResponseEntity<Session> updateSession(@PathVariable Long id, @RequestBody Session details, Authentication auth) {
        return ResponseEntity.ok(sessionService.updateSession(id, details, auth));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isMentorForSession(#id, authentication)")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id, Authentication auth) {
        sessionService.deleteSession(id, auth);
        return ResponseEntity.noContent().build();
    }
}