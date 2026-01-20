package com.profiling.service.psychometric;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.profiling.dto.psychometric.OpenAIRequest;
import com.profiling.dto.psychometric.OpenAIResponse;
import com.profiling.model.psychometric.Answer;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.PsychometricReport;
import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.UserInfo;

import reactor.core.publisher.Mono;

@Service
public class ReportGenerationService {
    
    private final WebClient.Builder webClientBuilder;
    private final ScoringService scoringService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Random random = new Random();
    
    @Value("${openai.apiKey:}")
    private String openAiApiKey;
    
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    
    public ReportGenerationService(WebClient.Builder webClientBuilder, ScoringService scoringService) {
        this.webClientBuilder = webClientBuilder;
        this.scoringService = scoringService;
    }
    
    /**
     * Get subject pronoun based on gender (he/she/they)
     */
    private String getSubjectPronoun(String gender) {
        if (gender == null) return "they";
        switch (gender.toLowerCase()) {
            case "male": return "he";
            case "female": return "she";
            default: return "they";
        }
    }
    
    /**
     * Get object pronoun based on gender (him/her/them)
     */
    private String getObjectPronoun(String gender) {
        if (gender == null) return "them";
        switch (gender.toLowerCase()) {
            case "male": return "him";
            case "female": return "her";
            default: return "them";
        }
    }
    
    /**
     * Get possessive pronoun based on gender (his/her/their)
     */
    private String getPossessivePronoun(String gender) {
        if (gender == null) return "their";
        switch (gender.toLowerCase()) {
            case "male": return "his";
            case "female": return "her";
            default: return "their";
        }
    }
    
    /**
     * Get reflexive pronoun based on gender (himself/herself/themselves)
     */
    private String getReflexivePronoun(String gender) {
        if (gender == null) return "themselves";
        switch (gender.toLowerCase()) {
            case "male": return "himself";
            case "female": return "herself";
            default: return "themselves";
        }
    }
    
    /**
     * Capitalize first letter of a string
     */
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
    
