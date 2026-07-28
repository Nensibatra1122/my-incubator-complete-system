package com.example.demo.service;

import com.example.demo.repository.*;
import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("securityService")
public class SecurityService {

    @Autowired private ActivityLogRepository activityLogRepository;
    @Autowired private FeedbackRepository feedbackRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private FinanceProjectRepository financeProjectRepository;
    @Autowired private FinanceTransactionRepository financeTransactionRepository;
    @Autowired private LikeRepository likeRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private CommentRepository commentRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private InvestorRepository investorRepository;
    @Autowired private TagRepository tagRepository;
    @Autowired private StartupProgressRepository startupProgressRepository;
    @Autowired private StartupTimelineRepository startupTimelineRepository;

    // --- Helper for Admin Role ---
    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("ROLE_ADMIN") || r.getAuthority().equals("ADMIN"));
    }

    // --- Helper to get User ID ---
    private Long getUserIdFromAuth(Authentication auth) {
        if (auth == null || auth.getName() == null) return -1L;
        return userRepository.findByEmail(auth.getName())
                .map(User::getId)
                .orElse(-1L);
    }

    // --- Feedback Owner or Admin Check ---
    public boolean isFeedbackOwner(Long feedbackId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (isAdmin(auth)) return true;

        return feedbackRepository.findById(feedbackId)
                .map(f -> f.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Comment Owner ---
    public boolean isCommentOwner(Long commentId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (isAdmin(auth)) return true;

        return commentRepository.findById(commentId)
                .map(comment -> comment.getUser().getEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Activity Log Owner ---
    public boolean isOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return activityLogRepository.findById(id)
                .map(log -> log.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Session Mentor ---
    public boolean isMentorForSession(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return sessionRepository.findById(id)
                .map(s -> s.getMentorEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Investor Owner Check ---
    public boolean isInvestorOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return investorRepository.findById(id)
                .map(inv -> inv.getEmail() != null && inv.getEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Tag Owner Check ---
    public boolean isTagOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return tagRepository.findById(id)
                .map(t -> t.getCreatedByEmail() != null && t.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Startup Progress Owner Check ---
    public boolean isProgressOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return startupProgressRepository.findById(id)
                .map(p -> p.getCreatedByEmail() != null && p.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Startup Timeline Owner Check ---
    public boolean isTimelineOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return startupTimelineRepository.findById(id)
                .map(t -> t.getCreatedByEmail() != null && t.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- User Owner Check ---
    public boolean isUserOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return userRepository.findById(id)
                .map(u -> u.getEmail() != null && u.getEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Finance Project Owner ---
    public boolean isProjectOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return financeProjectRepository.findById(id)
                .map(p -> p.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Transaction Owner ---
    public boolean isTransactionOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return financeTransactionRepository.findById(id)
                .map(t -> t.getCreatedByEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Like Owner ---
    public boolean isLikeOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return likeRepository.findById(id)
                .map(l -> l.getUserEmail().equals(auth.getName()))
                .orElse(false);
    }

    // --- Notification Owner ---
    public boolean isNotificationOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        Long userId = getUserIdFromAuth(auth);
        return notificationRepository.findById(id)
                .map(n -> n.getUserId().equals(userId))
                .orElse(false);
    }

    // --- Profile Owner ---
    public boolean isProfileOwner(Long id, Authentication auth) {
        if (auth == null) return false;
        if (isAdmin(auth)) return true;
        return profileRepository.findById(id)
                .map(p -> p.getUserEmail().equals(auth.getName()))
                .orElse(false);
    }
}