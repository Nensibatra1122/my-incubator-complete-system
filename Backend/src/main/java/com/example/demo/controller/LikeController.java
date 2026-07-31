package com.example.demo.controller;

import com.example.demo.model.Like;
import com.example.demo.repository.LikeRepository;
import com.example.demo.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/likes")
@CrossOrigin(origins = "*")
public class LikeController {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private LikeService likeService;

    // 1. CREATE / TOGGLE LIKE (Integrated with Service for Activity Logging & Duplicate Prevention)
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addLike(@RequestBody Like like, Authentication auth) {
        try {
            Like savedLike = likeService.save(like, auth);
            return ResponseEntity.ok(savedLike);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing like: " + e.getMessage());
        }
    }

    // 2. READ ALL (Accessible to authenticated users for community feed)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Like>> getAllLikes() {
        List<Like> likes = likeService.getAll();
        return ResponseEntity.ok(likes);
    }

    // 3. READ ONE BY ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isLikeOwner(#id, authentication)")
    public ResponseEntity<Like> getLikeById(@PathVariable Long id) {
        return likeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. UPDATE LIKE
    @PutMapping("/{id}")
    @PreAuthorize("@securityService.isLikeOwner(#id, authentication)")
    public ResponseEntity<Like> updateLike(@PathVariable Long id, @RequestBody Like likeDetails, Authentication auth) {
        return likeRepository.findById(id).map(like -> {
            like.setStatus(likeDetails.getStatus());
            Like updated = likeService.save(like, auth);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    // 5. DELETE LIKE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isLikeOwner(#id, authentication)")
    public ResponseEntity<Void> deleteLike(@PathVariable Long id) {
        if (likeRepository.existsById(id)) {
            likeRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}