    /**
     * Generate a comprehensive psychometric report for a completed session
     */
    public PsychometricReport generateReport(PsychometricSession session) {
        if (session.getStatus() != com.profiling.model.psychometric.SessionStatus.COMPLETED) {
            throw new IllegalArgumentException("Session must be completed before generating report");
        }
        
        PsychometricReport report = new PsychometricReport();
        UserInfo userInfo = session.getUserInfo();
        
        // Set user information
        report.setUserInfo(userInfo);
        report.setTimestamp(Instant.now());
        report.setReportGeneratedAt(Instant.now());
        
        // Calculate scores
        Map<String, Integer> bigFiveScores = scoringService.calculateBigFiveScores(session);
        Map<String, Double> sectionScores = scoringService.calculateSectionScores(session);
        
        report.setOpenness(bigFiveScores.get("openness"));
        report.setConscientiousness(bigFiveScores.get("conscientiousness"));
        report.setExtraversion(bigFiveScores.get("extraversion"));
        report.setAgreeableness(bigFiveScores.get("agreeableness"));
        report.setNeuroticism(bigFiveScores.get("neuroticism"));
        
        report.setAptitudeScore(sectionScores.get("aptitude"));
        report.setBehavioralScore(sectionScores.get("behavioral"));
        report.setDomainScore(sectionScores.get("domain"));
        
        // Use saved test results from frontend submission if available
        int totalQuestions;
        int attempted;
        int correct;
        int wrong;
        
        if (session.getTestResults() != null) {
            // Use the exact results that were calculated on the frontend result page
            PsychometricSession.TestResults savedResults = session.getTestResults();
            totalQuestions = savedResults.getTotalQuestions();
            attempted = savedResults.getAttempted();
            correct = savedResults.getCorrect();
            wrong = savedResults.getWrong();
            
            report.setTotalQuestions(totalQuestions);
            report.setAttempted(attempted);
            report.setCorrect(correct);
            report.setWrong(wrong);
            report.setNotAttempted(savedResults.getNotAttempted());
        } else {
            // Fallback: Calculate if test results were not saved (backward compatibility)
            // Excludes Behavioral section (section 2) - only counts Aptitude (1) and Domain (3)
            SectionStats aptitudeStats = new SectionStats();
            SectionStats domainStats = new SectionStats();
            
            if (session.getQuestions() != null) {
                for (Question question : session.getQuestions()) {
                    int section = question.getSectionNumber();
                    // Skip Behavioral section (section 2)
                    if (section == 2) continue;
                    SectionStats stats = section == 1 ? aptitudeStats : domainStats;
                    stats.total++;
                }
            }
            
            if (session.getAnswers() != null && session.getQuestions() != null) {
                for (Question question : session.getQuestions()) {
                    // Skip Behavioral section (section 2)
                    if (question.getSectionNumber() == 2) continue;
                    
                    Answer answer = session.getAnswers().stream()
                        .filter(a -> a.getQuestionId().equals(question.getId()))
                        .findFirst()
                        .orElse(null);
                    
                    if (answer != null && answer.getSelectedOptionIndex() != null) {
                        int section = question.getSectionNumber();
                        SectionStats stats = section == 1 ? aptitudeStats : domainStats;
                        stats.attempted++;
                        Integer correctIdx = question.getCorrectOptionIndex();
                        
                        // Aptitude (1) and Domain (3): count when correct option exists and matches
                        if (correctIdx != null) {
                            if (answer.getSelectedOptionIndex().equals(correctIdx)) {
                                stats.correct++;
                            }
                        }
                    }
                }
            }
            
            totalQuestions = aptitudeStats.total + domainStats.total;
            attempted = aptitudeStats.attempted + domainStats.attempted;
            correct = aptitudeStats.correct + domainStats.correct;
            wrong = attempted - correct;
            
            report.setTotalQuestions(totalQuestions);
            report.setAttempted(attempted);
            report.setCorrect(correct);
            report.setWrong(wrong);
            report.setNotAttempted(totalQuestions - attempted);
        }
        
        // Calculate candidate percentage based on correct answers out of total questions
        double candidatePercentage = totalQuestions > 0 ? (correct * 100.0 / totalQuestions) : 0.0;
        report.setCandidatePercentile(candidatePercentage);
        
        // Set overall score to match candidate percentage
        report.setOverallScore(candidatePercentage);
        
        // Determine performance bucket based on overall score
        report.setPerformanceBucket(scoringService.determinePerformanceBucket(candidatePercentage));
        
        // Get test results from session with per-section stats for AI generation
        SectionStats aptitudeStats = new SectionStats();
        SectionStats behavioralStats = new SectionStats();
        SectionStats domainStats = new SectionStats();
        
        // Calculate category-level stats for detailed breakdowns
        Map<String, CategoryStats> aptitudeCategoryStats = new HashMap<>();
        Map<String, CategoryStats> behavioralCategoryStats = new HashMap<>();
        Map<String, CategoryStats> domainCategoryStats = new HashMap<>();
        
        if (session.getQuestions() != null) {
            for (Question question : session.getQuestions()) {
                int section = question.getSectionNumber();
                SectionStats stats = section == 1 ? aptitudeStats : section == 2 ? behavioralStats : domainStats;
                stats.total++;
                
                // Track category-level stats
                String category = question.getCategory();
                if (category != null && !category.isEmpty()) {
                    Map<String, CategoryStats> categoryMap = section == 1 ? aptitudeCategoryStats : 
                                                           section == 2 ? behavioralCategoryStats : domainCategoryStats;
                    categoryMap.putIfAbsent(category, new CategoryStats());
                    categoryMap.get(category).total++;
                }
            }
        }
        
        if (session.getAnswers() != null && session.getQuestions() != null) {
            for (Question question : session.getQuestions()) {
                Answer answer = session.getAnswers().stream()
                    .filter(a -> a.getQuestionId().equals(question.getId()))
                    .findFirst()
                    .orElse(null);
                
                if (answer != null && answer.getSelectedOptionIndex() != null) {
                    int section = question.getSectionNumber();
                    SectionStats stats = section == 1 ? aptitudeStats : section == 2 ? behavioralStats : domainStats;
                    stats.attempted++;
                    Integer correctIdx = question.getCorrectOptionIndex();
                    
                    // Track category-level stats
                    String category = question.getCategory();
                    if (category != null && !category.isEmpty()) {
                        Map<String, CategoryStats> categoryMap = section == 1 ? aptitudeCategoryStats : 
                                                                   section == 2 ? behavioralCategoryStats : domainCategoryStats;
                        CategoryStats catStats = categoryMap.get(category);
                        if (catStats != null) {
                            catStats.attempted++;
                            
                            // Aptitude (1) and Domain (3): count when correct option exists and matches
                            if ((section == 1 || section == 3) && correctIdx != null) {
                                if (answer.getSelectedOptionIndex().equals(correctIdx)) {
                                    catStats.correct++;
                                }
                            }
                            // Behavioral (2): subjective, count any answered
                            else if (section == 2) {
                                catStats.correct++;
                            }
                        }
                    }
                    
                    // Aptitude (1) and Domain (3): count when correct option exists and matches
                    if ((section == 1 || section == 3) && correctIdx != null) {
                        if (answer.getSelectedOptionIndex().equals(correctIdx)) {
                            stats.correct++;
                        }
                    }
                    // Behavioral (2): subjective, count any answered
                    else if (section == 2) {
                        stats.correct++;
                    }
                }
            }
        }
        
        // Generate AI-powered content using OpenAI
        if (openAiApiKey != null && !openAiApiKey.isEmpty()) {
            try {
                generateAIReportContent(report, session, bigFiveScores, sectionScores,
                    aptitudeStats, behavioralStats, domainStats,
                    aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
            } catch (Exception e) {
                System.err.println("Error generating AI report content: " + e.getMessage());
                e.printStackTrace();
                // Fallback to default content
                generateDefaultReportContent(report, userInfo, sectionScores,
                    aptitudeStats, behavioralStats, domainStats,
                    aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
            }
        } else {
            // Fallback to default content if OpenAI is not configured
            generateDefaultReportContent(report, userInfo, sectionScores,
                aptitudeStats, behavioralStats, domainStats,
                aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
        }
        
        // Generate chart data
        PsychometricReport.ChartData chartData = new PsychometricReport.ChartData();
        chartData.setPoorScore(30);
        chartData.setAverageScore(60);
        chartData.setBestScore(90);
        chartData.setCandidatePosition(report.getPerformanceBucket());
        report.setChartsData(chartData);
        
        return report;
    }
    
    private int calculateCorrectAnswers(PsychometricSession session) {
        if (session.getQuestions() == null || session.getAnswers() == null) {
            return 0;
        }
        
        int correct = 0;
        for (Question question : session.getQuestions()) {
            Answer answer = session.getAnswers().stream()
                .filter(a -> a.getQuestionId().equals(question.getId()))
                .findFirst()
                .orElse(null);
            
            if (answer != null && answer.getSelectedOptionIndex() != null) {
                int section = question.getSectionNumber();
                Integer correctIdx = question.getCorrectOptionIndex();

                // Aptitude (1) and Domain (3): only count when correctOptionIndex exists and matches
                if ((section == 1 || section == 3) && correctIdx != null) {
                    if (answer.getSelectedOptionIndex().equals(correctIdx)) {
                        correct++;
                    }
                }
                // Behavioral (2): subjective, count any answered
                else if (section == 2) {
                    correct++;
                }
                // If domain/aptitude questions lack a correctOptionIndex, we skip counting them
            }
        }
        return correct;
    }
    
    private void generateAIReportContent(PsychometricReport report, PsychometricSession session,
                                         Map<String, Integer> bigFiveScores, Map<String, Double> sectionScores,
                                         SectionStats aptitudeStats, SectionStats behavioralStats, SectionStats domainStats,
                                         Map<String, CategoryStats> aptitudeCategoryStats,
                                         Map<String, CategoryStats> behavioralCategoryStats,
                                         Map<String, CategoryStats> domainCategoryStats) {
        String prompt = buildReportGenerationPrompt(report, session, bigFiveScores, sectionScores,
            aptitudeStats, behavioralStats, domainStats,
            aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
        
        OpenAIRequest request = new OpenAIRequest(prompt);
        request.setTemperature(0.8); // Higher temperature for more variety and uniqueness
        
        WebClient webClient = webClientBuilder
            .baseUrl(OPENAI_API_URL)
            .defaultHeader("Authorization", "Bearer " + openAiApiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
        
        OpenAIResponse response = webClient.post()
            .bodyValue(request)
            .retrieve()
            .bodyToMono(OpenAIResponse.class)
            .block();
        
        if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
            String content = response.getChoices().get(0).getMessage().getContent();
            parseAIResponse(content, report, sectionScores, aptitudeStats, behavioralStats, domainStats,
                aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
        } else {
            Map<String, Double> emptyScores = new HashMap<>();
            emptyScores.put("aptitude", report.getAptitudeScore() != null ? report.getAptitudeScore() : 0.0);
            emptyScores.put("behavioral", report.getBehavioralScore() != null ? report.getBehavioralScore() : 0.0);
            emptyScores.put("domain", report.getDomainScore() != null ? report.getDomainScore() : 0.0);
            generateDefaultReportContent(report, session.getUserInfo(), emptyScores,
                new SectionStats(), new SectionStats(), new SectionStats(),
                aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
        }
    }
    
    private String buildReportGenerationPrompt(PsychometricReport report, PsychometricSession session,
                                              Map<String, Integer> bigFiveScores, Map<String, Double> sectionScores,
                                              SectionStats aptitudeStats, SectionStats behavioralStats, SectionStats domainStats,
                                              Map<String, CategoryStats> aptitudeCategoryStats,
                                              Map<String, CategoryStats> behavioralCategoryStats,
                                              Map<String, CategoryStats> domainCategoryStats) {
        StringBuilder prompt = new StringBuilder();
        UserInfo userInfo = session.getUserInfo();
        String gender = userInfo.getGender();
        String subjectPronoun = getSubjectPronoun(gender);
        String objectPronoun = getObjectPronoun(gender);
        String possessivePronoun = getPossessivePronoun(gender);
        String reflexivePronoun = getReflexivePronoun(gender);
        
        prompt.append("You are a professional psychometric assessment analyst. Generate a comprehensive 2-page talent report based on the following candidate profile and test performance.\n\n");
        prompt.append("⚠️ CRITICAL PRONOUN USAGE INSTRUCTION:\n");
        prompt.append("Throughout the ENTIRE report, use the following gender-appropriate pronouns when referring to the candidate:\n");
        prompt.append("- Subject pronoun: \"").append(subjectPronoun).append("\" (e.g., \"").append(subjectPronoun).append(" demonstrates...\")\n");
        prompt.append("- Object pronoun: \"").append(objectPronoun).append("\" (e.g., \"for ").append(objectPronoun).append("...\")\n");
        prompt.append("- Possessive pronoun: \"").append(possessivePronoun).append("\" (e.g., \"").append(possessivePronoun).append(" skills...\")\n");
        prompt.append("- Reflexive pronoun: \"").append(reflexivePronoun).append("\" (e.g., \"").append(reflexivePronoun).append("...\")\n");
        prompt.append("NEVER use generic terms like 'the person', 'the candidate', 'their' (unless gender is other/not_to_say), or 'they' (unless gender is other/not_to_say).\n");
        prompt.append("Apply these pronouns consistently in ALL sections: summaryBio, interviewSummary, strengths, weaknesses, opportunities, threats, swotAnalysis, fitAnalysis, behavioralInsights, domainInsights, and narrativeSummary.\n\n");
        
        prompt.append("CANDIDATE PROFILE:\n");
        prompt.append("- Name: ").append(userInfo.getName()).append("\n");
        prompt.append("- Email: ").append(userInfo.getEmail()).append("\n");
        prompt.append("- Phone: ").append(userInfo.getPhone()).append("\n");
        prompt.append("- Degree: ").append(userInfo.getDegree()).append("\n");
        prompt.append("- Specialization: ").append(userInfo.getSpecialization()).append("\n");
        prompt.append("- Career Interest: ").append(userInfo.getCareerInterest()).append("\n");
        prompt.append("- Age: ").append(userInfo.getAge()).append("\n");
        if (gender != null && !gender.isEmpty()) {
            prompt.append("- Gender: ").append(gender).append("\n");
        }
        if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().isEmpty()) {
            prompt.append("- Technical Skills: ").append(userInfo.getTechnicalSkills()).append("\n");
        }
        if (userInfo.getSoftSkills() != null && !userInfo.getSoftSkills().isEmpty()) {
            prompt.append("- Soft Skills: ").append(userInfo.getSoftSkills()).append("\n");
        }
        if (userInfo.getHobbies() != null && !userInfo.getHobbies().isEmpty()) {
            prompt.append("- Hobbies: ").append(userInfo.getHobbies()).append("\n");
        }
        if (userInfo.getInterests() != null && !userInfo.getInterests().isEmpty()) {
            prompt.append("- Interests: ").append(userInfo.getInterests()).append("\n");
        }
        if (userInfo.getCertifications() != null && !userInfo.getCertifications().isEmpty()) {
            prompt.append("- Certifications: ").append(userInfo.getCertifications()).append("\n");
        }
        if (userInfo.getAchievements() != null && !userInfo.getAchievements().isEmpty()) {
            prompt.append("- Achievements: ").append(userInfo.getAchievements()).append("\n");
        }
        prompt.append("\n");
        
        prompt.append("TEST PERFORMANCE:\n");
        prompt.append("- Aptitude Score: ").append(String.format("%.1f", sectionScores.get("aptitude"))).append("%\n");
        prompt.append("- Behavioral Score: ").append(String.format("%.1f", sectionScores.get("behavioral"))).append("%\n");
        prompt.append("- Domain Score: ").append(String.format("%.1f", sectionScores.get("domain"))).append("%\n");
        prompt.append("- Overall Score: ").append(String.format("%.1f", report.getOverallScore())).append("%\n");
        prompt.append("- Candidate Percentage: ").append(String.format("%.2f", report.getCandidatePercentile())).append("%\n");
        prompt.append("- Total Questions: ").append(report.getTotalQuestions()).append("\n");
        prompt.append("- Attempted: ").append(report.getAttempted()).append("\n");
        prompt.append("- Correct: ").append(report.getCorrect()).append("\n");
        prompt.append("- Wrong: ").append(report.getWrong()).append("\n\n");
        
        prompt.append("SECTION PERFORMANCE DETAILS:\n");
        prompt.append(String.format("- Aptitude: %d correct out of %d attempted (total %d questions)\n",
            aptitudeStats.correct, aptitudeStats.attempted, aptitudeStats.total));
        prompt.append(String.format("- Behavioral: %d counted-correct out of %d attempted (total %d questions)\n",
            behavioralStats.correct, behavioralStats.attempted, behavioralStats.total));
        prompt.append(String.format("- Domain: %d correct out of %d attempted (total %d questions)\n\n",
            domainStats.correct, domainStats.attempted, domainStats.total));
        
        // Add detailed category-level performance for Aptitude section
        prompt.append("APTITUDE SECTION - CATEGORY BREAKDOWN:\n");
        if (!aptitudeCategoryStats.isEmpty()) {
            for (Map.Entry<String, CategoryStats> entry : aptitudeCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                prompt.append(String.format("- %s: %d correct out of %d total questions (%.1f%%). ",
                    categoryName, stats.correct, stats.total, percentage));
                prompt.append(String.format("Attempted: %d questions.\n", stats.attempted));
            }
        } else {
            prompt.append("- No category-level data available\n");
        }
        prompt.append("\n");
        
        // Add detailed category-level performance for Behavioral section
        prompt.append("BEHAVIORAL SECTION - CATEGORY BREAKDOWN:\n");
        if (!behavioralCategoryStats.isEmpty()) {
            for (Map.Entry<String, CategoryStats> entry : behavioralCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                prompt.append(String.format("- %s: %d responses out of %d total questions (%.1f%%). ",
                    categoryName, stats.correct, stats.total, percentage));
                prompt.append(String.format("Attempted: %d questions.\n", stats.attempted));
            }
        } else {
            prompt.append("- No category-level data available\n");
        }
        prompt.append("\n");
        
        // Add detailed category-level performance for Domain section
        prompt.append("DOMAIN SECTION - CATEGORY BREAKDOWN:\n");
        if (!domainCategoryStats.isEmpty()) {
            for (Map.Entry<String, CategoryStats> entry : domainCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                prompt.append(String.format("- %s: %d correct out of %d total questions (%.1f%%). ",
                    categoryName, stats.correct, stats.total, percentage));
                prompt.append(String.format("Attempted: %d questions.\n", stats.attempted));
            }
        } else {
            prompt.append("- No category-level data available\n");
        }
        prompt.append("\n");
        
        prompt.append("BIG FIVE PERSONALITY TRAITS (0-100 scale):\n");
        prompt.append("- Openness: ").append(bigFiveScores.get("openness")).append("\n");
        prompt.append("- Conscientiousness: ").append(bigFiveScores.get("conscientiousness")).append("\n");
        prompt.append("- Extraversion: ").append(bigFiveScores.get("extraversion")).append("\n");
        prompt.append("- Agreeableness: ").append(bigFiveScores.get("agreeableness")).append("\n");
        prompt.append("- Neuroticism: ").append(bigFiveScores.get("neuroticism")).append("\n\n");
        
        prompt.append("Generate a professional psychometric report in JSON format with the following structure:\n");
        prompt.append("{\n");
        prompt.append("  \"summaryBio\": \"A DETAILED and COMPREHENSIVE professional bio (8-12 sentences, approximately 150-200 words) that provides an in-depth overview of the candidate. Structure it as follows:\\n\\n");
        prompt.append("1. Opening (2-3 sentences): Start with the candidate's name, educational background (degree and specialization), and current career stage or aspirations. Provide context about their academic journey and what led them to their field of interest.\\n\\n");
        prompt.append("2. Career Interest & Goals (2-3 sentences): Elaborate extensively on their chosen career path, what draws them to this field, their professional aspirations, and how their educational background aligns with their career goals. Explain the connection between their specialization and career interest in detail.\\n\\n");
        prompt.append("3. Technical Expertise (2-3 sentences): Provide a detailed breakdown of their technical skills. For each technical skill mentioned, explain what it indicates about their capabilities, how these skills complement each other, and what kind of projects or roles these skills are suited for. Show depth of understanding of their technical profile.\\n\\n");
        prompt.append("4. Soft Skills & Interpersonal Abilities (2-3 sentences): Elaborate on their soft skills in detail. Explain how each soft skill contributes to their professional profile, what it means for their work style, and how these skills enhance their technical capabilities. Provide context about how these soft skills make them a well-rounded professional.\\n\\n");
        prompt.append("5. Personal Interests & Hobbies (1-2 sentences): Connect their hobbies and interests to their professional profile. Explain how these personal interests reflect their personality, creativity, or problem-solving approach, and how they might contribute to their professional growth or work-life balance.\\n\\n");
        prompt.append("6. Closing (1 sentence): Provide a brief summary statement that ties together their educational background, technical skills, soft skills, and interests into a cohesive professional identity.\\n\\n");
        prompt.append("IMPORTANT: Make the bio detailed, engaging, and personalized. Use varied sentence structures and vocabulary. Avoid generic phrases. Make it feel like a comprehensive professional profile that truly represents the candidate's unique combination of skills, interests, and aspirations.\",\n");
        prompt.append("  \"interviewSummary\": \"COMPREHENSIVE PERFORMANCE NARRATIVE: Write a detailed, flowing 4-6 paragraph narrative analysis of the candidate's psychometric test performance. This should read as a cohesive story of their capabilities, not a structured breakdown. DO NOT mention or break down by Aptitude/Behavioral/Domain sections as those have separate dedicated sections. Focus on OVERALL performance, STRONG ZONES across all categories, WEAK ZONES needing improvement, and STRATEGIC RECOMMENDATIONS. Write in paragraph form with smooth transitions.\\n\\n");
        
        prompt.append("PARAGRAPH 1 - OVERALL PERFORMANCE NARRATIVE (4-6 sentences):\\n");
        prompt.append("Begin with a comprehensive overview that tells the story of the candidate's overall performance. The candidate achieved an overall score of ").append(String.format("%.1f", report.getOverallScore())).append("% across the comprehensive psychometric assessment, with a candidate percentage of ").append(String.format("%.2f", report.getCandidatePercentile())).append("% (").append(report.getCorrect()).append(" correct out of ").append(report.getTotalQuestions()).append(" total questions). Out of ").append(report.getTotalQuestions()).append(" total questions, they attempted ").append(report.getAttempted()).append(" and answered ").append(report.getCorrect()).append(" correctly, achieving an accuracy rate of ").append(report.getAttempted() > 0 ? String.format("%.1f", (report.getCorrect() * 100.0 / report.getAttempted())) : "0").append("%. Explain what this performance level reveals about their overall capabilities, readiness for their chosen career (").append(userInfo.getCareerInterest()).append("), and where they stand compared to their peer group. Discuss their performance classification (").append(report.getPerformanceBucket()).append(") and what this means for their professional prospects. Make this paragraph flow naturally as a narrative introduction to their performance story.\\n\\n");
        
        prompt.append("PARAGRAPH 2 - STRONG ZONES NARRATIVE (5-7 sentences):\\n");
        prompt.append("Identify and discuss the candidate's TOP PERFORMING areas across ALL categories (not by section). Look at the category-level data provided above and identify the 3-5 HIGHEST scoring categories regardless of which section they belong to. For example, if they scored highest in Numerical Ability (82%), Leadership (78%), and Frontend Development (85%), discuss these as their strong zones without mentioning which section they're from. Write a flowing narrative that:\\n");
        prompt.append("- Names each strong zone category with its specific score\\n");
        prompt.append("- Explains what these high performances collectively reveal about their natural talents and developed capabilities\\n");
        prompt.append("- Discusses how these strengths complement each other and create a unique capability profile\\n");
        prompt.append("- Connects these strengths to success in their target career (").append(userInfo.getCareerInterest()).append(")\\n");
        prompt.append("- Provides 2-3 SPECIFIC, ACTIONABLE recommendations for leveraging these strong zones (e.g., 'Given your exceptional numerical reasoning, pursue advanced data analytics certification', 'Your leadership strengths position you to mentor junior team members')\\n");
        prompt.append("Write this as a cohesive paragraph that tells the story of their strengths, NOT as bullet points.\\n\\n");
        
        prompt.append("PARAGRAPH 3 - WEAK ZONES & IMPROVEMENT NARRATIVE (6-8 sentences):\\n");
        prompt.append("Identify and discuss the candidate's LOWEST PERFORMING areas across ALL categories (not by section). Look at the category-level data and identify the 3-5 LOWEST scoring categories. Write a flowing narrative that:\\n");
        prompt.append("- Names each weak zone category with its specific score\\n");
        prompt.append("- Explains why these areas are critical for professional success in ").append(userInfo.getCareerInterest()).append("\\n");
        prompt.append("- Discusses the potential impact of these weaknesses if not addressed\\n");
        prompt.append("- Provides a DETAILED, SYSTEMATIC improvement roadmap for EACH weak zone with specific steps (e.g., 'For Abstract Reasoning (45%), start with Khan Academy's pattern recognition basics, practice 10 puzzles daily on Brilliant.org, focus on one pattern type weekly, and take timed tests monthly to track progress from 45% to target 70% within 3 months')\\n");
        prompt.append("- Suggests specific resources, courses, platforms, practice schedules, and learning methods\\n");
        prompt.append("- Sets realistic improvement timelines and measurable goals\\n");
        prompt.append("Write this as a narrative that flows from identifying problems to providing solutions, NOT as bullet points.\\n\\n");
        
        prompt.append("PARAGRAPH 4 - CAPABILITY ANALYSIS & CAREER READINESS (5-6 sentences):\\n");
        prompt.append("Synthesize what the overall performance pattern reveals about the candidate's capabilities and readiness. Discuss:\\n");
        prompt.append("- What their performance pattern (strong zones vs weak zones) says about their working style and natural aptitudes\\n");
        prompt.append("- Whether their demonstrated capabilities align with requirements for ").append(userInfo.getCareerInterest()).append("\\n");
        prompt.append("- Their current readiness level: Are they ready to enter the job market immediately, do they need 2-3 months preparation, or 3-6 months intensive development?\\n");
        prompt.append("- Which types of roles their performance profile best suits (mention 2-3 specific role types without detailed explanation as that's in Fit Analysis section)\\n");
        prompt.append("- Their competitive standing based on the candidate percentage score\\n");
        prompt.append("Write this as a flowing narrative assessment.\\n\\n");
        
        prompt.append("PARAGRAPH 5 - STRATEGIC DEVELOPMENT ROADMAP (5-7 sentences):\\n");
        prompt.append("Conclude with a comprehensive, actionable strategy for the candidate's development. Write a narrative that:\\n");
        prompt.append("- Prioritizes what they should focus on first (typically the weak zones that are most critical for their target career)\\n");
        prompt.append("- Provides a PHASED approach: 'In the first month, focus on X; in months 2-3, work on Y; in months 4-6, advance to Z'\\n");
        prompt.append("- Balances improvement (working on weaknesses) with leverage (capitalizing on strengths)\\n");
        prompt.append("- Includes specific milestones and checkpoints (e.g., 'Take baseline test now, re-test after 6 weeks, target 15-20% improvement')\\n");
        prompt.append("- Suggests a realistic timeline for achieving job-market readiness\\n");
        prompt.append("- Ends with an encouraging but honest assessment of their potential\\n");
        prompt.append("Make this feel like personalized career counseling advice, written in flowing paragraphs.\\n\\n");
        
        prompt.append("OPTIONAL PARAGRAPH 6 - PERFORMANCE PATTERNS & INSIGHTS (if space allows, 3-4 sentences):\\n");
        prompt.append("Provide deeper insights about patterns observed in their performance. For example: 'Your performance shows a consistent pattern of excellence in analytical tasks but variability in interpersonal scenarios, suggesting a technical specialist profile.' or 'The balance across different capability areas indicates versatility and adaptability, valuable traits for cross-functional roles.' Connect these patterns to career implications.\\n\\n");
        
        prompt.append("CRITICAL REQUIREMENTS:\\n");
        prompt.append("- Write in FLOWING PARAGRAPHS, not bullet points or structured sections\\n");
        prompt.append("- DO NOT mention 'Aptitude Section', 'Behavioral Section', or 'Domain Section' - those have separate sections\\n");
        prompt.append("- Discuss categories directly (e.g., 'Numerical Ability', 'Leadership', 'Frontend Development') without grouping by section\\n");
        prompt.append("- Use category-level performance data from above to identify specific strong and weak zones\\n");
        prompt.append("- Include EXACT scores and percentages when discussing categories\\n");
        prompt.append("- Provide SPECIFIC, ACTIONABLE recommendations with course names, platforms, timelines\\n");
        prompt.append("- Make it read like a comprehensive performance narrative story, not a report\\n");
        prompt.append("- Focus on: What they did well, What needs work, How to improve, When they'll be ready\\n");
        prompt.append("- Write for the CANDIDATE - make it useful, honest, and encouraging\\n");
        prompt.append("- Total length: 4-6 substantial paragraphs (approximately 300-400 words)\",\n");
        prompt.append("  \"strengths\": [\"PERFORMANCE-BASED: List 4-6 specific strengths based on HIGH-performing areas (70%+ scores). Express these as QUALITATIVE professional capabilities WITHOUT mentioning numeric scores or percentages. Examples: 'Demonstrates strong analytical aptitude and logical reasoning ability', 'Shows proficiency in numerical problem-solving and data interpretation', 'Exhibits solid technical foundation in [domain area]', 'Displays effective leadership and interpersonal communication skills'. Base these on the ACTUAL HIGHEST scoring categories from the test data, but describe them as abilities and competencies, NOT as test scores.\"],\n");
        prompt.append("  \"weaknesses\": [\"PERFORMANCE-BASED: List 2-4 development areas based on LOW-performing zones (below 50% scores). Express these as GROWTH-ORIENTED needs WITHOUT mentioning numeric scores, percentages, or phrases like 'scored X%'. Examples: 'Requires improvement in abstract reasoning and pattern recognition', 'Needs development in conflict resolution and decision-making under pressure', 'Technical skill gaps in [specific domain] may limit competitive readiness', 'Could benefit from enhanced quantitative problem-solving capabilities'. Base these on the ACTUAL LOWEST scoring categories, but frame as professional development needs, NOT as test performance.\"],\n");
        prompt.append("  \"opportunities\": [\"List 3-5 growth-oriented opportunities aligned with the candidate's performance profile. For HIGH performers (70%+): mention career advancement, specialized roles, and leadership paths. For MODERATE performers (50-69%): emphasize upskilling opportunities, training programs, and skill development. For LOW performers (<50%): focus on foundational learning, bootcamps, and entry-level preparation. Also include market-based opportunities like industry demand and emerging career pathways. Do NOT reference numeric scores. Examples: 'Strong positioning for immediate entry into competitive roles', 'Growth potential through targeted upskilling programs', 'Access to structured training in emerging technologies'.\"],\n");
        prompt.append("  \"threats\": [\"List 2-4 EXTERNAL and FUTURE-FOCUSED risks and challenges. Focus on market competition, industry benchmarks, skill obsolescence, and consequences of not addressing weaknesses. Examples: 'Intense competition from candidates with stronger technical profiles', 'Rapid evolution of technology requires continuous learning', 'Risk of limited opportunities without addressing analytical skill gaps', 'Rising industry standards demand higher competency levels'. Do NOT simply restate weaknesses or mention test scores. Threats should represent external factors and career risks, not internal performance.\"],\n");
        prompt.append("  \"swotAnalysis\": \"A detailed 2-paragraph SWOT analysis narrative\",\n");
        prompt.append("  \"fitAnalysis\": \"DETAILED CAREER FIT & ROLE RECOMMENDATION ANALYSIS (4-6 paragraphs): Provide a comprehensive, performance-based career fit analysis using the candidate's ACTUAL TEST PERFORMANCE DATA. Structure as follows:\\n\\n");
        prompt.append("PARAGRAPH 1 - OVERALL FIT ASSESSMENT:\\n");
        prompt.append("Based on their stated career interest (").append(userInfo.getCareerInterest()).append(") and specialization (").append(userInfo.getSpecialization()).append("), analyze how their TEST PERFORMANCE aligns with this career path. Consider:\\n");
        prompt.append("- Overall score (").append(String.format("%.1f", report.getOverallScore())).append("%) and what it indicates for career readiness\\n");
        prompt.append("- Aptitude score (").append(String.format("%.1f", sectionScores.get("aptitude"))).append("%) - Does it match requirements for ").append(userInfo.getCareerInterest()).append("?\\n");
        prompt.append("- Behavioral score (").append(String.format("%.1f", sectionScores.get("behavioral"))).append("%) - Do they have the right behavioral traits?\\n");
        prompt.append("- Domain score (").append(String.format("%.1f", sectionScores.get("domain"))).append("%) - Is their technical knowledge sufficient?\\n");
        prompt.append("Provide an honest assessment: Is their chosen career path a PERFECT FIT, GOOD FIT WITH DEVELOPMENT NEEDED, or REQUIRES SIGNIFICANT PREPARATION?\\n\\n");
        
        prompt.append("PARAGRAPH 2 - CORE SKILLS ALIGNMENT:\\n");
        prompt.append("Analyze their performance in CORE SKILLS required for ").append(userInfo.getCareerInterest()).append(". For each critical skill category from the test data above:\\n");
        prompt.append("- If they scored 70%+ in a core skill: Confirm this is a strong match and explain how this skill is essential for their target roles\\n");
        prompt.append("- If they scored 50-69% in a core skill: Note this as adequate but needing enhancement to be competitive\\n");
        prompt.append("- If they scored <50% in a core skill: Flag this as a critical gap that must be addressed before pursuing this career\\n");
        prompt.append("Be SPECIFIC: mention exact category names and scores from the data provided.\\n\\n");
        
        prompt.append("PARAGRAPH 3 - SPECIALIZATION-BASED FIT:\\n");
        prompt.append("Based on their specialization (").append(userInfo.getSpecialization()).append(") and domain test performance:\\n");
        prompt.append("- Identify which domain categories align with their specialization\\n");
        prompt.append("- Analyze if their performance in these categories validates their specialization choice\\n");
        prompt.append("- If domain scores are strong (70%+): Confirm specialization alignment and readiness for specialized roles\\n");
        prompt.append("- If domain scores are weak (<50%): Question if this specialization truly matches their strengths or if they need intensive upskilling\\n");
        prompt.append("- Consider if their behavioral traits (from behavioral section scores) complement their technical specialization\\n\\n");
        
        prompt.append("PARAGRAPH 4 - SPECIFIC ROLE RECOMMENDATIONS (MOST IMPORTANT):\\n");
        prompt.append("Based on their COMPLETE performance profile across ALL categories, recommend 3-5 SPECIFIC JOB ROLES that are BEST SUITED for them. For EACH recommended role:\\n");
        prompt.append("- State the exact job title (e.g., 'Junior Data Analyst', 'Frontend Developer', 'Business Analyst', 'Technical Support Engineer', 'QA Automation Engineer', 'Project Coordinator')\\n");
        prompt.append("- Explain WHY this role fits: Reference their specific strong zone scores that match role requirements (e.g., 'Your Numerical Ability score of 85% and Data Analysis score of 78% make you ideal for Data Analyst roles')\\n");
        prompt.append("- Note the seniority level they're ready for: Entry-level, Junior, Mid-level (based on overall performance)\\n");
        prompt.append("- Mention which of their strong zones this role would leverage\\n");
        prompt.append("CRITICAL: Choose roles based on their STRONGEST performing categories, NOT just their stated career interest. If their performance suggests they'd excel in different roles than their interest, mention this diplomatically.\\n\\n");
        
        prompt.append("PARAGRAPH 5 - ALTERNATIVE ROLES (if performance suggests it):\\n");
        prompt.append("If their performance indicates they might be BETTER SUITED for roles different from their stated career interest (").append(userInfo.getCareerInterest()).append("), provide 2-3 ALTERNATIVE role suggestions:\\n");
        prompt.append("- Explain how their actual performance strengths align better with these alternatives\\n");
        prompt.append("- Be diplomatic but honest: 'While you've expressed interest in [X], your exceptional performance in [Y] (score%) suggests you might also excel in [Z] roles'\\n");
        prompt.append("- Provide bridge path: How they can explore these alternatives while still pursuing their primary interest\\n\\n");
        
        prompt.append("PARAGRAPH 6 - READINESS & DEVELOPMENT PATH:\\n");
        prompt.append("Conclude with an honest readiness assessment:\\n");
        prompt.append("- IMMEDIATE READINESS: If overall score >70% - 'Ready to apply for recommended roles now with confidence'\\n");
        prompt.append("- SHORT-TERM READINESS: If overall score 50-70% - 'Ready for entry roles after 2-3 months of focused improvement in weak zones'\\n");
        prompt.append("- PREPARATION NEEDED: If overall score <50% - 'Requires 3-6 months of intensive preparation before job applications'\\n");
        prompt.append("- List TOP 3 priorities to improve before applying (based on weak zones that matter for recommended roles)\\n");
        prompt.append("- Provide a realistic timeline for achieving job-readiness\\n\\n");
        
        prompt.append("EXAMPLE FORMATS FOR ROLE RECOMMENDATIONS (ADAPT TO CANDIDATE'S CAREER FIELD):\\n\\n");
        
        prompt.append("FOR TECH/IT CAREERS (Software, Data, Engineering):\\n");
        prompt.append("'1. FRONTEND DEVELOPER (Entry-level): Your Frontend Development score (82%) and Verbal Reasoning (75%) make you ideal for UI/UX implementation.\\n");
        prompt.append("2. DATA ANALYST (Junior): Your Numerical Ability (85%) and Data Analysis (78%) position you well for data-driven roles.\\n");
        prompt.append("3. QA ENGINEER: Your Attention to Detail (80%) and Logical Reasoning (75%) suit quality assurance roles.'\\n\\n");
        
        prompt.append("FOR BUSINESS/MANAGEMENT CAREERS:\\n");
        prompt.append("'1. BUSINESS ANALYST (Entry-level): Your Numerical Ability (82%) and Communication (75%) make you ideal for bridging business-technical requirements.\\n");
        prompt.append("2. PROJECT COORDINATOR: Your Leadership (78%) and Situational Judgment (80%) position you well for project management.\\n");
        prompt.append("3. OPERATIONS ASSOCIATE: Your Attention to Detail (75%) and Adaptability (72%) suit operational roles.'\\n\\n");
        
        prompt.append("FOR HUMAN RESOURCES CAREERS:\\n");
        prompt.append("'1. HR COORDINATOR (Entry-level): Your Communication (80%) and Interpersonal Skills (75%) make you ideal for recruitment and employee relations.\\n");
        prompt.append("2. TALENT ACQUISITION ASSOCIATE: Your Leadership (78%) and Conflict Resolution (72%) position you well for hiring roles.\\n");
        prompt.append("3. HR GENERALIST: Your balanced Behavioral scores and Communication suit diverse HR responsibilities.'\\n\\n");
        
        prompt.append("FOR MARKETING/COMMUNICATIONS CAREERS:\\n");
        prompt.append("'1. DIGITAL MARKETING ASSOCIATE: Your Verbal Reasoning (82%) and Creativity indicators (75%) make you ideal for content and campaigns.\\n");
        prompt.append("2. SOCIAL MEDIA COORDINATOR: Your Communication (80%) and Adaptability (78%) position you well for brand management.\\n");
        prompt.append("3. MARKETING ANALYST: Your Numerical Ability (75%) and Verbal Reasoning (80%) suit data-driven marketing roles.'\\n\\n");
        
        prompt.append("FOR FINANCE/ACCOUNTING CAREERS:\\n");
        prompt.append("'1. FINANCIAL ANALYST (Junior): Your Numerical Ability (85%) and Attention to Detail (80%) make you ideal for financial modeling.\\n");
        prompt.append("2. ACCOUNTS ASSOCIATE: Your Numerical skills (78%) and Conscientiousness (75%) position you well for accounting.\\n");
        prompt.append("3. AUDIT ASSOCIATE: Your Attention to Detail (82%) and Logical Reasoning (75%) suit auditing roles.'\\n\\n");
        
        prompt.append("FOR SALES/BUSINESS DEVELOPMENT CAREERS:\\n");
        prompt.append("'1. BUSINESS DEVELOPMENT ASSOCIATE: Your Communication (85%) and Extraversion (78%) make you ideal for client acquisition.\\n");
        prompt.append("2. SALES REPRESENTATIVE: Your Interpersonal Skills (80%) and Adaptability (75%) position you well for direct sales.\\n");
        prompt.append("3. ACCOUNT EXECUTIVE: Your Communication (82%) and Situational Judgment (78%) suit client relationship management.'\\n\\n");
        
        prompt.append("FOR DATA/ANALYTICS CAREERS:\\n");
        prompt.append("'1. DATA ANALYST: Your Numerical Ability (85%) and Logical Reasoning (80%) make you ideal for data analysis and insights.\\n");
        prompt.append("2. BUSINESS INTELLIGENCE ANALYST: Your Analytical skills (82%) and Domain knowledge (75%) suit BI roles.\\n");
        prompt.append("3. RESEARCH ANALYST: Your Numerical Ability (78%) and Attention to Detail (75%) position you for research roles.'\\n\\n");
        
        prompt.append("CRITICAL: Choose the appropriate field examples based on the candidate's career interest (").append(userInfo.getCareerInterest()).append("). ");
        prompt.append("Adapt role recommendations to their specific field while using their actual performance scores to justify fit.\\n\\n");
        
        prompt.append("CRITICAL REQUIREMENTS:\\n");
        prompt.append("- Base ALL role recommendations on ACTUAL performance data, not assumptions\\n");
        prompt.append("- Include EXACT scores when explaining why roles fit\\n");
        prompt.append("- Recommend 3-5 SPECIFIC job titles with clear reasoning\\n");
        prompt.append("- Be HONEST about fit - don't sugarcoat poor matches\\n");
        prompt.append("- If performance doesn't match career interest, suggest alternatives diplomatically\\n");
        prompt.append("- Provide actionable next steps for achieving readiness\\n");
        prompt.append("- Make it feel like personalized career counseling, not generic advice\",\n");
        prompt.append("  \"behavioralInsights\": \"⚠️ ABSOLUTELY CRITICAL - LENGTH REQUIREMENT: This section MUST contain AT LEAST 12-15 COMPLETE SENTENCES (minimum 250-300 words). ONE OR TWO SENTENCE RESPONSES ARE COMPLETELY UNACCEPTABLE AND WILL BE REJECTED. This is NOT optional. Read this requirement again: MINIMUM 12-15 SENTENCES, 250-300 WORDS.\\n\\n");
        prompt.append("Write a comprehensive, detailed behavioral analysis paragraph based on the following data. This MUST be a flowing narrative paragraph, NOT bullet points. DO NOT mention any numerical scores, percentages, or statistics in the output.\\n\\n");
        prompt.append("ANALYZE THESE SPECIFIC DATA POINTS:\\n");
        prompt.append("1. BEHAVIORAL ACCURACY: The candidate achieved ").append(report.getAttempted() > 0 ? String.format("%.1f", (report.getCorrect() * 100.0 / report.getAttempted())) : "0").append("% accuracy rate (").append(behavioralStats.correct).append(" correct behavioral responses out of ").append(behavioralStats.attempted).append(" attempted). Deeply analyze what this accuracy level reveals about their behavioral maturity, professional judgment quality, decision-making effectiveness, and alignment with mature workplace behaviors.\\n\\n");
        prompt.append("2. BIG FIVE PERSONALITY PROFILE - Synthesize ALL five traits into your analysis:\\n");
        prompt.append("   • Openness: ").append(bigFiveScores.get("openness")).append("/100 - Their curiosity, creativity, willingness to embrace new ideas, and adaptability to change\\n");
        prompt.append("   • Conscientiousness: ").append(bigFiveScores.get("conscientiousness")).append("/100 - Their organization, reliability, responsibility, work ethic, and attention to detail\\n");
        prompt.append("   • Extraversion: ").append(bigFiveScores.get("extraversion")).append("/100 - Their social energy, communication style, assertiveness, and team interaction preferences\\n");
        prompt.append("   • Agreeableness: ").append(bigFiveScores.get("agreeableness")).append("/100 - Their cooperation, empathy, teamwork orientation, and interpersonal harmony focus\\n");
        prompt.append("   • Neuroticism: ").append(bigFiveScores.get("neuroticism")).append("/100 - Their emotional stability, stress resilience, composure under pressure, and professional maturity\\n");
        prompt.append("Discuss how this complete personality profile shapes their workplace behavior, professional relationships, and career success potential.\\n\\n");
        prompt.append("3. LEADERSHIP CAPABILITIES: Based on their behavioral category performance data (Leadership, Conflict Resolution, Communication, Teamwork categories), analyze their leadership potential, ability to inspire and guide others, conflict management skills, team dynamics contribution, and readiness to take charge in professional settings for ").append(userInfo.getCareerInterest()).append(" roles.\\n\\n");
        prompt.append("EXAMPLE OF PROPER LENGTH AND DEPTH (Your response should be similar in length and comprehensiveness):\\n");
        prompt.append("'The candidate demonstrates strong behavioral maturity through their consistent accuracy in workplace scenario responses, showing sound professional judgment and well-developed decision-making capabilities that align with effective organizational behaviors. Their personality profile reveals a balanced combination of traits that support professional success, with particularly strong conscientiousness indicating reliable work ethic and attention to detail, while moderate extraversion suggests comfortable collaboration without overwhelming need for constant social interaction. The candidate shows solid openness to new experiences and ideas, which positions them well for adapting to evolving workplace demands and embracing innovative approaches in their field. Their high agreeableness score reflects strong team orientation and cooperative nature, making them well-suited for collaborative environments and cross-functional project work. Emotional stability indicators suggest good stress resilience and professional composure under pressure, critical attributes for maintaining performance during challenging situations. In terms of leadership potential, the candidate exhibits developing capabilities in guiding others and contributing to team dynamics, with room for growth in conflict resolution and taking decisive charge in high-stakes scenarios. This behavioral profile aligns well with requirements for ").append(userInfo.getCareerInterest()).append(" roles, where combination of technical competence, collaborative spirit, and professional maturity creates foundation for career progression. Overall, their behavioral tendencies suggest readiness for professional environments, with particular strengths in reliability and teamwork, while continued development in assertive leadership would enhance their long-term advancement potential.'\\n\\n");
        prompt.append("YOUR RESPONSE REQUIREMENTS:\\n");
        prompt.append("✓ MINIMUM 8-10 complete sentences (count them!)\\n");
        prompt.append("✓ Start by discussing behavioral accuracy and professional maturity\\n");
        prompt.append("✓ Weave in ALL FIVE Big Five personality traits throughout the narrative\\n");
        prompt.append("✓ Address leadership potential and interpersonal capabilities specifically\\n");
        prompt.append("✓ Connect behavioral profile to success in ").append(userInfo.getCareerInterest()).append(" career\\n");
        prompt.append("✓ Discuss both behavioral strengths and development areas\\n");
        prompt.append("✓ Use flowing, natural language without bullet points\\n");
        prompt.append("✓ Use qualitative descriptions, NOT numerical scores\\n");
        prompt.append("✗ DO NOT write just 1-2 sentences - this is UNACCEPTABLE\\n");
        prompt.append("✗ DO NOT write brief summaries - be comprehensive and detailed\\n\\n");
        prompt.append("REMINDER: Count your sentences. You need AT LEAST 12-15 complete sentences (250-300 words). Short responses will not be accepted.\",\n");
        prompt.append("  \"domainInsights\": \"⚠️ ABSOLUTELY CRITICAL - LENGTH REQUIREMENT: This section MUST contain AT LEAST 12-15 COMPLETE SENTENCES (minimum 250-300 words). ONE OR TWO SENTENCE RESPONSES ARE COMPLETELY UNACCEPTABLE AND WILL BE REJECTED. This is NOT optional. Read this requirement again: MINIMUM 12-15 SENTENCES, 250-300 WORDS.\\n\\n");
        prompt.append("Write a comprehensive, detailed domain knowledge analysis for ").append(userInfo.getCareerInterest()).append(". This MUST be a flowing narrative paragraph, NOT bullet points. DO NOT mention any numerical scores, percentages, or statistics in the output.\\n\\n");
        prompt.append("ANALYZE THESE SPECIFIC DATA POINTS:\\n");
        prompt.append("1. EDUCATIONAL FOUNDATION:\\n");
        prompt.append("   • Degree: ").append(userInfo.getDegree()).append("\\n");
        prompt.append("   • Specialization: ").append(userInfo.getSpecialization()).append("\\n");
        prompt.append("   Deeply analyze how this educational background provides foundation for ").append(userInfo.getCareerInterest()).append(" career. Discuss alignment between specialization and career interest, whether they have appropriate academic preparation, what this education equips them to do professionally, and if their degree level matches industry entry requirements.\\n\\n");
        prompt.append("2. TECHNICAL SKILLS PROFILE:\\n");
        if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().isEmpty()) {
            prompt.append("   • Technical Skills: ").append(userInfo.getTechnicalSkills()).append("\\n");
            prompt.append("   Comprehensively evaluate the breadth, depth, and relevance of their skillset for ").append(userInfo.getCareerInterest()).append(". Discuss which skills are most valuable, whether they have modern industry-relevant competencies, if there are critical skill gaps, how their technical toolkit positions them competitively in job market, and whether skills indicate hands-on experience or just theoretical knowledge.\\n\\n");
        } else {
            prompt.append("   • No technical skills listed\\n");
            prompt.append("   Discuss the significant challenge this presents for ").append(userInfo.getCareerInterest()).append(" career, critical skills they need to develop, how lack of listed skills impacts job readiness, and urgent need for technical skill development.\\n\\n");
        }
        prompt.append("3. DOMAIN ASSESSMENT PERFORMANCE: The candidate achieved ").append(domainStats.correct).append(" correct responses out of ").append(domainStats.attempted).append(" attempted domain questions (").append(String.format("%.1f", sectionScores.get("domain"))).append("% domain score). Analyze what this performance reveals about depth vs breadth of knowledge, practical understanding vs theoretical knowledge, technical readiness level, whether knowledge matches their educational credentials and career goals, and if they demonstrate job-ready competency or need significant upskilling.\\n\\n");
        prompt.append("4. DOMAIN CATEGORY PATTERNS: Review the domain category-level breakdown data provided earlier and identify specific patterns - which technical areas show strength, which need development, where knowledge gaps exist, and what these patterns mean for their ").append(userInfo.getCareerInterest()).append(" career prospects.\\n\\n");
        prompt.append("EXAMPLE OF PROPER LENGTH AND DEPTH (Your response should be similar in length and comprehensiveness):\\n");
        prompt.append("'The candidate's educational background in ").append(userInfo.getDegree()).append(" with specialization in ").append(userInfo.getSpecialization()).append(" provides relevant academic foundation for pursuing ").append(userInfo.getCareerInterest()).append(" career, establishing necessary theoretical understanding and conceptual framework required in this field. ");
        if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().isEmpty()) {
            prompt.append("Their technical skills profile demonstrates developing competency across several important areas, with particular strength in skills that directly support core job functions, though some critical modern technologies and frameworks appear underrepresented in their current skillset. ");
        } else {
            prompt.append("However, the absence of listed technical skills represents significant gap that requires immediate attention through structured learning and hands-on practice to build competitive technical toolkit. ");
        }
        prompt.append("The domain assessment performance reveals moderate foundational knowledge with clear understanding of fundamental concepts, though depth of expertise varies across different technical categories, indicating areas where intensive focused learning would strengthen overall technical profile. Analysis of specific domain categories shows solid grasp of core theoretical principles but highlights need for deeper practical application skills and hands-on experience with industry-standard tools and methodologies. The candidate demonstrates adequate baseline technical knowledge for entry-level positions but would benefit substantially from targeted skill development in emerging technologies and advanced topics that are increasingly valued in competitive ").append(userInfo.getCareerInterest()).append(" job market. Their combination of formal education, current skill inventory, and demonstrated domain knowledge suggests they are on developmental trajectory toward professional readiness, though additional 3-6 months of focused technical upskilling through structured courses, practical projects, and hands-on experimentation would significantly enhance their competitive positioning. The alignment between their specialization and career goals is appropriate, indicating they have chosen career path that leverages their educational investment, though translation of academic knowledge into practical industry-ready competencies remains ongoing development priority. Overall technical maturity indicates emerging professional who understands foundational concepts but needs to deepen expertise through real-world application, continuous learning, and exposure to industry best practices to achieve full job-market readiness for ").append(userInfo.getCareerInterest()).append(" roles.'\\n\\n");
        prompt.append("YOUR RESPONSE REQUIREMENTS:\\n");
        prompt.append("✓ MINIMUM 12-15 complete sentences (count them!)\\n");
        prompt.append("✓ Start by discussing educational foundation (degree + specialization) and career alignment\\n");
        prompt.append("✓ Thoroughly analyze technical skills profile - breadth, depth, relevance, gaps\\n");
        prompt.append("✓ Integrate insights from domain assessment performance\\n");
        prompt.append("✓ Discuss specific technical strengths and knowledge gaps across categories\\n");
        prompt.append("✓ Assess technical readiness level (job-ready vs needs development)\\n");
        prompt.append("✓ Evaluate alignment with industry expectations for ").append(userInfo.getCareerInterest()).append("\\n");
        prompt.append("✓ Discuss learning potential and technical maturity\\n");
        prompt.append("✓ Use flowing, natural language without bullet points\\n");
        prompt.append("✓ Use qualitative descriptions, NOT numerical scores\\n");
        prompt.append("✗ DO NOT write just 1-2 sentences - this is UNACCEPTABLE\\n");
        prompt.append("✗ DO NOT write brief summaries - be comprehensive and detailed\\n\\n");
        prompt.append("REMINDER: Count your sentences. You need AT LEAST 12-15 complete sentences (250-300 words). Short responses will not be accepted.\",\n");
        prompt.append("  \"narrativeSummary\": \"CRITICAL: Provide a VERY DETAILED performance breakdown focusing on STRONG ZONES and WEAK ZONES with ACTIONABLE RECOMMENDATIONS. DO NOT combine sections into single paragraphs. Each category paragraph MUST be UNIQUE and VARIED. Structure as follows:\\n\\n");
        prompt.append("APTITUDE SECTION:\\n");
        prompt.append("For EACH aptitude category (Numerical Ability, Verbal Reasoning, Abstract Reasoning, Logical Reasoning, Situational Judgment), write a SEPARATE and UNIQUE paragraph (5-7 lines each) that:\\n");
        prompt.append("- States the candidate's performance with UNIQUE wording: 'Scored X out of Y questions (Z%)' with exact numbers from data above\\n");
        prompt.append("- CLEARLY IDENTIFIES if this is a STRONG ZONE (>70%), MODERATE ZONE (50-70%), or WEAK ZONE (<50%)\\n");
        prompt.append("- If STRONG ZONE: Explains what this strength reveals about their capabilities, how they can LEVERAGE this strength in their career (").append(userInfo.getCareerInterest()).append("), and provides 2-3 specific recommendations to EXCEL FURTHER (e.g., 'Take advanced certification', 'Mentor others', 'Lead projects requiring this skill')\\n");
        prompt.append("- If WEAK ZONE: Explains why this area needs attention, the impact of this weakness on their career goals, and provides 3-4 SPECIFIC, ACTIONABLE steps to improve (e.g., 'Practice 15 problems daily from [specific resource]', 'Complete [specific online course]', 'Work on [specific type of exercises]', 'Seek mentorship in this area')\\n");
        prompt.append("- If MODERATE ZONE: Acknowledges competency, identifies specific gaps, and provides 2-3 targeted recommendations to move from moderate to strong\\n");
        prompt.append("- Uses EXACT category performance data provided above\\n");
        prompt.append("- VARY sentence structure, vocabulary, and writing style between categories\\n\\n");
        prompt.append("BEHAVIORAL SECTION:\\n");
        prompt.append("For EACH behavioral category (Leadership, Conflict Resolution, Adaptability, Communication, Teamwork, Big Five traits, etc.), write a SEPARATE and UNIQUE paragraph (5-7 lines each) that:\\n");
        prompt.append("- States performance with UNIQUE phrasing: 'Responded to X of Y questions (Z%)' with exact numbers from data above\\n");
        prompt.append("- CLEARLY IDENTIFIES if this is a STRONG BEHAVIORAL ZONE (>70%), DEVELOPING ZONE (50-70%), or WEAK BEHAVIORAL ZONE (<50%)\\n");
        prompt.append("- If STRONG ZONE: Explains what strong responses reveal about their behavioral competencies, how this strength will benefit them in ").append(userInfo.getCareerInterest()).append(" roles, and provides 2-3 specific recommendations to MAXIMIZE this strength (e.g., 'Volunteer for leadership opportunities', 'Lead team initiatives', 'Become a peer mentor', 'Take on conflict mediation roles')\\n");
        prompt.append("- If WEAK ZONE: Explains the importance of this behavioral trait for career success, identifies specific behavioral gaps evident from responses, and provides 3-4 DETAILED, ACTIONABLE improvement strategies (e.g., 'Enroll in [specific behavioral training workshop]', 'Practice [specific behavioral technique] in daily situations', 'Read [specific book on this trait]', 'Seek feedback from peers on this behavior', 'Join groups/clubs that develop this trait')\\n");
        prompt.append("- If DEVELOPING ZONE: Acknowledges current level, pinpoints specific behaviors to strengthen, and provides 2-3 targeted development activities\\n");
        prompt.append("- Uses EXACT category performance data provided above\\n");
        prompt.append("- Each paragraph must be COMPLETELY DIFFERENT in structure, vocabulary, and approach - NO generic phrases\\n\\n");
        prompt.append("DOMAIN SECTION:\\n");
        prompt.append("For EACH domain skill/category (Frontend Development, Backend Development, Data Analysis, Database Management, etc.), write a SEPARATE and UNIQUE paragraph (5-7 lines each) that:\\n");
        prompt.append("- States performance with technical precision: 'Achieved X of Y correct (Z%)' with exact numbers from data above\\n");
        prompt.append("- CLEARLY IDENTIFIES if this is a TECHNICAL STRONG ZONE (>70%), COMPETENT ZONE (50-70%), or WEAK TECHNICAL ZONE (<50%)\\n");
        prompt.append("- If STRONG ZONE: Explains what this technical strength indicates about their domain expertise, how they can CAPITALIZE on this in ").append(userInfo.getCareerInterest()).append(" roles, and provides 2-3 specific recommendations to DEEPEN expertise (e.g., 'Build advanced projects using [specific technology]', 'Contribute to open-source projects in this area', 'Obtain [specific certification]', 'Write technical articles/blogs', 'Teach/mentor others in this domain')\\n");
        prompt.append("- If WEAK ZONE: Explains why this technical area is critical for their career (").append(userInfo.getCareerInterest()).append("), identifies specific knowledge gaps, and provides 3-5 CONCRETE, STEP-BY-STEP learning recommendations (e.g., 'Complete [specific online course/platform]', 'Build [specific type of project]', 'Study [specific topics/concepts]', 'Practice [specific exercises]', 'Follow [specific learning path]', 'Join [specific community/forum]')\\n");
        prompt.append("- If COMPETENT ZONE: Acknowledges foundation, identifies specific technical areas to strengthen, and provides 2-3 focused learning activities to reach advanced level\\n");
        prompt.append("- Includes specific technologies, tools, frameworks, or concepts relevant to that domain\\n");
        prompt.append("- Uses EXACT category performance data provided above\\n");
        prompt.append("- VARY sentence structure, technical language, and recommendations between categories\\n\\n");
        prompt.append("CRITICAL REQUIREMENTS FOR ALL SECTIONS:\\n");
        prompt.append("1. Each category MUST have its own dedicated paragraph - NO combining\\n");
        prompt.append("2. Each paragraph MUST be UNIQUE - different structure, vocabulary, phrasing\\n");
        prompt.append("3. FOCUS on performance-based analysis: STRONG ZONES and WEAK ZONES\\n");
        prompt.append("4. Provide SPECIFIC, ACTIONABLE, DETAILED recommendations - not generic advice\\n");
        prompt.append("5. Include exact percentages and numbers from the test data\\n");
        prompt.append("6. Recommendations must be concrete (courses, resources, exercises, practice methods)\\n");
        prompt.append("7. Connect recommendations to candidate's career goal: ").append(userInfo.getCareerInterest()).append("\\n");
        prompt.append("8. Make analysis feel personalized and directly useful for improvement\"\n");
        prompt.append("}\n\n");
        prompt.append("IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanations. Make the content professional, balanced, and constructive.");
        
        return prompt.toString();
    }
    
    private void parseAIResponse(String content, PsychometricReport report,
                                Map<String, Double> sectionScores,
                                SectionStats aptitudeStats, SectionStats behavioralStats, SectionStats domainStats,
                                Map<String, CategoryStats> aptitudeCategoryStats,
                                Map<String, CategoryStats> behavioralCategoryStats,
                                Map<String, CategoryStats> domainCategoryStats) {
        try {
            // Extract JSON from response
            String jsonContent = extractJsonFromResponse(content);
            JsonNode root = objectMapper.readTree(jsonContent);
            
            if (root.has("summaryBio")) {
                report.setSummaryBio(root.get("summaryBio").asText());
            }
            if (root.has("interviewSummary")) {
                report.setInterviewSummary(root.get("interviewSummary").asText());
            }
            if (root.has("strengths") && root.get("strengths").isArray()) {
                List<String> strengths = new ArrayList<>();
                root.get("strengths").forEach(node -> strengths.add(node.asText()));
                report.setStrengths(strengths);
            }
            if (root.has("weaknesses") && root.get("weaknesses").isArray()) {
                List<String> weaknesses = new ArrayList<>();
                root.get("weaknesses").forEach(node -> weaknesses.add(node.asText()));
                report.setWeaknesses(weaknesses);
            }
            if (root.has("opportunities") && root.get("opportunities").isArray()) {
                List<String> opportunities = new ArrayList<>();
                root.get("opportunities").forEach(node -> opportunities.add(node.asText()));
                report.setOpportunities(opportunities);
            }
            if (root.has("threats") && root.get("threats").isArray()) {
                List<String> threats = new ArrayList<>();
                root.get("threats").forEach(node -> threats.add(node.asText()));
                report.setThreats(threats);
            }
            if (root.has("swotAnalysis")) {
                report.setSwotAnalysis(root.get("swotAnalysis").asText());
            }
            if (root.has("fitAnalysis")) {
                report.setFitAnalysis(root.get("fitAnalysis").asText());
            }
            if (root.has("behavioralInsights")) {
                report.setBehavioralInsights(root.get("behavioralInsights").asText());
            }
            if (root.has("domainInsights")) {
                report.setDomainInsights(root.get("domainInsights").asText());
            }
            // Always generate unique narrative content for each category individually
            // This ensures maximum variety and prevents repetitive content
            try {
                generateUniqueNarrativeContent(report, null, sectionScores,
                    aptitudeStats, behavioralStats, domainStats,
                    aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
            } catch (Exception ex) {
                System.err.println("Error generating unique narrative: " + ex.getMessage());
                // Fallback to AI-generated narrative if individual generation fails
                if (root.has("narrativeSummary")) {
                    report.setNarrativeSummary(root.get("narrativeSummary").asText());
                }
            }
        } catch (Exception e) {
            System.err.println("Error parsing AI response: " + e.getMessage());
            Map<String, Double> emptyScores = new HashMap<>();
            emptyScores.put("aptitude", report.getAptitudeScore() != null ? report.getAptitudeScore() : 0.0);
            emptyScores.put("behavioral", report.getBehavioralScore() != null ? report.getBehavioralScore() : 0.0);
            emptyScores.put("domain", report.getDomainScore() != null ? report.getDomainScore() : 0.0);
            generateDefaultReportContent(report, report.getUserInfo(), emptyScores,
                new SectionStats(), new SectionStats(), new SectionStats(),
                aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
        }
    }
    
    /**
     * Check if narrative content seems repetitive or uses generic templates
     */
    private boolean isNarrativeRepetitive(String narrative) {
        if (narrative == null || narrative.trim().isEmpty()) {
            return true;
        }
        
        String lowerNarrative = narrative.toLowerCase();
        
        // Check for repetitive phrases that indicate template usage
        String[] repetitivePhrases = {
            "areas for behavioral development",
            "increased self-awareness and practice",
            "engaging in activities that require these behaviors",
            "seeking feedback, and learning from experienced professionals",
            "building these skills will enhance overall professional effectiveness",
            "demonstrates strong proficiency",
            "excellent understanding and application of concepts",
            "to further enhance skills, consider tackling",
            "strong behavioral competencies",
            "demonstrates maturity and awareness",
            "to continue developing, consider seeking leadership opportunities",
            "reflecting on real-world applications of these behaviors",
            "the candidate shows a good grasp of",
            "while performance is solid, there is room for improvement",
            "focus on practicing similar problem types"
        };
        
        int repetitiveCount = 0;
        for (String phrase : repetitivePhrases) {
            if (lowerNarrative.contains(phrase.toLowerCase())) {
                repetitiveCount++;
            }
        }
        
        // If we find 2 or more repetitive phrases, consider it repetitive
        if (repetitiveCount >= 2) {
            return true;
        }
        
        // Check for repeated sentence patterns
        String[] patterns = {
            "the candidate provided responses to",
            "the candidate answered",
            "out of.*questions correctly",
            "demonstrates strong proficiency in",
            "responses indicate strong behavioral competencies"
        };
        
        for (String pattern : patterns) {
            long count = lowerNarrative.split(pattern).length - 1;
            if (count >= 2) {
                return true;
            }
        }
        
        // Check if multiple categories have identical or very similar text
        // Split by category headers and compare
        String[] sections = narrative.split("(?i)(?:aptitude|behavioral|domain)\\s+section:");
        if (sections.length > 1) {
            // Check if paragraphs within sections are too similar
            for (int i = 1; i < sections.length; i++) {
                String[] paragraphs = sections[i].split("\\n\\n");
                if (paragraphs.length > 1) {
                    // Simple similarity check - if two paragraphs are very similar in length and structure
                    for (int j = 0; j < paragraphs.length - 1; j++) {
                        for (int k = j + 1; k < paragraphs.length; k++) {
                            String p1 = paragraphs[j].trim().toLowerCase();
                            String p2 = paragraphs[k].trim().toLowerCase();
                            if (p1.length() > 50 && p2.length() > 50) {
                                // Check if they start similarly
                                int minLen = Math.min(p1.length(), p2.length());
                                int commonStart = 0;
                                for (int l = 0; l < Math.min(minLen, 100); l++) {
                                    if (p1.charAt(l) == p2.charAt(l)) {
                                        commonStart++;
                                    } else {
                                        break;
                                    }
                                }
                                // If more than 60% of the start is identical, consider it repetitive
                                if (commonStart > 60) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    private String extractJsonFromResponse(String content) {
        content = content.trim();
        if (content.startsWith("```json")) {
            content = content.substring(7);
        } else if (content.startsWith("```")) {
            content = content.substring(3);
        }
        if (content.endsWith("```")) {
            content = content.substring(0, content.length() - 3);
        }
        content = content.trim();
        
        // Find JSON object
        int start = content.indexOf("{");
        int end = content.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        return content;
    }
    
    private void generateDefaultReportContent(PsychometricReport report, UserInfo userInfo,
                                             Map<String, Double> sectionScores,
                                             SectionStats aptitudeStats, SectionStats behavioralStats, SectionStats domainStats,
                                             Map<String, CategoryStats> aptitudeCategoryStats,
                                             Map<String, CategoryStats> behavioralCategoryStats,
                                             Map<String, CategoryStats> domainCategoryStats) {
        // Get gender-appropriate pronouns
        String gender = userInfo.getGender();
        String possessivePronoun = getPossessivePronoun(gender);
        
        // Build comprehensive and detailed bio
        StringBuilder bioBuilder = new StringBuilder();
        
        // Opening: Educational background and career stage
        bioBuilder.append(String.format("%s is a %s graduate with specialization in %s, representing a strong foundation in %s chosen field. ", 
            userInfo.getName(), userInfo.getDegree(), userInfo.getSpecialization(), possessivePronoun));
        bioBuilder.append(String.format("%s academic journey in %s has equipped %s with fundamental knowledge and analytical thinking skills essential for professional growth. ", 
            capitalize(possessivePronoun), userInfo.getSpecialization(), getObjectPronoun(gender)));
        
        // Career Interest & Goals
        bioBuilder.append(String.format("With a clear career focus on %s, %s demonstrates a well-defined professional direction that aligns closely with %s educational background. ", 
            userInfo.getCareerInterest(), userInfo.getName(), possessivePronoun));
        bioBuilder.append(String.format("This career path reflects %s passion for applying technical knowledge and problem-solving skills in real-world scenarios. ", possessivePronoun));
        bioBuilder.append(String.format("%s specialization in %s provides a solid technical base that directly supports %s aspirations in %s, creating a cohesive professional trajectory. ", 
            capitalize(possessivePronoun), userInfo.getSpecialization(), possessivePronoun, userInfo.getCareerInterest()));
        
        // Technical Expertise
        if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().isEmpty()) {
            bioBuilder.append(String.format("In terms of technical capabilities, %s has developed expertise in %s, which showcases %s commitment to staying current with industry-relevant technologies. ", 
                userInfo.getName(), userInfo.getTechnicalSkills(), possessivePronoun));
            bioBuilder.append(String.format("These technical skills demonstrate %s ability to work with modern tools and frameworks, indicating readiness for challenging technical roles. ", possessivePronoun));
        } else {
            bioBuilder.append(String.format("%s is building %s technical skill set to complement %s educational foundation. ", 
                userInfo.getName(), possessivePronoun, possessivePronoun));
        }
        
        // Soft Skills & Interpersonal Abilities
        if (userInfo.getSoftSkills() != null && !userInfo.getSoftSkills().isEmpty()) {
            bioBuilder.append(String.format("Beyond technical expertise, %s possesses strong soft skills including %s, which are crucial for effective collaboration and professional success. ", 
                userInfo.getName(), userInfo.getSoftSkills()));
            bioBuilder.append(String.format("These interpersonal abilities enhance %s technical capabilities, making %s a well-rounded professional who can contribute effectively in team environments. ", 
                possessivePronoun, getObjectPronoun(gender)));
        } else {
            bioBuilder.append(String.format("%s is developing %s interpersonal skills to complement %s technical knowledge. ", 
                userInfo.getName(), possessivePronoun, possessivePronoun));
        }
        
        // Personal Interests & Hobbies
        if (userInfo.getHobbies() != null && !userInfo.getHobbies().isEmpty()) {
            bioBuilder.append(String.format("Outside of %s professional pursuits, %s enjoys %s, which reflects %s diverse interests and contributes to a balanced lifestyle. ", 
                possessivePronoun, userInfo.getName(), userInfo.getHobbies(), possessivePronoun));
        }
        if (userInfo.getInterests() != null && !userInfo.getInterests().isEmpty()) {
            bioBuilder.append(String.format("%s interests in %s further demonstrate %s curiosity and engagement with various domains beyond %s primary field. ", 
                capitalize(possessivePronoun), userInfo.getInterests(), possessivePronoun, possessivePronoun));
        }
        
        // Closing: Cohesive professional identity
        bioBuilder.append(String.format("Overall, %s presents as a motivated professional with a clear educational foundation, technical capabilities, and interpersonal skills that position %s well for success in %s. ", 
            userInfo.getName(), getObjectPronoun(gender), userInfo.getCareerInterest()));
        
        report.setSummaryBio(bioBuilder.toString().trim());
        
        // Build NARRATIVE-STYLE performance summary (paragraph format, no section breakdowns)
        StringBuilder summaryBuilder = new StringBuilder();
        
        // Paragraph 1: Overall Performance Narrative
        summaryBuilder.append(String.format("The candidate completed a comprehensive psychometric assessment, achieving an overall score of %.1f%% with a candidate percentage of %.2f%% (answering %d out of %d questions correctly). ", 
            report.getOverallScore(), report.getCandidatePercentile(), report.getCorrect(), report.getTotalQuestions()));
        summaryBuilder.append(String.format("Out of %d total questions administered, %s attempted %d and successfully answered %d correctly, demonstrating an accuracy rate of %.1f%%. ", 
            report.getTotalQuestions(), getSubjectPronoun(gender), report.getAttempted(), report.getCorrect(), 
            (report.getAttempted() > 0 ? (report.getCorrect() * 100.0 / report.getAttempted()) : 0)));
        summaryBuilder.append(String.format("This performance level classifies %s in the %s category, ", getObjectPronoun(gender), report.getPerformanceBucket()));
        
        if (report.getOverallScore() >= 70) {
            summaryBuilder.append(String.format("indicating strong readiness for roles in %s with competitive capability in the current job market. ", userInfo.getCareerInterest()));
        } else if (report.getOverallScore() >= 50) {
            summaryBuilder.append(String.format("suggesting good foundational capabilities for %s with focused development needed in specific areas to achieve optimal career readiness. ", userInfo.getCareerInterest()));
        } else {
            summaryBuilder.append(String.format("indicating that significant preparation and skill development are recommended before pursuing professional roles in %s. ", userInfo.getCareerInterest()));
        }
        summaryBuilder.append("\n\n");
        
        // Paragraph 2: Strong Zones Narrative (identify from categories)
        List<String> strongCategories = new ArrayList<>();
        
        // Check category-level performance for strong zones
        if (!aptitudeCategoryStats.isEmpty()) {
            aptitudeCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) >= 70)
                .forEach(e -> strongCategories.add(String.format("%s (%.1f%%)", 
                    formatCategoryName(e.getKey()), (e.getValue().correct * 100.0 / e.getValue().total))));
        }
        if (!behavioralCategoryStats.isEmpty()) {
            behavioralCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) >= 70)
                .forEach(e -> strongCategories.add(String.format("%s (%.1f%%)", 
                    formatCategoryName(e.getKey()), (e.getValue().correct * 100.0 / e.getValue().total))));
        }
        if (!domainCategoryStats.isEmpty()) {
            domainCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) >= 70)
                .forEach(e -> strongCategories.add(String.format("%s (%.1f%%)", 
                    formatCategoryName(e.getKey()), (e.getValue().correct * 100.0 / e.getValue().total))));
        }
        
        if (!strongCategories.isEmpty()) {
            summaryBuilder.append("Analysis of the performance data reveals several strong zones where the candidate demonstrated exceptional capability: ");
            summaryBuilder.append(String.join(", ", strongCategories.subList(0, Math.min(5, strongCategories.size()))));
            summaryBuilder.append(". These high-performing areas represent natural aptitudes and well-developed skills that can serve as a foundation for career success. ");
            summaryBuilder.append(String.format("To capitalize on these strengths, the candidate should pursue advanced learning opportunities in these domains, take on challenging projects that leverage these capabilities, and consider roles in %s that specifically require these competencies. ", userInfo.getCareerInterest()));
        } else {
            summaryBuilder.append("While no individual category reached the strong zone threshold of 70% or above, the candidate demonstrates developing competencies across multiple areas. ");
            summaryBuilder.append("This balanced profile suggests versatility and the potential for growth with focused development efforts. ");
        }
        summaryBuilder.append("\n\n");
        
        // Paragraph 3: Weak Zones & Improvement Narrative
        List<String> weakCategories = new ArrayList<>();
        
        if (!aptitudeCategoryStats.isEmpty()) {
            aptitudeCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) < 50)
                .forEach(e -> weakCategories.add(String.format("%s (%.1f%%)", 
                    formatCategoryName(e.getKey()), (e.getValue().correct * 100.0 / e.getValue().total))));
        }
        if (!behavioralCategoryStats.isEmpty()) {
            behavioralCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) < 50)
                .forEach(e -> weakCategories.add(String.format("%s (%.1f%%)", 
                    formatCategoryName(e.getKey()), (e.getValue().correct * 100.0 / e.getValue().total))));
        }
        if (!domainCategoryStats.isEmpty()) {
            domainCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) < 50)
                .forEach(e -> weakCategories.add(String.format("%s (%.1f%%)", 
                    formatCategoryName(e.getKey()), (e.getValue().correct * 100.0 / e.getValue().total))));
        }
        
