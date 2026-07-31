package com.example.demo.controller;

import com.example.demo.model.FinanceTransaction;
import com.example.demo.repository.FinanceTransactionRepository;
import com.example.demo.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/finance-transactions")
public class FinanceTransactionController {

    @Autowired
    private FinanceService service;

    @Autowired
    private FinanceTransactionRepository transactionRepo;

    @PostMapping("/project/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public FinanceTransaction add(@RequestBody FinanceTransaction t,
                                  @PathVariable Long projectId,
                                  Authentication auth) {
        return service.addTransaction(t, projectId, auth);
    }

    @GetMapping("/by-project/{id}")
    @PreAuthorize("isAuthenticated()")
    public List<FinanceTransaction> getByProject(@PathVariable Long id) {
        return service.getByProjectId(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTOR', 'MENTOR', 'STUDENT')")
    public List<FinanceTransaction> getAll(Authentication authentication) {
        List<FinanceTransaction> list = service.getAllTransactions();

        if (authentication == null) {
            return list;
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN"));

        if (isAdmin) {
            return list;
        }

        String currentEmail = authentication.getName().toLowerCase();

        return list.stream()
                .filter(tx -> {
                    if (tx.getFinanceProject() == null) return true;
                    String createdBy = tx.getFinanceProject().getCreatedByEmail() != null ? tx.getFinanceProject().getCreatedByEmail().toLowerCase() : "";
                    String mentorEmail = tx.getFinanceProject().getMentorEmail() != null ? tx.getFinanceProject().getMentorEmail().toLowerCase() : "";
                    return createdBy.isEmpty() || createdBy.equals(currentEmail) || mentorEmail.equals(currentEmail);
                })
                .toList();
    }

    @GetMapping("/project/{projectId}/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public List<FinanceTransaction> getByType(@PathVariable Long projectId,
                                              @PathVariable String type) {
        return transactionRepo.findByFinanceProject_IdAndType(projectId, type);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or @securityService.isTransactionOwner(#id, authentication)")
    public ResponseEntity<FinanceTransaction> update(@PathVariable Long id,
                                                     @RequestBody FinanceTransaction t,
                                                     Authentication auth) {
        FinanceTransaction updated = service.updateTransaction(id, t, auth);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or @securityService.isTransactionOwner(#id, authentication)")
    public ResponseEntity<String> delete(@PathVariable Long id,
                                         Authentication auth) {
        service.deleteTransaction(id, auth);
        return ResponseEntity.ok("Transaction with ID " + id + " deleted successfully!");
    }
}