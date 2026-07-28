package com.example.demo.controller;

import com.example.demo.model.Feedback;
import com.example.demo.service.FeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    // Public Testimonials ya Success Wall ke liye public feedbacks fetch karne ka endpoint
    @GetMapping("/public")
    public List<Feedback> getPublicFeedbacks() {
        return feedbackService.getPublicFeedbacks();
    }

    @GetMapping
    public List<Feedback> getAll() {
        return feedbackService.getAllFeedbacks();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isFeedbackOwner(#id, authentication)")
    public ResponseEntity<Feedback> getById(@PathVariable Long id) {
        return ResponseEntity.ok(feedbackService.getFeedbackById(id));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Feedback create(@RequestBody Feedback feedback, Authentication auth) {
        return feedbackService.createFeedback(feedback, auth.getName());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isFeedbackOwner(#id, authentication)")
    public ResponseEntity<Feedback> update(@PathVariable Long id, @RequestBody Feedback feedback) {
        return ResponseEntity.ok(feedbackService.updateFeedback(id, feedback));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isFeedbackOwner(#id, authentication)")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        return ResponseEntity.ok("Feedback deleted successfully!");
    }
}