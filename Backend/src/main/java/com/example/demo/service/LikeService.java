package com.example.demo.service;

import com.example.demo.model.Like;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.Idea;
import com.example.demo.model.User;
import com.example.demo.repository.LikeRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LikeService {

    @Autowired
    private LikeRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private IdeaRepository ideaRepository; // <-- IdeaRepository inject kiya

    public List<Like> getAll() {
        return repository.findAll();
    }

    public Like save(Like like, Authentication auth) {
        // Ensure user is attached if coming from frontend request
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && like.getUser() == null) {
            like.setUser(user);
        }

        Like savedLike = repository.save(like);

        // Activity Log for Like save/create
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_LIKE");
            log.setDescription("Like record saved/updated successfully.");
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            if (user != null) {
                log.setUser(user);
            }
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception so main transaction doesn't fail
        }

        return savedLike;
    }

    // --- Toggle Like Logic (Fixed) ---
    public boolean toggleLike(Long ideaId, Authentication auth) {
        if (auth == null || auth.getName() == null) return false;

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

        // Fetch idea to make sure it exists
        Idea idea = ideaRepository.findById(ideaId).orElse(null);
        if (idea == null) return false;

        // Check if user already liked this idea
        Optional<Like> existingLike = repository.findAll().stream()
                .filter(l -> l.getUser() != null && l.getUser().getId().equals(user.getId()) &&
                        l.getIdea() != null && l.getIdea().getIdeaId().equals(ideaId))
                .findFirst();

        if (existingLike.isPresent()) {
            repository.delete(existingLike.get());
            return false; // Unliked
        } else {
            Like newLike = new Like();
            newLike.setUser(user);
            newLike.setIdea(idea); // <-- Yahan Idea properly set kar diya
            repository.save(newLike);
            return true; // Liked
        }
    }
}