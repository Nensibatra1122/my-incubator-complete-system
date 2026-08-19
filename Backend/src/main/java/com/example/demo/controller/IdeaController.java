package com.example.demo.controller;

import com.example.demo.model.Idea;
import com.example.demo.model.Incubation;
import com.example.demo.model.Mentor;
import com.example.demo.model.Investor;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.MentorRepository;
import com.example.demo.repository.InvestorRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ideas")
@CrossOrigin(origins = "*")
public class IdeaController {

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private IncubationRepository incubationRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private InvestorRepository investorRepository;

    // Get all ideas endpoint
    @GetMapping
    public ResponseEntity<?> getAllIdeas() {
        return ResponseEntity.ok(ideaRepository.findAll());
    }

    // Get logged-in user's ideas endpoint (Fixes the 500 error)
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyIdeas(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return ResponseEntity.badRequest().body("User not authenticated");
        }
        String email = auth.getName();
        var userIdeas = ideaRepository.findAll().stream()
                .filter(idea -> idea.getCreatedByEmail() != null && idea.getCreatedByEmail().equalsIgnoreCase(email))
                .collect(Collectors.toList());

        return ResponseEntity.ok(userIdeas);
    }

    // Get a single idea by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getIdeaById(@PathVariable Long id) {
        Optional<Idea> optionalIdea = ideaRepository.findById(id);
        if (!optionalIdea.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(optionalIdea.get());
    }

    // Create a new idea endpoint
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'USER', 'MENTEE', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_USER', 'ROLE_MENTEE')")
    public ResponseEntity<?> createIdea(@RequestBody Idea idea, Authentication auth) {
        if ((idea.getCreatedByEmail() == null || idea.getCreatedByEmail().isEmpty()) && auth != null) {
            idea.setCreatedByEmail(auth.getName());
        }

        if (idea.getStatus() == null || idea.getStatus().isEmpty()) {
            idea.setStatus("PENDING");
        }

        // Fix: Automatically set submission date to current date if not provided
        if (idea.getSubmissionDate() == null) {
            idea.setSubmissionDate(LocalDate.now());
        }

        Idea savedIdea = ideaRepository.save(idea);
        return ResponseEntity.ok(savedIdea);
    }

    // Idea Status Update Endpoint (With Mentor & Investor Assignment Logic)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateIdeaStatus(@PathVariable Long id, @RequestBody Map<String, Object> requestMap) {
        Optional<Idea> optionalIdea = ideaRepository.findById(id);
        if (!optionalIdea.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Idea idea = optionalIdea.get();

        if (requestMap.containsKey("status") && requestMap.get("status") != null) {
            String newStatus = requestMap.get("status").toString();

            idea.setStatus(newStatus);

            if ("ACCEPTED".equalsIgnoreCase(newStatus)) {
                Incubation incubation = incubationRepository.findByIdea_IdeaId(id)
                        .orElseGet(() -> {
                            return incubationRepository.findAll().stream()
                                    .filter(inc -> inc.getIdea() != null &&
                                            (inc.getIdea().getId() == id || inc.getIdea().getIdeaId() == id))
                                    .findFirst()
                                    .orElse(new Incubation());
                        });

                if (incubation.getIdea() == null) {
                    incubation.setIdea(idea);
                }

                if (incubation.getProgramName() == null || incubation.getProgramName().isEmpty()) {
                    incubation.setProgramName(idea.getTitle());
                }

                if (incubation.getCategory() == null || incubation.getCategory().isEmpty()) {
                    incubation.setCategory(idea.getTagName());
                }

                if (incubation.getStartDate() == null) {
                    incubation.setStartDate(LocalDate.now());
                }

                // Mentor Mapping Logic Fixed
                if (requestMap.containsKey("mentorId") && requestMap.get("mentorId") != null && !requestMap.get("mentorId").toString().isEmpty()) {
                    try {
                        Long mentorId = Long.valueOf(requestMap.get("mentorId").toString());
                        Mentor mentorObj = mentorRepository.findById(mentorId).orElse(null);
                        if (mentorObj != null) {
                            incubation.setMentor(mentorObj);
                        }
                    } catch (Exception ignored) {}
                }

                // Investor Mapping Logic
                if (requestMap.containsKey("investorId") && requestMap.get("investorId") != null && !requestMap.get("investorId").toString().isEmpty()) {
                    try {
                        Long investorId = Long.valueOf(requestMap.get("investorId").toString());
                        Investor investor = investorRepository.findById(investorId).orElse(null);
                        if (investor != null) {
                            incubation.setInvestor(investor);
                        }
                    } catch (Exception ignored) {}
                }

                incubationRepository.save(incubation);
            }
        }

        ideaRepository.save(idea);
        return ResponseEntity.ok(idea);
    }
}