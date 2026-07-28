package com.example.demo.controller;

import com.example.demo.dto.MentorDTO;
import com.example.demo.model.Mentor;
import com.example.demo.service.MentorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mentors")
@CrossOrigin(origins = "http://localhost:5173")
public class MentorController {

    @Autowired
    private MentorService mentorService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Mentor create(@RequestBody Mentor entity, Authentication authentication) {
        return mentorService.save(entity, authentication);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MentorDTO>> getAllMentors(Authentication authentication) {
        List<MentorDTO> mentors = mentorService.getAllMentorsWithStartups(authentication);

        if (authentication == null) {
            return ResponseEntity.ok(List.of());
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN"));

        // Admin can see all mentors
        if (isAdmin) {
            return ResponseEntity.ok(mentors);
        }

        String currentEmail = authentication.getName().toLowerCase();

        boolean isMentorRole = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("MENTOR"));

        if (isMentorRole) {
            // Mentor can see their own profile
            return ResponseEntity.ok(mentors.stream()
                    .filter(m -> m.getEmail() != null && m.getEmail().toLowerCase().equals(currentEmail))
                    .collect(Collectors.toList()));
        }

        boolean isStudentOrUser = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("STUDENT") || a.getAuthority().contains("USER"));

        if (isStudentOrUser) {
            // Student with a project can ONLY see their assigned mentor.
            // Basic user without any assigned project/startup gets an empty list.
            List<MentorDTO> assignedMentors = mentors.stream()
                    .filter(m -> m.getStartups() != null && m.getStartups().stream()
                            .anyMatch(startup -> startup.getUserEmail() != null && startup.getUserEmail().toLowerCase().equals(currentEmail)))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(assignedMentors);
        }

        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MentorDTO> getById(@PathVariable Long id, Authentication authentication) {
        List<MentorDTO> mentors = mentorService.getAllMentorsWithStartups(authentication);
        return mentors.stream()
                .filter(m -> m.getMentorId().equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isMentorOwner(#id, authentication)")
    public ResponseEntity<Mentor> update(@PathVariable Long id, @RequestBody Mentor details, Authentication authentication) {
        details.setMentorId(id);
        return ResponseEntity.ok(mentorService.save(details, authentication));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        mentorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}