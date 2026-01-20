package com.profiling.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AnswerQualityUtils Tests")
class AnswerQualityUtilsTest {

    @Test
    @DisplayName("collectInvalidAnswers should return empty map for null input")
    void testCollectInvalidAnswers_NullInput_ReturnsEmpty() {
        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(null);
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("collectInvalidAnswers should filter out null answers")
    void testCollectInvalidAnswers_NullAnswers_FiltersOut() {
        Map<String, String> answers = new HashMap<>();
        answers.put("Question 1", null);
        answers.put("Question 2", "Valid answer with enough content");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        assertEquals(1, result.size());
        assertTrue(result.containsKey("Question 1"));
    }

    @Test
    @DisplayName("collectInvalidAnswers should filter out empty answers")
    void testCollectInvalidAnswers_EmptyAnswers_FiltersOut() {
        Map<String, String> answers = new HashMap<>();
        answers.put("Question 1", "");
        answers.put("Question 2", "   ");
        answers.put("Question 3", "Valid answer with enough content");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        assertEquals(2, result.size());
        assertTrue(result.containsKey("Question 1"));
        assertTrue(result.containsKey("Question 2"));
    }

    @Test
    @DisplayName("collectInvalidAnswers should filter out short answers")
    void testCollectInvalidAnswers_ShortAnswers_FiltersOut() {
        Map<String, String> answers = new HashMap<>();
        answers.put("Question 1", "Hi");
        answers.put("Question 2", "OK");
        answers.put("Question 3", "This is a valid answer with sufficient length and content");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        assertTrue(result.size() >= 2);
        assertTrue(result.containsKey("Question 1") || result.containsKey("Question 2"));
    }

    @Test
    @DisplayName("collectInvalidAnswers should filter out answers with too few words")
    void testCollectInvalidAnswers_FewWords_FiltersOut() {
        Map<String, String> answers = new HashMap<>();
        answers.put("Question 1", "Yes");
        answers.put("Question 2", "No");
        answers.put("Question 3", "This is a valid answer with multiple words");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        assertTrue(result.size() >= 2);
    }

    @Test
    @DisplayName("collectInvalidAnswers should filter out answers with low letter ratio")
    void testCollectInvalidAnswers_LowLetterRatio_FiltersOut() {
        Map<String, String> answers = new HashMap<>();
        answers.put("Question 1", "123456789012345");
        answers.put("Question 2", "!!!@@@###$$$%%%");
        answers.put("Question 3", "This is a valid answer with mostly letters");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        assertTrue(result.size() >= 2);
    }

    @Test
    @DisplayName("collectInvalidAnswers should preserve order using LinkedHashMap")
    void testCollectInvalidAnswers_PreservesOrder() {
        Map<String, String> answers = new LinkedHashMap<>();
        answers.put("Question 1", "Short");
        answers.put("Question 2", "Also short");
        answers.put("Question 3", "Valid answer with enough content");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        assertTrue(result instanceof LinkedHashMap);
    }

    @Test
    @DisplayName("collectInvalidAnswers should skip null or empty questions")
    void testCollectInvalidAnswers_NullOrEmptyQuestions_Skips() {
        Map<String, String> answers = new HashMap<>();
        answers.put(null, "Answer");
        answers.put("", "Answer");
        answers.put("   ", "Answer");
        answers.put("Valid Question", "Valid answer with enough content");

        Map<String, String> result = AnswerQualityUtils.collectInvalidAnswers(answers);
        // Should only contain valid question
        assertTrue(result.isEmpty() || result.size() <= 1);
    }
}
