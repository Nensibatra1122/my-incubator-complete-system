package com.example.demo.service;

import com.example.demo.model.Like;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.LikeRepository;
import com.example.demo.repository.ActivityLogRepository;
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

    public List<Like> getAll() {
        return repository.findAll();
    }

    public Like save(Like like, Authentication auth) {
        Like savedLike = repository.save(like);

        // Activity Log for Like save/create
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_LIKE");
            log.setDescription("Like record saved/updated successfully.");
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                log.setUser(user);
            }
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception so main transaction doesn't fail
        }

        return savedLike;
    }

    // --- Toggle Like Logic ---
    public boolean toggleLike(Long ideaId, Authentication auth) {
        if (auth == null || auth.getName() == null) return false;

        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return false;

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
            // Idea set karne ke liye agar idea repository ki zaroorat ho toh inject kar sakte hain,
            // ya incoming object se handle kar sakte hain.
            repository.save(newLike);
            return true; // Liked
        }
    }
}