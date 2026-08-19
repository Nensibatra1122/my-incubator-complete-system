package com.example.demo.controller;

import com.example.demo.dto.IncubationProgressDTO;
import com.example.demo.model.Incubation;
import com.example.demo.model.User;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.IncubationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/incubations", "/api/startups", "/incubations"})
@CrossOrigin(origins = {"http://localhost:5173", "http://98.94.6.13"}, allowCredentials = "true")
public class IncubationController {

    @Autowired
    private IncubationRepository incubationRepository;

    @Autowired
    private IncubationService incubationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Incubation>> getAllIncubations(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long mentorId,
            @RequestParam(required = false) String email,
            Authentication authentication) {

        String principalEmail = (authentication != null && authentication.getName() != null) ? authentication.getName() : email;
        User user = principalEmail != null ? userRepository.findByEmail(principalEmail).orElse(null) : null;

        boolean isAdmin = user != null && user.getRole() != null &&
                user.getRole().toString().toUpperCase().contains("ADMIN");

        List<Incubation> incubations;

        if (isAdmin) {
            // Admin can see all, or filter if explicit params are passed
            if ("INVESTOR".equalsIgnoreCase(role) && email != null) {
                incubations = incubationRepository.findByInvestorEmail(email);
            } else if ("STUDENT".equalsIgnoreCase(role) && email != null) {
                incubations = incubationRepository.findByIdea_UserEmail(email);
            } else {
                incubations = incubationRepository.findAll();
            }
        } else {
            // Non-admin (Mentor / Student / Investor) should only see their assigned projects
            if (user != null) {
                String userRole = user.getRole() != null ? user.getRole().toString().toUpperCase() : "";

                if (userRole.contains("MENTOR")) {
                    incubations = incubationRepository.findByMentorEmail(user.getEmail());
                    if (incubations == null || incubations.isEmpty()) {
                        incubations = incubationRepository.findByMentorId(user.getId());
                    }
                } else if (userRole.contains("INVESTOR")) {
                    incubations = incubationRepository.findByInvestorEmail(user.getEmail());
                } else {
                    incubations = incubationService.getIncubationsByUserEmail(user.getEmail());
                }
            } else if (principalEmail != null) {
                incubations = incubationRepository.findByMentorEmail(principalEmail);
            } else {
                incubations = List.of();
            }
        }

        return ResponseEntity.ok(incubations);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Incubation>> getMyIncubations(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        String email = authentication.getName();
        List<Incubation> myIncubations = incubationService.getIncubationsByUserEmail(email);
        return ResponseEntity.ok(myIncubations);
    }

    @PostMapping
    public ResponseEntity<Incubation> createIncubation(@RequestBody Incubation incubation, Authentication authentication) {
        Incubation saved = incubationService.incubationRepositorySaveWithFinance(incubation, authentication);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Incubation> updateIncubation(@PathVariable Long id, @RequestBody Incubation incubationDetails) {
        return incubationRepository.findById(id).map(incubation -> {
            if (incubationDetails.getProgramName() != null) incubation.setProgramName(incubationDetails.getProgramName());
            if (incubationDetails.getStartDate() != null) incubation.setStartDate(incubationDetails.getStartDate());
            if (incubationDetails.getCategory() != null) incubation.setCategory(incubationDetails.getCategory());
            if (incubationDetails.getFunding() != null) incubation.setFunding(incubationDetails.getFunding());
            if (incubationDetails.getValuation() != null) incubation.setValuation(incubationDetails.getValuation());
            if (incubationDetails.getProgressPercentage() != null) incubation.setProgressPercentage(incubationDetails.getProgressPercentage());
            if (incubationDetails.getStatus() != null) incubation.setStatus(incubationDetails.getStatus());

            if (incubationDetails.getMentor() != null) {
                incubation.setMentor(incubationDetails.getMentor());
            }

            if (incubationDetails.getInvestor() != null) {
                incubation.setInvestor(incubationDetails.getInvestor());
            }

            return ResponseEntity.ok(incubationRepository.save(incubation));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/ideas/{id}/status")
    public ResponseEntity<Incubation> updateIdeaStatusAndAssign(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody,
            Authentication authentication) {

        String newStatus = (String) requestBody.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        Long mentorId = requestBody.get("mentorId") != null ? Long.valueOf(requestBody.get("mentorId").toString()) : null;
        Long investorId = requestBody.get("investorId") != null ? Long.valueOf(requestBody.get("investorId").toString()) : null;

        Incubation updated = incubationService.acceptAndAssignIdea(id, mentorId, investorId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Incubation> updateIncubationStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestBody,
            Authentication authentication) {

        String newStatus = (String) requestBody.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        Long mentorId = requestBody.get("mentorId") != null ? Long.valueOf(requestBody.get("mentorId").toString()) : null;
        Long investorId = requestBody.get("investorId") != null ? Long.valueOf(requestBody.get("investorId").toString()) : null;

        Incubation updated = incubationService.updateIncubationStatus(id, newStatus, authentication, mentorId, investorId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<?> updateIncubationProgress(@PathVariable Long id, @RequestBody IncubationProgressDTO dto) {
        Incubation incubation = incubationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incubation not found with id: " + id));

        if (dto.getFundingRaised() != null) {
            incubation.setFunding(dto.getFundingRaised());
        }
        if (dto.getProgressPercentage() != null) {
            incubation.setProgressPercentage(dto.getProgressPercentage());
        }
        if (dto.getCategory() != null) {
            incubation.setCategory(dto.getCategory());
        }
        if (dto.getValuation() != null) {
            incubation.setValuation(dto.getValuation());
        }

        Incubation updatedIncubation = incubationRepository.save(incubation);

        if (dto.getTimelineLog() != null && !dto.getTimelineLog().isEmpty()) {
            try {
                incubationService.addTimelineLog(id, dto.getTimelineLog(), dto.getProgressPercentage());
            } catch (Exception ignored) {}
        }

        return ResponseEntity.ok(updatedIncubation);
    }

    @PutMapping("/{id}/fund")
    public ResponseEntity<?> updateIncubationFund(@PathVariable Long id, @RequestBody IncubationProgressDTO dto) {
        Incubation incubation = incubationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incubation not found with id: " + id));

        if (dto.getFundingRaised() != null) {
            incubation.setFunding(dto.getFundingRaised());
        }

        Incubation updatedIncubation = incubationRepository.save(incubation);
        return ResponseEntity.ok(updatedIncubation);
    }

    @PostMapping("/{id}/timeline-logs")
    public ResponseEntity<?> addTimelineLog(@PathVariable Long id, @RequestBody IncubationProgressDTO request) {
        try {
            String phase = request.getTimelineLog() != null ? request.getTimelineLog() : request.getCurrentPhase();
            Double progress = request.getProgressPercentage();

            incubationService.addTimelineLog(id, phase, progress);
            return ResponseEntity.ok("Timeline log added successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<User>> getIncubationMembers(@PathVariable Long id) {
        List<User> members = incubationService.getIncubationMembers(id);
        return ResponseEntity.ok(members);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncubation(@PathVariable Long id) {
        if (incubationRepository.existsById(id)) {
            incubationRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}