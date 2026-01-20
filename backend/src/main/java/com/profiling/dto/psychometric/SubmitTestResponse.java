package com.profiling.dto.psychometric;

import java.time.Instant;

public class SubmitTestResponse {
    private String sessionId;
    private String userId;
    private String testId;
    private int totalQuestions;
    private int attempted;
    private int notAttempted;
    private int correct;
    private int wrong;
    private int markedForReview;
    private int answeredAndMarkedForReview;
    private int warnings;
    private String submittedBy;
    private Instant submittedAt;

    public SubmitTestResponse() {
    }

    public SubmitTestResponse(String sessionId, String userId, String testId, 
                             int totalQuestions, int attempted, int notAttempted,
                             int correct, int wrong, int markedForReview, 
                             int answeredAndMarkedForReview, int warnings,
                             String submittedBy, Instant submittedAt) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.testId = testId;
        this.totalQuestions = totalQuestions;
        this.attempted = attempted;
        this.notAttempted = notAttempted;
        this.correct = correct;
        this.wrong = wrong;
        this.markedForReview = markedForReview;
        this.answeredAndMarkedForReview = answeredAndMarkedForReview;
        this.warnings = warnings;
        this.submittedBy = submittedBy;
        this.submittedAt = submittedAt;
    }

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

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
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


