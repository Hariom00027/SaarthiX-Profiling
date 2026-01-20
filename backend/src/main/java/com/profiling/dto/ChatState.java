package com.profiling.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO representing the current state of the chatbot conversation
 */
public class ChatState {
    private int currentStage; // 1, 2, or 3
    private int currentQuestionIndex; // 0-4 within current stage (5 questions per stage)
    private List<String> questions; // All 15 questions
    private Map<String, String> answers; // question -> answer mapping
    private String pendingWhyQuestion; // If a WHY follow-up is needed
    private boolean isComplete; // Whether all questions are answered

    public ChatState() {
        this.currentStage = 1;
        this.currentQuestionIndex = 0;
        this.questions = new ArrayList<>();
        this.answers = new HashMap<>();
        this.pendingWhyQuestion = null;
        this.isComplete = false;
    }

    public int getCurrentStage() {
        return currentStage;
    }

    public void setCurrentStage(int currentStage) {
        this.currentStage = currentStage;
    }

    public int getCurrentQuestionIndex() {
        return currentQuestionIndex;
    }

    public void setCurrentQuestionIndex(int currentQuestionIndex) {
        this.currentQuestionIndex = currentQuestionIndex;
    }

    public List<String> getQuestions() {
        return questions;
    }

    public void setQuestions(List<String> questions) {
        this.questions = questions;
    }

    public Map<String, String> getAnswers() {
        return answers;
    }

    public void setAnswers(Map<String, String> answers) {
        this.answers = answers;
    }

    public String getPendingWhyQuestion() {
        return pendingWhyQuestion;
    }

    public void setPendingWhyQuestion(String pendingWhyQuestion) {
        this.pendingWhyQuestion = pendingWhyQuestion;
    }

    public boolean isComplete() {
        return isComplete;
    }

    public void setComplete(boolean complete) {
        isComplete = complete;
    }

    public void addAnswer(String question, String answer) {
        this.answers.put(question, answer);
    }

    public String getCurrentQuestion() {
        if (questions == null || questions.isEmpty()) {
            return null;
        }
        int globalIndex = (currentStage - 1) * 5 + currentQuestionIndex;
        if (globalIndex < questions.size()) {
            return questions.get(globalIndex);
        }
        return null;
    }

    public void moveToNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= 5) {
            currentQuestionIndex = 0;
            currentStage++;
            if (currentStage > 3) {
                isComplete = true;
            }
        }
        // Safety check: ensure we don't exceed 15 questions total
        int globalIndex = (currentStage - 1) * 5 + currentQuestionIndex;
        if (globalIndex >= 15 || (questions != null && globalIndex >= questions.size())) {
            isComplete = true;
        }
    }
}

