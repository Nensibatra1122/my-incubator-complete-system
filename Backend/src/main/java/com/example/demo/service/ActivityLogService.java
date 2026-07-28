package com.example.demo.service;

import com.example.demo.model.ActivityLog;
import com.example.demo.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ActivityLogService {

    @Autowired
    private ActivityLogRepository repository;

    public List<ActivityLog> getAll() {
        return repository.findAll();
    }

    public ActivityLog save(ActivityLog activityLog) {
        return repository.save(activityLog);
    }
}