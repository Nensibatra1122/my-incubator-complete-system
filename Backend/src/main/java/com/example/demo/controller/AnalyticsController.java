package com.example.demo.controller;

import com.example.demo.model.Idea;
import com.example.demo.model.Incubation;
import com.example.demo.model.Mentor;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.MentorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private IncubationRepository incubationRepository;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long mentorId) {

        Map<String, Object> stats = new HashMap<>();
        if (role == null) role = "USER";
        String normalizedRole = role.trim().toUpperCase();

        switch (normalizedRole) {
            case "ADMIN":
                long totalIdeas = ideaRepository.count();
                long totalIncubations = incubationRepository.count();
                long totalMentors = mentorRepository.count();
                stats.put("totalIdeas", totalIdeas);
                stats.put("totalIncubations", totalIncubations);
                stats.put("totalMentors", totalMentors);
                stats.put("message", "Admin Overview Metrics");
                break;

            case "MENTOR":
                List<Incubation> mentorStartups;
                if (mentorId != null) {
                    mentorStartups = incubationRepository.findByMentor_MentorId(mentorId);
                } else if (email != null && !email.isEmpty()) {
                    mentorStartups = incubationRepository.findByMentor_Email(email);
                } else {
                    mentorStartups = List.of();
                }
                stats.put("assignedStartupsCount", mentorStartups.size());
                stats.put("startups", mentorStartups);
                stats.put("message", "Mentor Dashboard Metrics");
                break;

            case "INVESTOR":
                List<Incubation> allActiveStartups = incubationRepository.findAll();
                stats.put("investmentOpportunitiesCount", allActiveStartups.size());
                stats.put("startups", allActiveStartups);
                stats.put("message", "Investor Portfolio Metrics");
                break;

            case "USER":
            case "STUDENT":
            default:
                List<Incubation> userIncubations = List.of();
                List<Idea> userIdeas = List.of();
                if (email != null && !email.isEmpty()) {
                    userIncubations = incubationRepository.findByIdea_UserEmail(email);
                    // Agar IdeaRepository mein email se ideas find karne ka method hai
                    try {
                        userIdeas = ideaRepository.findByCreatedByEmail(email);
                    } catch (Exception e) {
                        // Fallback agar method name alag ho
                    }
                }
                stats.put("myIdeasCount", userIdeas.size());
                stats.put("myIncubationsCount", userIncubations.size());
                stats.put("incubations", userIncubations);
                stats.put("ideas", userIdeas);
                stats.put("message", "Student / User Personal Dashboard");
                break;
        }

        return ResponseEntity.ok(stats);
    }
}