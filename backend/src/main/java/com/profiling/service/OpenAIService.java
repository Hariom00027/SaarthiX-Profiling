package com.profiling.service;

import java.util.List;
import java.util.Map;

public interface OpenAIService {
    String enhanceProfile(String profileText);
    
    /**
     * Generate personalized questions based on user profile
     * @param userProfile The user's profile information
     * @return List of 15 questions (5 per stage)
     */
    List<String> generateQuestions(Map<String, String> userProfileData);
    
    /**
     * Generate a follow-up WHY question based on user's answer
     * @param question The original question
     * @param answer The user's answer
     * @return A WHY follow-up question or null if not needed
     */
    String generateWhyQuestion(String question, String answer);
    
    /**
     * Evaluate user profile and answers to generate interest evaluation
     * @param userProfileData User profile information
     * @param answers Map of question to answer
     * @param invalidAnswers Subset of answers that looked short or placeholder
     * @return JSON string containing evaluation result
     */
    String evaluateInterests(Map<String, String> userProfileData, Map<String, String> answers, Map<String, String> invalidAnswers);

    /**
     * Enhance a single uploaded profile paragraph using psychometric report insights, without increasing word count.
     * @param originalParagraph paragraph to enhance
     * @param reportInsights positive insights from the report (strengths, fit analysis, behavioral insights)
     * @return enhanced paragraph text
     */
    String enhanceParagraphWithReport(String originalParagraph, String reportInsights);

    /**
     * Low-level helper: run a raw prompt through chat completions without adding additional wrapping prompts.
     * Used when the caller already crafted a full instruction prompt (e.g., preserve exact template structure).
     */
    String completePrompt(String prompt, int maxTokens, double temperature);
}

