package com.profiling.service;

import com.profiling.dto.ChatRequest;
import com.profiling.dto.ChatState;
import com.profiling.dto.UserProfile;
import com.profiling.exception.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for managing chatbot conversation flow
 */
@Service
public class ChatbotService {

    private final OpenAIService openAIService;
    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    @Autowired
    public ChatbotService(OpenAIService openAIService) {
        this.openAIService = openAIService;
    }

    /**
     * Process chat message and return next question or follow-up
     */
    public ChatResponse processChat(ChatRequest request) {
        ChatState state = request.getConversationState();
        String userMessage = request.getUserMessage();

        if (state == null) {
            log.warn("Conversation state missing in chat request");
            throw new BadRequestException("Conversation state is required");
        }

        if (userMessage == null || userMessage.trim().isEmpty()) {
            log.warn("User message missing in chat request");
            throw new BadRequestException("User message is required");
        }

        log.info("Processing chatbot conversation step");
        
        // Calculate current question number (0-indexed)
        int currentQuestionNum = (state.getCurrentStage() - 1) * 5 + state.getCurrentQuestionIndex();
        int maxQuestions = 15;
        
        log.info("Current question: {}/{}, WHY questions: DISABLED", currentQuestionNum + 1, maxQuestions);
        
        // DISABLED: WHY follow-up questions to ensure exactly 15 questions are asked
        // If there's a pending WHY question, handle it first
        if (state.getPendingWhyQuestion() != null && !state.getPendingWhyQuestion().isEmpty()) {
            // User answered the WHY question, store it and move on
            String currentQuestion = state.getCurrentQuestion();
            if (currentQuestion != null) {
                // Store the WHY answer with a special key
                state.addAnswer(currentQuestion + " [WHY]", userMessage);
            }
            state.setPendingWhyQuestion(null);
        } else {
            // Store the answer to the current question
            String currentQuestion = state.getCurrentQuestion();
            if (currentQuestion != null) {
                state.addAnswer(currentQuestion, userMessage);

                // WHY questions DISABLED to keep conversation to exactly 15 questions
                // This ensures the chatbot doesn't exceed the 15 question limit
                /*
                // Only ask WHY questions for the first 12 questions to ensure we don't exceed 15 total
                // This allows for some WHY follow-ups while keeping total questions manageable
                if (currentQuestionNum < 12) {
                    // Check if we should ask a WHY question
                    String whyQuestion = openAIService.generateWhyQuestion(currentQuestion, userMessage);
                    if (whyQuestion != null && !whyQuestion.isEmpty()) {
                        state.setPendingWhyQuestion(whyQuestion);
                        return new ChatResponse(whyQuestion, state, false);
                    }
                }
                */
            }
        }

        // Move to next question
        state.moveToNextQuestion();

        // Check if conversation is complete
        if (state.isComplete()) {
            return new ChatResponse(null, state, true);
        }

        // Get next question and check if it's already been answered
        String nextQuestion = state.getCurrentQuestion();
        
        // Skip questions that have already been answered
        int maxAttempts = 15; // Safety limit
        int attempts = 0;
        while (nextQuestion != null && state.getAnswers().containsKey(nextQuestion) && attempts < maxAttempts) {
            log.info("Skipping already answered question: {}", nextQuestion);
            state.moveToNextQuestion();
            if (state.isComplete()) {
                return new ChatResponse(null, state, true);
            }
            nextQuestion = state.getCurrentQuestion();
            attempts++;
        }
        
        // Also check for similar "interests and goals" questions
        if (nextQuestion != null) {
            String normalizedNext = nextQuestion.toLowerCase();
            boolean isInterestsGoalsQuestion = normalizedNext.contains("interests") && 
                                             (normalizedNext.contains("goals") || normalizedNext.contains("goal"));
            
            if (isInterestsGoalsQuestion) {
                // Check if we've already answered a similar question
                for (String answeredQ : state.getAnswers().keySet()) {
                    String normalizedAnswered = answeredQ.toLowerCase();
                    boolean isSimilarInterestsGoals = normalizedAnswered.contains("interests") && 
                                                    (normalizedAnswered.contains("goals") || normalizedAnswered.contains("goal"));
                    if (isSimilarInterestsGoals) {
                        log.info("Skipping interests/goals question as similar question already answered: {}", answeredQ);
                        state.moveToNextQuestion();
                        if (state.isComplete()) {
                            return new ChatResponse(null, state, true);
                        }
                        nextQuestion = state.getCurrentQuestion();
                        break;
                    }
                }
            }
        }
        
        return new ChatResponse(nextQuestion, state, false);
    }

    /**
     * Convert UserProfile to Map for OpenAI service
     */
    public Map<String, String> profileToMap(UserProfile profile) {
        Map<String, String> map = new HashMap<>();
        if (profile != null) {
            if (profile.getName() != null) map.put("name", profile.getName());
            if (profile.getEmail() != null) map.put("email", profile.getEmail());
            if (profile.getInstitute() != null) map.put("institute", profile.getInstitute());
            if (profile.getCurrentDegree() != null) map.put("currentDegree", profile.getCurrentDegree());
            if (profile.getBranch() != null) map.put("branch", profile.getBranch());
            if (profile.getYearOfStudy() != null) map.put("yearOfStudy", profile.getYearOfStudy());
            if (profile.getTechnicalSkills() != null) map.put("technicalSkills", profile.getTechnicalSkills());
            if (profile.getSoftSkills() != null) map.put("softSkills", profile.getSoftSkills());
            if (profile.getCertifications() != null) map.put("certifications", profile.getCertifications());
            if (profile.getAchievements() != null) map.put("achievements", profile.getAchievements());
            if (profile.getHobbies() != null) map.put("hobbies", profile.getHobbies());
            if (profile.getInterests() != null) map.put("interests", profile.getInterests());
            if (profile.getGoals() != null) map.put("goals", profile.getGoals());
        }
        return map;
    }

    /**
     * Response DTO for chat processing
     */
    public static class ChatResponse {
        private String nextQuestion;
        private ChatState updatedState;
        private boolean isComplete;

        public ChatResponse(String nextQuestion, ChatState updatedState, boolean isComplete) {
            this.nextQuestion = nextQuestion;
            this.updatedState = updatedState;
            this.isComplete = isComplete;
        }

        public String getNextQuestion() {
            return nextQuestion;
        }

        public void setNextQuestion(String nextQuestion) {
            this.nextQuestion = nextQuestion;
        }

        public ChatState getUpdatedState() {
            return updatedState;
        }

        public void setUpdatedState(ChatState updatedState) {
            this.updatedState = updatedState;
        }

        public boolean isComplete() {
            return isComplete;
        }

        public void setComplete(boolean complete) {
            isComplete = complete;
        }
    }
}