        if (!weakCategories.isEmpty()) {
            summaryBuilder.append("The assessment also identified areas requiring focused improvement: ");
            summaryBuilder.append(String.join(", ", weakCategories.subList(0, Math.min(5, weakCategories.size()))));
            summaryBuilder.append(String.format(". These weak zones are critical for professional success in %s and require systematic development. ", userInfo.getCareerInterest()));
            summaryBuilder.append("A structured improvement plan should include dedicated study time, relevant online courses or workshops, regular practice with increasing difficulty, and mentorship from experienced professionals in these areas. ");
            summaryBuilder.append("Setting measurable goals such as improving scores by 15-20% over a 2-3 month period through daily practice and weekly assessments will help track progress effectively. ");
        } else {
            summaryBuilder.append("The performance profile shows no critical weak zones below 50%, indicating a solid foundation across assessed areas. ");
            summaryBuilder.append("Continued development in moderate-performing categories will help achieve excellence and competitive advantage in the job market. ");
        }
        summaryBuilder.append("\n\n");
        
        // Paragraph 4: Readiness & Strategic Recommendations
        summaryBuilder.append("Based on the comprehensive performance analysis, ");
        if (report.getOverallScore() >= 70) {
            summaryBuilder.append("the candidate demonstrates immediate readiness for professional roles. ");
            summaryBuilder.append(String.format("%s should focus on building a strong portfolio showcasing %s capabilities, preparing for technical interviews, and actively applying for positions that align with %s strong zones. ", 
                capitalize(getSubjectPronoun(gender)), possessivePronoun, possessivePronoun));
            summaryBuilder.append(String.format("With %s current performance level, %s %s well-positioned to secure opportunities within 2-4 weeks of active job search. ", 
                possessivePronoun, getSubjectPronoun(gender), getSubjectPronoun(gender).equals("they") ? "are" : "is"));
        } else if (report.getOverallScore() >= 50) {
            summaryBuilder.append("the candidate would benefit from 2-3 months of targeted skill development before entering an intensive job search. ");
            summaryBuilder.append("Priority should be given to strengthening the identified weak zones while maintaining and enhancing strong areas. ");
            summaryBuilder.append("A structured learning plan combining online courses, practical projects, and regular self-assessment will help achieve the 70%+ threshold that indicates strong job-market readiness. ");
        } else {
            summaryBuilder.append("the candidate should undertake a comprehensive 3-6 month preparation program before actively pursuing professional opportunities. ");
            summaryBuilder.append("This preparation should include foundational skill-building through structured courses or bootcamps, extensive hands-on practice, mentored learning, and progressive self-assessment. ");
            summaryBuilder.append(String.format("Building core competencies that are essential for %s will significantly improve both job-market competitiveness and long-term career success. ", userInfo.getCareerInterest()));
        }
        
        report.setInterviewSummary(summaryBuilder.toString());
        
        // Performance-based strengths (qualitative, no numeric scores)
        List<String> strengthsList = new ArrayList<>();
        
        // Aptitude strengths
        if (report.getAptitudeScore() >= 70) {
            strengthsList.add("Demonstrates strong analytical aptitude and logical reasoning ability with proficiency in problem-solving");
            strengthsList.add("Exhibits solid numerical and data interpretation skills essential for informed decision-making");
        }
        
        // Behavioral strengths
        if (report.getBehavioralScore() >= 70) {
            strengthsList.add("Shows positive interpersonal skills, adaptability, and leadership potential in team environments");
            strengthsList.add("Displays strong emotional intelligence and effective communication capabilities");
        }
        
        // Domain strengths
        if (report.getDomainScore() >= 70) {
            strengthsList.add(String.format("Demonstrates solid foundational knowledge and technical readiness for %s roles", userInfo.getCareerInterest()));
            strengthsList.add(String.format("Exhibits strong technical competency aligned with industry requirements in %s", userInfo.getSpecialization()));
        }
        
