package com.profiling.service;

import com.profiling.model.SavedPsychometricReport;
import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.repository.SavedPsychometricReportRepository;
import com.profiling.service.psychometric.PsychometricSessionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class SavedPsychometricReportService {

    private final SavedPsychometricReportRepository savedReportRepository;
    private final PsychometricSessionService sessionService;

    public SavedPsychometricReportService(
            SavedPsychometricReportRepository savedReportRepository,
            PsychometricSessionService sessionService) {
        this.savedReportRepository = savedReportRepository;
        this.sessionService = sessionService;
    }

    /**
     * Save a psychometric report for a user
     */
    @Transactional
    public SavedPsychometricReport saveReport(String userId, String sessionId, String reportTitle) {
        // Check if already saved
        Optional<SavedPsychometricReport> existing = savedReportRepository.findByUserIdAndSessionId(userId, sessionId);
        if (existing.isPresent()) {
            // Update the title if provided
            if (reportTitle != null && !reportTitle.isEmpty()) {
                SavedPsychometricReport savedReport = existing.get();
                savedReport.setReportTitle(reportTitle);
                return savedReportRepository.save(savedReport);
            }
            return existing.get();
        }

        // Get session to extract user info
        Optional<PsychometricSession> sessionOpt = sessionService.getSession(sessionId);
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }

        PsychometricSession session = sessionOpt.get();
        
        // Ensure session is completed
        if (session.getStatus() != com.profiling.model.psychometric.SessionStatus.COMPLETED) {
            throw new IllegalStateException("Cannot save report for incomplete session");
        }

        SavedPsychometricReport savedReport = new SavedPsychometricReport();
        savedReport.setUserId(userId);
        savedReport.setSessionId(sessionId);
        savedReport.setUserEmail(session.getUserInfo().getEmail());
        savedReport.setCandidateName(session.getUserInfo().getName());
        savedReport.setReportTitle(reportTitle);
        savedReport.setSavedAt(Instant.now());

        return savedReportRepository.save(savedReport);
    }

    /**
     * Get all saved reports for a user
     */
    public List<SavedPsychometricReport> getUserSavedReports(String userId) {
        return savedReportRepository.findByUserIdOrderBySavedAtDesc(userId);
    }

    /**
     * Check if a report is already saved
     */
    public boolean isReportSaved(String userId, String sessionId) {
        return savedReportRepository.existsByUserIdAndSessionId(userId, sessionId);
    }

    /**
     * Delete a saved report
     */
    @Transactional
    public void deleteSavedReport(String userId, String sessionId) {
        savedReportRepository.deleteByUserIdAndSessionId(userId, sessionId);
    }

    /**
     * Get a specific saved report
     */
    public Optional<SavedPsychometricReport> getSavedReport(String userId, String sessionId) {
        return savedReportRepository.findByUserIdAndSessionId(userId, sessionId);
    }
}










