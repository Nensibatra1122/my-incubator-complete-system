package com.example.demo.service;

import com.example.demo.model.ActivityLog;
import com.example.demo.model.FinanceProject;
import com.example.demo.model.FinanceTransaction;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.FinanceProjectRepository;
import com.example.demo.repository.FinanceTransactionRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class FinanceService {

    @Autowired
    private FinanceTransactionRepository repo;

    @Autowired
    private FinanceProjectRepository projectRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public FinanceTransaction addTransaction(FinanceTransaction t, Long projectId, Authentication auth) {
        FinanceProject project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        double currentBudget = project.getBudget() != null ? project.getBudget() : 0.0;
        double newBudget;

        if ("INCOME".equalsIgnoreCase(t.getType())) {
            newBudget = currentBudget + t.getAmount();
        } else {
            newBudget = currentBudget - t.getAmount();
        }

        project.setBudget(newBudget);
        projectRepository.save(project);

        t.setFinanceProject(project);
        String email = (auth != null) ? auth.getName() : "System";
        t.setCreatedByEmail(email);

        FinanceTransaction savedTransaction = repo.save(t);

        // --- ACTIVITY LOG ENTRY FOR ADD ---
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("ADD_TRANSACTION");
            log.setDescription("Added " + t.getType() + " of $" + t.getAmount() + " to project: " + project.getTitle());
            log.setCreatedByEmail(email);
            if (auth != null) {
                userRepository.findByEmail(email).ifPresent(log::setUser);
            }
            activityLogRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception so main transaction doesn't fail
        }

        return savedTransaction;
    }

    public List<FinanceTransaction> getByProjectId(Long id) {
        return repo.findByFinanceProjectId(id);
    }

    public List<FinanceTransaction> getAllTransactions() {
        return repo.findAll();
    }

    @Transactional
    public FinanceTransaction updateTransaction(Long id, FinanceTransaction updatedDetails, Authentication auth) {
        FinanceTransaction transaction = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        FinanceProject project = transaction.getFinanceProject();
        if (project != null) {
            double currentBudget = project.getBudget() != null ? project.getBudget() : 0.0;
            if ("INCOME".equalsIgnoreCase(transaction.getType())) {
                currentBudget -= transaction.getAmount();
            } else {
                currentBudget += transaction.getAmount();
            }

            if ("INCOME".equalsIgnoreCase(updatedDetails.getType())) {
                currentBudget += updatedDetails.getAmount();
            } else {
                currentBudget -= updatedDetails.getAmount();
            }

            project.setBudget(currentBudget);
            projectRepository.save(project);
        }

        transaction.setAmount(updatedDetails.getAmount());
        transaction.setType(updatedDetails.getType());
        transaction.setDescription(updatedDetails.getDescription());

        String email = (auth != null) ? auth.getName() : "System";
        if (auth != null) {
            transaction.setCreatedByEmail(email);
        }

        FinanceTransaction updatedTransaction = repo.save(transaction);

        // --- ACTIVITY LOG ENTRY FOR UPDATE ---
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("UPDATE_TRANSACTION");
            log.setDescription("Updated transaction ID " + id + " to " + updatedDetails.getType() + " of $" + updatedDetails.getAmount());
            log.setCreatedByEmail(email);
            if (auth != null) {
                userRepository.findByEmail(email).ifPresent(log::setUser);
            }
            activityLogRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }

        return updatedTransaction;
    }

    @Transactional
    public void deleteTransaction(Long id, Authentication auth) {
        FinanceTransaction transaction = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        FinanceProject project = transaction.getFinanceProject();
        if (project != null) {
            double currentBudget = project.getBudget() != null ? project.getBudget() : 0.0;
            if ("INCOME".equalsIgnoreCase(transaction.getType())) {
                currentBudget -= transaction.getAmount();
            } else {
                currentBudget += transaction.getAmount();
            }

            project.setBudget(currentBudget);
            projectRepository.save(project);
        }

        String email = (auth != null) ? auth.getName() : "System";
        repo.delete(transaction);

        // --- ACTIVITY LOG ENTRY FOR DELETE ---
        try {
            ActivityLog log = new ActivityLog();
            log.setAction("DELETE_TRANSACTION");
            log.setDescription("Deleted " + transaction.getType() + " transaction of $" + transaction.getAmount());
            log.setCreatedByEmail(email);
            if (auth != null) {
                userRepository.findByEmail(email).ifPresent(log::setUser);
            }
            activityLogRepository.save(log);
        } catch (Exception e) {
            // Ignore log exception
        }
    }
}