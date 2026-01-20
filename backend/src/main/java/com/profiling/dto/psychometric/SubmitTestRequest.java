package com.profiling.dto.psychometric;

import java.util.List;

import com.profiling.model.psychometric.Answer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SubmitTestRequest {
    
    @NotBlank
    private String sessionId;
    
    @NotBlank
    private String userId;
    
    @NotBlank
    private String testId;
    
    @NotNull
    private List<Answer> answers;
    
    @NotNull
    private TestResults results;
    
    private int warnings = 0;
    
    private String submittedBy = "user"; // "user" | "timer" | "proctor"

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTestId() {
        return testId;
    }

    public void setTestId(String testId) {
        this.testId = testId;
    }

    public List<Answer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<Answer> answers) {
        this.answers = answers;
    }

    public TestResults getResults() {
        return results;
    }

    public void setResults(TestResults results) {
        this.results = results;
    }

    public static class TestResults {
        private int totalQuestions;
        private int attempted;
        private int notAttempted;
        private int correct;
        private int wrong;
        private int markedForReview;
        private int answeredAndMarkedForReview;
        private String submittedAt;

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

    public int getWarnings() {
        return warnings;
    }

    public void setWarnings(int warnings) {
        this.warnings = warnings;
    }

    public String getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(String submittedBy) {
        this.submittedBy = submittedBy;
    }
}


