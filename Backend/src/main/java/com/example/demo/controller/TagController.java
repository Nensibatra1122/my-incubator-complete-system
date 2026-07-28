package com.example.demo.controller;

import com.example.demo.model.Tag;
import com.example.demo.service.TagService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tags")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    // 1. CREATE: Admin, Mentor, ya koi bhi authenticated user jo idea submit kar raha ho tag create kar sake
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR')")
    public ResponseEntity<Tag> createTag(@RequestBody Tag tag, Authentication authentication) {
        Tag created = tagService.createTag(tag, authentication);
        return ResponseEntity.ok(created);
    }

    // 2. READ ALL: Sabhi authorized roles tags dekh sakein taake ideas filter kar sakein
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR')")
    public ResponseEntity<List<Tag>> getAllTags(Authentication authentication) {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    // 3. READ BY ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'ROLE_ADMIN', 'ROLE_STUDENT', 'ROLE_MENTOR', 'ROLE_INVESTOR')")
    public ResponseEntity<Tag> getTagById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(tagService.getTagById(id));
    }

    // 4. UPDATE: Sirf Admin ya Tag owner
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isTagOwner(#id, authentication)")
    public ResponseEntity<Tag> updateTag(@PathVariable Long id, @RequestBody Tag tagDetails, Authentication authentication) {
        Tag updated = tagService.updateTag(id, tagDetails, authentication);
        return ResponseEntity.ok(updated);
    }

    // 5. DELETE: Sirf Admin ya Tag owner
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN') or @securityService.isTagOwner(#id, authentication)")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id, Authentication authentication) {
        tagService.deleteTag(id, authentication);
        return ResponseEntity.ok().build();
    }
}