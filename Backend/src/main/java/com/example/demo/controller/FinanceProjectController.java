package com.example.demo.controller;

import com.example.demo.dto.ProjectExpenseDTO;
import com.example.demo.model.FinanceProject;
import com.example.demo.service.FinanceProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance-projects")
public class FinanceProjectController {

    @Autowired
    private FinanceProjectService projectService;

    @GetMapping("/all-projects-expenses")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTOR', 'MENTOR', 'STUDENT')")
    public ResponseEntity<List<ProjectExpenseDTO>> getAllProjectsExpenses(Authentication authentication) {
        List<ProjectExpenseDTO> list = projectService.getAllProjectsExpenses();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}/total-expense")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectExpenseDTO> getTotalExpense(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getExpenseByProjectId(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FinanceProject> getById(@PathVariable Long id) {
        return projectService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public FinanceProject create(@RequestBody FinanceProject p, Authentication auth) {
        p.setCreatedByEmail(auth.getName());
        return projectService.save(p);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTOR', 'MENTOR', 'STUDENT')")
    public List<FinanceProject> getAll(Authentication authentication) {
        List<FinanceProject> list = projectService.findAll();

        if (authentication == null) {
            return list;
        }

        String currentEmail = authentication.getName().toLowerCase();

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN"));

        if (isAdmin) {
            return list;
        }

        // Updated filter: Agar createdByEmail null bhi ho (jese purane projects mein hai), toh unhein bhi show hone dein
        return list.stream()
                .filter(p -> {
                    String createdBy = p.getCreatedByEmail() != null ? p.getCreatedByEmail().toLowerCase() : "";
                    String mentorEmail = p.getMentorEmail() != null ? p.getMentorEmail().toLowerCase() : "";
                    return createdBy.isEmpty() || createdBy.equals(currentEmail) || mentorEmail.equals(currentEmail);
                })
                .toList();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or @securityService.isProjectOwner(#id, authentication)")
    public ResponseEntity<FinanceProject> update(@PathVariable Long id, @RequestBody FinanceProject p) {
        return projectService.update(id, p);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }
}