        // Add category-level strengths if available (qualitative descriptions)
        if (!aptitudeCategoryStats.isEmpty()) {
            aptitudeCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) >= 70)
                .limit(3)
                .forEach(e -> {
                    String categoryName = formatCategoryName(e.getKey());
                    strengthsList.add(String.format("Shows proficiency in %s with strong conceptual understanding", categoryName));
                });
        }
        
        if (strengthsList.isEmpty()) {
            strengthsList.add("Demonstrates consistent performance and balanced approach across evaluated competencies");
            strengthsList.add("Shows willingness to engage with challenging problems and learn from experiences");
        }
        report.setStrengths(strengthsList.size() > 6 ? strengthsList.subList(0, 6) : strengthsList);
        
        // Performance-based weaknesses (qualitative, development-focused, no numeric scores)
        List<String> weaknessesList = new ArrayList<>();
        
        // Aptitude weaknesses
        if (report.getAptitudeScore() < 50) {
            weaknessesList.add("Requires improvement in analytical reasoning and quantitative problem-solving to meet industry expectations");
            weaknessesList.add("Needs development in logical thinking and pattern recognition for complex scenarios");
        }
        
        // Behavioral weaknesses
        if (report.getBehavioralScore() < 50) {
            weaknessesList.add("Needs development in conflict resolution, decision-making under pressure, and professional communication");
            weaknessesList.add("Requires enhancement of interpersonal skills and emotional intelligence for effective collaboration");
        }
        
        // Domain weaknesses
        if (report.getDomainScore() < 50) {
            weaknessesList.add(String.format("Technical skill gaps may limit readiness for competitive %s roles", userInfo.getCareerInterest()));
            weaknessesList.add(String.format("Requires focused upskilling in core %s concepts to meet professional standards", userInfo.getSpecialization()));
        }
        
        // Add category-level weaknesses if available (qualitative descriptions)
        if (!aptitudeCategoryStats.isEmpty()) {
            aptitudeCategoryStats.entrySet().stream()
                .filter(e -> e.getValue().total > 0 && (e.getValue().correct * 100.0 / e.getValue().total) < 50)
                .limit(3)
                .forEach(e -> {
                    String categoryName = formatCategoryName(e.getKey());
                    weaknessesList.add(String.format("Needs focused improvement in %s through structured practice and learning", categoryName));
                });
        }
        
        if (weaknessesList.isEmpty()) {
            weaknessesList.add("Can benefit from enhanced accuracy and speed through targeted practice");
            weaknessesList.add("Would gain from deeper engagement with advanced concepts and edge cases");
        }
        report.setWeaknesses(weaknessesList.size() > 4 ? weaknessesList.subList(0, 4) : weaknessesList);
        
        // Opportunities (growth-oriented, aligned with performance)
        List<String> opportunitiesList = new ArrayList<>();
        
        // High performers - advancement opportunities
        if (report.getOverallScore() >= 70) {
            opportunitiesList.add(String.format("Strong positioning for immediate entry into %s roles with competitive advantage", userInfo.getCareerInterest()));
            opportunitiesList.add("Potential for rapid career progression through demonstrated competencies");
            opportunitiesList.add("Opportunity to pursue specialized certifications to enhance market value");
        } 
        // Moderate performers - development opportunities
        else if (report.getOverallScore() >= 50) {
            opportunitiesList.add(String.format("Growth potential in %s field with targeted upskilling in identified areas", userInfo.getCareerInterest()));
            opportunitiesList.add("Opportunity to strengthen foundational skills through focused training programs");
            opportunitiesList.add("Career advancement possible through practical experience and continuous learning");
        } 
        // Low performers - foundational opportunities
        else {
            opportunitiesList.add("Significant opportunity for skill development through structured bootcamps and courses");
            opportunitiesList.add(String.format("Access to entry-level training programs in %s to build core competencies", userInfo.getCareerInterest()));
            opportunitiesList.add("Potential to pivot career direction based on identified strengths and interests");
        }
        
        // Add market-based opportunities
        opportunitiesList.add("High demand in technology sector creates favorable employment landscape");
        opportunitiesList.add("Growing industry need for diverse skill sets offers multiple career pathways");
        
        report.setOpportunities(opportunitiesList.size() > 5 ? opportunitiesList.subList(0, 5) : opportunitiesList);
        
        // Threats (external, future-focused risks)
        List<String> threatsList = new ArrayList<>();
        
        // Competitive threats based on performance
        if (report.getOverallScore() < 70) {
            threatsList.add("Intense competition from candidates with stronger technical and analytical profiles");
            threatsList.add("Risk of being overlooked for opportunities without addressing identified skill gaps");
        }
        
        // Industry and market threats
        threatsList.add("Rapid evolution of technology trends requires continuous learning to remain relevant");
        threatsList.add(String.format("Rising industry benchmarks for %s roles demand higher competency levels", userInfo.getCareerInterest()));
        
        // Aptitude-specific threats
        if (report.getAptitudeScore() < 50) {
            threatsList.add("Weak analytical foundation may hinder problem-solving in technical interviews and job performance");
        }
        
        // Domain-specific threats
        if (report.getDomainScore() < 50) {
            threatsList.add("Insufficient technical knowledge could limit career entry and progression opportunities");
        }
        
        // General threats
        threatsList.add("Risk of skill stagnation without proactive professional development");
        threatsList.add("Market saturation in certain technology domains increases competition for entry-level positions");
        
        report.setThreats(threatsList.size() > 4 ? threatsList.subList(0, 4) : threatsList);
        
        // Build dynamic SWOT Analysis narrative based on performance (qualitative)
        StringBuilder swotNarrative = new StringBuilder();
        
        // Strengths paragraph
        if (report.getOverallScore() >= 70) {
            swotNarrative.append(String.format("%s demonstrates strong competency in %s with well-rounded capabilities across analytical, behavioral, and technical dimensions. ", 
                userInfo.getName(), userInfo.getCareerInterest()));
            swotNarrative.append("Their cognitive abilities, professional conduct, and domain knowledge position them favorably for competitive roles in the industry. ");
        } else if (report.getOverallScore() >= 50) {
            swotNarrative.append(String.format("%s shows foundational capabilities in %s with notable strengths in specific areas. ", 
                userInfo.getName(), userInfo.getCareerInterest()));
            swotNarrative.append("While demonstrating competence in several key dimensions, there is clear potential for growth through targeted skill development. ");
        } else {
            swotNarrative.append(String.format("%s is at the early stages of developing competencies required for %s roles. ", 
                userInfo.getName(), userInfo.getCareerInterest()));
            swotNarrative.append("With dedicated effort and structured learning, there is significant opportunity to build the foundational skills needed for career success. ");
        }
        
        // Weaknesses and opportunities paragraph
        if (report.getOverallScore() >= 70) {
            swotNarrative.append("To maintain competitive advantage, continuous learning and adaptation to evolving industry trends will be essential. ");
            swotNarrative.append("Opportunities exist to specialize further and take on leadership responsibilities as technical expertise deepens. ");
        } else if (report.getOverallScore() >= 50) {
            swotNarrative.append("Key development areas include strengthening analytical reasoning, enhancing technical depth, and building professional behavioral competencies. ");
            swotNarrative.append(String.format("With focused training programs and practical experience in %s, career advancement is achievable. ", userInfo.getSpecialization()));
        } else {
            swotNarrative.append("Substantial development is needed across analytical thinking, professional skills, and technical knowledge. ");
            swotNarrative.append(String.format("A comprehensive 3-6 month preparation program covering core competencies in %s is recommended before actively pursuing professional opportunities. ", userInfo.getSpecialization()));
        }
        
        // Threats paragraph
        swotNarrative.append("The competitive landscape in technology fields demands continuous upskilling and adaptation to rapid industry changes. ");
        if (report.getOverallScore() < 70) {
            swotNarrative.append("Without addressing identified skill gaps, there is risk of limited career opportunities and challenges in meeting employer expectations.");
        } else {
            swotNarrative.append("Staying current with emerging technologies and maintaining strong performance will be key to long-term career success.");
        }
        
        report.setSwotAnalysis(swotNarrative.toString());
        
        // Build DETAILED, PERFORMANCE-BASED fit analysis with role recommendations
        StringBuilder fitBuilder = new StringBuilder();
        
        // Paragraph 1: Overall Fit Assessment
        fitBuilder.append(String.format("CAREER FIT ASSESSMENT: %s has expressed interest in %s with a specialization in %s. ", 
            userInfo.getName(), userInfo.getCareerInterest(), userInfo.getSpecialization()));
        fitBuilder.append(String.format("Based on their psychometric test performance (Overall: %.1f%%, Aptitude: %.1f%%, Behavioral: %.1f%%, Domain: %.1f%%), ", 
            report.getOverallScore(), report.getAptitudeScore(), report.getBehavioralScore(), report.getDomainScore()));
        
        if (report.getOverallScore() >= 70) {
            fitBuilder.append(String.format("they demonstrate EXCELLENT FIT for their chosen career path. Their strong performance across all sections indicates readiness for %s roles. ", userInfo.getCareerInterest()));
        } else if (report.getOverallScore() >= 50) {
            fitBuilder.append(String.format("they show GOOD FIT WITH DEVELOPMENT NEEDED. Their moderate performance suggests they have a foundation but require focused improvement in specific areas to be competitive in %s roles. ", userInfo.getCareerInterest()));
        } else {
            fitBuilder.append(String.format("they show SIGNIFICANT PREPARATION NEEDED. Their current performance indicates gaps in key areas required for %s. A structured 3-6 month improvement plan is recommended before actively pursuing such roles. ", userInfo.getCareerInterest()));
        }
        fitBuilder.append("\n\n");
        
        // Paragraph 2: Intelligent Field-Aware Role Recommendations
        fitBuilder.append("RECOMMENDED ROLES BASED ON PERFORMANCE: Analyzing their test results, the following roles align best with their demonstrated strengths:\n\n");
        
        List<String> recommendedRoles = new ArrayList<>();
        String careerInterest = userInfo.getCareerInterest().toLowerCase();
        
        // Determine career field and recommend accordingly
        if (careerInterest.contains("software") || careerInterest.contains("developer") || 
            careerInterest.contains("engineer") || careerInterest.contains("programming") ||
            careerInterest.contains("tech") || careerInterest.contains("it")) {
            
            // TECH/IT FIELD ROLES
            if (report.getAptitudeScore() >= 70 && report.getDomainScore() >= 65) {
                recommendedRoles.add(String.format("1. SOFTWARE DEVELOPER/ENGINEER: Strong aptitude (%.1f%%) and domain knowledge (%.1f%%) indicate capability for development roles with complex problem-solving.", 
                    report.getAptitudeScore(), report.getDomainScore()));
            }
            if (report.getBehavioralScore() >= 70 && report.getAptitudeScore() >= 60) {
                recommendedRoles.add(String.format("2. TECHNICAL TEAM LEAD: Exceptional behavioral competencies (%.1f%%) with analytical skills (%.1f%%) suit technical leadership roles.", 
                    report.getBehavioralScore(), report.getAptitudeScore()));
            }
            if (report.getDomainScore() >= 70) {
                recommendedRoles.add(String.format("3. SPECIALIZED ENGINEER: Strong domain expertise (%.1f%%) positions you for specialized technical roles in your area of focus.", 
                    report.getDomainScore()));
            }
            
        } else if (careerInterest.contains("business") || careerInterest.contains("management") || 
                   careerInterest.contains("admin") || careerInterest.contains("operations")) {
            
            // BUSINESS/MANAGEMENT ROLES
            if (report.getAptitudeScore() >= 65 && report.getBehavioralScore() >= 60) {
                recommendedRoles.add(String.format("1. BUSINESS ANALYST: Strong analytical thinking (%.1f%%) and communication skills (%.1f%%) make you ideal for business analysis roles.", 
                    report.getAptitudeScore(), report.getBehavioralScore()));
            }
            if (report.getBehavioralScore() >= 70) {
                recommendedRoles.add(String.format("2. PROJECT COORDINATOR/MANAGER: Exceptional interpersonal competencies (%.1f%%) suit project coordination and management roles.", 
                    report.getBehavioralScore()));
            }
            if (report.getAptitudeScore() >= 60 && report.getBehavioralScore() >= 60) {
                recommendedRoles.add(String.format("3. OPERATIONS ASSOCIATE: Balanced analytical (%.1f%%) and interpersonal (%.1f%%) skills suit operational and administrative roles.", 
                    report.getAptitudeScore(), report.getBehavioralScore()));
            }
            
        } else if (careerInterest.contains("hr") || careerInterest.contains("human resource") || 
                   careerInterest.contains("recruitment") || careerInterest.contains("talent")) {
            
            // HUMAN RESOURCES ROLES
            if (report.getBehavioralScore() >= 70) {
                recommendedRoles.add(String.format("1. HR COORDINATOR/GENERALIST: Exceptional interpersonal skills (%.1f%%) make you ideal for HR roles involving employee relations and recruitment.", 
                    report.getBehavioralScore()));
            }
            if (report.getBehavioralScore() >= 65 && report.getAptitudeScore() >= 60) {
                recommendedRoles.add(String.format("2. TALENT ACQUISITION ASSOCIATE: Strong people skills (%.1f%%) with analytical ability (%.1f%%) suit recruitment and hiring roles.", 
                    report.getBehavioralScore(), report.getAptitudeScore()));
            }
            if (report.getBehavioralScore() >= 60) {
                recommendedRoles.add(String.format("3. LEARNING & DEVELOPMENT COORDINATOR: Good interpersonal competencies (%.1f%%) suit training and employee development roles.", 
                    report.getBehavioralScore()));
            }
            
        } else if (careerInterest.contains("marketing") || careerInterest.contains("communication") || 
                   careerInterest.contains("brand") || careerInterest.contains("digital")) {
            
            // MARKETING/COMMUNICATIONS ROLES
            if (report.getBehavioralScore() >= 70 && report.getAptitudeScore() >= 60) {
                recommendedRoles.add(String.format("1. DIGITAL MARKETING ASSOCIATE: Strong communication skills (%.1f%%) with analytical thinking (%.1f%%) ideal for marketing campaigns and content creation.", 
                    report.getBehavioralScore(), report.getAptitudeScore()));
            }
            if (report.getBehavioralScore() >= 65) {
                recommendedRoles.add(String.format("2. SOCIAL MEDIA COORDINATOR: Exceptional interpersonal abilities (%.1f%%) suit brand management, content strategy, and community engagement.", 
                    report.getBehavioralScore()));
            }
            if (report.getAptitudeScore() >= 70 && report.getBehavioralScore() >= 60) {
                recommendedRoles.add(String.format("3. MARKETING ANALYST: Strong analytical skills (%.1f%%) with communication (%.1f%%) suit data-driven marketing and campaign analytics.", 
                    report.getAptitudeScore(), report.getBehavioralScore()));
            }
            
        } else if (careerInterest.contains("finance") || careerInterest.contains("accounting") || 
                   careerInterest.contains("audit") || careerInterest.contains("banking")) {
            
            // FINANCE/ACCOUNTING ROLES
            if (report.getAptitudeScore() >= 75) {
                recommendedRoles.add(String.format("1. FINANCIAL ANALYST: Exceptional numerical ability (%.1f%%) makes you ideal for financial modeling, analysis, and forecasting roles.", 
                    report.getAptitudeScore()));
            }
            if (report.getAptitudeScore() >= 70 && report.getDomainScore() >= 60) {
                recommendedRoles.add(String.format("2. ACCOUNTS ASSOCIATE/ACCOUNTANT: Strong quantitative skills (%.1f%%) and attention to detail (%.1f%%) suit accounting and bookkeeping roles.", 
                    report.getAptitudeScore(), report.getDomainScore()));
            }
            if (report.getAptitudeScore() >= 65) {
                recommendedRoles.add(String.format("3. AUDIT ASSOCIATE: Good analytical ability (%.1f%%) and conscientiousness suit auditing, compliance, and financial control roles.", 
                    report.getAptitudeScore()));
            }
            
        } else if (careerInterest.contains("sales") || careerInterest.contains("business development") || 
                   careerInterest.contains("account") || careerInterest.contains("client")) {
            
            // SALES/BUSINESS DEVELOPMENT ROLES
            if (report.getBehavioralScore() >= 75) {
                recommendedRoles.add(String.format("1. BUSINESS DEVELOPMENT ASSOCIATE: Exceptional interpersonal skills (%.1f%%) make you ideal for client acquisition, relationship building, and deal closure.", 
                    report.getBehavioralScore()));
            }
            if (report.getBehavioralScore() >= 70) {
                recommendedRoles.add(String.format("2. SALES REPRESENTATIVE: Strong communication abilities (%.1f%%) suit direct sales, client engagement, and revenue generation roles.", 
                    report.getBehavioralScore()));
            }
            if (report.getBehavioralScore() >= 65 && report.getAptitudeScore() >= 60) {
                recommendedRoles.add(String.format("3. ACCOUNT EXECUTIVE: Good interpersonal (%.1f%%) and analytical (%.1f%%) skills suit account management and client relationship roles.", 
                    report.getBehavioralScore(), report.getAptitudeScore()));
            }
            
        } else if (careerInterest.contains("data") || careerInterest.contains("analytics") || 
                   careerInterest.contains("research") || careerInterest.contains("analyst")) {
            
            // DATA/ANALYTICS/RESEARCH ROLES
            if (report.getAptitudeScore() >= 75) {
                recommendedRoles.add(String.format("1. DATA ANALYST: Exceptional analytical ability (%.1f%%) makes you ideal for data analysis, insights generation, and reporting roles.", 
                    report.getAptitudeScore()));
            }
            if (report.getAptitudeScore() >= 70 && report.getDomainScore() >= 65) {
                recommendedRoles.add(String.format("2. BUSINESS INTELLIGENCE ANALYST: Strong quantitative (%.1f%%) and technical skills (%.1f%%) suit BI, data visualization, and analytics roles.", 
                    report.getAptitudeScore(), report.getDomainScore()));
            }
            if (report.getAptitudeScore() >= 65) {
                recommendedRoles.add(String.format("3. RESEARCH ANALYST: Good analytical ability (%.1f%%) suits market research, data-driven insights, and trend analysis roles.", 
                    report.getAptitudeScore()));
            }
            
        } else {
            // GENERIC/OTHER FIELD ROLES
            if (report.getBehavioralScore() >= 70 && report.getAptitudeScore() >= 65) {
                recommendedRoles.add(String.format("1. MANAGEMENT TRAINEE in %s: Balanced interpersonal (%.1f%%) and analytical (%.1f%%) skills suit general management training programs.", 
                    userInfo.getCareerInterest(), report.getBehavioralScore(), report.getAptitudeScore()));
            }
            if (report.getBehavioralScore() >= 65) {
                recommendedRoles.add(String.format("2. COORDINATOR/ASSOCIATE in %s: Strong interpersonal skills (%.1f%%) suit coordination, support, and administrative roles in your field.", 
                    userInfo.getCareerInterest(), report.getBehavioralScore()));
            }
            if (report.getAptitudeScore() >= 65) {
                recommendedRoles.add(String.format("3. ANALYST/SPECIALIST in %s: Good analytical abilities (%.1f%%) suit research, analysis, and specialist positions in your domain.", 
                    userInfo.getCareerInterest(), report.getAptitudeScore()));
            }
        }
        
        // Fallback if no specific roles matched (low scores)
        if (recommendedRoles.isEmpty()) {
            recommendedRoles.add(String.format("1. TRAINEE/INTERN ROLES in %s: Current performance levels suggest building foundational skills through trainee or internship positions with structured learning and mentorship.", 
                userInfo.getCareerInterest()));
            recommendedRoles.add(String.format("2. ENTRY-LEVEL ASSOCIATE in %s: Focus on entry-level roles that provide hands-on experience, skill development, and career growth opportunities.", 
                userInfo.getCareerInterest()));
            recommendedRoles.add("3. SUPPORT ROLES: Consider support, assistant, or coordinator positions that offer learning while contributing to the organization.");
        }
        
        // Add roles to fit analysis
        for (String role : recommendedRoles) {
            fitBuilder.append(role).append("\n\n");
        }
        
        // Paragraph 3: Readiness Assessment
        fitBuilder.append("READINESS LEVEL: ");
        if (report.getOverallScore() >= 70) {
            fitBuilder.append("IMMEDIATE READINESS - Can confidently apply for the recommended roles now. Strong performance indicates competitive capability in the job market. Focus on building portfolio projects and preparing for technical interviews.\n\n");
        } else if (report.getOverallScore() >= 50) {
            fitBuilder.append("SHORT-TERM PREPARATION (2-3 months) - Should focus on strengthening weak zones before active job search. Recommended actions: ");
            List<String> improvements = new ArrayList<>();
            if (report.getAptitudeScore() < 60) improvements.add("improve problem-solving through daily practice");
            if (report.getBehavioralScore() < 60) improvements.add("develop soft skills through workshops");
            if (report.getDomainScore() < 60) improvements.add("enhance technical knowledge through courses and projects");
            fitBuilder.append(String.join(", ", improvements)).append(".\n\n");
        } else {
            fitBuilder.append("INTENSIVE PREPARATION NEEDED (3-6 months) - Requires structured learning program before job applications. Priorities: ");
            List<String> priorities = new ArrayList<>();
            if (report.getAptitudeScore() < 50) priorities.add("build cognitive and analytical skills foundation");
            if (report.getBehavioralScore() < 50) priorities.add("develop essential interpersonal competencies");
            if (report.getDomainScore() < 50) priorities.add("gain technical expertise through comprehensive courses");
            fitBuilder.append(String.join(", ", priorities)).append(". Consider bootcamps, certifications, or structured online programs.\n\n");
        }
        
        // Final sentence
        fitBuilder.append(String.format("With focused effort on improvement areas while leveraging existing strengths, %s can successfully transition into %s roles aligned with their career aspirations.", 
            userInfo.getName(), userInfo.getCareerInterest()));
        
        report.setFitAnalysis(fitBuilder.toString());
        
        // Generate comprehensive Behavioral Insights (250-300 words)
        StringBuilder behavioralInsightsBuilder = new StringBuilder();
        behavioralInsightsBuilder.append(String.format("%s demonstrates a well-rounded behavioral profile characterized by balanced personality traits and developing professional competencies. ", userInfo.getName()));
        behavioralInsightsBuilder.append("Their behavioral assessment responses reveal foundational interpersonal skills including effective communication abilities, adaptability to changing circumstances, and collaborative tendencies that facilitate positive team dynamics. ");
        behavioralInsightsBuilder.append("The candidate exhibits emotional awareness and demonstrates capacity for professional relationship building, which are essential attributes for success in modern workplace environments. ");
        
        if (report.getBehavioralScore() >= 70) {
            behavioralInsightsBuilder.append("Their strong behavioral performance indicates mature professional conduct, sound judgment in workplace scenarios, and well-developed soft skills that complement technical capabilities. ");
            behavioralInsightsBuilder.append("This behavioral foundation positions them favorably for roles requiring leadership potential, team collaboration, and client-facing responsibilities. ");
        } else if (report.getBehavioralScore() >= 50) {
            behavioralInsightsBuilder.append("While demonstrating competent baseline behavioral skills, there are opportunities for growth in areas such as conflict resolution, decision-making under pressure, and advanced interpersonal dynamics. ");
            behavioralInsightsBuilder.append("Focused development in these areas through workshops, mentorship, and practical experience would enhance their professional effectiveness. ");
        } else {
            behavioralInsightsBuilder.append("The assessment identifies areas requiring targeted development, particularly in workplace communication, professional judgment, and interpersonal effectiveness. ");
            behavioralInsightsBuilder.append("Structured behavioral training, role-playing exercises, and guided practice in professional scenarios would significantly strengthen these competencies. ");
        }
        
        behavioralInsightsBuilder.append(String.format("Their personality profile suggests potential for growth in %s, with behavioral traits that can be further refined through conscious effort and professional development activities. ", userInfo.getCareerInterest()));
        behavioralInsightsBuilder.append("The candidate shows willingness to engage with diverse perspectives, capacity for self-reflection, and openness to feedback, all of which are indicators of behavioral maturity and learning orientation. ");
        behavioralInsightsBuilder.append("With continued focus on emotional intelligence, active listening, professional communication, and adaptive thinking, they can develop the behavioral excellence required for leadership positions and high-performing team environments. ");
        behavioralInsightsBuilder.append("Their interpersonal approach suggests a balance between assertiveness and cooperation, indicating potential for both collaborative work and independent initiative. ");
        behavioralInsightsBuilder.append("Overall, the behavioral assessment reveals a candidate with solid foundational soft skills and clear potential for professional behavioral development through targeted learning experiences and workplace practice.");
        
        report.setBehavioralInsights(behavioralInsightsBuilder.toString());
        
        // Generate comprehensive Domain Insights (250-300 words)
        StringBuilder domainInsightsBuilder = new StringBuilder();
        domainInsightsBuilder.append(String.format("%s presents a domain knowledge profile that reflects their educational background in %s with specialization in %s. ", 
            userInfo.getName(), userInfo.getDegree(), userInfo.getSpecialization()));
        domainInsightsBuilder.append(String.format("Their academic foundation provides relevant theoretical understanding for pursuing %s career paths, establishing baseline technical concepts necessary for professional entry. ", userInfo.getCareerInterest()));
        
        if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().isEmpty()) {
            domainInsightsBuilder.append(String.format("The candidate has developed technical competencies including %s, which demonstrates commitment to building practical skills aligned with industry requirements. ", userInfo.getTechnicalSkills()));
            domainInsightsBuilder.append("These technical capabilities indicate hands-on learning experience and exposure to tools and technologies relevant to their domain of interest. ");
        } else {
            domainInsightsBuilder.append("While their educational credentials provide theoretical foundation, developing a robust technical skills portfolio through practical projects and hands-on experience would significantly enhance their domain readiness. ");
        }
        
        if (report.getDomainScore() >= 70) {
            domainInsightsBuilder.append("The domain assessment reveals strong technical knowledge with solid grasp of fundamental concepts and practical understanding of domain-specific principles. ");
            domainInsightsBuilder.append("This level of domain expertise suggests readiness for professional roles with clear technical competency that can be further specialized through focused practice. ");
        } else if (report.getDomainScore() >= 50) {
            domainInsightsBuilder.append("The domain assessment indicates foundational technical knowledge with room for growth in depth and breadth of expertise. ");
            domainInsightsBuilder.append("Targeted learning in specific technical areas, combined with practical application through projects, would strengthen overall domain competency. ");
        } else {
            domainInsightsBuilder.append("The domain assessment highlights significant opportunities for technical skill development, indicating gaps between current knowledge level and industry expectations. ");
            domainInsightsBuilder.append("A structured learning program focusing on core domain concepts, modern tools, and practical application would be essential for achieving professional readiness. ");
        }
        
        domainInsightsBuilder.append(String.format("Their specialization in %s aligns appropriately with %s career goals, creating a coherent professional trajectory that leverages educational investment. ", 
            userInfo.getSpecialization(), userInfo.getCareerInterest()));
        domainInsightsBuilder.append("The candidate demonstrates awareness of their chosen field and shows engagement with relevant technical domains, though the depth of expertise varies across different technical categories. ");
        domainInsightsBuilder.append(String.format("With continued learning, practical projects, and exposure to industry-standard practices, they can develop the technical maturity required for competitive %s positions. ", userInfo.getCareerInterest()));
        domainInsightsBuilder.append("Their domain knowledge profile suggests an emerging professional who understands foundational principles and would benefit from deepening expertise through real-world application, mentorship, and advanced learning. ");
        domainInsightsBuilder.append("Overall, the assessment reveals potential for strong technical competency with appropriate educational foundation, requiring focused skill development to translate academic knowledge into job-ready professional capabilities.");
        
        report.setDomainInsights(domainInsightsBuilder.toString());
        
        // Try to generate unique AI content for narrative, fallback to templates if AI fails
        try {
            if (openAiApiKey != null && !openAiApiKey.isEmpty()) {
                generateUniqueNarrativeContent(report, null, sectionScores,
                    aptitudeStats, behavioralStats, domainStats,
                    aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats);
            } else {
                report.setNarrativeSummary(buildSectionPerformanceNarrative(sectionScores, aptitudeStats, behavioralStats, domainStats,
                    aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats));
            }
        } catch (Exception e) {
            System.err.println("Error generating unique narrative in fallback: " + e.getMessage());
            report.setNarrativeSummary(buildSectionPerformanceNarrative(sectionScores, aptitudeStats, behavioralStats, domainStats,
                aptitudeCategoryStats, behavioralCategoryStats, domainCategoryStats));
        }
    }

    // Backward-compatible overload when stats are not available
    private void generateDefaultReportContent(PsychometricReport report, UserInfo userInfo) {
        Map<String, Double> scores = new HashMap<>();
        scores.put("aptitude", report.getAptitudeScore() != null ? report.getAptitudeScore() : 0.0);
        scores.put("behavioral", report.getBehavioralScore() != null ? report.getBehavioralScore() : 0.0);
        scores.put("domain", report.getDomainScore() != null ? report.getDomainScore() : 0.0);
        generateDefaultReportContent(report, userInfo, scores, new SectionStats(), new SectionStats(), new SectionStats(),
            new HashMap<>(), new HashMap<>(), new HashMap<>());
    }

    /**
     * Generate unique narrative content for each category using OpenAI
     */
    private void generateUniqueNarrativeContent(PsychometricReport report, PsychometricSession session,
                                               Map<String, Double> sectionScores,
                                               SectionStats aptitudeStats, SectionStats behavioralStats, SectionStats domainStats,
                                               Map<String, CategoryStats> aptitudeCategoryStats,
                                               Map<String, CategoryStats> behavioralCategoryStats,
                                               Map<String, CategoryStats> domainCategoryStats) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            throw new IllegalStateException("OpenAI API key not configured");
        }
        
        StringBuilder narrativeBuilder = new StringBuilder();
        
        // Generate unique content for Aptitude categories
        if (!aptitudeCategoryStats.isEmpty()) {
            narrativeBuilder.append("APTITUDE SECTION:\n\n");
            int aptitudeIndex = 0;
            for (Map.Entry<String, CategoryStats> entry : aptitudeCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                
                // Add small delay between API calls to ensure variety
                if (aptitudeIndex > 0) {
                    try {
                        Thread.sleep(200 + random.nextInt(300)); // 200-500ms delay
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
                
                String categoryNarrative = generateUniqueCategoryNarrative("aptitude", categoryName, stats, percentage, 
                    sectionScores.getOrDefault("aptitude", 0.0), aptitudeIndex);
                narrativeBuilder.append(categoryName).append(": ").append(categoryNarrative).append("\n\n");
                aptitudeIndex++;
            }
        }
        
        // Generate unique content for Behavioral categories
        if (!behavioralCategoryStats.isEmpty()) {
            narrativeBuilder.append("BEHAVIORAL SECTION:\n\n");
            int behavioralIndex = 0;
            for (Map.Entry<String, CategoryStats> entry : behavioralCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                
                // Add small delay between API calls to ensure variety
                if (behavioralIndex > 0) {
                    try {
                        Thread.sleep(200 + random.nextInt(300)); // 200-500ms delay
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
                
                String categoryNarrative = generateUniqueCategoryNarrative("behavioral", categoryName, stats, percentage,
                    sectionScores.getOrDefault("behavioral", 0.0), behavioralIndex);
                narrativeBuilder.append(categoryName).append(": ").append(categoryNarrative).append("\n\n");
                behavioralIndex++;
            }
        }
        
        // Generate unique content for Domain categories
        if (!domainCategoryStats.isEmpty()) {
            narrativeBuilder.append("DOMAIN SECTION:\n\n");
            int domainIndex = 0;
            for (Map.Entry<String, CategoryStats> entry : domainCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                
                // Add small delay between API calls to ensure variety
                if (domainIndex > 0) {
                    try {
                        Thread.sleep(200 + random.nextInt(300)); // 200-500ms delay
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
                
                String categoryNarrative = generateUniqueCategoryNarrative("domain", categoryName, stats, percentage,
                    sectionScores.getOrDefault("domain", 0.0), domainIndex);
                narrativeBuilder.append(categoryName).append(": ").append(categoryNarrative).append("\n\n");
                domainIndex++;
            }
        }
        
        report.setNarrativeSummary(narrativeBuilder.toString().trim());
    }
    
    /**
     * Generate unique narrative for a single category using OpenAI
     */
    private String generateUniqueCategoryNarrative(String sectionType, String categoryName, CategoryStats stats, 
                                                  double percentage, double sectionScore, int categoryIndex) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("You are an expert psychometric assessment analyst. Generate a COMPLETELY UNIQUE and DETAILED paragraph (6-8 sentences) focused on STRONG ZONE or WEAK ZONE analysis with ACTIONABLE RECOMMENDATIONS.\n\n");
            prompt.append("CRITICAL FOCUS: Identify if this is a STRONG ZONE or WEAK ZONE and provide SPECIFIC, CONCRETE recommendations accordingly.\n\n");
            
            prompt.append("Section Type: ").append(sectionType.toUpperCase()).append("\n");
            prompt.append("Category: ").append(categoryName).append("\n");
            prompt.append("Performance Data:\n");
            prompt.append("- Correct/Responses: ").append(stats.correct).append(" out of ").append(stats.total).append(" total questions\n");
            prompt.append("- Attempted: ").append(stats.attempted).append(" questions\n");
            prompt.append("- Percentage: ").append(String.format("%.1f", percentage)).append("%\n");
            prompt.append("- Overall Section Score: ").append(String.format("%.1f", sectionScore)).append("%\n\n");
            
            prompt.append("ZONE CLASSIFICATION:\n");
            if (percentage >= 70) {
                prompt.append("- This is a STRONG ZONE (").append(String.format("%.1f", percentage)).append("% >= 70%)\n");
                prompt.append("- Focus on: How to LEVERAGE and MAXIMIZE this strength\n");
                prompt.append("- Provide 2-3 specific recommendations to excel even further\n\n");
            } else if (percentage >= 50) {
                prompt.append("- This is a MODERATE/DEVELOPING ZONE (").append(String.format("%.1f", percentage)).append("% between 50-70%)\n");
                prompt.append("- Focus on: Identifying specific gaps and targeted improvement\n");
                prompt.append("- Provide 2-3 specific recommendations to move from moderate to strong\n\n");
            } else {
                prompt.append("- This is a WEAK ZONE (").append(String.format("%.1f", percentage)).append("% < 50%) - NEEDS SIGNIFICANT IMPROVEMENT\n");
                prompt.append("- Focus on: Why this matters and HOW TO IMPROVE systematically\n");
                prompt.append("- Provide 3-4 SPECIFIC, ACTIONABLE, DETAILED improvement strategies\n\n");
            }
            
            if ("aptitude".equals(sectionType)) {
                // Category-specific prompts for aptitude
                String categoryLower = categoryName.toLowerCase();
                if (categoryLower.contains("numerical") || categoryLower.contains("quantitative")) {
                    prompt.append("For NUMERICAL ABILITY analysis, you MUST:\n");
                    prompt.append("- Start with stating the exact score: 'Scored ").append(stats.correct).append(" out of ").append(stats.total).append(" questions (").append(String.format("%.1f", percentage)).append("%)'\n");
                    if (percentage >= 70) {
                        prompt.append("- Identify this as a STRONG ZONE: Explain what this strong numerical performance reveals about quantitative reasoning, data analysis, and mathematical problem-solving capabilities\n");
                        prompt.append("- Explain how this numerical strength can be LEVERAGED in their career (data analyst, financial analyst, quant roles, etc.)\n");
                        prompt.append("- Provide 2-3 SPECIFIC recommendations to excel further: (e.g., 'Take advanced statistics course on Coursera', 'Practice competitive math problems on platforms like Brilliant.org', 'Apply for data-driven projects', 'Learn advanced Excel/Python for quantitative analysis', 'Pursue CFA or similar quantitative certification')\n");
                    } else if (percentage >= 50) {
                        prompt.append("- Identify this as DEVELOPING: Acknowledge basic numerical competency but identify specific gaps (speed, accuracy, complex calculations)\n");
                        prompt.append("- Provide 2-3 targeted recommendations: (e.g., 'Practice 20 numerical problems daily on aptitude platforms', 'Focus on weak sub-areas like percentages/ratios', 'Take online course on quantitative aptitude')\n");
                    } else {
                        prompt.append("- Identify this as a WEAK ZONE: Explain why numerical ability is critical for career success and current limitations\n");
                        prompt.append("- Provide 3-4 DETAILED, STEP-BY-STEP improvement strategies: (e.g., 'Start with basics: Complete Khan Academy's arithmetic and algebra courses', 'Practice 15 basic numerical problems daily using apps like IndiaBIX or Aptitude Test', 'Focus on one topic at a time: percentages week 1, ratios week 2, etc.', 'Join online study groups for accountability', 'Take timed practice tests weekly to track improvement')\n");
                    }
                    prompt.append("- Use mathematical and analytical terminology naturally\n");
                    prompt.append("- Be SPECIFIC with course names, platforms, practice methods, and resources\n");
                } else if (categoryLower.contains("verbal") || categoryLower.contains("language")) {
                    prompt.append("For VERBAL REASONING analysis, you MUST:\n");
                    prompt.append("- Start with stating the exact score: 'Achieved ").append(stats.correct).append(" out of ").append(stats.total).append(" correct answers (").append(String.format("%.1f", percentage)).append("%)'\n");
                    if (percentage >= 70) {
                        prompt.append("- Identify this as a STRONG ZONE: Explain what this verbal strength reveals about reading comprehension, vocabulary, communication skills, and analytical thinking\n");
                        prompt.append("- Explain how this verbal strength benefits their career: effective communication, documentation, presentations, client interaction\n");
                        prompt.append("- Provide 2-3 SPECIFIC recommendations to excel: (e.g., 'Write technical blogs or articles to showcase expertise', 'Present at conferences or team meetings', 'Read advanced literature like Harvard Business Review', 'Take advanced writing courses', 'Mentor others in communication skills')\n");
                    } else if (percentage >= 50) {
                        prompt.append("- Identify this as DEVELOPING: Acknowledge competency but identify gaps in vocabulary, comprehension speed, or argument analysis\n");
                        prompt.append("- Provide 2-3 recommendations: (e.g., 'Read diverse content daily (news, articles, books)', 'Practice verbal reasoning questions on GRE/GMAT platforms', 'Expand vocabulary using apps like Vocabulary.com')\n");
                    } else {
                        prompt.append("- Identify this as a WEAK ZONE: Explain how weak verbal skills limit career growth (poor communication, difficulty understanding requirements, documentation challenges)\n");
                        prompt.append("- Provide 3-4 DETAILED improvement steps: (e.g., 'Read 30 minutes daily starting with easier content, gradually increasing difficulty', 'Complete online reading comprehension course on platforms like Udemy', 'Practice 10 verbal reasoning questions daily on Testbook or IndiaBIX', 'Watch TED Talks and summarize them to improve comprehension', 'Use flashcards for vocabulary building - 10 new words daily')\n");
                    }
                    prompt.append("- Use communication and linguistic terminology\n");
                    prompt.append("- Provide CONCRETE resources, platforms, and specific practice methods\n");
                } else if (categoryLower.contains("situational") || categoryLower.contains("judgment")) {
                    prompt.append("For SITUATIONAL JUDGMENT analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their decision-making in scenarios (e.g., 'Situational assessment reveals...', 'The candidate's judgment in workplace scenarios demonstrates...', 'Scenario-based evaluation indicates...')\n");
                    prompt.append("- Explain what this performance means for practical decision-making (real-world problem-solving, ethical reasoning, workplace judgment, conflict handling)\n");
                    prompt.append("- Identify specific judgment strengths (e.g., ethical decision-making, practical problem-solving, understanding workplace dynamics, prioritizing effectively)\n");
                    prompt.append("- Provide detailed, situation-specific recommendations (e.g., study workplace scenarios, practice ethical decision-making, analyze case studies, improve prioritization skills)\n");
                    prompt.append("- Use terminology related to judgment, ethics, and practical reasoning\n");
                    prompt.append("- DO NOT use generic phrases - focus on practical judgment and decision-making\n");
                } else if (categoryLower.contains("abstract") || categoryLower.contains("non-verbal")) {
                    prompt.append("For ABSTRACT REASONING analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their pattern recognition abilities (e.g., 'Abstract thinking capabilities show...', 'Pattern recognition assessment reveals...', 'Non-verbal reasoning demonstrates...')\n");
                    prompt.append("- Explain what this performance means for abstract thinking (visual pattern recognition, logical sequences, spatial reasoning, conceptual thinking)\n");
                    prompt.append("- Identify specific abstract reasoning strengths (e.g., pattern identification, sequence recognition, spatial visualization, conceptual connections)\n");
                    prompt.append("- Provide detailed, abstract-specific recommendations (e.g., practice visual puzzles, work on sequence problems, strengthen spatial reasoning, improve pattern recognition)\n");
                    prompt.append("- Use terminology related to abstract thinking and pattern recognition\n");
                    prompt.append("- DO NOT use generic phrases - focus on abstract and non-verbal reasoning skills\n");
                } else if (categoryLower.contains("logical") || categoryLower.contains("reasoning")) {
                    prompt.append("For LOGICAL REASONING analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their logical thinking (e.g., 'Logical analysis capabilities indicate...', 'The candidate's reasoning skills demonstrate...', 'Deductive reasoning assessment shows...')\n");
                    prompt.append("- Explain what this performance means for logical thinking (deductive reasoning, inductive reasoning, argument evaluation, logical structure understanding)\n");
                    prompt.append("- Identify specific logical strengths (e.g., argument analysis, logical deduction, identifying fallacies, structured thinking, cause-effect reasoning)\n");
                    prompt.append("- Provide detailed, logic-specific recommendations (e.g., practice logical puzzles, study argument structures, work on deductive reasoning, improve fallacy detection)\n");
                    prompt.append("- Use terminology related to logic, reasoning, and argumentation\n");
                    prompt.append("- DO NOT use generic phrases - focus on logical reasoning and analytical thinking\n");
                } else {
                    // Generic aptitude category
                    prompt.append("For this APTITUDE category analysis, you MUST:\n");
                    prompt.append("- State exact performance: 'Scored ").append(stats.correct).append(" out of ").append(stats.total).append(" (").append(String.format("%.1f", percentage)).append("%)'\n");
                    if (percentage >= 70) {
                        prompt.append("- Identify as STRONG ZONE: Explain what this aptitude strength indicates and how it benefits their career\n");
                        prompt.append("- Provide 2-3 SPECIFIC actions to maximize: Include concrete courses, certifications, projects, or practice methods\n");
                    } else if (percentage >= 50) {
                        prompt.append("- Identify as DEVELOPING: Note competency but identify specific improvement areas\n");
                        prompt.append("- Provide 2-3 targeted recommendations with specific resources\n");
                    } else {
                        prompt.append("- Identify as WEAK ZONE: Explain importance and current limitations\n");
                        prompt.append("- Provide 3-4 DETAILED improvement steps with specific platforms, courses, practice schedules, and methods\n");
                    }
                    prompt.append("- Use category-appropriate terminology\n");
                    prompt.append("- Be SPECIFIC with resources, not generic advice\n");
                }
            } else if ("behavioral".equals(sectionType)) {
                // Category-specific prompts for behavioral
                String categoryLower = categoryName.toLowerCase();
                if (categoryLower.contains("leadership") || categoryLower.contains("lead")) {
                    prompt.append("For LEADERSHIP analysis, you MUST:\n");
                    prompt.append("- Start with exact performance: 'Responded to ").append(stats.attempted).append(" out of ").append(stats.total).append(" leadership questions (").append(String.format("%.1f", percentage)).append("%)'\n");
                    if (percentage >= 70) {
                        prompt.append("- Identify as STRONG LEADERSHIP ZONE: Explain what strong responses reveal about leadership potential, team management, decision-making, and influence capabilities\n");
                        prompt.append("- Explain career impact: Ready for team lead, project manager, or supervisory roles\n");
                        prompt.append("- Provide 2-3 SPECIFIC actions: (e.g., 'Volunteer to lead a team project or initiative', 'Take on mentorship roles for junior team members', 'Enroll in leadership certification like PMP or Scrum Master', 'Join Toastmasters to improve public speaking and leadership presence', 'Read leadership books like \"The Leadership Challenge\" by Kouzes and Posner')\n");
                    } else if (percentage >= 50) {
                        prompt.append("- Identify as DEVELOPING LEADERSHIP: Show emerging leadership qualities but need strengthening in specific areas (delegation, conflict management, or strategic thinking)\n");
                        prompt.append("- Provide 2-3 recommendations: (e.g., 'Shadow experienced leaders to learn best practices', 'Take online leadership course on LinkedIn Learning', 'Start with leading small tasks before bigger projects')\n");
                    } else {
                        prompt.append("- Identify as WEAK LEADERSHIP ZONE: Explain importance for career advancement and current gaps in leadership competencies\n");
                        prompt.append("- Provide 3-4 DETAILED steps: (e.g., 'Start with self-leadership: Take Coursera course \"Inspiring Leadership through Emotional Intelligence\"', 'Practice decision-making in low-stakes situations', 'Volunteer for team coordination roles to build experience', 'Read \"Leaders Eat Last\" by Simon Sinek', 'Seek feedback from peers on leadership behaviors monthly', 'Join professional groups or clubs that develop leadership skills')\n");
                    }
                    prompt.append("- Use leadership terminology: delegation, vision, strategic thinking, influence, motivation\n");
                    prompt.append("- Be SPECIFIC with courses, books, activities, and development paths\n");
                } else if (categoryLower.contains("conflict") || categoryLower.contains("resolution")) {
                    prompt.append("For CONFLICT RESOLUTION analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their conflict handling (e.g., 'Conflict management assessment indicates...', 'The candidate's approach to disputes reveals...', 'Conflict resolution capabilities demonstrate...')\n");
                    prompt.append("- Explain what their responses show about mediation skills, negotiation abilities, emotional regulation during conflicts, and problem-solving in tense situations\n");
                    prompt.append("- Identify specific conflict resolution strengths (e.g., active listening, finding common ground, de-escalation techniques, win-win solutions)\n");
                    prompt.append("- Provide detailed, conflict-specific recommendations (e.g., practice mediation techniques, study negotiation strategies, work on emotional intelligence, role-play conflict scenarios)\n");
                    prompt.append("- Use terminology related to conflict management and mediation\n");
                    prompt.append("- DO NOT use generic behavioral phrases - focus on conflict resolution specifically\n");
                } else if (categoryLower.contains("adaptability") || categoryLower.contains("flexibility")) {
                    prompt.append("For ADAPTABILITY analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their flexibility (e.g., 'Adaptability assessment shows...', 'The candidate's response to change indicates...', 'Flexibility evaluation reveals...')\n");
                    prompt.append("- Explain what their responses demonstrate about handling change, learning new systems, adjusting to new environments, and resilience\n");
                    prompt.append("- Identify specific adaptability strengths (e.g., quick learning, embracing change, adjusting strategies, maintaining performance under uncertainty)\n");
                    prompt.append("- Provide detailed, adaptability-specific recommendations (e.g., seek diverse experiences, practice learning new skills quickly, work in changing environments, develop resilience)\n");
                    prompt.append("- Use terminology related to change management and flexibility\n");
                    prompt.append("- DO NOT use generic phrases - focus on adaptability and change management\n");
                } else if (categoryLower.contains("attention") || categoryLower.contains("detail")) {
                    prompt.append("For ATTENTION TO DETAIL analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their precision (e.g., 'Detail orientation assessment indicates...', 'The candidate's precision in responses reveals...', 'Attention to detail evaluation shows...')\n");
                    prompt.append("- Explain what their responses demonstrate about thoroughness, accuracy, quality focus, and meticulousness\n");
                    prompt.append("- Identify specific detail-oriented strengths (e.g., thorough review, accuracy checking, quality control, systematic approach, error detection)\n");
                    prompt.append("- Provide detailed, precision-specific recommendations (e.g., develop review checklists, practice proofreading, implement quality control processes, strengthen systematic approaches)\n");
                    prompt.append("- Use terminology related to precision and quality\n");
                    prompt.append("- DO NOT use generic phrases - focus on attention to detail and precision\n");
                } else if (categoryLower.contains("extraversion") || categoryLower.contains("introversion")) {
                    prompt.append("For EXTRAVERSION analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their social orientation (e.g., 'Social orientation assessment reveals...', 'The candidate's interpersonal energy indicates...', 'Extraversion evaluation shows...')\n");
                    prompt.append("- Explain what their responses demonstrate about social engagement, energy from interactions, communication style, and group dynamics\n");
                    prompt.append("- Identify specific extraversion-related strengths (e.g., networking ability, team collaboration, public engagement, relationship building, social confidence)\n");
                    prompt.append("- Provide detailed, social-specific recommendations (e.g., leverage networking opportunities, engage in team projects, practice public speaking, build professional relationships)\n");
                    prompt.append("- Use terminology related to personality and social dynamics\n");
                    prompt.append("- DO NOT use generic phrases - focus on social orientation and interpersonal energy\n");
                } else if (categoryLower.contains("agreeableness")) {
                    prompt.append("For AGREEABLENESS analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their cooperation (e.g., 'Cooperation assessment indicates...', 'The candidate's collaborative nature reveals...', 'Agreeableness evaluation shows...')\n");
                    prompt.append("- Explain what their responses demonstrate about cooperation, empathy, trust, and interpersonal harmony\n");
                    prompt.append("- Identify specific agreeableness strengths (e.g., empathy, cooperation, trust-building, conflict avoidance, team harmony)\n");
                    prompt.append("- Provide detailed, cooperation-specific recommendations (e.g., practice active listening, develop empathy skills, build trust, enhance collaborative approaches)\n");
                    prompt.append("- Use terminology related to cooperation and interpersonal harmony\n");
                    prompt.append("- DO NOT use generic phrases - focus on agreeableness and cooperation\n");
                } else if (categoryLower.contains("neuroticism") || categoryLower.contains("emotional")) {
                    prompt.append("For NEUROTICISM/EMOTIONAL STABILITY analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their emotional regulation (e.g., 'Emotional stability assessment reveals...', 'The candidate's stress response indicates...', 'Emotional regulation evaluation shows...')\n");
                    prompt.append("- Explain what their responses demonstrate about stress management, emotional control, resilience, and stability under pressure\n");
                    prompt.append("- Identify specific emotional stability strengths (e.g., stress resilience, emotional control, calm under pressure, recovery from setbacks)\n");
                    prompt.append("- Provide detailed, emotional-specific recommendations (e.g., practice stress management, develop emotional intelligence, build resilience, learn coping strategies)\n");
                    prompt.append("- Use terminology related to emotional regulation and stability\n");
                    prompt.append("- DO NOT use generic phrases - focus on emotional stability and stress management\n");
                } else if (categoryLower.contains("openness")) {
                    prompt.append("For OPENNESS analysis, you MUST:\n");
                    prompt.append("- Start with a unique opening about their openness (e.g., 'Openness to experience assessment indicates...', 'The candidate's curiosity reveals...', 'Intellectual openness evaluation shows...')\n");
                    prompt.append("- Explain what their responses demonstrate about creativity, curiosity, intellectual engagement, and willingness to try new things\n");
                    prompt.append("- Identify specific openness strengths (e.g., creativity, intellectual curiosity, openness to new ideas, innovative thinking, cultural appreciation)\n");
                    prompt.append("- Provide detailed, creativity-specific recommendations (e.g., explore new domains, engage in creative projects, study diverse topics, embrace innovation)\n");
                    prompt.append("- Use terminology related to creativity and intellectual openness\n");
                    prompt.append("- DO NOT use generic phrases - focus on openness and creativity\n");
                } else {
                    // Generic behavioral category
                    prompt.append("For this BEHAVIORAL dimension analysis, you MUST:\n");
                    prompt.append("- State exact performance: 'Engaged with ").append(stats.attempted).append(" out of ").append(stats.total).append(" questions (").append(String.format("%.1f", percentage)).append("%)'\n");
                    if (percentage >= 70) {
                        prompt.append("- Identify as STRONG BEHAVIORAL ZONE: Explain what strong responses indicate about this behavioral competency\n");
                        prompt.append("- Explain career benefit of this behavioral strength\n");
                        prompt.append("- Provide 2-3 SPECIFIC actions to leverage: Include workshops, activities, roles, or practice methods specific to this behavioral dimension\n");
                    } else if (percentage >= 50) {
                        prompt.append("- Identify as DEVELOPING: Note emerging competency but identify behavioral gaps\n");
                        prompt.append("- Provide 2-3 targeted behavioral development recommendations\n");
                    } else {
                        prompt.append("- Identify as WEAK BEHAVIORAL ZONE: Explain why this behavioral trait matters for success\n");
                        prompt.append("- Provide 3-4 DETAILED behavioral development steps: Include specific workshops, books, exercises, practice scenarios, feedback mechanisms\n");
                    }
                    prompt.append("- Use behavioral psychology terminology\n");
                    prompt.append("- Be SPECIFIC with behavioral development resources and activities\n");
                }
            } else { // domain
                prompt.append("For this DOMAIN category analysis, you MUST:\n");
                prompt.append("- State exact performance: 'Achieved ").append(stats.correct).append(" out of ").append(stats.total).append(" correct (").append(String.format("%.1f", percentage)).append("%)'\n");
                if (percentage >= 70) {
                    prompt.append("- Identify as STRONG TECHNICAL ZONE: Explain what this demonstrates about technical mastery in this domain\n");
                    prompt.append("- Explain how this technical strength supports career goals\n");
                    prompt.append("- Provide 2-3 SPECIFIC actions to deepen expertise: Include advanced courses, certifications, projects, technologies to learn, communities to join\n");
                } else if (percentage >= 50) {
                    prompt.append("- Identify as COMPETENT: Note foundational knowledge but identify specific technical gaps\n");
                    prompt.append("- Provide 2-3 targeted technical learning recommendations with specific technologies, courses, or projects\n");
                } else {
                    prompt.append("- Identify as WEAK TECHNICAL ZONE: Explain why this domain knowledge is critical for their career path\n");
                    prompt.append("- Provide 3-4 DETAILED technical learning steps: Include specific online courses (Udemy, Coursera, Pluralsight), tutorials, documentation to study, projects to build, technologies to practice\n");
                }
                prompt.append("- Use technical terminology specific to this domain\n");
                prompt.append("- Be SPECIFIC with technologies, platforms, courses, and learning resources\n");
            }
            
            // Add randomization to prompt to ensure variety
            String[] styleVariations = {
                "Write in a analytical, data-driven style",
                "Write in a insightful, reflective style",
                "Write in a practical, actionable style",
                "Write in a comprehensive, detailed style",
                "Write in a professional, evaluative style"
            };
            String[] perspectiveVariations = {
                "Focus on what this performance reveals about the candidate's capabilities",
                "Emphasize the practical implications of this performance",
                "Highlight the developmental aspects and growth potential",
                "Analyze the strengths and areas for improvement in detail",
                "Provide a nuanced assessment of the performance level"
            };
            
            prompt.append("\nCRITICAL REQUIREMENTS:\n");
            prompt.append("- ").append(styleVariations[categoryIndex % styleVariations.length]).append("\n");
            prompt.append("- ").append(perspectiveVariations[categoryIndex % perspectiveVariations.length]).append("\n");
            prompt.append("- Write 6-8 detailed sentences focusing on PERFORMANCE ANALYSIS\n");
            prompt.append("- CLEARLY state if this is STRONG ZONE, DEVELOPING ZONE, or WEAK ZONE\n");
            prompt.append("- For STRONG ZONES: Focus on how to LEVERAGE and MAXIMIZE the strength with 2-3 SPECIFIC actions\n");
            prompt.append("- For WEAK ZONES: Focus on WHY it matters and HOW TO IMPROVE with 3-4 DETAILED, ACTIONABLE steps\n");
            prompt.append("- Include SPECIFIC resources: course names, platforms, books, tools, practice methods, timelines\n");
            prompt.append("- Avoid generic advice - be CONCRETE and ACTIONABLE\n");
            prompt.append("- Use varied sentence structures to make each paragraph unique\n");
            prompt.append("- Connect recommendations to career goals when relevant\n");
            prompt.append("- Make recommendations MEASURABLE where possible (e.g., 'practice 15 problems daily', 'complete course in 4 weeks')\n");
            prompt.append("\nGenerate ONLY the paragraph text, no labels, headers, or category names. Make it professional, constructive, performance-focused, and action-oriented.");
            
            OpenAIRequest request = new OpenAIRequest(prompt.toString());
            // Vary temperature slightly between categories for more diversity (0.85-0.95)
            request.setTemperature(0.85 + (categoryIndex % 3) * 0.033); // 0.85, 0.883, 0.916, cycling
            
            WebClient webClient = webClientBuilder
                .baseUrl(OPENAI_API_URL)
                .defaultHeader("Authorization", "Bearer " + openAiApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
            
            OpenAIResponse response = webClient.post()
                .bodyValue(request)
                .retrieve()
                .bodyToMono(OpenAIResponse.class)
                .block();
            
            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                String content = response.getChoices().get(0).getMessage().getContent().trim();
                // Clean up any markdown or extra formatting
                content = content.replaceAll("^```[\\w]*\\n?", "").replaceAll("\\n?```$", "").trim();
                return content;
            }
        } catch (Exception e) {
            System.err.println("Error generating unique narrative for category " + categoryName + ": " + e.getMessage());
        }
        
        // Fallback to a simple unique statement if AI fails
        return String.format("Performance analysis for %s: %d correct out of %d questions (%.1f%%). " +
            "This indicates %s competency in this area, with specific opportunities for targeted improvement.",
            categoryName, stats.correct, stats.total, percentage,
            percentage >= 70 ? "strong" : percentage >= 50 ? "moderate" : "developing");
    }
    
    private String buildSectionPerformanceNarrative(Map<String, Double> sectionScores,
                                                    SectionStats aptitudeStats,
                                                    SectionStats behavioralStats,
                                                    SectionStats domainStats,
                                                    Map<String, CategoryStats> aptitudeCategoryStats,
                                                    Map<String, CategoryStats> behavioralCategoryStats,
                                                    Map<String, CategoryStats> domainCategoryStats) {
        StringBuilder sb = new StringBuilder();
        
        // Aptitude Section with category breakdowns
        sb.append("APTITUDE SECTION:\n\n");
        if (!aptitudeCategoryStats.isEmpty()) {
            for (Map.Entry<String, CategoryStats> entry : aptitudeCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                
                sb.append(categoryName).append(": ");
                sb.append(getAptitudeDescription(category, categoryName, percentage));
                sb.append("\n\n");
            }
        } else {
            sb.append(String.format("Overall Aptitude Performance: Answered %d of %d questions, with %d correct. Score: %.1f%%. ",
                aptitudeStats.attempted, aptitudeStats.total, aptitudeStats.correct,
                sectionScores.getOrDefault("aptitude", 0.0)));
            sb.append("Highlights accuracy on quantitative/analytical reasoning; review missed items to solidify fundamentals.\n\n");
        }
        
        // Behavioral Section with category breakdowns
        sb.append("BEHAVIORAL SECTION:\n\n");
        if (!behavioralCategoryStats.isEmpty()) {
            for (Map.Entry<String, CategoryStats> entry : behavioralCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                
                sb.append(categoryName).append(": ");
                sb.append(getBehavioralDescription(category, categoryName, percentage));
                sb.append("\n\n");
            }
        } else {
            sb.append(String.format("Overall Behavioral Performance: Responded to %d of %d prompts. Score proxy: %.1f%% based on participation and consistency. ",
                behavioralStats.attempted, behavioralStats.total, sectionScores.getOrDefault("behavioral", 0.0)));
            sb.append("Responses indicate patterns across leadership, teamwork, adaptability, and Big Five traits; focus on balanced, consistent answers.\n\n");
        }
        
        // Domain Section with category breakdowns
        sb.append("DOMAIN SECTION:\n\n");
        if (!domainCategoryStats.isEmpty()) {
            for (Map.Entry<String, CategoryStats> entry : domainCategoryStats.entrySet()) {
                String category = entry.getKey();
                CategoryStats stats = entry.getValue();
                String categoryName = formatCategoryName(category);
                double percentage = stats.total > 0 ? (stats.correct * 100.0 / stats.total) : 0.0;
                
                sb.append(categoryName).append(": ");
                sb.append(getDomainDescription(category, categoryName, percentage));
                sb.append("\n\n");
            }
        } else {
            sb.append(String.format("Overall Domain Performance: Answered %d of %d questions, with %d correct. Score: %.1f%%. ",
                domainStats.attempted, domainStats.total, domainStats.correct,
                sectionScores.getOrDefault("domain", 0.0)));
            sb.append("Performance reflects applied knowledge in specialization; strengthen weak subtopics and practice scenario-based items.\n\n");
        }
        
        return sb.toString();
    }
    
    private String getAptitudeDescription(String category, String categoryName, double percentage) {
        // Normalize category name for comparison
        String normalizedCategory = category.toLowerCase().replace("_", " ");
        
        if (normalizedCategory.contains("numerical") || normalizedCategory.contains("quantitative")) {
            return getNumericalDescription(percentage);
        } else if (normalizedCategory.contains("verbal")) {
            return getVerbalDescription(percentage);
        } else if (normalizedCategory.contains("abstract")) {
            return getAbstractDescription(percentage);
        } else if (normalizedCategory.contains("logical")) {
            return getLogicalDescription(percentage);
        } else if (normalizedCategory.contains("situational")) {
            return getSituationalDescription(percentage);
        } else {
            // Default generic description for other categories
            return getGenericAptitudeDescription(categoryName, percentage);
        }
    }
    
    private String getNumericalDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional numerical ability, indicating strong analytical thinking, quantitative reasoning, and problem-solving skills. This strength reflects a high capacity to interpret numerical data, identify patterns, and make accurate, logic-driven decisions under time constraints. Such proficiency is critical in subjects like Mathematics, Statistics, Economics, Physics, and Data Analysis. The candidate's strong numerical zone enables effective performance in roles involving calculations, forecasting, optimization, and data-backed decision-making. Career paths such as Data Analyst, Software Engineer, Financial Analyst, Business Analyst, Economist, Actuary, and Operations or Strategy roles are particularly well-aligned with this strength.";
        } else if (percentage >= 60) {
            return "The candidate shows solid numerical ability with competent analytical thinking and quantitative reasoning skills. There is a good foundation for interpreting numerical data and solving mathematical problems, though accuracy and speed can be further enhanced. This level of numerical proficiency supports roles in fields like Business Analytics, Finance, Engineering, and Technology. To elevate performance to an exceptional level, the candidate should focus on practicing advanced problem sets, working with real-world data scenarios, and strengthening mental calculation techniques. Regular practice with timed numerical exercises and exploring statistical analysis tools will help build confidence and expertise in this critical skill area.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic numerical ability with foundational quantitative reasoning skills that require strengthening. While the candidate can handle simple calculations and basic data interpretation, performance in numerical reasoning indicates areas that need focused attention. Building stronger numerical skills is essential for career advancement in most professional fields. The candidate should dedicate time to reviewing fundamental mathematical concepts, practicing step-by-step problem-solving approaches, and working through progressively challenging numerical exercises. Consider utilizing online resources, mathematical apps, or tutoring support to build confidence. Strengthening this area will significantly broaden career opportunities in analytical and technical domains.";
        } else {
            return "Performance in numerical ability indicates significant areas requiring development. The candidate faces challenges with quantitative reasoning, mathematical problem-solving, and numerical data interpretation. This is a critical skill area that needs immediate attention and structured improvement. The candidate should focus on building foundational knowledge by starting with basic mathematical concepts and gradually progressing to more complex problems. Recommended actions include: enrolling in foundational mathematics courses, practicing daily with simple numerical exercises, using educational apps designed for numerical skill development, and seeking guidance from mentors or tutors. Consistent, focused effort in this area is essential, as numerical ability underlies success in many academic subjects and professional careers. With dedicated practice and proper guidance, substantial improvement is achievable.";
        }
    }
    
    private String getVerbalDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate exhibits outstanding verbal reasoning ability, demonstrating exceptional language comprehension, vocabulary strength, and critical reading skills. This proficiency indicates a strong capacity to understand complex written information, extract key insights, analyze arguments, and communicate ideas effectively. Such verbal excellence is invaluable in fields like Law, Journalism, Content Writing, Marketing, Public Relations, Teaching, Human Resources, and Management. The candidate's linguistic strength enables them to articulate thoughts clearly, comprehend nuanced information, and engage effectively in both written and verbal communication. This skill set is highly sought after in roles requiring persuasive communication, content creation, strategic messaging, and stakeholder engagement.";
        } else if (percentage >= 60) {
            return "The candidate shows good verbal reasoning ability with solid language comprehension and communication skills. There is a competent foundation for understanding written material and expressing ideas, though further refinement can enhance effectiveness. This level of verbal proficiency supports roles in Business Communication, Customer Relations, Content Development, and various Management positions. To reach an exceptional level, the candidate should focus on expanding vocabulary through diverse reading materials, practicing critical analysis of complex texts, and engaging in writing exercises. Regular reading of quality publications, participating in discussions or debates, and consciously working on articulation will help strengthen verbal reasoning and communication capabilities.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic verbal reasoning skills with foundational language comprehension that requires enhancement. While the candidate can understand simple texts and communicate basic ideas, performance in verbal reasoning indicates areas needing focused development. Stronger verbal skills are essential for professional success across virtually all career paths. The candidate should dedicate effort to improving reading comprehension by engaging with varied written materials, building vocabulary through systematic learning, and practicing written expression. Consider reading newspapers, novels, and articles regularly, maintaining a vocabulary journal, and engaging in writing exercises. Strengthening verbal reasoning will enhance communication effectiveness and open doors to broader career opportunities.";
        } else {
            return "Performance in verbal reasoning indicates significant areas requiring immediate attention. The candidate faces challenges with language comprehension, vocabulary, and text interpretation. This is a foundational skill that impacts success across all professional and academic domains. The candidate should prioritize building verbal skills through structured learning approaches. Recommended actions include: starting with basic reading materials and gradually progressing to more complex texts, systematically learning new vocabulary daily, practicing reading comprehension exercises, and engaging with language learning resources. Consider joining reading groups, using vocabulary-building apps, and seeking guidance from language tutors or mentors. Consistent, focused effort in developing verbal reasoning is crucial, as this skill underpins effective communication, critical thinking, and professional success.";
        }
    }
    
    private String getAbstractDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional abstract reasoning ability, indicating outstanding pattern recognition, logical thinking, and problem-solving capabilities. This strength reflects a high capacity to identify relationships between concepts, think creatively, and solve novel problems without relying on prior knowledge. Abstract reasoning is a strong predictor of learning potential and adaptability across diverse domains. Such proficiency is particularly valuable in fields like Software Development, Engineering, Research, Design, Architecture, and Strategic Planning. The candidate's strong abstract thinking enables them to grasp complex systems quickly, innovate solutions, and excel in roles requiring analytical creativity and conceptual thinking. This cognitive strength is highly prized in technical, analytical, and innovation-driven careers.";
        } else if (percentage >= 60) {
            return "The candidate shows good abstract reasoning ability with solid pattern recognition and logical thinking skills. There is a competent foundation for identifying relationships and solving conceptual problems, though further development can enhance problem-solving agility. This level of abstract reasoning supports roles in Technology, Engineering, Analytics, and Creative Design fields. To elevate performance, the candidate should practice with diverse abstract reasoning puzzles, engage with pattern-based games and exercises, and work on visualizing complex relationships. Regular practice with logic puzzles, spatial reasoning exercises, and conceptual problem-solving will help strengthen abstract thinking capabilities and enhance overall cognitive flexibility.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic abstract reasoning skills with foundational pattern recognition abilities that require strengthening. While the candidate can identify simple patterns and relationships, performance indicates areas needing focused development. Abstract reasoning is crucial for learning new concepts, adapting to unfamiliar situations, and problem-solving across various contexts. The candidate should dedicate time to practicing pattern recognition exercises, working with visual puzzles, and engaging with logical reasoning problems. Consider using brain-training apps, solving abstract reasoning practice tests, and gradually increasing problem complexity. Developing stronger abstract reasoning will enhance learning capacity, problem-solving efficiency, and career versatility.";
        } else {
            return "Performance in abstract reasoning indicates significant areas requiring development. The candidate faces challenges with pattern recognition, logical relationship identification, and conceptual problem-solving. This is a critical cognitive skill that affects learning ability and adaptability. The candidate should prioritize building abstract reasoning through structured practice. Recommended actions include: starting with simple pattern recognition exercises, working with visual puzzles and logic games, practicing regularly with abstract reasoning resources, and gradually increasing difficulty levels. Consider using educational apps focused on cognitive skill development, solving puzzle books, and seeking guidance on problem-solving strategies. Consistent practice in abstract reasoning is essential as this skill enhances overall intelligence, learning capacity, and professional adaptability. With dedicated effort and proper training, substantial improvement is achievable.";
        }
    }
    
    private String getLogicalDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate exhibits exceptional logical reasoning ability, demonstrating outstanding deductive and inductive reasoning, systematic thinking, and analytical problem-solving skills. This strength indicates a high capacity to analyze information logically, draw valid conclusions, evaluate arguments critically, and make sound decisions based on evidence and reasoning. Logical reasoning is fundamental to success in fields like Computer Science, Law, Engineering, Mathematics, Philosophy, Management Consulting, and Strategic Planning. The candidate's strong logical thinking enables effective performance in roles requiring critical analysis, structured problem-solving, algorithm development, legal reasoning, and strategic decision-making. This cognitive strength is essential for technical problem-solving, business analysis, and any role requiring rigorous analytical thinking.";
        } else if (percentage >= 60) {
            return "The candidate shows good logical reasoning ability with solid analytical thinking and problem-solving skills. There is a competent foundation for analyzing information systematically and drawing logical conclusions, though further refinement can enhance reasoning precision. This level of logical proficiency supports roles in Business Analysis, Technology, Project Management, and various analytical positions. To reach an exceptional level, the candidate should focus on practicing formal logic problems, working with deductive and inductive reasoning exercises, and engaging with case study analysis. Regular practice with logical puzzles, critical thinking exercises, and structured problem-solving scenarios will help strengthen logical reasoning capabilities and enhance decision-making effectiveness.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic logical reasoning skills with foundational analytical thinking that requires enhancement. While the candidate can follow simple logical arguments and solve basic problems, performance indicates areas needing focused development. Stronger logical reasoning is crucial for professional effectiveness across technical and business domains. The candidate should dedicate effort to improving analytical thinking by practicing logical reasoning exercises, working through structured problem-solving scenarios, and studying argument analysis. Consider solving logic puzzles regularly, analyzing case studies, and learning formal reasoning techniques. Strengthening logical reasoning will enhance critical thinking, problem-solving efficiency, and decision-making quality across professional contexts.";
        } else {
            return "Performance in logical reasoning indicates significant areas requiring immediate attention. The candidate faces challenges with analytical thinking, logical argument evaluation, and structured problem-solving. This is a foundational cognitive skill that impacts success in technical and professional domains. The candidate should prioritize building logical reasoning through structured learning approaches. Recommended actions include: starting with basic logic exercises and gradually progressing to complex reasoning problems, practicing syllogisms and argument analysis, working with step-by-step problem-solving methods, and using logical reasoning training resources. Consider enrolling in critical thinking courses, using logic training apps, and seeking guidance from mentors experienced in analytical thinking. Consistent, focused effort in developing logical reasoning is essential, as this skill underpins effective problem-solving, decision-making, and professional success in analytical roles.";
        }
    }
    
    private String getSituationalDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional situational judgment, indicating strong practical intelligence, decision-making ability, and workplace maturity. This strength reflects a high capacity to assess complex workplace scenarios, evaluate multiple perspectives, make sound judgment calls, and choose appropriate courses of action aligned with professional standards. Such proficiency is critical for roles requiring interpersonal sensitivity, conflict resolution, ethical decision-making, and leadership. The candidate's strong situational judgment enables effective performance in management positions, customer-facing roles, team leadership, human resources, and any position requiring nuanced understanding of workplace dynamics. This skill indicates readiness for professional environments and ability to navigate complex organizational situations effectively.";
        } else if (percentage >= 60) {
            return "The candidate shows good situational judgment with solid decision-making ability in workplace scenarios. There is a competent foundation for assessing situations and choosing appropriate responses, though further development can enhance judgment quality and consistency. This level of situational awareness supports roles in Team Management, Customer Service, Project Coordination, and various collaborative positions. To elevate performance, the candidate should focus on exposure to diverse workplace scenarios, learning from case studies of professional decision-making, and reflecting on the reasoning behind effective choices. Engaging with workplace ethics discussions, analyzing organizational behavior cases, and seeking mentorship from experienced professionals will help refine situational judgment and decision-making capabilities.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic situational judgment with foundational decision-making ability that requires strengthening. While the candidate can handle straightforward workplace scenarios, performance indicates areas needing focused development. Stronger situational judgment is essential for professional effectiveness and career advancement. The candidate should dedicate effort to understanding professional norms, workplace ethics, and effective decision-making frameworks. Consider studying workplace scenario case studies, learning about organizational behavior, engaging in role-playing exercises, and seeking feedback on judgment calls. Exposure to diverse professional situations, mentorship from experienced colleagues, and conscious reflection on decision outcomes will help build stronger situational awareness and judgment capabilities.";
        } else {
            return "Performance in situational judgment indicates significant areas requiring development. The candidate faces challenges with assessing workplace scenarios, understanding appropriate professional responses, and making sound judgment calls. This is a critical skill for professional success and workplace effectiveness. The candidate should prioritize building situational judgment through structured learning and practical experience. Recommended actions include: studying workplace ethics and professional conduct standards, analyzing case studies of workplace scenarios, engaging in simulation exercises, seeking mentorship from experienced professionals, and reflecting consciously on daily decision-making situations. Consider workplace training programs, organizational behavior courses, and regular discussions with mentors about professional decision-making. Developing stronger situational judgment is essential for career success, as this skill underpins effective workplace navigation, relationship management, and professional maturity. With focused attention and practical experience, substantial improvement is achievable.";
        }
    }
    
    private String getGenericAptitudeDescription(String categoryName, double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional performance in " + categoryName.toLowerCase() + ", indicating strong analytical abilities and mastery of key concepts in this domain. This proficiency reflects excellent understanding, application skills, and problem-solving capabilities. Such strength enables effective performance in roles requiring expertise in this area and provides a solid foundation for continued professional growth. The candidate should leverage this strength by pursuing advanced learning opportunities, mentoring others, and taking on challenging projects that utilize these capabilities.";
        } else if (percentage >= 60) {
            return "The candidate shows good competency in " + categoryName.toLowerCase() + " with solid foundational understanding. While performance demonstrates capability, there is opportunity for further refinement and mastery. To elevate performance, the candidate should focus on advanced practice, reviewing challenging concepts, and applying skills in diverse scenarios. Regular engagement with progressively complex problems and seeking feedback will help strengthen expertise in this area.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic proficiency in " + categoryName.toLowerCase() + " with foundational knowledge that requires strengthening. Performance indicates areas needing focused development to build stronger capabilities. The candidate should dedicate time to reviewing core concepts, practicing systematically, and working through varied problems. Utilizing learning resources, seeking guidance, and consistent practice will help build confidence and improve performance in this area.";
        } else {
            return "Performance in " + categoryName.toLowerCase() + " indicates areas requiring significant development. The candidate faces challenges that need immediate attention and structured improvement efforts. Building competency in this area requires focusing on fundamental concepts, engaging in regular practice, and seeking educational support. Recommended actions include utilizing learning resources, working with tutors or mentors, and practicing consistently. With dedicated effort and proper guidance, substantial improvement can be achieved in this critical area.";
        }
    }
    
    private String getBehavioralDescription(String category, String categoryName, double percentage) {
        // Normalize category name for comparison
        String normalizedCategory = category.toLowerCase().replace("_", " ");
        
        if (normalizedCategory.contains("big") && normalizedCategory.contains("five")) {
            return getBigFiveDescription(normalizedCategory, percentage);
        } else if (normalizedCategory.contains("leadership")) {
            return getLeadershipDescription(percentage);
        } else if (normalizedCategory.contains("conflict")) {
            return getConflictDescription(percentage);
        } else if (normalizedCategory.contains("adaptability") || normalizedCategory.contains("flexibility")) {
            return getAdaptabilityDescription(percentage);
        } else if (normalizedCategory.contains("communication")) {
            return getCommunicationDescription(percentage);
        } else if (normalizedCategory.contains("teamwork") || normalizedCategory.contains("collaboration")) {
            return getTeamworkDescription(percentage);
        } else if (normalizedCategory.contains("emotional") || normalizedCategory.contains("eq")) {
            return getEmotionalIntelligenceDescription(percentage);
        } else if (normalizedCategory.contains("decision")) {
            return getDecisionMakingDescription(percentage);
        } else {
            // Default generic description for other behavioral categories
            return getGenericBehavioralDescription(categoryName, percentage);
        }
    }
    
    private String getBigFiveDescription(String specificTrait, double percentage) {
        // Check which Big Five trait
        if (specificTrait.contains("extraversion") || specificTrait.contains("extroversion")) {
            if (percentage >= 60) {
                return "The candidate exhibits strong extraversion traits, demonstrating natural sociability, assertiveness, and energy in social situations. This behavioral strength indicates comfort with interpersonal interactions, enthusiasm for collaborative environments, and ability to energize and engage others. Extraverted individuals typically excel in roles requiring networking, team leadership, customer interaction, sales, public speaking, and relationship building. The candidate's outgoing nature enables effective performance in dynamic, people-oriented environments and positions requiring frequent social engagement. This trait is particularly valuable in roles such as Sales Professional, Marketing Specialist, Event Manager, Team Leader, Customer Success Manager, and Public Relations roles.";
            } else {
                return "The candidate demonstrates introverted behavioral tendencies, indicating preference for focused, independent work and smaller social interactions. This behavioral pattern suggests comfort with deep concentration, thoughtful reflection, and one-on-one or small group engagements rather than large social settings. Introverted individuals often excel in roles requiring detailed analysis, independent problem-solving, research, technical work, and focused expertise. The candidate's reflective nature can be leveraged in positions such as Software Developer, Data Analyst, Researcher, Content Writer, Technical Specialist, and roles requiring sustained concentration and independent work. To enhance professional versatility, the candidate may benefit from gradually building comfort with group presentations and networking, while continuing to leverage strengths in focused, detail-oriented work.";
            }
        } else if (specificTrait.contains("openness")) {
            if (percentage >= 60) {
                return "The candidate demonstrates high openness to experience, indicating intellectual curiosity, creativity, and willingness to embrace new ideas and approaches. This behavioral strength reflects appreciation for innovation, diverse perspectives, and continuous learning. Individuals high in openness typically excel in roles requiring creativity, strategic thinking, innovation, research, and adaptability to change. The candidate's open-minded approach enables effective performance in dynamic environments requiring fresh thinking and willingness to challenge conventional approaches. This trait is particularly valuable in roles such as Innovation Manager, Creative Professional, Researcher, Strategy Consultant, Product Designer, and positions requiring vision and adaptability.";
            } else {
                return "The candidate exhibits practical and conventional behavioral tendencies, indicating preference for established methods, proven approaches, and structured processes. This behavioral pattern suggests comfort with familiar routines, clear procedures, and traditional ways of working. While this provides stability and reliability, the candidate may benefit from consciously cultivating greater openness to new ideas, innovative approaches, and alternative perspectives. In today's rapidly changing professional environment, developing comfort with change and willingness to explore novel solutions can significantly enhance career adaptability. Consider engaging with diverse perspectives, exploring new learning opportunities, and gradually stepping outside comfort zones to build greater openness and flexibility.";
            }
        } else if (specificTrait.contains("conscientiousness")) {
            if (percentage >= 60) {
                return "The candidate exhibits high conscientiousness, demonstrating strong organizational skills, reliability, attention to detail, and goal-oriented behavior. This behavioral strength indicates excellent self-discipline, responsibility, and commitment to quality work. Conscientious individuals typically excel in roles requiring precision, project management, systematic execution, compliance, and accountability. The candidate's disciplined approach enables effective performance in positions requiring thoroughness, deadline management, and consistent delivery of high-quality results. This trait is particularly valuable in roles such as Project Manager, Quality Assurance Specialist, Compliance Officer, Operations Manager, Financial Analyst, and any position requiring meticulous attention to detail and reliable execution.";
            } else {
                return "The candidate demonstrates more spontaneous and flexible behavioral tendencies, indicating adaptability and comfort with improvisation. While this flexibility can be valuable in dynamic situations, professional success typically requires developing stronger organizational habits, systematic approaches, and consistent follow-through. The candidate would benefit from building greater conscientiousness through time management techniques, task prioritization systems, and structured work approaches. Consider implementing organizational tools, setting clear goals with timelines, and developing consistent routines. Strengthening conscientiousness will enhance professional reliability, work quality, and career advancement opportunities across virtually all professional domains.";
            }
        } else if (specificTrait.contains("agreeableness")) {
            if (percentage >= 60) {
                return "The candidate demonstrates high agreeableness, indicating cooperative nature, empathy, consideration for others, and strong interpersonal harmony. This behavioral strength reflects excellent team orientation, conflict avoidance, and ability to build positive relationships. Agreeable individuals typically excel in roles requiring collaboration, customer service, counseling, human resources, healthcare, and team environments. The candidate's cooperative approach enables effective performance in positions requiring relationship building, stakeholder management, and harmonious team dynamics. This trait is particularly valuable in roles such as Human Resources Professional, Customer Service Manager, Healthcare Provider, Counselor, Mediator, and any position requiring strong interpersonal skills and collaboration.";
            } else {
                return "The candidate exhibits more competitive and assertive behavioral tendencies, indicating directness, objective focus, and comfort with challenging others when necessary. While this can be valuable in competitive environments and negotiations, professional success often requires balancing assertiveness with collaboration. The candidate may benefit from consciously developing greater empathy, considering others' perspectives more actively, and building collaborative approaches alongside competitive drive. Strengthening interpersonal sensitivity, active listening, and collaborative problem-solving will enhance relationship quality and team effectiveness. Consider seeking feedback on interpersonal style and practicing collaborative approaches in team settings.";
            }
        } else if (specificTrait.contains("neuroticism") || specificTrait.contains("emotional stability")) {
            if (percentage >= 60) {
                return "The candidate demonstrates strong emotional stability, indicating resilience, composure under pressure, and effective stress management. This behavioral strength reflects ability to remain calm in challenging situations, bounce back from setbacks, and maintain consistent performance despite difficulties. Emotionally stable individuals typically excel in high-pressure roles, crisis management, leadership positions, and stressful environments. The candidate's emotional resilience enables effective performance in demanding positions requiring steady judgment, stress tolerance, and consistent decision-making. This trait is particularly valuable in roles such as Emergency Response, Crisis Manager, Executive Leadership, Trading, Emergency Healthcare, and any position requiring calm under pressure.";
            } else {
                return "The candidate shows sensitivity to stress and emotional fluctuations, which may impact performance in high-pressure situations. While emotional sensitivity can provide valuable empathy and awareness, professional effectiveness requires developing stronger stress management capabilities and emotional regulation. The candidate would significantly benefit from building resilience through stress management techniques, mindfulness practices, and developing coping strategies for workplace pressures. Consider practicing stress-reduction techniques, seeking support when needed, building emotional regulation skills through training or coaching, and gradually exposing oneself to manageable challenges to build confidence. Strengthening emotional stability will enhance professional effectiveness, decision-making quality, and overall career success.";
            }
        } else {
            // Generic Big Five description
            if (percentage >= 60) {
                return "The candidate demonstrates strong performance in this behavioral dimension, indicating positive personality traits that support professional effectiveness and interpersonal success. This behavioral strength enables effective engagement in workplace situations and contributes to overall professional competency. The candidate should continue leveraging these behavioral strengths while seeking opportunities for further development and self-awareness.";
            } else {
                return "The candidate shows developing behavioral patterns in this dimension, indicating areas for personality development and self-awareness. Building stronger competency in this area will enhance professional effectiveness and interpersonal success. The candidate would benefit from self-reflection, seeking feedback from others, and consciously working on behavioral development through training and practical experience.";
            }
        }
    }
    
    private String getLeadershipDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong leadership potential, exhibiting qualities such as initiative, decision-making confidence, ability to inspire others, and comfort with responsibility. This behavioral strength indicates natural leadership tendencies including vision-setting, team motivation, strategic thinking, and willingness to take charge. Strong leadership capability is essential for management roles, entrepreneurship, project leadership, and positions requiring influence and direction. The candidate's leadership qualities enable effective performance in roles such as Team Leader, Department Manager, Project Manager, Startup Founder, Director, and any position requiring guiding and motivating others toward goals. To further develop leadership excellence, consider seeking formal leadership training, mentoring others, taking on progressively challenging leadership responsibilities, and studying effective leadership models.";
        } else {
            return "The candidate shows developing leadership capability, indicating areas for growth in taking initiative, making confident decisions, and guiding others. While everyone can develop leadership skills, this area requires focused attention and practical experience. Building stronger leadership capability is valuable for career advancement across virtually all professional domains. The candidate should focus on gradually taking on leadership responsibilities in small group settings, studying leadership principles and models, seeking mentorship from effective leaders, practicing decision-making in low-risk situations, and building confidence through progressive leadership experiences. Consider leadership development programs, volunteering for team coordination roles, and consciously observing and learning from effective leaders. With dedicated effort and practical experience, leadership capabilities can be substantially developed and strengthened.";
        }
    }
    
    private String getConflictDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate exhibits strong conflict resolution skills, demonstrating ability to navigate disagreements constructively, mediate between different perspectives, and find mutually acceptable solutions. This behavioral strength indicates emotional intelligence, communication effectiveness, and maturity in handling interpersonal tensions. Strong conflict resolution capability is essential for leadership roles, team management, customer service, human resources, and any position requiring interpersonal problem-solving. The candidate's conflict management skills enable effective performance in challenging interpersonal situations and contribute to maintaining positive team dynamics and productive relationships. This skill is particularly valuable in roles requiring stakeholder management, team leadership, customer relations, and organizational development.";
        } else {
            return "The candidate shows developing conflict resolution capability, indicating areas for growth in handling disagreements and interpersonal tensions effectively. Many professionals find conflict management challenging, but this is a learnable skill that significantly impacts career success. Building stronger conflict resolution ability is crucial for professional effectiveness and advancement. The candidate should focus on learning conflict management frameworks, practicing active listening, understanding different conflict styles, and developing emotional regulation during tensions. Consider taking conflict resolution training, studying negotiation techniques, role-playing difficult conversations, and seeking feedback on interpersonal interactions. Observing skilled mediators, learning de-escalation techniques, and practicing empathetic communication will help build confidence and competency in managing conflicts constructively. This skill development will significantly enhance professional relationships and leadership effectiveness.";
        }
    }
    
    private String getAdaptabilityDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong adaptability and flexibility, exhibiting comfort with change, ability to adjust to new situations, and resilience in dynamic environments. This behavioral strength indicates openness to new approaches, quick learning ability, and effectiveness in ambiguous or changing circumstances. Strong adaptability is increasingly critical in today's rapidly evolving business environment and is essential for roles in fast-paced industries, startups, consulting, technology, and any position requiring agility. The candidate's adaptive nature enables effective performance in changing conditions, quick pivoting when needed, and success in dynamic, unpredictable environments. This trait is particularly valuable in roles such as Consultant, Startup Team Member, Change Management Specialist, Technology Professional, and any position in rapidly evolving industries.";
        } else {
            return "The candidate shows preference for stability and established routines, which may present challenges in rapidly changing environments. While consistency can be valuable, today's professional landscape increasingly requires adaptability and comfort with change. Building stronger adaptability is essential for career resilience and success in modern workplaces. The candidate should focus on gradually stepping outside comfort zones, exposing oneself to new situations in manageable doses, practicing flexible thinking, and reframing change as opportunity rather than threat. Consider taking on projects in unfamiliar areas, learning new skills regularly, practicing scenario planning, and studying change management principles. Building resilience through managed exposure to change, developing growth mindset, and practicing cognitive flexibility will significantly enhance adaptability. This skill development is crucial for long-term career success in evolving professional landscapes.";
        }
    }
    
    private String getCommunicationDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate exhibits strong communication skills, demonstrating ability to express ideas clearly, listen actively, adjust messaging for different audiences, and engage effectively in both verbal and written communication. This behavioral strength indicates excellent interpersonal effectiveness, presentation ability, and capacity to build understanding across diverse stakeholders. Strong communication capability is fundamental to success across virtually all professional roles and is particularly critical for leadership, client-facing positions, team collaboration, and any role requiring information exchange and relationship building. The candidate's communication effectiveness enables success in roles such as Manager, Consultant, Sales Professional, Marketing Specialist, Trainer, Public Relations, and any position requiring clear, persuasive, and engaging communication.";
        } else {
            return "The candidate shows developing communication capability, indicating areas for improvement in expressing ideas clearly, listening effectively, and engaging with others. Communication is perhaps the most fundamental professional skill, impacting success across all career paths. Building stronger communication ability is essential for professional effectiveness and advancement. The candidate should focus on practicing active listening, organizing thoughts before speaking, seeking feedback on communication style, and engaging in public speaking opportunities. Consider joining speaking groups like Toastmasters, practicing written communication regularly, studying effective communicators, recording and reviewing presentations, and seeking coaching on communication skills. Developing clarity in expression, empathetic listening, confident presentation, and audience awareness will significantly enhance professional effectiveness. This skill development is critical as communication underpins leadership, collaboration, stakeholder management, and virtually all professional interactions.";
        }
    }
    
    private String getTeamworkDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong teamwork and collaboration skills, exhibiting ability to work effectively with others, contribute to group efforts, support team members, and balance individual and collective goals. This behavioral strength indicates excellent interpersonal awareness, cooperative spirit, and effectiveness in collaborative environments. Strong teamwork capability is essential for success in modern workplaces where cross-functional collaboration, project teams, and collective problem-solving are standard. The candidate's collaborative nature enables effective performance in team-based roles, matrix organizations, and any position requiring coordination with others. This skill is fundamental across virtually all professional domains and particularly valuable in roles requiring project teamwork, cross-functional collaboration, and collective achievement.";
        } else {
            return "The candidate shows developing teamwork capability, indicating preference for independent work or areas for growth in collaborative effectiveness. While individual contribution is valuable, modern professional success typically requires strong teamwork and collaboration skills. Building stronger teamwork ability is essential for career advancement and organizational effectiveness. The candidate should focus on understanding team dynamics, practicing active participation in group settings, valuing diverse perspectives, and developing collaborative problem-solving approaches. Consider studying team effectiveness models, seeking feedback from team members, practicing giving and receiving constructive input, and consciously contributing to group success beyond individual tasks. Developing skills in active listening, conflict resolution within teams, supporting others' ideas, and balancing advocacy with inquiry will significantly enhance collaborative effectiveness. This skill development is crucial as most modern work requires effective teamwork and cross-functional collaboration.";
        }
    }
    
    private String getEmotionalIntelligenceDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate exhibits strong emotional intelligence, demonstrating self-awareness, empathy, effective emotion regulation, and ability to navigate social complexities. This behavioral strength indicates excellent interpersonal perception, understanding of emotional dynamics, and ability to manage relationships effectively. High emotional intelligence is critical for leadership success, team management, customer relations, and any role requiring interpersonal sensitivity and influence. The candidate's emotional intelligence enables effective performance in roles requiring stakeholder management, team leadership, coaching, counseling, human resources, and customer engagement. This capability significantly enhances leadership effectiveness, relationship quality, and professional influence across all domains.";
        } else {
            return "The candidate shows developing emotional intelligence, indicating areas for growth in self-awareness, empathy, and interpersonal sensitivity. Emotional intelligence is increasingly recognized as critical for professional success, often more predictive of leadership effectiveness than traditional intelligence measures. Building stronger emotional intelligence is essential for career advancement and interpersonal effectiveness. The candidate should focus on developing self-awareness through reflection and feedback, practicing empathy by considering others' perspectives actively, learning emotion regulation techniques, and studying interpersonal dynamics. Consider seeking 360-degree feedback, working with a coach on emotional intelligence development, practicing mindfulness, reading about emotional intelligence concepts, and consciously observing emotional dynamics in interactions. Developing skills in recognizing emotions in oneself and others, managing emotional responses, empathetic listening, and relationship building will significantly enhance professional effectiveness and leadership capability.";
        }
    }
    
    private String getDecisionMakingDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong decision-making capability, exhibiting ability to analyze situations, weigh alternatives, make timely decisions, and take responsibility for outcomes. This behavioral strength indicates good judgment, confidence in choices, and effective balance between analysis and action. Strong decision-making ability is essential for leadership roles, management positions, entrepreneurship, and any role requiring judgment and accountability. The candidate's decision-making effectiveness enables success in roles requiring strategic choices, problem resolution, resource allocation, and taking charge in ambiguous situations. This capability is particularly valuable in management, consulting, entrepreneurship, and leadership positions.";
        } else {
            return "The candidate shows developing decision-making capability, which may manifest as hesitation, over-analysis, or difficulty choosing between alternatives. Decision-making confidence and effectiveness are learnable skills that significantly impact career success and leadership potential. Building stronger decision-making ability is essential for professional advancement and personal effectiveness. The candidate should focus on learning decision-making frameworks, practicing making decisions in low-risk situations, analyzing past decisions to understand patterns, and developing comfort with imperfect information. Consider studying decision science, using structured decision tools, seeking mentorship on decision-making approaches, and consciously practicing making timely decisions with available information. Developing skills in risk assessment, scenario planning, decisive action, and learning from outcomes will significantly enhance decision-making confidence and effectiveness. This skill development is crucial for leadership roles and professional advancement.";
        }
    }
    
    private String getGenericBehavioralDescription(String categoryName, double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong behavioral competencies in " + categoryName.toLowerCase() + ", indicating mature, effective patterns in this dimension. This behavioral strength suggests awareness, appropriate responses, and effectiveness in situations requiring these capabilities. Such competency enables effective professional performance and positive workplace relationships. The candidate should continue leveraging these behavioral strengths while seeking opportunities for further development through challenging situations, feedback, and conscious reflection on behavioral effectiveness.";
        } else {
            return "The candidate shows developing behavioral patterns in " + categoryName.toLowerCase() + ", indicating areas for growth and enhanced self-awareness. Building stronger competency in this behavioral dimension will enhance professional effectiveness and interpersonal success. The candidate would benefit from focused development through self-reflection, seeking feedback from colleagues and mentors, studying effective behaviors in this area, and consciously practicing more effective approaches. Consider training programs, mentorship, reading relevant behavioral development resources, and gradually exposing oneself to situations requiring these behaviors to build confidence and competency through practical experience.";
        }
    }
    
    private String getDomainDescription(String category, String categoryName, double percentage) {
        // Normalize category name for comparison
        String normalizedCategory = category.toLowerCase().replace("_", " ");
        
        if (normalizedCategory.contains("software") && normalizedCategory.contains("engineering")) {
            return getSoftwareEngineeringDescription(percentage);
        } else if (normalizedCategory.contains("design") && normalizedCategory.contains("thinking")) {
            return getDesignThinkingDescription(percentage);
        } else if (normalizedCategory.contains("technical") && normalizedCategory.contains("problem")) {
            return getTechnicalProblemSolvingDescription(percentage);
        } else if (normalizedCategory.contains("frontend") || normalizedCategory.contains("front end")) {
            return getFrontendDevelopmentDescription(percentage);
        } else if (normalizedCategory.contains("backend") || normalizedCategory.contains("back end")) {
            return getBackendDevelopmentDescription(percentage);
        } else if (normalizedCategory.contains("database") || normalizedCategory.contains("data base")) {
            return getDatabaseDescription(percentage);
        } else if (normalizedCategory.contains("devops") || normalizedCategory.contains("deployment")) {
            return getDevOpsDescription(percentage);
        } else if (normalizedCategory.contains("api") || normalizedCategory.contains("integration")) {
            return getAPIDescription(percentage);
        } else if (normalizedCategory.contains("security") || normalizedCategory.contains("cybersecurity")) {
            return getSecurityDescription(percentage);
        } else if (normalizedCategory.contains("testing") || normalizedCategory.contains("quality assurance")) {
            return getTestingDescription(percentage);
        } else if (normalizedCategory.contains("data") && (normalizedCategory.contains("science") || normalizedCategory.contains("analytics"))) {
            return getDataScienceDescription(percentage);
        } else if (normalizedCategory.contains("machine learning") || normalizedCategory.contains("ml") || normalizedCategory.contains("ai")) {
            return getMachineLearningDescription(percentage);
        } else if (normalizedCategory.contains("leadership") && normalizedCategory.contains("application")) {
            return getLeadershipApplicationDescription(percentage);
        } else if (normalizedCategory.contains("professional") && normalizedCategory.contains("application")) {
            return getProfessionalApplicationDescription(percentage);
        } else if (normalizedCategory.contains("domain") && normalizedCategory.contains("expertise")) {
            return getDomainExpertiseDescription(percentage, categoryName);
        } else if (normalizedCategory.contains("mobile") || normalizedCategory.contains("android") || normalizedCategory.contains("ios")) {
            return getMobileDevelopmentDescription(percentage);
        } else if (normalizedCategory.contains("cloud") || normalizedCategory.contains("aws") || normalizedCategory.contains("azure")) {
            return getCloudComputingDescription(percentage);
        } else if (normalizedCategory.contains("agile") || normalizedCategory.contains("scrum")) {
            return getAgileDescription(percentage);
        } else if (normalizedCategory.contains("version control") || normalizedCategory.contains("git")) {
            return getVersionControlDescription(percentage);
        } else {
            // Default generic description for other domain categories
            return getGenericDomainDescription(categoryName, percentage);
        }
    }
    
    private String getSoftwareEngineeringDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional software engineering expertise, indicating strong proficiency in software development principles, programming paradigms, system design, and engineering best practices. This expertise reflects deep understanding of software architecture, code quality, design patterns, and scalable system development. Such proficiency is essential for building robust, maintainable, and efficient software solutions. The candidate's strong software engineering foundation enables effective performance in roles requiring complex application development, system architecture, technical leadership, and engineering excellence. Career opportunities particularly well-suited include Software Architect, Senior Software Engineer, Technical Lead, Engineering Manager, Full-Stack Developer, and roles requiring comprehensive software development expertise. This strength positions the candidate for technical leadership and advanced engineering challenges.";
        } else if (percentage >= 60) {
            return "The candidate shows solid software engineering knowledge with good understanding of development principles and programming concepts. There is a competent foundation for building software applications, though deeper mastery of advanced patterns, architecture, and system design will enhance capabilities. This level supports roles in Software Development, Application Engineering, and Technical positions. To reach exceptional proficiency, focus on studying software design patterns, practicing system architecture, contributing to complex codebases, learning multiple programming paradigms, and understanding scalability principles. Engage with open-source projects, build progressively complex applications, study software engineering literature, and seek code reviews from experienced engineers to strengthen expertise.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates foundational software engineering knowledge that requires substantial strengthening. While basic programming concepts may be understood, performance indicates significant gaps in software development practices, design principles, and engineering methodology. Building stronger software engineering capability is critical for success in technology careers. Focus on mastering programming fundamentals, understanding object-oriented principles, learning software design patterns, practicing algorithmic thinking, and building practical projects. Consider structured courses in software engineering, intensive coding practice, working through project-based learning, contributing to guided development projects, and seeking mentorship from experienced developers. Consistent, focused effort in software engineering fundamentals will open doors to technology career opportunities.";
        } else {
            return "Performance in software engineering indicates significant areas requiring immediate, focused development. The candidate faces substantial challenges with software development concepts, programming principles, and engineering practices. This is a critical area requiring structured learning and intensive practice. Recommended approach: start with programming fundamentals, begin with one programming language and master basics, work through beginner-friendly tutorials and courses, practice coding daily with simple exercises, join coding communities for support, and gradually progress to more complex topics. Consider enrolling in comprehensive software engineering bootcamps, using interactive learning platforms, working with mentors or tutors, and building confidence through small, achievable projects. Software engineering skills are highly valuable and achievable with dedicated, consistent effort and proper guidance.";
        }
    }
    
    private String getDesignThinkingDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate exhibits exceptional design thinking capability, demonstrating strong user-centric approach, creative problem-solving, empathy-driven design, and innovation mindset. This expertise reflects excellent understanding of user research, ideation, prototyping, testing, and iterative design processes. Such proficiency is crucial for creating user-friendly products, innovative solutions, and human-centered designs. The candidate's design thinking strength enables effective performance in roles requiring product innovation, user experience design, service design, and creative problem-solving. Career paths particularly aligned include Product Designer, UX/UI Designer, Innovation Consultant, Product Manager, Design Strategist, and roles requiring user-centered innovation. This capability is increasingly valuable across all industries focusing on customer experience and innovation.";
        } else if (percentage >= 60) {
            return "The candidate shows good design thinking capability with solid understanding of user-centered approaches and creative problem-solving. There is competent foundation for applying design thinking methodology, though deeper practice in user research, ideation techniques, and iterative design will enhance effectiveness. This level supports roles in Product Development, User Experience, and Innovation positions. To elevate expertise, focus on conducting user research studies, practicing rapid prototyping, engaging in design workshops, studying successful design thinking case studies, and applying methodology to real problems. Participate in design challenges, collaborate with cross-functional teams, learn design tools, and continuously iterate based on user feedback to strengthen design thinking skills.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic design thinking awareness that requires development. While the concept of user-centered design may be understood superficially, performance indicates need for deeper engagement with design thinking methodology and practice. Building stronger design thinking capability is valuable across many professional domains. Focus on learning design thinking frameworks, practicing empathy mapping, conducting user interviews, engaging in ideation exercises, and creating simple prototypes. Consider taking design thinking workshops, studying human-centered design principles, observing user behavior, practicing creative problem-solving techniques, and applying design thinking to everyday challenges. Developing this skill will enhance innovation capability and problem-solving effectiveness.";
        } else {
            return "Performance in design thinking indicates areas requiring focused development. The candidate needs to build understanding of user-centered design, empathy-driven problem-solving, and iterative design processes. Design thinking is increasingly important across professional fields for innovation and problem-solving. Recommended actions: study design thinking fundamentals through online courses, learn about empathy in design, practice basic user research techniques, engage in creative brainstorming exercises, and observe how successful products solve user problems. Start with simple design challenges, use design thinking templates and frameworks, join design communities, and gradually build comfort with human-centered design approach. With structured learning and consistent practice, design thinking capabilities can be developed and applied across various professional contexts.";
        }
    }
    
    private String getTechnicalProblemSolvingDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional technical problem-solving ability, indicating outstanding analytical thinking, systematic debugging, algorithm development, and solution optimization skills. This expertise reflects strong capacity to break down complex technical challenges, identify root causes, develop efficient solutions, and optimize performance. Such proficiency is critical for engineering roles, technical positions, and any career requiring systematic problem resolution. The candidate's technical problem-solving strength enables effective performance in roles involving software debugging, system optimization, technical troubleshooting, algorithm design, and complex technical challenges. This capability is highly valued in Software Engineering, Systems Analysis, Technical Consulting, DevOps, and any role requiring rigorous technical problem-solving.";
        } else if (percentage >= 60) {
            return "The candidate shows good technical problem-solving ability with solid analytical approach to technical challenges. There is competent foundation for addressing technical problems, though developing more advanced debugging techniques, algorithmic thinking, and optimization strategies will enhance effectiveness. This level supports technical roles in Development, IT Support, and Engineering positions. To reach exceptional capability, practice solving coding challenges, study algorithms and data structures, work through technical debugging scenarios, learn systematic problem-solving frameworks, and analyze complex systems. Engage with competitive programming, contribute to technical projects, learn from debugging sessions, and continuously challenge yourself with progressively difficult technical problems.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic technical problem-solving ability that requires strengthening. While simple technical issues may be addressed, performance indicates need for developing more structured approaches to complex technical challenges. Building stronger technical problem-solving is essential for technology careers. Focus on learning systematic debugging approaches, understanding root cause analysis, practicing algorithmic thinking, studying common technical patterns, and working through guided technical exercises. Consider technical problem-solving courses, practicing on coding platforms, learning debugging tools and techniques, working with more experienced developers, and building confidence through progressively challenging technical problems. Strengthening this skill will significantly enhance technical effectiveness.";
        } else {
            return "Performance in technical problem-solving indicates significant areas requiring development. The candidate faces challenges with analytical technical thinking, systematic debugging, and solution development. This is a critical skill for technical careers that can be developed through structured learning. Recommended actions: start with basic problem-solving frameworks, learn fundamental debugging techniques, practice breaking problems into smaller components, study how to read error messages and logs, and work through simple technical exercises with guidance. Consider mentorship from experienced technical professionals, use online platforms for guided technical practice, start with very simple problems and gradually increase complexity, and learn to think systematically about technical issues. With consistent practice and proper guidance, technical problem-solving skills can be substantially developed.";
        }
    }
    
    private String getFrontendDevelopmentDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional frontend development expertise, indicating strong proficiency in HTML, CSS, JavaScript, modern frameworks, responsive design, and user interface implementation. This expertise reflects excellent understanding of web technologies, component-based architecture, state management, browser APIs, and frontend best practices. Such proficiency enables creating sophisticated, performant, and user-friendly web interfaces. The candidate's frontend strength positions them excellently for roles including Frontend Developer, UI Engineer, Full-Stack Developer, Web Developer, React/Angular/Vue Developer, and positions requiring modern web application development. This expertise is highly sought after in the current technology landscape where web applications dominate.";
        } else if (percentage >= 60) {
            return "The candidate shows solid frontend development knowledge with good understanding of web technologies and interface development. There is competent foundation for building web applications, though mastering modern frameworks, advanced CSS techniques, performance optimization, and state management patterns will enhance capabilities. This level supports Web Developer and Frontend positions. To reach exceptional proficiency, focus on mastering at least one modern JavaScript framework (React, Vue, or Angular), learning advanced CSS and responsive design, understanding browser performance optimization, practicing component architecture, and building complex web applications. Contribute to frontend projects, study modern web development best practices, and continuously learn evolving web technologies.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic frontend development knowledge that requires substantial strengthening. While fundamental HTML/CSS concepts may be understood, performance indicates significant gaps in JavaScript proficiency, modern frameworks, and frontend development practices. Building stronger frontend capabilities is essential for web development careers. Focus on solidifying HTML/CSS fundamentals, mastering JavaScript basics, learning at least one modern framework, understanding DOM manipulation, and practicing responsive design. Work through structured frontend courses, build progressively complex projects, study successful web applications, practice daily coding, and engage with frontend communities. Consistent effort in frontend development will open numerous opportunities in web technology.";
        } else {
            return "Performance in frontend development indicates areas requiring immediate, focused learning. The candidate faces challenges with web technologies, interface development, and frontend programming. This is a valuable skill area with significant career opportunities that can be developed through structured learning. Recommended approach: start with HTML/CSS fundamentals, learn JavaScript basics systematically, practice building simple web pages, study responsive design principles, and use interactive learning platforms. Begin with beginner-friendly tutorials, build small projects to apply learning, join web development communities, follow structured curriculums, and celebrate small wins. Frontend development is accessible and highly rewarding with consistent practice and proper learning resources.";
        }
    }
    
    private String getBackendDevelopmentDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional backend development expertise, indicating strong proficiency in server-side programming, API development, database management, system architecture, and backend best practices. This expertise reflects excellent understanding of server technologies, RESTful services, authentication/authorization, data modeling, and scalable backend systems. Such proficiency enables building robust, secure, and performant server-side applications. The candidate's backend strength positions them excellently for roles including Backend Developer, API Developer, Full-Stack Developer, Systems Engineer, DevOps Engineer, and positions requiring comprehensive server-side development. This expertise is fundamental to modern application development and highly valued across the technology industry.";
        } else if (percentage >= 60) {
            return "The candidate shows solid backend development knowledge with good understanding of server-side programming and API development. There is competent foundation for backend work, though mastering advanced architectural patterns, database optimization, security best practices, and scalability will enhance capabilities. This level supports Backend Developer and API Development roles. To reach exceptional proficiency, focus on mastering database design and optimization, learning microservices architecture, understanding caching strategies, studying authentication/authorization patterns, and building scalable APIs. Practice with different backend frameworks, study system design, learn about message queues and async processing, and work on progressively complex backend challenges.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic backend development knowledge that requires strengthening. While some server-side concepts may be understood, performance indicates gaps in API development, database management, and backend architecture. Building stronger backend capabilities is essential for full-stack or backend-focused careers. Focus on learning one backend language deeply (Python, Java, Node.js, etc.), understanding RESTful API principles, practicing database operations, learning about authentication, and building complete backend applications. Work through backend development courses, practice building APIs, study database design, learn about server deployment, and engage with backend development communities. Strengthening backend skills will significantly enhance technical versatility.";
        } else {
            return "Performance in backend development indicates areas requiring focused learning and development. The candidate faces challenges with server-side programming, API concepts, and backend architecture. This is a critical technical area with strong career potential that can be developed systematically. Recommended actions: choose one backend language to start (Python/Node.js are beginner-friendly), learn basic API concepts, understand HTTP and web protocols, practice database basics, and build simple server applications. Use structured backend courses, start with basic CRUD applications, learn about data persistence, practice with frameworks, and gradually increase complexity. Backend development skills are achievable with consistent practice and structured learning, opening doors to comprehensive software development careers.";
        }
    }
    
    private String getDatabaseDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional database expertise, indicating strong proficiency in data modeling, query optimization, database design, transaction management, and both SQL and NoSQL technologies. This expertise reflects excellent understanding of relational databases, normalization, indexing, query performance, and database administration. Such proficiency is critical for building data-driven applications, ensuring data integrity, and optimizing data access. The candidate's database strength enables effective performance in roles including Database Administrator, Data Engineer, Backend Developer, Data Architect, and any position requiring sophisticated data management. This expertise is fundamental across virtually all technology domains where data persistence and retrieval are essential.";
        } else if (percentage >= 60) {
            return "The candidate shows solid database knowledge with good understanding of SQL queries, basic data modeling, and database operations. There is competent foundation for working with databases, though mastering query optimization, advanced data modeling, indexing strategies, and database administration will enhance capabilities. This level supports Development and Data Management roles. To reach exceptional proficiency, practice complex SQL queries, study database normalization and design patterns, learn query performance optimization, understand indexing strategies, explore both SQL and NoSQL databases, and practice data modeling for real-world scenarios. Work with large datasets, analyze query execution plans, and study database administration concepts to strengthen expertise.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic database knowledge that requires strengthening. While simple SQL queries may be understood, performance indicates gaps in data modeling, query optimization, and database design principles. Building stronger database capabilities is important for most technical careers. Focus on mastering SQL fundamentals, learning database normalization, understanding relationships between tables, practicing JOIN operations, and designing simple databases. Work through SQL tutorials, practice with database exercises, learn about primary and foreign keys, study entity-relationship diagrams, and build small database-driven applications. Strengthening database skills will enhance technical effectiveness across many technology roles.";
        } else {
            return "Performance in database knowledge indicates areas requiring focused learning. The candidate faces challenges with database concepts, SQL operations, and data management. Database skills are fundamental to technology careers and highly learnable through structured practice. Recommended actions: start with basic SQL concepts (SELECT, INSERT, UPDATE, DELETE), learn about tables and simple queries, understand what databases do and why they're important, practice with beginner-friendly database tools, and work through interactive SQL tutorials. Use online SQL learning platforms, practice with small datasets, learn basic database terminology, and gradually build complexity. Database skills are accessible and valuable, forming a critical foundation for technology careers that can be developed with consistent practice.";
        }
    }
    
    private String getDevOpsDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional DevOps expertise, indicating strong proficiency in CI/CD pipelines, infrastructure automation, containerization, cloud platforms, monitoring, and DevOps practices. This expertise reflects excellent understanding of deployment automation, infrastructure as code, Docker/Kubernetes, cloud services, and continuous delivery. Such proficiency is critical for modern software development practices, enabling rapid, reliable, and automated software delivery. The candidate's DevOps strength positions them excellently for roles including DevOps Engineer, Site Reliability Engineer, Cloud Engineer, Infrastructure Engineer, Platform Engineer, and positions requiring automation and deployment expertise. This is one of the most in-demand skill sets in current technology landscape.";
        } else if (percentage >= 60) {
            return "The candidate shows solid DevOps knowledge with good understanding of deployment processes, automation, and infrastructure concepts. There is competent foundation for DevOps work, though mastering containerization, orchestration, advanced CI/CD patterns, and infrastructure as code will enhance capabilities. This level supports DevOps and Infrastructure roles. To reach exceptional proficiency, focus on mastering Docker and Kubernetes, learning infrastructure as code (Terraform/Ansible), understanding cloud platforms deeply, practicing CI/CD pipeline creation, studying monitoring and logging, and automating deployment processes. Build complete deployment pipelines, practice with cloud platforms, learn about site reliability engineering, and continuously explore DevOps tools and practices.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic DevOps awareness that requires substantial development. While deployment concepts may be understood superficially, performance indicates gaps in automation, containerization, and DevOps practices. Building DevOps capabilities is increasingly important for technology careers. Focus on learning basic Linux administration, understanding CI/CD concepts, getting hands-on with Docker, learning about cloud platforms (AWS/Azure/GCP), and practicing deployment automation. Work through DevOps tutorials, set up simple automation scripts, learn version control workflows, practice with cloud free tiers, and study DevOps culture and practices. Strengthening DevOps skills will significantly enhance career opportunities in modern software development.";
        } else {
            return "Performance in DevOps indicates areas requiring focused learning and development. The candidate needs to build understanding of deployment, automation, and infrastructure concepts. DevOps is a valuable skill area with strong career potential that can be developed systematically. Recommended actions: start with basic command line and Linux concepts, learn what CI/CD means and why it matters, get hands-on with Git for version control, understand basic deployment concepts, and explore Docker basics. Use interactive DevOps learning platforms, follow beginner-friendly tutorials, practice with free cloud accounts, join DevOps communities, and gradually build understanding of modern deployment practices. DevOps skills are increasingly essential and achievable through structured learning and hands-on practice.";
        }
    }
    
    private String getAPIDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional API development and integration expertise, indicating strong proficiency in RESTful services, API design, authentication, documentation, and integration patterns. This expertise reflects excellent understanding of API architecture, HTTP protocols, request/response handling, API security, and service integration. Such proficiency is critical for modern application development where systems communicate through APIs. The candidate's API expertise enables effective performance in roles including API Developer, Backend Developer, Integration Engineer, Full-Stack Developer, and positions requiring service-oriented architecture. This skill is fundamental to modern software development and highly valued across technology companies.";
        } else if (percentage >= 60) {
            return "The candidate shows solid API knowledge with good understanding of RESTful services and basic integration concepts. There is competent foundation for API work, though mastering advanced API patterns, authentication mechanisms, rate limiting, versioning, and comprehensive API design will enhance capabilities. This level supports Backend and Integration development roles. To reach exceptional proficiency, focus on designing well-structured APIs, learning OAuth and JWT authentication, understanding API versioning strategies, practicing API documentation, studying GraphQL alongside REST, and building production-quality APIs. Work on API security, practice error handling, learn about API gateways, and study successful API designs from major platforms.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic API awareness that requires strengthening. While the concept of APIs may be understood, performance indicates gaps in API development, integration practices, and understanding of API architecture. Building stronger API capabilities is important for backend and full-stack careers. Focus on understanding RESTful principles, learning HTTP methods (GET, POST, PUT, DELETE), practicing API consumption, understanding JSON data format, and building simple APIs. Work through API development tutorials, use public APIs to understand patterns, practice with API testing tools like Postman, learn about API authentication basics, and build small API-driven applications. Strengthening API skills will enhance technical versatility significantly.";
        } else {
            return "Performance in API knowledge indicates areas requiring focused learning. The candidate needs to build understanding of what APIs are, how they work, and how systems integrate through APIs. API knowledge is fundamental to modern software development and highly learnable. Recommended actions: start by understanding what APIs do and why they exist, learn about HTTP and web requests, practice consuming public APIs, understand JSON data format, and experiment with simple API calls. Use beginner-friendly API tutorials, practice with free public APIs, learn about request/response concepts, use tools like Postman to explore APIs, and gradually build understanding of API patterns. API skills are essential for modern development and accessible through structured learning and hands-on practice.";
        }
    }
    
    private String getSecurityDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional cybersecurity and application security expertise, indicating strong understanding of security principles, threat modeling, secure coding practices, encryption, authentication, and security best practices. This expertise reflects excellent knowledge of common vulnerabilities, security patterns, penetration testing concepts, and defensive programming. Such proficiency is critical in today's threat landscape where security is paramount. The candidate's security strength positions them excellently for roles including Security Engineer, Application Security Specialist, DevSecOps Engineer, Security Consultant, Penetration Tester, and positions requiring security-focused development. Security expertise is increasingly valuable and sought after across all technology domains.";
        } else if (percentage >= 60) {
            return "The candidate shows solid security awareness with good understanding of basic security principles and common vulnerabilities. There is competent foundation for secure development, though mastering advanced security patterns, penetration testing, security architecture, and comprehensive threat modeling will enhance capabilities. This level supports secure development practices in various technical roles. To reach exceptional proficiency, study OWASP Top 10 in depth, learn about cryptography and encryption, practice threat modeling, understand secure authentication patterns, learn about security testing tools, and stay current with emerging security threats. Practice secure coding, study security breaches and lessons learned, and continuously integrate security thinking into development practices.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic security awareness that requires substantial strengthening. While some security concepts may be understood, performance indicates significant gaps in security practices, vulnerability awareness, and secure development. Building stronger security knowledge is increasingly essential across all technical roles. Focus on learning about common security vulnerabilities (SQL injection, XSS, CSRF), understanding authentication and authorization, practicing input validation, learning about encryption basics, and studying security best practices. Work through security-focused tutorials, learn about OWASP guidelines, practice secure coding principles, understand password security, and develop security-conscious mindset. Strengthening security knowledge will enhance professional value significantly in current threat landscape.";
        } else {
            return "Performance in security knowledge indicates areas requiring immediate attention and learning. The candidate needs to build fundamental understanding of security principles and secure development practices. Security is critical in modern technology and can be learned systematically. Recommended actions: start with understanding why security matters, learn about common security threats in plain language, understand basics of passwords and authentication, learn what makes code secure or insecure, and study security thinking. Use beginner-friendly security resources, learn about real-world security breaches and their causes, understand basic security principles, practice thinking about potential vulnerabilities, and gradually build security awareness. Security knowledge is essential for responsible technology development and achievable through focused learning and security-conscious practice.";
        }
    }
    
    private String getTestingDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional software testing and quality assurance expertise, indicating strong proficiency in test design, automated testing, testing frameworks, test-driven development, and quality assurance practices. This expertise reflects excellent understanding of unit testing, integration testing, end-to-end testing, test coverage, and testing best practices. Such proficiency is critical for delivering high-quality, reliable software. The candidate's testing strength positions them excellently for roles including QA Engineer, Test Automation Engineer, SDET (Software Development Engineer in Test), Quality Assurance Lead, and positions requiring comprehensive testing expertise. Testing expertise is fundamental to professional software development and highly valued for ensuring software quality and reliability.";
        } else if (percentage >= 60) {
            return "The candidate shows solid testing knowledge with good understanding of basic testing concepts and quality assurance principles. There is competent foundation for testing work, though mastering test automation frameworks, advanced testing patterns, performance testing, and comprehensive test strategy will enhance capabilities. This level supports QA and Testing roles. To reach exceptional proficiency, focus on learning test automation frameworks (Jest, JUnit, Pytest, Selenium), practicing test-driven development, understanding different testing levels, learning about continuous testing in CI/CD, studying test design patterns, and building comprehensive test suites. Practice writing maintainable tests, learn about code coverage tools, and develop testing mindset alongside development skills.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic testing awareness that requires strengthening. While the importance of testing may be understood conceptually, performance indicates gaps in practical testing skills, test automation, and quality assurance practices. Building stronger testing capabilities is important for software development careers. Focus on learning testing fundamentals, understanding different types of tests (unit, integration, end-to-end), practicing manual testing systematically, learning basic test automation, and understanding test cases. Work through testing tutorials, practice writing simple tests, learn about testing frameworks in your programming language, understand what makes good tests, and develop habit of testing code. Strengthening testing skills will enhance software development quality and career opportunities.";
        } else {
            return "Performance in testing knowledge indicates areas requiring focused learning. The candidate needs to build understanding of software testing, quality assurance, and why testing matters. Testing is a fundamental aspect of professional software development that can be learned systematically. Recommended actions: start by understanding why software needs testing, learn what different types of testing exist, practice manual testing of applications, understand what test cases are, and learn basics of finding bugs. Use beginner-friendly testing resources, practice testing simple applications systematically, learn to think like a tester looking for problems, understand basic quality concepts, and gradually build testing mindset. Testing skills are essential for delivering quality software and accessible through structured learning and practice.";
        }
    }
    
    private String getDataScienceDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional data science expertise, indicating strong proficiency in statistical analysis, data manipulation, machine learning concepts, data visualization, and analytical thinking. This expertise reflects excellent understanding of data processing, statistical methods, Python/R for data analysis, and deriving insights from data. Such proficiency is highly valuable in today's data-driven business environment. The candidate's data science strength positions them excellently for roles including Data Scientist, Data Analyst, Business Intelligence Analyst, Analytics Consultant, ML Engineer, and positions requiring advanced data analytics. This is one of the most sought-after skill sets across industries as organizations increasingly rely on data-driven decision making.";
        } else if (percentage >= 60) {
            return "The candidate shows solid data science knowledge with good understanding of statistical concepts and data analysis basics. There is competent foundation for data work, though mastering advanced statistical methods, machine learning algorithms, big data technologies, and comprehensive data storytelling will enhance capabilities. This level supports Data Analyst and Junior Data Scientist roles. To reach exceptional proficiency, focus on mastering Python/R for data analysis, learning machine learning algorithms deeply, practicing with real-world datasets, understanding statistical inference, learning data visualization best practices, and building end-to-end data science projects. Study feature engineering, practice on Kaggle competitions, and continuously apply data science techniques to practical problems.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic data science awareness that requires substantial development. While some statistical concepts may be understood, performance indicates gaps in practical data analysis, statistical methods, and data science techniques. Building data science capabilities is valuable for many career paths in today's data-centric world. Focus on learning statistics fundamentals, getting comfortable with Python or R, understanding data manipulation with pandas/dplyr, learning basic visualization, and practicing with datasets. Work through data science courses, practice on simple datasets, learn about exploratory data analysis, understand basic machine learning concepts, and gradually build analytical skills. Strengthening data science capabilities will open numerous career opportunities in analytics and data-driven roles.";
        } else {
            return "Performance in data science indicates areas requiring focused learning and development. The candidate needs to build understanding of data analysis, statistical thinking, and data science fundamentals. Data science is a valuable and growing field that can be learned systematically. Recommended actions: start with basic statistics concepts, learn to work with data using spreadsheets initially, understand what data analysis means, learn basic Python or R, and practice with simple datasets. Use beginner-friendly data science resources, start with descriptive statistics, learn to create basic visualizations, practice asking questions of data, and gradually build analytical thinking. Data science skills are increasingly valuable and accessible through structured learning platforms and hands-on practice with real data.";
        }
    }
    
    private String getMachineLearningDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional machine learning expertise, indicating strong proficiency in ML algorithms, model development, feature engineering, model evaluation, and ML frameworks. This expertise reflects excellent understanding of supervised and unsupervised learning, neural networks, model optimization, and practical ML implementation. Such proficiency positions the candidate at the forefront of AI/ML technology. The candidate's ML strength enables effective performance in roles including Machine Learning Engineer, AI Engineer, Data Scientist (ML-focused), Research Scientist, ML Architect, and positions requiring advanced ML capabilities. This is one of the most cutting-edge and high-value skill areas in current technology landscape with significant career potential.";
        } else if (percentage >= 60) {
            return "The candidate shows solid machine learning knowledge with good understanding of ML concepts and basic algorithms. There is competent foundation for ML work, though mastering advanced algorithms, deep learning, model optimization, production ML systems, and comprehensive ML engineering will enhance capabilities. This level supports ML development and data science roles. To reach exceptional proficiency, focus on implementing ML algorithms from scratch to understand internals, learning deep learning frameworks (TensorFlow/PyTorch), practicing feature engineering, understanding model deployment, studying ML system design, and working on complex ML projects. Participate in ML competitions, study research papers, practice with diverse datasets, and build end-to-end ML applications.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic machine learning awareness that requires substantial development. While ML concepts may be understood theoretically, performance indicates gaps in practical implementation, algorithm understanding, and ML engineering. Building ML capabilities requires strong foundation in mathematics, programming, and statistics combined with ML-specific knowledge. Focus on strengthening mathematical foundations (linear algebra, calculus, probability), learning ML algorithms conceptually before implementation, practicing with scikit-learn, understanding training/testing concepts, and working through guided ML projects. Study ML courses systematically, practice implementing basic algorithms, understand when to use which algorithms, and gradually build practical ML skills. ML is complex but highly rewarding field worth the investment in learning.";
        } else {
            return "Performance in machine learning indicates this is an advanced area requiring substantial foundational learning first. Machine learning builds on strong programming, mathematics, and data science foundations. The candidate should first strengthen prerequisite skills before diving deep into ML. Recommended approach: ensure solid Python programming skills, build strong foundation in statistics and linear algebra, become comfortable with data manipulation and analysis, understand basic algorithms, and then begin ML learning journey. Start with conceptual understanding of what ML is and how it works, use beginner-friendly ML resources, practice with simple ML models using high-level libraries, and gradually build complexity. ML is an advanced field but achievable with proper prerequisites and systematic learning. Focus first on building strong foundations in programming and mathematics, then progress to ML-specific concepts.";
        }
    }
    
    private String getLeadershipApplicationDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong leadership application capability in their domain, indicating ability to guide teams, make strategic decisions, mentor others, and drive projects forward. This strength reflects mature understanding of how to apply leadership principles in practical professional contexts. Leadership application skills enable taking on management responsibilities, leading projects, influencing stakeholders, and driving organizational impact. The candidate's leadership application strength positions them for advancement into management, project leadership, team leadership, and strategic roles within their domain. This capability is essential for career progression beyond individual contributor roles.";
        } else {
            return "The candidate shows developing leadership application capability in their domain, indicating areas for growth in practical leadership, team guidance, and strategic influence. While domain expertise may exist, translating that into leadership and influence requires development. Building leadership application skills is crucial for career advancement beyond purely technical roles. Focus on seeking opportunities to lead small projects, mentoring junior team members, understanding stakeholder management, practicing decision-making in professional context, and learning to influence without authority. Consider leadership development programs, seeking mentorship from effective leaders in your domain, gradually taking on leadership responsibilities, and consciously developing leadership behaviors alongside technical skills. Leadership application can be developed through practice and reflection, significantly enhancing career trajectory.";
        }
    }
    
    private String getProfessionalApplicationDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong professional application capability, indicating ability to apply domain knowledge effectively in professional contexts, understand business requirements, communicate with stakeholders, and deliver practical solutions. This strength reflects mature understanding of how to translate knowledge into professional value and business impact. Professional application skills enable effective performance in real-world professional environments, successful project delivery, and stakeholder satisfaction. The candidate shows readiness for professional roles and ability to operate effectively in business contexts, not just technical ones.";
        } else {
            return "The candidate shows developing professional application capability, indicating need for growth in applying domain knowledge to practical business contexts, stakeholder communication, and professional delivery. While theoretical knowledge may exist, translating that into professional practice requires development. Building professional application skills is crucial for career success. Focus on understanding business context of technical work, practicing professional communication, learning to gather and clarify requirements, understanding project delivery processes, and developing client/stakeholder interaction skills. Consider seeking exposure to client-facing work, learning about business processes, practicing professional communication, understanding how technical work creates business value, and gradually building comfort with professional environments. Professional application skills bridge technical knowledge and career success.";
        }
    }
    
    private String getDomainExpertiseDescription(double percentage, String categoryName) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional domain expertise in " + categoryName.toLowerCase() + ", indicating deep specialized knowledge, practical experience, and mastery of domain-specific concepts and practices. This expertise reflects comprehensive understanding of the field, industry best practices, advanced concepts, and ability to solve complex domain-specific problems. Such depth of domain knowledge is highly valuable for specialized roles and positions the candidate as a subject matter expert. This expertise enables effective performance in advanced roles requiring deep domain knowledge, technical leadership in the specialty area, and consulting or advisory positions. Domain expertise at this level significantly differentiates the candidate in the job market.";
        } else if (percentage >= 60) {
            return "The candidate shows solid domain knowledge in " + categoryName.toLowerCase() + " with good understanding of core concepts and practical application. There is competent foundation in the domain, though deepening expertise through advanced study, practical experience, and specialization will enhance capabilities. This level supports professional roles in the domain. To reach exceptional expertise, focus on advanced topics in the domain, gain hands-on experience with complex scenarios, study industry best practices, pursue relevant certifications, engage with domain communities, and work on challenging projects in the specialty area. Continuous learning and practical application in the domain will build toward expert-level capability.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates foundational knowledge in " + categoryName.toLowerCase() + " that requires strengthening for professional proficiency. While basic concepts may be understood, performance indicates gaps in depth, practical application, and comprehensive domain understanding. Building stronger domain expertise is important for career success in this specialization. Focus on systematic study of domain fundamentals, hands-on practice with domain-specific tools and techniques, learning from domain experts, working on domain projects, and engaging with domain learning resources. Consider structured courses, practical projects, mentorship in the domain, and consistent engagement with domain content to build expertise systematically.";
        } else {
            return "Performance in " + categoryName.toLowerCase() + " indicates this domain requires focused learning and development. The candidate needs to build foundational understanding of domain concepts, practices, and applications. Domain expertise can be developed through structured learning and practical experience. Recommended actions: start with domain fundamentals, use beginner-friendly resources in this specialty, seek to understand why this domain matters and its applications, practice with basic domain scenarios, and engage with domain communities. Begin with introductory courses, learn domain terminology and concepts, gradually build practical skills, seek guidance from domain experts, and consistently engage with domain learning. With focused effort and structured approach, domain expertise can be developed to support career goals in this specialization.";
        }
    }
    
    private String getMobileDevelopmentDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional mobile development expertise, indicating strong proficiency in mobile platforms (iOS/Android), mobile UI/UX patterns, mobile-specific optimization, and mobile app development best practices. This expertise reflects excellent understanding of native or cross-platform development, mobile architecture patterns, platform-specific guidelines, and mobile app lifecycle. Such proficiency is highly valuable as mobile applications dominate user interaction with technology. The candidate's mobile development strength positions them excellently for roles including Mobile Developer, iOS/Android Engineer, React Native/Flutter Developer, Mobile Architect, and positions requiring mobile application expertise. Mobile development expertise is in high demand across industries.";
        } else if (percentage >= 60) {
            return "The candidate shows solid mobile development knowledge with good understanding of mobile platforms and app development basics. There is competent foundation for mobile development, though mastering platform-specific patterns, advanced mobile UI, performance optimization, and comprehensive mobile architecture will enhance capabilities. This level supports Mobile Developer roles. To reach exceptional proficiency, focus on deep-diving into one platform initially (iOS or Android), learning mobile UI/UX best practices, understanding mobile performance optimization, mastering state management in mobile apps, studying mobile architecture patterns, and building complex mobile applications. Practice with both native and cross-platform approaches, study successful mobile apps, and continuously learn evolving mobile technologies.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic mobile development awareness that requires substantial strengthening. While mobile concepts may be understood superficially, performance indicates gaps in practical mobile development, platform knowledge, and mobile-specific patterns. Building mobile development capabilities opens significant career opportunities. Focus on choosing one mobile development path (native iOS/Android or cross-platform React Native/Flutter), learning mobile development fundamentals, understanding mobile UI components, practicing with mobile development tools, and building simple mobile apps. Work through mobile development tutorials, understand mobile app structure, practice with simulators/emulators, learn mobile-specific concepts, and gradually build mobile development skills. Mobile development is a valuable specialization worth investing in learning.";
        } else {
            return "Performance in mobile development indicates this area requires focused learning. The candidate needs to build understanding of mobile platforms, mobile development approaches, and mobile app concepts. Mobile development is a valuable specialization that can be learned systematically. Recommended actions: start by understanding difference between iOS/Android and native/cross-platform approaches, choose one path to begin learning, set up mobile development environment, learn mobile development basics, and build very simple mobile apps following tutorials. Use beginner-friendly mobile development resources, start with simple UI-focused apps, understand mobile app structure, practice with development tools, and gradually increase complexity. Mobile development skills are valuable and achievable through structured learning and hands-on practice.";
        }
    }
    
    private String getCloudComputingDescription(double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional cloud computing expertise, indicating strong proficiency in cloud platforms (AWS/Azure/GCP), cloud architecture, serverless computing, cloud services, and cloud best practices. This expertise reflects excellent understanding of cloud infrastructure, scalability patterns, cloud security, cost optimization, and cloud-native development. Such proficiency is critical in modern technology landscape where cloud dominates infrastructure. The candidate's cloud expertise positions them excellently for roles including Cloud Architect, Cloud Engineer, Solutions Architect, DevOps Engineer, Platform Engineer, and positions requiring cloud infrastructure expertise. Cloud skills are among the most in-demand in current technology market.";
        } else if (percentage >= 60) {
            return "The candidate shows solid cloud computing knowledge with good understanding of cloud concepts and basic cloud services. There is competent foundation for cloud work, though mastering cloud architecture patterns, multi-cloud strategies, cloud security, infrastructure as code, and comprehensive cloud services will enhance capabilities. This level supports Cloud Engineering and related roles. To reach exceptional proficiency, focus on obtaining cloud certifications (AWS/Azure/GCP), practicing cloud architecture design, learning infrastructure as code deeply, understanding cloud cost optimization, mastering cloud security, and building cloud-native applications. Work with multiple cloud services, practice designing scalable cloud solutions, and continuously explore evolving cloud technologies.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates basic cloud computing awareness that requires strengthening. While cloud concepts may be understood generally, performance indicates gaps in practical cloud experience, cloud services knowledge, and cloud architecture. Building cloud capabilities is increasingly essential for technology careers. Focus on choosing one major cloud platform to start (AWS, Azure, or GCP), learning core cloud services, understanding cloud deployment, practicing with cloud free tiers, and learning basic cloud architecture. Work through cloud tutorials, practice deploying applications to cloud, learn about cloud service categories, understand cloud pricing models, and build familiarity with cloud concepts. Cloud skills are increasingly fundamental to modern technology roles.";
        } else {
            return "Performance in cloud computing indicates areas requiring focused learning. The candidate needs to build understanding of what cloud computing is, how it works, and why it's important. Cloud computing is fundamental to modern technology and highly learnable. Recommended actions: start by understanding what cloud computing means conceptually, learn about major cloud providers (AWS, Azure, GCP), understand difference between cloud and traditional infrastructure, explore cloud free tier accounts hands-on, and learn basic cloud terminology. Use beginner-friendly cloud resources, start with simple services like virtual machines and storage, understand cloud benefits, practice with guided tutorials, and gradually build cloud knowledge. Cloud skills are essential for modern technology careers and accessible through structured learning and hands-on exploration.";
        }
    }
    
    private String getAgileDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong understanding of Agile methodology, including Scrum, iterative development, sprint planning, and Agile practices. This knowledge reflects excellent grasp of modern software development processes, team collaboration patterns, and iterative delivery approaches. Such understanding is essential in modern software development environments where Agile dominates. The candidate's Agile knowledge enables effective participation in Agile teams, understanding of iterative delivery, and ability to work in sprint-based environments. This understanding is valuable across development, project management, and product roles in technology organizations.";
        } else {
            return "The candidate shows developing understanding of Agile methodology and practices. While some Agile concepts may be familiar, deeper practical understanding of Agile ceremonies, principles, and practices would enhance professional effectiveness. Building stronger Agile understanding is valuable for modern software development careers. Focus on learning Agile principles and manifesto, understanding Scrum framework, learning about sprints and ceremonies, understanding user stories and backlogs, and experiencing Agile in practice. Consider Agile certifications, participating actively in Agile ceremonies, studying Agile practices, understanding difference between Agile and Waterfall, and building familiarity with Agile terminology and processes. Agile understanding enhances effectiveness in modern development teams significantly.";
        }
    }
    
    private String getVersionControlDescription(double percentage) {
        if (percentage >= 60) {
            return "The candidate demonstrates strong version control expertise, particularly with Git, including branching strategies, collaboration workflows, merge/rebase operations, and version control best practices. This expertise reflects excellent understanding of code collaboration, version history management, and team development workflows. Version control proficiency is absolutely fundamental to professional software development. The candidate's version control strength enables effective collaboration in development teams, proper code management, and professional development workflows. This is a baseline essential skill for all software development roles, and strong proficiency indicates professional development maturity.";
        } else {
            return "The candidate shows developing version control capability, indicating need for stronger understanding of Git, branching workflows, and version control practices. Version control (especially Git) is absolutely fundamental to professional software development and must be mastered. Building strong version control skills is non-negotiable for software development careers. Focus on mastering Git basics (commit, push, pull, branch, merge), understanding branching strategies, learning to resolve merge conflicts, practicing collaborative workflows, and using Git daily. Work through Git tutorials, practice with real repositories, understand Git conceptually not just commands, learn about pull requests and code review workflows, and build muscle memory with version control. Version control proficiency is essential for any development role and must be prioritized in learning. This is a fundamental skill that enables all collaborative development work.";
        }
    }
    
    private String getGenericDomainDescription(String categoryName, double percentage) {
        if (percentage >= 80) {
            return "The candidate demonstrates exceptional expertise in " + categoryName.toLowerCase() + ", indicating comprehensive knowledge, strong practical skills, and mastery of concepts in this domain area. This proficiency reflects deep understanding and ability to apply knowledge effectively in professional contexts. Such domain expertise positions the candidate excellently for specialized roles requiring this knowledge and provides significant professional value. The candidate should continue deepening this expertise through advanced learning, practical application, and staying current with developments in this domain area. This strength can be leveraged for specialized roles, technical leadership, or advisory positions in this domain.";
        } else if (percentage >= 60) {
            return "The candidate shows solid knowledge in " + categoryName.toLowerCase() + " with good foundational understanding and practical capability. There is competent proficiency in this domain area, though continued learning and deepening expertise will enhance professional value. This level supports professional roles utilizing this knowledge. To reach exceptional expertise, focus on advanced topics in this area, gain more hands-on experience, study best practices, work on complex scenarios, and engage with professional communities in this domain. Continuous learning and practical application will strengthen expertise and enhance career opportunities in this specialization.";
        } else if (percentage >= 40) {
            return "The candidate demonstrates foundational knowledge in " + categoryName.toLowerCase() + " that requires strengthening for strong professional proficiency. While basic concepts are understood, performance indicates need for deeper study and more practical experience in this domain area. Building stronger capability in this domain will enhance professional effectiveness. Focus on systematic study of core concepts, hands-on practice, working on relevant projects, learning from experienced practitioners, and utilizing quality learning resources. Consider structured courses, practical projects, mentorship, and consistent engagement with this domain area to build stronger expertise systematically.";
        } else {
            return "Performance in " + categoryName.toLowerCase() + " indicates this domain area requires focused attention and development. The candidate needs to build stronger foundational understanding and practical skills in this area. Domain knowledge can be developed through structured learning and deliberate practice. Recommended actions: start with fundamentals in this domain, use quality learning resources, understand why this knowledge area matters professionally, practice with guided exercises, and seek mentorship or guidance. Begin with introductory materials, learn systematically, build practical skills progressively, and engage consistently with learning in this area. With focused effort and structured approach, domain knowledge can be developed to support professional goals and career advancement.";
        }
    }

    private static class SectionStats {
        int total = 0;
        int attempted = 0;
        int correct = 0;
    }
    
    private static class CategoryStats {
        int total = 0;
        int attempted = 0;
        int correct = 0;
    }
    
    private String formatCategoryName(String category) {
        if (category == null || category.isEmpty()) {
            return "Unknown";
        }
        // Convert snake_case and lowercase to Title Case
        String[] parts = category.toLowerCase().split("[_\\s]+");
        StringBuilder formatted = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                if (formatted.length() > 0) {
                    formatted.append(" ");
                }
                formatted.append(Character.toUpperCase(part.charAt(0)));
                if (part.length() > 1) {
                    formatted.append(part.substring(1));
                }
            }
        }
        // Handle special cases
        String result = formatted.toString();
        result = result.replace("Big Five", "Big Five");
        result = result.replace("Cse", "CSE");
        result = result.replace("It", "IT");
        result = result.replace("Api", "API");
        result = result.replace("Sql", "SQL");
        result = result.replace("Mba", "MBA");
        result = result.replace("Bba", "BBA");
        result = result.replace("Bcom", "B.Com");
        result = result.replace("Btech", "B.Tech");
        return result;
    }
}