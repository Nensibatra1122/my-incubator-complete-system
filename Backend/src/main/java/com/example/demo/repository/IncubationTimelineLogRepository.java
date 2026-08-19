package com.example.demo.repository;

import com.example.demo.model.IncubationTimelineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IncubationTimelineLogRepository extends JpaRepository<IncubationTimelineLog, Long> {
    List<IncubationTimelineLog> findByIncubation_IncubationId(Long incubationId);
}