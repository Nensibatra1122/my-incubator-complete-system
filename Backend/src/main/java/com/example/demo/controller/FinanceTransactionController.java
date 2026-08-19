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
@RequestMapping({"/api/finance-transactions", "/api/finance/transactions"})
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FinanceTransactionController {

    @Autowired
    private FinanceService service;

    @Autowired
    private FinanceTransactionRepository transactionRepo;

    // Fixed: hasAuthority use kiya hai taake token role mismatch na ho
    @PostMapping("/project/{projectId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'STUDENT', 'ROLE_STUDENT')")
    public FinanceTransaction add(@RequestBody FinanceTransaction t,
                                  @PathVariable Long projectId,
                                  Authentication auth) {
        return service.addTransaction(t, projectId, auth);
    }

    @GetMapping("/by-project/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVESTOR', 'ROLE_INVESTOR', 'MENTOR', 'ROLE_MENTOR', 'STUDENT', 'ROLE_STUDENT')")
    public List<FinanceTransaction> getByProject(@PathVariable Long id) {
        return service.getByProjectId(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVESTOR', 'ROLE_INVESTOR', 'MENTOR', 'ROLE_MENTOR', 'STUDENT', 'ROLE_STUDENT')")
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
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'INVESTOR', 'ROLE_INVESTOR', 'MENTOR', 'ROLE_MENTOR', 'STUDENT', 'ROLE_STUDENT')")
    public List<FinanceTransaction> getByType(@PathVariable Long projectId,
                                              @PathVariable String type) {
        return transactionRepo.findByFinanceProject_IdAndType(projectId, type);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<FinanceTransaction> update(@PathVariable Long id,
                                                     @RequestBody FinanceTransaction t,
                                                     Authentication auth) {
        FinanceTransaction updated = service.updateTransaction(id, t, auth);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> delete(@PathVariable Long id,
                                         Authentication auth) {
        service.deleteTransaction(id, auth);
        return ResponseEntity.ok("Transaction with ID " + id + " deleted successfully!");
    }
}