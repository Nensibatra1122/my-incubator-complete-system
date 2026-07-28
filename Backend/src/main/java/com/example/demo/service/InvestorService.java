package com.example.demo.service;

import com.example.demo.model.Investor;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.User;
import com.example.demo.repository.InvestorRepository;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class InvestorService {

    @Autowired
    private InvestorRepository repository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Investor> getAll() {
        return repository.findAll();
    }

    public Optional<Investor> getById(Long id) {
        return repository.findById(id);
    }

    public Investor save(Investor investor, Authentication auth) {
        // 1. Root Fix & Role Validation: Fetch the managed User from database using ID
        if (investor.getUser() != null && investor.getUser().getUserId() != null) {
            User targetUser = userRepository.findById(investor.getUser().getUserId()).orElse(null);
            if (targetUser != null) {
                if (!"INVESTOR".equals(targetUser.getRole())) {
                    throw new RuntimeException("Only users with Investor role can be added as an investor. This user's role is: " + targetUser.getRole());
                }
                // Attach the fully managed user to prevent TransientPropertyValueException
                investor.setUser(targetUser);
            } else {
                throw new RuntimeException("User with ID " + investor.getUser().getUserId() + " not found in database!");
            }
        } else {
            throw new RuntimeException("Investor must be associated with a valid User ID!");
        }

        // 2. Duplicate & Project Append Check
        Investor savedInvestor;
        Optional<Investor> existingInvestorOpt = repository.findAll().stream()
                .filter(inv -> inv.getUser() != null && inv.getUser().getUserId().equals(investor.getUser().getUserId()))
                .findFirst();

        if (existingInvestorOpt.isPresent()) {
            Investor existing = existingInvestorOpt.get();

            // Append new projects if list exists
            if (investor.getProjects() != null && !investor.getProjects().isEmpty()) {
                if (existing.getProjects() == null) {
                    existing.setProjects(new ArrayList<>());
                }
                for (String proj : investor.getProjects()) {
                    if (!existing.getProjects().contains(proj)) {
                        existing.getProjects().add(proj);
                    }
                }
            }

            // Update other fields
            existing.setInvestmentFocus(investor.getInvestmentFocus());
            existing.setMinimumAmount(investor.getMinimumAmount());
            existing.setWhatInvestorOffers(investor.getWhatInvestorOffers());

            savedInvestor = repository.save(existing);
        } else {
            savedInvestor = repository.save(investor);
        }

        // 3. Activity Log for Investor save/create
        String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_INVESTOR");
            log.setDescription("Investor record saved for ID: " + savedInvestor.getInvestorId());
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                log.setUser(user);
            }
            logRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }

        return savedInvestor;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}