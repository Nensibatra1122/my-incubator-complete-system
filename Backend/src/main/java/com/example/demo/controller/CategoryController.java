package com.example.demo.controller;

import com.example.demo.model.Category;
import com.example.demo.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Category> getAllCategories() {
        return categoryService.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addCategory(@RequestBody Category category, Authentication auth) {
        categoryService.addCategory(category, auth.getName());
        return ResponseEntity.ok("Success: Category '" + category.getName() + "' created successfully!");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCategory(@PathVariable Long id, @RequestBody Category details, Authentication auth) {
        return categoryService.updateCategory(id, details, auth.getName())
                .map(category -> ResponseEntity.ok("Success: Category ID " + id + " updated to '" + category.getName() + "' successfully!"))
                .orElse(ResponseEntity.status(404).body("Error: Category with ID " + id + " not found."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id, Authentication auth) {
        categoryService.deleteCategory(id, auth.getName());
        return ResponseEntity.ok("Success: Category with ID " + id + " has been deleted!");
    }
}