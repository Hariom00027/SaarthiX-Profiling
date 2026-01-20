package com.profiling.service.psychometric;

import java.util.List;
import java.util.Optional;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.SessionStatus;
import com.profiling.model.psychometric.UserInfo;
import com.profiling.repository.PsychometricSessionRepository;

@Service
public class PsychometricAsyncService {

    private final PsychometricSessionRepository repository;
    private final QuestionGeneratorService questionGeneratorService;

    public PsychometricAsyncService(
            PsychometricSessionRepository repository,
            QuestionGeneratorService questionGeneratorService) {
        this.repository = repository;
        this.questionGeneratorService = questionGeneratorService;
    }

    @Async("questionGeneratorExecutor")
    public void generateSection1Questions(String sessionId, UserInfo userInfo) {
        try {
            List<Question> questions = questionGeneratorService.generateSection1Questions(userInfo);
            updateSessionWithSection(sessionId, 1, questions, true, false, false);
        } catch (Exception e) {
            System.err.println("Error generating section 1 questions for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            markSectionAsFailed(sessionId, 1);
        }
    }

    @Async("questionGeneratorExecutor")
    public void generateSection2Questions(String sessionId, UserInfo userInfo) {
        try {
            List<Question> questions = questionGeneratorService.generateSection2Questions(userInfo);
            updateSessionWithSection(sessionId, 2, questions, false, true, false);
        } catch (Exception e) {
            System.err.println("Error generating section 2 questions for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            markSectionAsFailed(sessionId, 2);
        }
    }

    @Async("questionGeneratorExecutor")
    public void generateSection3Questions(String sessionId, UserInfo userInfo) {
        try {
            List<Question> questions = questionGeneratorService.generateSection3Questions(userInfo);
            updateSessionWithSection(sessionId, 3, questions, false, false, true);
        } catch (Exception e) {
            System.err.println("Error generating section 3 questions for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            markSectionAsFailed(sessionId, 3);
        }
    }

    @Transactional
    private void updateSessionWithSection(String sessionId, int sectionNumber, List<Question> questions,
            boolean aptitudeReady, boolean behavioralReady, boolean domainReady) {
        Optional<PsychometricSession> sessionOpt = repository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            System.err.println("Session not found: " + sessionId);
            return;
        }

        PsychometricSession session = sessionOpt.get();
        
        List<Question> existingQuestions = session.getQuestions();
        existingQuestions.addAll(questions);
        session.setQuestions(existingQuestions);

        if (aptitudeReady) {
            session.setAptitudeReady(true);
        }
        if (behavioralReady) {
            session.setBehavioralReady(true);
        }
        if (domainReady) {
            session.setDomainReady(true);
        }

        // Incremental status updates so the UI can start as soon as section 1 is ready
        boolean allSectionsReady = session.isAptitudeReady() && session.isBehavioralReady() && session.isDomainReady();
        if (allSectionsReady) {
            session.setStatus(SessionStatus.READY);
        } else if (session.isAptitudeReady()) {
            // At least aptitude is ready; remaining sections may still be generating
            session.setStatus(SessionStatus.PARTIAL_READY);
        } else if (session.getStatus() != SessionStatus.READY && session.getStatus() != SessionStatus.PARTIAL_READY) {
            session.setStatus(SessionStatus.GENERATING);
        }

        repository.save(session);
    }

    @Transactional
    private void markSectionAsFailed(String sessionId, int sectionNumber) {
        Optional<PsychometricSession> sessionOpt = repository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            PsychometricSession session = sessionOpt.get();
            session.setStatus(SessionStatus.FAILED);
            repository.save(session);
        }
    }
}

