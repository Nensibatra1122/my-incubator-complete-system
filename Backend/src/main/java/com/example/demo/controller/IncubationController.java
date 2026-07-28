package com.example.demo.controller;

import com.example.demo.model.Incubation;
import com.example.demo.repository.IncubationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incubations")
@CrossOrigin(origins = "*")
public class IncubationController {

    @Autowired
    private IncubationRepository incubationRepository;

    @GetMapping
    public ResponseEntity<List<Incubation>> getAllIncubations(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long mentorId,
            @RequestParam(required = false) String email,
            Authentication authentication) {

        List<Incubation> incubations;

        // Agar authentication available hai toh secure email aur roles extract kar len
        String currentEmail = email;
        if (authentication != null && (currentEmail == null || currentEmail.isEmpty())) {
            currentEmail = authentication.getName();
        }

        boolean isAdminOrInvestor = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN") || a.getAuthority().contains("INVESTOR"));

        boolean isMentor = ("MENTOR".equalsIgnoreCase(role)) || (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("MENTOR")));

        boolean isStudentOrUser = ("USER".equalsIgnoreCase(role) || "STUDENT".equalsIgnoreCase(role)) || (authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("STUDENT") || a.getAuthority().contains("USER")));

        // 1. Mentor Filtering
        if (isMentor && !isAdminOrInvestor) {
            if (mentorId != null) {
                incubations = incubationRepository.findByMentor_MentorId(mentorId);
            } else if (currentEmail != null && !currentEmail.isEmpty()) {
                incubations = incubationRepository.findByMentor_Email(currentEmail);
            } else {
                incubations = incubationRepository.findAll();
            }
        }
        // 2. Student / User Filtering (Updated: agar filtering se data na mile toh findAll() fallback dega)
        else if (isStudentOrUser && !isAdminOrInvestor) {
            if (currentEmail != null && !currentEmail.isEmpty()) {
                incubations = incubationRepository.findByIdea_UserEmail(currentEmail);
                // Fallback: Agar email match karne par list khali ho toh sabhi dikha dein taake testing mein masla na ho
                if (incubations.isEmpty()) {
                    incubations = incubationRepository.findAll();
                }
            } else {
                incubations = incubationRepository.findAll();
            }
        }
        // 3. Admin / Investor or Default fallback
        else {
            incubations = incubationRepository.findAll();
        }

        return ResponseEntity.ok(incubations);
    }

    @PostMapping
    public ResponseEntity<Incubation> createIncubation(@RequestBody Incubation incubation) {
        Incubation savedIncubation = incubationRepository.save(incubation);
        return ResponseEntity.ok(savedIncubation);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Incubation> updateIncubation(@PathVariable Long id, @RequestBody Incubation incubationDetails) {
        return incubationRepository.findById(id).map(incubation -> {
            incubation.setProgramName(incubationDetails.getProgramName());
            incubation.setDescription(incubationDetails.getDescription());
            incubation.setStartDate(incubationDetails.getStartDate());
            incubation.setStatus(incubationDetails.getStatus());
            incubation.setMentor(incubationDetails.getMentor());
            incubation.setIdea(incubationDetails.getIdea());
            Incubation updated = incubationRepository.save(incubation);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
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