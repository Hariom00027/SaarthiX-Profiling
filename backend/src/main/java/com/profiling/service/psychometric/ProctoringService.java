package com.profiling.service.psychometric;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.profiling.dto.psychometric.ProctoringViolationRequest;
import com.profiling.model.psychometric.ProctoringViolation;
import com.profiling.repository.ProctoringViolationRepository;

@Service
@Transactional
public class ProctoringService {
    
    private final ProctoringViolationRepository violationRepository;
    
    public ProctoringService(ProctoringViolationRepository violationRepository) {
        this.violationRepository = violationRepository;
    }
    
    /**
     * Log a proctoring violation
     */
    public ProctoringViolation logViolation(ProctoringViolationRequest request) {
        ProctoringViolation violation = new ProctoringViolation();
        violation.setSessionId(request.getSessionId());
        violation.setUserId(request.getUserId());
        violation.setViolationType(request.getViolationType());
        violation.setDescription(request.getDescription());
        violation.setTimestamp(LocalDateTime.now());
        violation.setSeverity(request.getSeverity() != null ? request.getSeverity() : "MEDIUM");
        
        return violationRepository.save(violation);
    }
    
    /**
     * Get all violations for a session
     */
    @Transactional(readOnly = true)
    public List<ProctoringViolation> getSessionViolations(String sessionId) {
        return violationRepository.findBySessionIdOrderByTimestampDesc(sessionId);
    }
    
    /**
     * Get violation statistics for a session
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getViolationStats(String sessionId) {
        List<ProctoringViolation> violations = violationRepository.findBySessionId(sessionId);
        
        // Group by violation type and count
        return violations.stream()
            .collect(Collectors.groupingBy(
                ProctoringViolation::getViolationType,
                Collectors.counting()
            ));
    }
    
    /**
     * Get total violation count for a session
     */
    @Transactional(readOnly = true)
    public long getTotalViolationCount(String sessionId) {
        return violationRepository.countBySessionId(sessionId);
    }
    
    /**
     * Get violations by user
     */
    @Transactional(readOnly = true)
    public List<ProctoringViolation> getUserViolations(String userId) {
        return violationRepository.findByUserIdOrderByTimestampDesc(userId);
    }
    
    /**
     * Delete all violations for a session
     */
    public void deleteSessionViolations(String sessionId) {
        violationRepository.deleteBySessionId(sessionId);
    }
}
