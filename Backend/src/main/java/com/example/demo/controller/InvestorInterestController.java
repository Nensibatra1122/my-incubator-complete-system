package com.example.demo.controller;

import com.example.demo.dto.InvestorInterestRequestDTO;
import com.example.demo.dto.InvestorInterestResponseDTO;
import com.example.demo.model.InvestorInterest;
import com.example.demo.service.InvestorInterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/investor-interests")
@CrossOrigin(origins = "*")
public class InvestorInterestController {

    @Autowired
    private InvestorInterestService investorInterestService;

    // Investor: "Express Investment Interest" button ka call (Ab DTO return karega)
    @PostMapping
    public ResponseEntity<?> createInterest(@RequestBody InvestorInterestRequestDTO request) {
        try {
            InvestorInterestResponseDTO saved = investorInterestService.createInterestDTO(request);
            return ResponseEntity.ok(saved);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save interest: " + e.getMessage()));
        }
    }

    // Admin: saari interests dekhne ke liye
    @GetMapping
    public ResponseEntity<List<InvestorInterestResponseDTO>> getAllInterests() {
        return ResponseEntity.ok(investorInterestService.getAllInterestDTOs());
    }

    // Admin: sirf pending interests
    @GetMapping("/pending")
    public ResponseEntity<List<InvestorInterestResponseDTO>> getPendingInterests() {
        return ResponseEntity.ok(investorInterestService.getPendingInterestDTOs());
    }

    // Investor apni khud ki bheji hui requests dekh sake
    @GetMapping("/my")
    public ResponseEntity<List<InvestorInterestResponseDTO>> getMyInterests(@RequestParam String email) {
        return ResponseEntity.ok(investorInterestService.getInterestDTOsByInvestorEmail(email));
    }

    // Admin: approve ya reject karna (Ab DTO return karega)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "status field is required."));
            }
            InvestorInterestResponseDTO updated = investorInterestService.updateStatusDTO(id, newStatus.toUpperCase());
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update status: " + e.getMessage()));
        }
    }
}