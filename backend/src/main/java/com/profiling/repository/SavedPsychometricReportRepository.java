package com.profiling.repository;

import com.profiling.model.SavedPsychometricReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPsychometricReportRepository extends MongoRepository<SavedPsychometricReport, String> {
    
    /**
     * Find all saved reports for a specific user
     */
    List<SavedPsychometricReport> findByUserIdOrderBySavedAtDesc(String userId);
    
    /**
     * Find a saved report by userId and sessionId
     */
    Optional<SavedPsychometricReport> findByUserIdAndSessionId(String userId, String sessionId);
    
    /**
     * Check if a report is already saved by a user
     */
    boolean existsByUserIdAndSessionId(String userId, String sessionId);
    
    /**
     * Delete a saved report by userId and sessionId
     */
    void deleteByUserIdAndSessionId(String userId, String sessionId);
}










