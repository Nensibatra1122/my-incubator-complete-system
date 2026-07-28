package com.example.demo.service;

import com.example.demo.model.Idea;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IdeaService {

    @Autowired private IdeaRepository ideaRepository;
    @Autowired private ActivityLogRepository logRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService; // Notification Service added

    public List<Idea> getAllIdeas() {
        return ideaRepository.findAll();
    }

    public Optional<Idea> getIdeaById(Long id) {
        return ideaRepository.findById(id);
    }

    public Idea createIdea(Idea idea, Authentication auth) {
        String userEmail = "nensi@utopia.com"; // Default fallback
        if (auth != null && auth.getName() != null) {
            userEmail = auth.getName();
        }
        idea.setCreatedByEmail(userEmail);

        if (idea.getSubmitterName() == null || idea.getSubmitterName().trim().isEmpty()) {
            idea.setSubmitterName("Nensi Batra");
        }

        if (idea.getSubmissionDate() == null) {
            idea.setSubmissionDate(LocalDate.now());
        }

        Idea savedIdea = ideaRepository.save(idea);
        addLog("CREATE", "New Idea Created: " + savedIdea.getTitle(), userEmail);

        // Send Notification on Idea Creation
        User owner = userRepository.findByEmail(userEmail).orElse(null);
        if (owner != null) {
            notificationService.sendNotification(owner, "Aapka naya idea '" + savedIdea.getTitle() + "' successfully submit ho gaya hai!");
        }

        return savedIdea;
    }

    public Idea updateIdea(Long id, Idea ideaDetails, Authentication auth) {
        return ideaRepository.findById(id).map(idea -> {
            String currentEmail = (auth != null && auth.getName() != null) ? auth.getName() : idea.getCreatedByEmail();

            if (auth != null && !idea.getCreatedByEmail().equals(auth.getName()) && !auth.getAuthorities().toString().contains("ADMIN")) {
                throw new RuntimeException("Access Denied: You are not the owner of this idea");
            }

            idea.setTitle(ideaDetails.getTitle());
            idea.setDescription(ideaDetails.getDescription());

            if (ideaDetails.getSubmitterName() != null) {
                idea.setSubmitterName(ideaDetails.getSubmitterName());
            }

            Idea updatedIdea = ideaRepository.save(idea);
            addLog("UPDATE", "Idea Updated: " + updatedIdea.getTitle(), currentEmail);

            // Send Notification on Idea Update
            User owner = userRepository.findByEmail(currentEmail).orElse(null);
            if (owner != null) {
                notificationService.sendNotification(owner, "Aapka idea '" + updatedIdea.getTitle() + "' update kar diya gaya hai.");
            }

            return updatedIdea;
        }).orElseThrow(() -> new RuntimeException("Idea not found"));
    }

    public void deleteIdea(Long id, Authentication auth) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Idea not found"));

        String currentEmail = (auth != null && auth.getName() != null) ? auth.getName() : idea.getCreatedByEmail();

        if (auth != null && !idea.getCreatedByEmail().equals(auth.getName()) && !auth.getAuthorities().toString().contains("ADMIN")) {
            throw new RuntimeException("Access Denied: You are not the owner");
        }

        String ideaTitle = idea.getTitle();
        ideaRepository.delete(idea);
        addLog("DELETE", "Idea Deleted: " + ideaTitle, currentEmail);

        // Send Notification on Idea Deletion
        User owner = userRepository.findByEmail(currentEmail).orElse(null);
        if (owner != null) {
            notificationService.sendNotification(owner, "Aapka idea '" + ideaTitle + "' delete kar diya gaya hai.");
        }
    }

    private void addLog(String action, String description, String email) {
        ActivityLog log = new ActivityLog();
        log.setAction(action);
        log.setDescription(description);
        log.setTimestamp(LocalDateTime.now());
        log.setCreatedByEmail(email);

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            log.setUser(user);
        }

        logRepository.save(log);
    }
}