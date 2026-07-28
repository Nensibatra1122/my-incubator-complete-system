package com.example.demo.repository;

import com.example.demo.model.StartupTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StartupTimelineRepository extends JpaRepository<StartupTimeline, Long> {
    // Yahan 'findByStartupId' ko change karke 'findByIdeaId' kar diya hai
    // Taaki ye database ke 'idea_id' column se match kare
    List<StartupTimeline> findByIdeaId(Long ideaId);
}