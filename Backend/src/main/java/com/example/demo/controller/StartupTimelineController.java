package com.example.demo.controller;

import com.example.demo.model.StartupTimeline;
import com.example.demo.repository.StartupTimelineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/timelines")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StartupTimelineController {

    @Autowired
    private StartupTimelineRepository repo;

    // 1. CREATE
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MENTOR', 'STUDENT', 'USER', 'ROLE_ADMIN', 'ROLE_MENTOR', 'ROLE_STUDENT', 'ROLE_USER')")
    public StartupTimeline create(@RequestBody StartupTimeline t, Authentication authentication) {
        return repo.save(t);
    }

    // 2. READ ALL
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR', 'ROLE_USER')")
    public List<StartupTimeline> getAll(Authentication authentication) {
        return repo.findAll();
    }

    // 3. READ BY ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR', 'ROLE_USER')")
    public ResponseEntity<StartupTimeline> getById(@PathVariable Long id, Authentication authentication) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. UPDATE (Secure)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'ROLE_ADMIN', 'ROLE_USER') or @securityService.isTimelineOwner(#id, authentication)")
    public ResponseEntity<StartupTimeline> update(@PathVariable Long id, @RequestBody StartupTimeline tDetails, Authentication authentication) {
        return repo.findById(id).map(t -> {
            t.setEventName(tDetails.getEventName());
            t.setEventDate(tDetails.getEventDate());
            StartupTimeline updated = repo.save(t);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. DELETE (Secure)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isTimelineOwner(#id, authentication)")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    // 6. GET BY STARTUP ID (Publicly accessible)
    @GetMapping("/startup/{startupId}")
    public List<StartupTimeline> getByStartupId(@PathVariable Long startupId, Authentication authentication) {
        return repo.findByIdeaId(startupId);
    }

    // 7. GET BY IDEA ID (Publicly accessible)
    @GetMapping("/idea/{ideaId}")
    public List<StartupTimeline> getByIdeaId(@PathVariable Long ideaId, Authentication authentication) {
        return repo.findByIdeaId(ideaId);
    }
}