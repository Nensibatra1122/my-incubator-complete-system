package com.example.demo.controller;

import com.example.demo.model.Idea;
import com.example.demo.model.Incubation;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.MentorQueryRepository;
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

    @Autowired(required = false)
    private MentorQueryRepository mentorQueryRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Long mentorId) {

        Map<String, Object> stats = new HashMap<>();
        if (role == null) role = "USER";
        String normalizedRole = role.trim().toUpperCase();

        long submittedIdeasCount = 0;
        long activeProjectsCount = 0;
        long mentorInteractionsCount = 0;

        switch (normalizedRole) {
            case "ADMIN":
                submittedIdeasCount = ideaRepository.count();
                activeProjectsCount = incubationRepository.count();
                mentorInteractionsCount = (mentorQueryRepository != null) ? mentorQueryRepository.count() : 0;

                stats.put("submittedIdeas", submittedIdeasCount);
                stats.put("activeProjects", activeProjectsCount);
                stats.put("mentorInteractions", mentorInteractionsCount);
                stats.put("incubationStatus", "Global System Active");
                stats.put("startups", incubationRepository.findAll());
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

                activeProjectsCount = mentorStartups.size();
                stats.put("submittedIdeas", 0);
                stats.put("activeProjects", activeProjectsCount);
                stats.put("mentorInteractions", mentorStartups.size());
                stats.put("incubationStatus", "Active Mentor");
                stats.put("startups", mentorStartups);
                stats.put("message", "Mentor Dashboard Metrics");
                break;

            case "INVESTOR":
                List<Incubation> allActiveStartups = incubationRepository.findAll();
                stats.put("submittedIdeas", ideaRepository.count());
                stats.put("activeProjects", allActiveStartups.size());
                stats.put("mentorInteractions", 0);
                stats.put("incubationStatus", "Active Investor");
                stats.put("startups", allActiveStartups);
                stats.put("message", "Investor Portfolio Metrics");
                break;

            case "USER":
            case "STUDENT":
            default:
                List<Incubation> userIncubations = List.of();
                List<Idea> userIdeas = List.of();

                if (email != null && !email.isEmpty()) {
                    try {
                        userIncubations = incubationRepository.findByIdea_UserEmail(email);
                    } catch (Exception ignored) {}

                    try {
                        userIdeas = ideaRepository.findByCreatedByEmail(email);
                    } catch (Exception e) {
                        userIdeas = ideaRepository.findAll().stream()
                                .filter(idea -> idea.getCreatedByEmail() != null && idea.getCreatedByEmail().equalsIgnoreCase(email))
                                .toList();
                    }
                }

                submittedIdeasCount = userIdeas.size();

                // Active projects sirf wohi hon ge jo incubate ho chuke hain (agar koi nahi toh 0)
                activeProjectsCount = userIncubations.size();

                // Mentor interactions sirf tab count hongi jab student ne real queries ki hon
                if (email != null && !email.isEmpty() && mentorQueryRepository != null) {
                    try {
                        mentorInteractionsCount = mentorQueryRepository.countByStudentEmail(email);
                    } catch (Exception e) {
                        mentorInteractionsCount = 0;
                    }
                } else {
                    mentorInteractionsCount = 0;
                }

                // Incubation Status: Agar incubations hain toh Active, warna Pending
                String incStatus = userIncubations.isEmpty() ? "Pending" : "Active";

                stats.put("submittedIdeas", submittedIdeasCount);
                stats.put("activeProjects", activeProjectsCount);
                stats.put("mentorInteractions", mentorInteractionsCount);
                stats.put("incubationStatus", incStatus);

                stats.put("myIdeasCount", submittedIdeasCount);
                stats.put("myIncubationsCount", activeProjectsCount);
                stats.put("incubations", userIncubations);
                stats.put("ideas", userIdeas);
                stats.put("message", "Student / User Personal Dashboard");
                break;
        }

        return ResponseEntity.ok(stats);
    }
}