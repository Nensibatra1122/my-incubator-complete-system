package com.example.demo.service;

import com.example.demo.model.ActivityLog;
import com.example.demo.model.Tag;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.TagRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TagService {

    private final TagRepository tagRepository;
    private final ActivityLogRepository logRepository;
    private final UserRepository userRepository;

    public TagService(TagRepository tagRepository, ActivityLogRepository logRepository, UserRepository userRepository) {
        this.tagRepository = tagRepository;
        this.logRepository = logRepository;
        this.userRepository = userRepository;
    }

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    public Tag getTagById(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found with id: " + id));
    }

    public Tag createTag(Tag tag, Authentication auth) {
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        tag.setCreatedByEmail(email);

        Tag savedTag = tagRepository.save(tag);

        // Log activity
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("CREATE_TAG");
            log.setDescription("Created tag: " + tag.getTagName());
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());
            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }

        return savedTag;
    }

    public Tag updateTag(Long id, Tag tagDetails, Authentication auth) {
        Tag tag = getTagById(id);
        tag.setTagName(tagDetails.getTagName());
        Tag updatedTag = tagRepository.save(tag);

        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("UPDATE_TAG");
            log.setDescription("Updated tag id: " + id);
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());
            userRepository.findByEmail(email).ifPresent(log::setUser);
            logRepository.save(log);
        } catch (Exception e) {}

        return updatedTag;
    }

    public void deleteTag(Long id, Authentication auth) {
        if (tagRepository.existsById(id)) {
            tagRepository.deleteById(id);

            String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
            try {
                ActivityLog log = new ActivityLog();
                log.setAction("DELETE_TAG");
                log.setDescription("Deleted tag id: " + id);
                log.setCreatedByEmail(email);
                log.setTimestamp(LocalDateTime.now());
                userRepository.findByEmail(email).ifPresent(log::setUser);
                logRepository.save(log);
            } catch (Exception e) {}
        } else {
            throw new RuntimeException("Tag not found for deletion");
        }
    }
}