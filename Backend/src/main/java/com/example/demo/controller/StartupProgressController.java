package com.example.demo.controller;

import com.example.demo.model.StartupProgress;
import com.example.demo.repository.StartupProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StartupProgressController {

    @Autowired
    private StartupProgressRepository repo;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_USER')")
    public StartupProgress create(@RequestBody StartupProgress p, Authentication authentication) {
        return repo.save(p);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR', 'ROLE_USER')")
    public List<StartupProgress> getAll(Authentication authentication) {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR', 'ROLE_USER')")
    public ResponseEntity<StartupProgress> getById(@PathVariable Long id, Authentication authentication) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/startup/{startupId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR', 'ROLE_USER')")
    public ResponseEntity<List<StartupProgress>> getByStartupId(@PathVariable Long startupId, Authentication authentication) {
        List<StartupProgress> progressList = repo.findByStartupId(startupId);
        return ResponseEntity.ok(progressList);
    }

    @GetMapping("/startup/{startupId}/{subId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR', 'ROLE_USER')")
    public ResponseEntity<StartupProgress> getByStartupAndSubId(@PathVariable Long startupId, @PathVariable Long subId, Authentication authentication) {
        return repo.findByStartupId(startupId).stream()
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'ROLE_ADMIN', 'ROLE_USER') or @securityService.isProgressOwner(#id, authentication)")
    public ResponseEntity<StartupProgress> update(@PathVariable Long id, @RequestBody StartupProgress pDetails, Authentication authentication) {
        return repo.findById(id).map(p -> {
            p.setCurrentPhase(pDetails.getCurrentPhase());
            p.setPercentage(pDetails.getPercentage());
            StartupProgress updated = repo.save(p);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isProgressOwner(#id, authentication)")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}