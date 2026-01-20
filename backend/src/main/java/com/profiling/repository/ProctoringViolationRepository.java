package com.profiling.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.profiling.model.psychometric.ProctoringViolation;

@Repository
public interface ProctoringViolationRepository extends MongoRepository<ProctoringViolation, String> {
    
    /**
     * Find all violations for a session ordered by timestamp descending
     */
    List<ProctoringViolation> findBySessionIdOrderByTimestampDesc(String sessionId);
    
    /**
     * Find all violations for a session
     */
    List<ProctoringViolation> findBySessionId(String sessionId);
    
    /**
     * Find all violations for a user ordered by timestamp descending
     */
    List<ProctoringViolation> findByUserIdOrderByTimestampDesc(String userId);
    
    /**
     * Count total violations for a session
     */
    long countBySessionId(String sessionId);
    
    /**
     * Delete all violations for a session
     */
    void deleteBySessionId(String sessionId);
}

