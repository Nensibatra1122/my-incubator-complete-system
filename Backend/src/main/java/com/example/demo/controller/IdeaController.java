package com.example.demo.controller;

import com.example.demo.model.Idea;
import com.example.demo.model.Incubation;
import com.example.demo.service.IdeaService;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.IncubationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ideas")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class IdeaController {

    @Autowired
    private IdeaService ideaService;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private IncubationRepository incubationRepository;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN') or hasRole('USER')")
    public Idea createIdea(@RequestBody Idea idea, Authentication auth) {
        return ideaService.createIdea(idea, auth);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Idea> getAllIdeas() {
        return ideaRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Idea> getIdeaById(@PathVariable Long id) {
        return ideaService.getIdeaById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<Idea> updateIdea(@PathVariable Long id,
                                           @RequestBody Idea ideaDetails,
                                           Authentication auth) {
        return ResponseEntity.ok(ideaService.updateIdea(id, ideaDetails, auth));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> updateIdeaStatus(@PathVariable String id, @RequestBody Map<String, Object> requestMap) {
        try {
            Long ideaId;
            try {
                String cleanId = id.split(":")[0];
                ideaId = Long.parseLong(cleanId);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Idea ID format"));
            }

            Optional<Idea> optionalIdea = ideaRepository.findById(ideaId);

            if (optionalIdea.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Idea idea = optionalIdea.get();
            String newStatus = (String) requestMap.get("status");

            if (newStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status cannot be null"));
            }

            if ("REJECTED".equals(newStatus)) {
                try {
                    Incubation inc = incubationRepository.findByIdeaId(ideaId);
                    if (inc != null) {
                        incubationRepository.delete(inc);
                    }
                } catch (Exception e) {}

                idea.setStatus("REJECTED");
                ideaRepository.save(idea);
                return ResponseEntity.ok(Map.of("message", "Idea status updated to REJECTED successfully."));
            }
            else if ("ACCEPTED".equals(newStatus)) {
                // Robust Check: Check both Idea status and if Incubation record already exists in DB
                Incubation existingIncubation = incubationRepository.findByIdeaId(ideaId);

                if ("ACCEPTED".equalsIgnoreCase(idea.getStatus()) || existingIncubation != null) {
                    if (!"ACCEPTED".equalsIgnoreCase(idea.getStatus())) {
                        idea.setStatus("ACCEPTED");
                        ideaRepository.save(idea);
                    }
                    return ResponseEntity.ok(Map.of("message", "It's already accepted."));
                }

                if (idea.getSubmitterName() == null || idea.getSubmitterName().trim().isEmpty()) {
                    idea.setSubmitterName("Nensi Batra");
                }

                idea.setStatus(newStatus);
                ideaRepository.save(idea);

                Incubation incubation = new Incubation();
                incubation.setProgramName(idea.getTitle() != null ? idea.getTitle() : "Default Program");
                incubation.setDescription(idea.getDescription() != null ? idea.getDescription() : "No Description");
                incubation.setStatus("Active");
                incubation.setStartDate(LocalDate.now());
                incubation.setIdea(idea);

                incubationRepository.saveAndFlush(incubation);

                return ResponseEntity.ok(Map.of("message", "Idea accepted and successfully moved to Incubated Startups!"));
            }
            else {
                if (idea.getSubmitterName() == null || idea.getSubmitterName().trim().isEmpty()) {
                    idea.setSubmitterName("Nensi Batra");
                }
                idea.setStatus(newStatus);
                ideaRepository.save(idea);
                return ResponseEntity.ok(Map.of("message", "Idea status updated successfully to " + newStatus));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteIdea(@PathVariable Long id, Authentication auth) {
        ideaService.deleteIdea(id, auth);
        return ResponseEntity.noContent().build();
    }
}