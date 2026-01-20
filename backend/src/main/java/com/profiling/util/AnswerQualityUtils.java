package com.profiling.util;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Utility to assess the quality of answers collected during the chat.
 */
public final class AnswerQualityUtils {

    private static final int MIN_CHARACTER_COUNT = 15;
    private static final int MIN_WORD_COUNT = 3;

    private AnswerQualityUtils() {
    }

    /**
     * Collects answers that look short, vague, or placeholder-y so we can mention them in the report.
     */
    public static Map<String, String> collectInvalidAnswers(Map<String, String> answers) {
        Map<String, String> invalid = new LinkedHashMap<>();
        if (answers == null) {
            return invalid;
        }
        answers.forEach((question, answer) -> {
            if (question == null || question.trim().isEmpty()) {
                return;
            }
            if (isLikelyInvalid(answer)) {
                invalid.put(question, answer == null ? "" : answer.trim());
            }
        });
        return invalid;
    }

    private static boolean isLikelyInvalid(String answer) {
        if (answer == null) {
            return true;
        }
        String trimmed = answer.trim();
        if (trimmed.isEmpty()) {
            return true;
        }
        if (trimmed.length() < MIN_CHARACTER_COUNT) {
            return true;
        }
        String[] words = trimmed.split("\\s+");
        if (words.length < MIN_WORD_COUNT) {
            return true;
        }
        long letterCount = trimmed.chars().filter(Character::isLetter).count();
        double letterRatio = letterCount / (double) trimmed.length();
        return letterRatio < 0.5;
    }
}








