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
@RequestMapping({"/api/finance-projects", "/api/finance", "/api/finances"})
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class FinanceProjectController {

    @Autowired
    private FinanceProjectService projectService;

    @GetMapping("/all-projects-expenses")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVESTOR', 'MENTOR', 'STUDENT')")
    public ResponseEntity<List<ProjectExpenseDTO>> getAllProjectsExpenses(Authentication authentication) {
        List<ProjectExpenseDTO> list = projectService.getAllProjectsExpenses();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{idParam}/total-expense")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectExpenseDTO> getTotalExpense(@PathVariable String idParam) {
        try {
            Long id = Long.parseLong(idParam.split(":")[0]);
            return ResponseEntity.ok(projectService.getExpenseByProjectId(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{idParam}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FinanceProject> getById(@PathVariable String idParam) {
        try {
            Long id = Long.parseLong(idParam.split(":")[0]);
            return projectService.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
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

        return list.stream()
                .filter(p -> {
                    String createdBy = p.getCreatedByEmail() != null ? p.getCreatedByEmail().toLowerCase() : "";
                    String mentorEmail = p.getMentorEmail() != null ? p.getMentorEmail().toLowerCase() : "";
                    return createdBy.isEmpty() || createdBy.equals(currentEmail) || mentorEmail.equals(currentEmail);
                })
                .toList();
    }

    @PutMapping("/{idParam}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FinanceProject> update(@PathVariable String idParam, @RequestBody FinanceProject p) {
        try {
            Long id = Long.parseLong(idParam.split(":")[0]);
            return projectService.update(id, p);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{idParam}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String idParam) {
        try {
            Long id = Long.parseLong(idParam.split(":")[0]);
            projectService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}