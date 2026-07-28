package com.example.demo.service;

import com.example.demo.model.Feedback;
import com.example.demo.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {

    private final FeedbackRepository repository;

    public FeedbackService(FeedbackRepository repository) {
        this.repository = repository;
    }

    public List<Feedback> getAllFeedbacks() {
        return repository.findAll();
    }

    // Sirf woh feedbacks jo admin ne public kiye hain (Public Testimonials ke liye)
    public List<Feedback> getPublicFeedbacks() {
        return repository.findAll().stream()
                .filter(Feedback::isPublic)
                .collect(Collectors.toList());
    }

    public Feedback getFeedbackById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found with id: " + id));
    }

    public Feedback createFeedback(Feedback feedback, String userEmail) {
        feedback.setCreatedByEmail(userEmail);
        feedback.setPublic(false); // Naya feedback default private rahega
        return repository.save(feedback);
    }

    public Feedback updateFeedback(Long id, Feedback fDetails) {
        Feedback f = getFeedbackById(id);
        f.setComment(fDetails.getComment());
        f.setRating(fDetails.getRating());
        f.setPublic(fDetails.isPublic()); // Admin yahan se status toggle kar ke save karega
        return repository.save(f);
    }

    public void deleteFeedback(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
        } else {
            throw new RuntimeException("Feedback not found for deletion");
        }
    }
}