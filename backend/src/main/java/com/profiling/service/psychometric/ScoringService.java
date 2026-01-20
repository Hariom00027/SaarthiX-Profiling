package com.profiling.service.psychometric;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.profiling.model.psychometric.Answer;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.PsychometricSession;

@Service
public class ScoringService {
    
    /**
     * Calculate Big Five personality scores from Section 2 (behavioral) questions
     * Questions with categories starting with "big_five_" are used for scoring
     */
    public Map<String, Integer> calculateBigFiveScores(PsychometricSession session) {
        Map<String, Integer> scores = new HashMap<>();
        scores.put("openness", 50);
        scores.put("conscientiousness", 50);
        scores.put("extraversion", 50);
        scores.put("agreeableness", 50);
        scores.put("neuroticism", 50);
        
        if (session.getQuestions() == null || session.getAnswers() == null) {
            return scores;
        }
        
        Map<String, List<Integer>> traitAnswers = new HashMap<>();
        traitAnswers.put("openness", new ArrayList<>());
        traitAnswers.put("conscientiousness", new ArrayList<>());
        traitAnswers.put("extraversion", new ArrayList<>());
        traitAnswers.put("agreeableness", new ArrayList<>());
        traitAnswers.put("neuroticism", new ArrayList<>());
        
        // Process Section 2 questions (behavioral/personality)
        for (Question question : session.getQuestions()) {
            if (question.getSectionNumber() != 2) {
                continue;
            }
            
            String category = question.getCategory();
            if (category == null) {
                continue;
            }
            
            // Find matching answer
            Answer answer = session.getAnswers().stream()
                .filter(a -> a.getQuestionId().equals(question.getId()))
                .findFirst()
                .orElse(null);
            
            if (answer == null || answer.getSelectedOptionIndex() == null) {
                continue;
            }
            
            // Map category to trait (case-insensitive)
            String trait = null;
            String categoryLower = category.toLowerCase();
            if (categoryLower.contains("openness")) {
                trait = "openness";
            } else if (categoryLower.contains("conscientiousness")) {
                trait = "conscientiousness";
            } else if (categoryLower.contains("extraversion")) {
                trait = "extraversion";
            } else if (categoryLower.contains("agreeableness")) {
                trait = "agreeableness";
            } else if (categoryLower.contains("neuroticism")) {
                trait = "neuroticism";
            }
            
            if (trait != null) {
                int index = answer.getSelectedOptionIndex();
                int score;
                // Prefer SJT-style per-option impact scores when available
                if (question.getTraitImpactScores() != null
                        && index >= 0
                        && index < question.getTraitImpactScores().size()) {
                    score = question.getTraitImpactScores().get(index);
                } else {
                    // Fallback for legacy Likert questions: 0-4 mapped to 0-100
                    score = index * 25;
                }
                traitAnswers.get(trait).add(score);
            }
        }
        
        // Calculate average for each trait
        for (String trait : traitAnswers.keySet()) {
            List<Integer> values = traitAnswers.get(trait);
            if (!values.isEmpty()) {
                int sum = values.stream().mapToInt(Integer::intValue).sum();
                int avg = sum / values.size();
                scores.put(trait, Math.max(0, Math.min(100, avg)));
            }
        }
        
        return scores;
    }
    
    /**
     * Calculate section-wise scores
     */
    public Map<String, Double> calculateSectionScores(PsychometricSession session) {
        Map<String, Double> sectionScores = new HashMap<>();
        sectionScores.put("aptitude", 0.0);
        sectionScores.put("behavioral", 0.0);
        sectionScores.put("domain", 0.0);
        
        if (session.getQuestions() == null || session.getAnswers() == null) {
            return sectionScores;
        }
        
        // Calculate for each section
        for (int sectionNum = 1; sectionNum <= 3; sectionNum++) {
            List<Question> sectionQuestions = new ArrayList<>();
            int correctCount = 0;
            int attemptedCount = 0;
            double totalImpactScore = 0.0; // used primarily for behavioral (Section 2) SJT scoring
            int impactCount = 0;
            
            for (Question question : session.getQuestions()) {
                if (question.getSectionNumber() != sectionNum) {
                    continue;
                }
                
                sectionQuestions.add(question);
                
                Answer answer = session.getAnswers().stream()
                    .filter(a -> a.getQuestionId().equals(question.getId()))
                    .findFirst()
                    .orElse(null);
                
                if (answer != null && answer.getSelectedOptionIndex() != null) {
                    attemptedCount++;
                    
                    // For Section 1 (aptitude), check correctness
                    if (sectionNum == 1 && question.getCorrectOptionIndex() != null) {
                        if (answer.getSelectedOptionIndex().equals(question.getCorrectOptionIndex())) {
                            correctCount++;
                        }
                    } else if (sectionNum == 2) {
                        // Behavioral Section 2: use per-option impact scores when available
                        Integer idx = answer.getSelectedOptionIndex();
                        if (question.getTraitImpactScores() != null
                                && idx != null
                                && idx >= 0
                                && idx < question.getTraitImpactScores().size()) {
                            totalImpactScore += question.getTraitImpactScores().get(idx);
                            impactCount++;
                        } else {
                            // Fallback: count as fully correct if answered at all (legacy behavior)
                            correctCount++;
                        }
                    } else if (sectionNum == 3) {
                        // For Section 3 (domain), keep existing behavior: any answer counts as positive
                        correctCount++;
                    }
                }
            }
            
            double score;
            if (sectionNum == 2 && impactCount > 0) {
                // Behavioral score is the average impact score (already 0-100 scale)
                score = totalImpactScore / impactCount;
            } else {
                score = sectionQuestions.isEmpty() ? 0.0 
                    : (attemptedCount > 0 ? (correctCount * 100.0 / sectionQuestions.size()) : 0.0);
            }
            
            if (sectionNum == 1) {
                sectionScores.put("aptitude", score);
            } else if (sectionNum == 2) {
                sectionScores.put("behavioral", score);
            } else {
                sectionScores.put("domain", score);
            }
        }
        
        return sectionScores;
    }
    
    /**
     * Calculate overall percentile based on performance
     */
    public double calculatePercentile(double overallScore) {
        // Simple percentile calculation - in production, this would use historical data
        // For now, using a simple mapping
        if (overallScore >= 90) return 95.0;
        if (overallScore >= 80) return 85.0;
        if (overallScore >= 70) return 70.0;
        if (overallScore >= 60) return 55.0;
        if (overallScore >= 50) return 40.0;
        return 25.0;
    }
    
    /**
     * Determine performance bucket
     */
    public String determinePerformanceBucket(double overallScore) {
        if (overallScore >= 85) return "BEST";
        if (overallScore >= 70) return "GOOD";
        if (overallScore >= 50) return "AVERAGE";
        return "POOR";
    }
}

