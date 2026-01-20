package com.profiling.model.psychometric;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

@Document(collection = "psychometric_sessions")
public class PsychometricSession {

    @Id
    private String id;

    @NotNull
    @Valid
    private UserInfo userInfo;

    private SessionStatus status = SessionStatus.CREATED;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private List<Question> questions = new ArrayList<>();
    private List<Answer> answers = new ArrayList<>();
    private Report report;
    
    // Test results from frontend submission
    private TestResults testResults;
    
    // Proctoring data
    private List<ProctoringViolation> proctoringViolations = new ArrayList<>();

    // Progress tracking for async generation
    private boolean aptitudeReady = false;
    private boolean behavioralReady = false;
    private boolean domainReady = false;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public UserInfo getUserInfo() {
        return userInfo;
    }

    public void setUserInfo(UserInfo userInfo) {
        this.userInfo = userInfo;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public List<Answer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Answer> answers) {
        this.answers = answers;
    }

    public Report getReport() {
        return report;
    }

    public void setReport(Report report) {
        this.report = report;
    }

    public boolean isAptitudeReady() {
        return aptitudeReady;
    }

    public void setAptitudeReady(boolean aptitudeReady) {
        this.aptitudeReady = aptitudeReady;
    }

    public boolean isBehavioralReady() {
        return behavioralReady;
    }

    public void setBehavioralReady(boolean behavioralReady) {
        this.behavioralReady = behavioralReady;
    }

    public boolean isDomainReady() {
        return domainReady;
    }

    public void setDomainReady(boolean domainReady) {
        this.domainReady = domainReady;
    }
    
    public List<ProctoringViolation> getProctoringViolations() {
        return proctoringViolations;
    }
    
    public void setProctoringViolations(List<ProctoringViolation> proctoringViolations) {
        this.proctoringViolations = proctoringViolations;
    }
    
    public void addProctoringViolation(ProctoringViolation violation) {
        if (this.proctoringViolations == null) {
            this.proctoringViolations = new ArrayList<>();
        }
        this.proctoringViolations.add(violation);
    }
    
    public TestResults getTestResults() {
        return testResults;
    }
    
    public void setTestResults(TestResults testResults) {
        this.testResults = testResults;
    }
    
    // Inner class to store test results
    public static class TestResults {
        private int totalQuestions;
        private int attempted;
        private int notAttempted;
        private int correct;
        private int wrong;
        private int markedForReview;
        private int answeredAndMarkedForReview;
        private String submittedAt;
        
        public TestResults() {}
        
        public TestResults(int totalQuestions, int attempted, int notAttempted, 
                          int correct, int wrong, int markedForReview, 
                          int answeredAndMarkedForReview, String submittedAt) {
            this.totalQuestions = totalQuestions;
            this.attempted = attempted;
            this.notAttempted = notAttempted;
            this.correct = correct;
            this.wrong = wrong;
            this.markedForReview = markedForReview;
            this.answeredAndMarkedForReview = answeredAndMarkedForReview;
            this.submittedAt = submittedAt;
        }
        
        public int getTotalQuestions() {
            return totalQuestions;
        }
        
        public void setTotalQuestions(int totalQuestions) {
            this.totalQuestions = totalQuestions;
        }
        
        public int getAttempted() {
            return attempted;
        }
        
        public void setAttempted(int attempted) {
            this.attempted = attempted;
        }
        
        public int getNotAttempted() {
            return notAttempted;
        }
        
        public void setNotAttempted(int notAttempted) {
            this.notAttempted = notAttempted;
        }
        
        public int getCorrect() {
            return correct;
        }
        
        public void setCorrect(int correct) {
            this.correct = correct;
        }
        
        public int getWrong() {
            return wrong;
        }
        
        public void setWrong(int wrong) {
            this.wrong = wrong;
        }
        
        public int getMarkedForReview() {
            return markedForReview;
        }
        
        public void setMarkedForReview(int markedForReview) {
            this.markedForReview = markedForReview;
        }
        
        public int getAnsweredAndMarkedForReview() {
            return answeredAndMarkedForReview;
        }
        
        public void setAnsweredAndMarkedForReview(int answeredAndMarkedForReview) {
            this.answeredAndMarkedForReview = answeredAndMarkedForReview;
        }
        
        public String getSubmittedAt() {
            return submittedAt;
        }
        
        public void setSubmittedAt(String submittedAt) {
            this.submittedAt = submittedAt;
        }
    }
}


