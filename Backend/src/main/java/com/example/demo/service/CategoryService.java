package com.example.demo.service;

import com.example.demo.model.ActivityLog;
import com.example.demo.model.Category;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ActivityLogRepository logRepository;
    @Autowired private UserRepository userRepository;

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public Category addCategory(Category category, String email) {
        Category saved = categoryRepository.save(category);
        createLog("CREATE_CATEGORY", "Admin created category: " + saved.getName(), email);
        return saved;
    }

    public Optional<Category> updateCategory(Long id, Category details, String email) {
        return categoryRepository.findById(id).map(c -> {
            c.setName(details.getName());
            Category saved = categoryRepository.save(c);
            createLog("UPDATE_CATEGORY", "Updated category ID: " + id + " to " + details.getName(), email);
            return saved;
        });
    }

    public void deleteCategory(Long id, String email) {
        categoryRepository.findById(id).ifPresent(c -> {
            createLog("DELETE_CATEGORY", "Deleted category: " + c.getName(), email);
            categoryRepository.deleteById(id);
        });
    }

    private void createLog(String action, String desc, String email) {
        ActivityLog log = new ActivityLog();
        log.setAction(action);
        log.setDescription(desc);
        log.setCreatedByEmail(email);
        userRepository.findByEmail(email).ifPresent(log::setUser);
        logRepository.save(log);
    }
}