package com.profiling.service.psychometric;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.profiling.dto.psychometric.CheatEventRequest;
import com.profiling.dto.psychometric.CreateSessionRequest;
import com.profiling.dto.psychometric.SubmitTestRequest;
import com.profiling.dto.psychometric.SubmitTestResponse;
import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.SessionStatus;
import com.profiling.repository.PsychometricSessionRepository;

@Service
public class PsychometricSessionService {

    private final PsychometricSessionRepository repository;
    private final PsychometricAsyncService asyncService;

    public PsychometricSessionService(
            PsychometricSessionRepository repository,
            PsychometricAsyncService asyncService) {
        this.repository = repository;
        this.asyncService = asyncService;
    }

    @Transactional
    public PsychometricSession createSession(CreateSessionRequest request) {
        PsychometricSession session = new PsychometricSession();
        session.setUserInfo(request.getUserInfo());
        session.setStatus(SessionStatus.CREATED);
        PsychometricSession savedSession = repository.save(session);
        
        savedSession.setStatus(SessionStatus.GENERATING);
        repository.save(savedSession);
        
        com.profiling.model.psychometric.UserInfo userInfo = request.getUserInfo();
        asyncService.generateSection1Questions(savedSession.getId(), userInfo);
        asyncService.generateSection2Questions(savedSession.getId(), userInfo);
        asyncService.generateSection3Questions(savedSession.getId(), userInfo);
        
        return savedSession;
    }

    public Optional<PsychometricSession> getSession(String id) {
        return repository.findById(id);
    }
    
    @Transactional
    public PsychometricSession saveSession(PsychometricSession session) {
        return repository.save(session);
    }

    public List<com.profiling.model.psychometric.Question> getQuestions(String sessionId) {
        return repository.findById(sessionId)
                .map(PsychometricSession::getQuestions)
                .orElse(java.util.Collections.emptyList());
    }

    @Transactional
    public SubmitTestResponse submitTest(SubmitTestRequest request) {
        Optional<PsychometricSession> sessionOpt = repository.findById(request.getSessionId());
        
        if (sessionOpt.isEmpty()) {
            throw new IllegalArgumentException("Session not found: " + request.getSessionId());
        }

        PsychometricSession session = sessionOpt.get();
        
        session.setAnswers(request.getAnswers());
        session.setStatus(SessionStatus.COMPLETED);
        
        // Save test results from frontend to ensure consistency
        PsychometricSession.TestResults testResults = new PsychometricSession.TestResults(
            request.getResults().getTotalQuestions(),
            request.getResults().getAttempted(),
            request.getResults().getNotAttempted(),
            request.getResults().getCorrect(),
            request.getResults().getWrong(),
            request.getResults().getMarkedForReview(),
            request.getResults().getAnsweredAndMarkedForReview(),
            request.getResults().getSubmittedAt()
        );
        session.setTestResults(testResults);
        
        repository.save(session);

        Instant submittedAt = Instant.parse(request.getResults().getSubmittedAt());

        SubmitTestResponse response = new SubmitTestResponse(
            request.getSessionId(),
            request.getUserId(),
            request.getTestId(),
            request.getResults().getTotalQuestions(),
            request.getResults().getAttempted(),
            request.getResults().getNotAttempted(),
            request.getResults().getCorrect(),
            request.getResults().getWrong(),
            request.getResults().getMarkedForReview(),
            request.getResults().getAnsweredAndMarkedForReview(),
            request.getWarnings(),
            request.getSubmittedBy(),
            submittedAt
        );

        return response;
    }

    public void logCheatEvent(CheatEventRequest request) {
        System.out.println(String.format(
            "Cheat Event Logged - Session: %s, Reason: %s, Warning Count: %d, Timestamp: %s",
            request.getSessionId(),
            request.getReason(),
            request.getWarningCount(),
            request.getTimestamp()
        ));
    }
}


