package com.example.demo.controller;

import com.example.demo.model.Session;
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

    // 1. CREATE: Sirf Admin ya Mentor hi session schedule/create kar sakte hain (Students ya basic users khud session book nahi kar sakte)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'ROLE_ADMIN', 'ROLE_MENTOR')")
    public Session requestSession(@RequestBody Session session, Authentication auth) {
        return sessionService.createSession(session, auth);
    }

    // 2. READ ALL (Mentor): Mentor apne sessions dekh sake
    @GetMapping("/my-sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'ROLE_ADMIN', 'ROLE_MENTOR')")
    public List<Session> getMentorSessions(Authentication auth) {
        return sessionService.getSessionsByMentor(auth.getName());
    }

    // 3. READ (Mentee): Student apne assigned sessions dekh sake
    @GetMapping("/mentee/{email}")
    @PreAuthorize("isAuthenticated()")
    public List<Session> getByMentee(@PathVariable String email) {
        return sessionService.getSessionsByMentee(email);
    }

    // 4. READ (Status): Status ke base par sessions filter karna
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'ROLE_ADMIN', 'ROLE_MENTOR')")
    public List<Session> getByStatus(@PathVariable String status) {
        return sessionService.getSessionsByStatus(status);
    }

    // 5. UPDATE: Sirf wahi mentor jiske paas yeh session hai ya Admin
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isMentorForSession(#id, authentication)")
    public ResponseEntity<Session> updateSession(@PathVariable Long id, @RequestBody Session details, Authentication auth) {
        return ResponseEntity.ok(sessionService.updateSession(id, details, auth));
    }

    // 6. DELETE: Sirf wahi mentor jiske paas yeh session hai ya Admin
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isMentorForSession(#id, authentication)")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id, Authentication auth) {
        sessionService.deleteSession(id, auth);
        return ResponseEntity.noContent().build();
    }
}