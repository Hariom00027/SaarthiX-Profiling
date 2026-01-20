package com.profiling.service.psychometric;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.profiling.dto.psychometric.OpenAIRequest;
import com.profiling.dto.psychometric.OpenAIResponse;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.UserInfo;

import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

@Service
public class QuestionGeneratorService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final int QUESTIONS_PER_BATCH = 10;
    private static final int TOTAL_QUESTIONS_PER_SECTION = 40;

    /**
     * Backup bank for Section 2 (Behavioral) when OpenAI generation returns fewer than expected,
     * or when placeholder questions are needed.
     *
     * NOTE: These are "template" questions; we clone them with new UUIDs per session.
     */
    private static final List<Question> SECTION2_BEHAVIORAL_BACKUP_TEMPLATES = buildSection2BehavioralBackupTemplates();
    private static final Map<String, Question> SECTION2_BEHAVIORAL_BACKUP_BY_CATEGORY = indexBackupByCategory(SECTION2_BEHAVIORAL_BACKUP_TEMPLATES);

    public QuestionGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public List<Question> generateSection1Questions(UserInfo userInfo) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            return buildAptitudeSectionPlaceholder();
        }
        try {
            return buildAptitudeSection(userInfo);
        } catch (Exception e) {
            System.err.println("Error generating section 1 questions with OpenAI: " + e.getMessage());
            e.printStackTrace();
            return buildAptitudeSectionPlaceholder();
        }
    }

    public List<Question> generateSection2Questions(UserInfo userInfo) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            return buildPersonalitySectionPlaceholder(userInfo);
        }
        try {
            return buildPersonalitySection(userInfo);
        } catch (Exception e) {
            System.err.println("Error generating section 2 questions with OpenAI: " + e.getMessage());
            e.printStackTrace();
            return buildPersonalitySectionPlaceholder(userInfo);
        }
    }

    public List<Question> generateSection3Questions(UserInfo userInfo) {
        if (openAiApiKey == null || openAiApiKey.isEmpty()) {
            return buildDomainSectionPlaceholder(userInfo);
        }
        try {
            return buildDomainSection(userInfo);
        } catch (Exception e) {
            System.err.println("Error generating section 3 questions with OpenAI: " + e.getMessage());
            e.printStackTrace();
            return buildDomainSectionPlaceholder(userInfo);
        }
    }

    private List<Question> buildAptitudeSection(UserInfo userInfo) {
        // Aptitude topics (equal distribution across categories):
        // With 40 questions total and 5 categories below, each topic will receive 8 questions.
        List<String> categories = Arrays.asList(
                "numerical", "verbal", "situational", "abstract", "logical");
        return generateSectionQuestionsWithOpenAI(1, categories, "MCQ", userInfo);
    }

    private List<Question> buildPersonalitySection(UserInfo userInfo) {
        List<String> categories = new ArrayList<>();
        
        // Core personality categories (keep existing ones)
        categories.add("conflict_resolution");
        categories.add("attention_to_detail");
        categories.add("leadership");
        categories.add("adaptability");
        categories.add("big_five_openness");
        categories.add("big_five_conscientiousness");
        categories.add("big_five_extraversion");
        categories.add("big_five_agreeableness");
        categories.add("big_five_neuroticism");
        
        // Add soft skills-based categories
        String softSkills = userInfo.getSoftSkills() != null ? userInfo.getSoftSkills().toLowerCase() : "";
        if (softSkills.contains("communication") || softSkills.contains("verbal") || softSkills.contains("presentation")) {
            categories.add("communication_effectiveness");
        }
        if (softSkills.contains("teamwork") || softSkills.contains("collaboration") || softSkills.contains("cooperation")) {
            categories.add("teamwork_and_collaboration");
        }
        if (softSkills.contains("problem") || softSkills.contains("critical") || softSkills.contains("analytical")) {
            categories.add("problem_solving_approach");
        }
        if (softSkills.contains("creativity") || softSkills.contains("innovation") || softSkills.contains("creative")) {
            categories.add("creativity_and_innovation");
        }
        if (softSkills.contains("time") || softSkills.contains("organization") || softSkills.contains("planning")) {
            categories.add("time_management");
        }
        if (softSkills.contains("empathy") || softSkills.contains("emotional") || softSkills.contains("interpersonal")) {
            categories.add("emotional_intelligence");
        }
        if (softSkills.contains("resilience") || softSkills.contains("perseverance") || softSkills.contains("persistence")) {
            categories.add("resilience_and_perseverance");
        }
        
        // Add hobbies-based categories
        String hobbies = userInfo.getHobbies() != null ? userInfo.getHobbies().toLowerCase() : "";
        if (hobbies.contains("reading") || hobbies.contains("book") || hobbies.contains("literature")) {
            categories.add("intellectual_curiosity");
        }
        if (hobbies.contains("music") || hobbies.contains("singing") || hobbies.contains("instrument")) {
            categories.add("artistic_expression");
        }
        if (hobbies.contains("sport") || hobbies.contains("fitness") || hobbies.contains("exercise") || hobbies.contains("gym")) {
            categories.add("discipline_and_commitment");
        }
        if (hobbies.contains("photography") || hobbies.contains("art") || hobbies.contains("design") || hobbies.contains("drawing")) {
            categories.add("aesthetic_sensitivity");
        }
        if (hobbies.contains("travel") || hobbies.contains("exploration") || hobbies.contains("adventure")) {
            categories.add("openness_to_experience");
        }
        if (hobbies.contains("writing") || hobbies.contains("blog") || hobbies.contains("journal")) {
            categories.add("self_expression");
        }
        if (hobbies.contains("volunteer") || hobbies.contains("community") || hobbies.contains("social")) {
            categories.add("social_responsibility");
        }
        if (hobbies.contains("cooking") || hobbies.contains("culinary") || hobbies.contains("baking")) {
            categories.add("patience_and_precision");
        }
        if (hobbies.contains("gaming") || hobbies.contains("video game") || hobbies.contains("esports")) {
            categories.add("strategic_thinking");
        }
        if (hobbies.contains("dance") || hobbies.contains("dancing") || hobbies.contains("choreography")) {
            categories.add("coordination_and_expression");
        }
        
        return generateSectionQuestionsWithOpenAI(2, categories, "LIKERT", userInfo);
    }

    private List<Question> buildDomainSection(UserInfo userInfo) {
        // Create categories based on skills and specialization (most questions from these)
        // Also include education and interests for comprehensive coverage
        List<String> categories = new ArrayList<>();
        
        // Primary focus: Skills and Specialization (60% of questions - 30 questions)
        // Extract key skills from technical and soft skills
        String techSkills = userInfo.getTechnicalSkills() != null ? userInfo.getTechnicalSkills().toLowerCase() : "";
        String softSkills = userInfo.getSoftSkills() != null ? userInfo.getSoftSkills().toLowerCase() : "";
        String specialization = userInfo.getSpecialization() != null ? userInfo.getSpecialization().toLowerCase() : "";
        
        // Add skill-based categories (most questions)
        if (techSkills.contains("react") || techSkills.contains("javascript") || techSkills.contains("frontend")) {
            categories.add("frontend_development");
        }
        if (techSkills.contains("node") || techSkills.contains("backend") || techSkills.contains("api")) {
            categories.add("backend_development");
        }
        if (techSkills.contains("python") || techSkills.contains("data") || techSkills.contains("analytics")) {
            categories.add("data_analysis");
        }
        if (techSkills.contains("sql") || techSkills.contains("database")) {
            categories.add("database_management");
        }
        if (techSkills.contains("java") || techSkills.contains("spring")) {
            categories.add("enterprise_development");
        }
        if (softSkills.contains("leadership") || softSkills.contains("management")) {
            categories.add("leadership_application");
        }
        if (softSkills.contains("communication") || softSkills.contains("collaboration")) {
            categories.add("communication_skills");
        }
        
        // Specialization-based categories
        if (specialization.contains("cse") || specialization.contains("computer") || specialization.contains("it")) {
            categories.add("software_engineering");
            categories.add("system_design");
        }
        if (specialization.contains("finance") || specialization.contains("accounting")) {
            categories.add("financial_analysis");
            categories.add("financial_planning");
        }
        if (specialization.contains("marketing") || specialization.contains("business")) {
            categories.add("marketing_strategy");
            categories.add("business_development");
        }
        
        // Secondary focus: Education and Interests (40% of questions - 20 questions)
        String degree = userInfo.getDegree().toLowerCase();
        if (degree.contains("b.tech") || degree.contains("btech") || degree.contains("cs") || degree.contains("it")) {
            categories.add("technical_problem_solving");
            categories.add("engineering_principles");
        } else if (degree.contains("bba")) {
            categories.add("business_analysis");
            categories.add("operational_excellence");
        } else if (degree.contains("b.com") || degree.contains("bcom")) {
            categories.add("commercial_awareness");
            categories.add("financial_literacy");
        } else if (degree.contains("mba")) {
            categories.add("strategic_thinking");
            categories.add("organizational_management");
        }
        
        // Interests-based categories
        String interests = userInfo.getInterests() != null ? userInfo.getInterests().toLowerCase() : "";
        if (interests.contains("design") || interests.contains("product")) {
            categories.add("design_thinking");
        }
        if (interests.contains("data") || interests.contains("analytics")) {
            categories.add("data_driven_decision_making");
        }
        if (interests.contains("entrepreneurship") || interests.contains("startup")) {
            categories.add("entrepreneurial_mindset");
        }
        
        // Ensure we have enough categories for the target number of questions
        // If not enough, add generic career alignment categories
        if (categories.size() < 10) {
            categories.add("career_alignment");
            categories.add("domain_expertise");
            categories.add("professional_application");
        }
        
        // Ensure we have at least 5 categories to cycle through
        while (categories.size() < 5) {
            categories.add("general_career_alignment");
        }
        
        return generateSectionQuestionsWithOpenAI(3, categories, "SCENARIO", userInfo);
    }

    private List<Question> buildAptitudeSectionPlaceholder() {
        List<String> categories = Arrays.asList(
                "numerical", "verbal", "situational", "abstract", "logical");
        return generateSectionQuestionsPlaceholder(1, categories, "MCQ");
    }

    private List<Question> buildPersonalitySectionPlaceholder(UserInfo userInfo) {
        List<String> categories = new ArrayList<>();
        
        // Core personality categories
        categories.add("conflict_resolution");
        categories.add("attention_to_detail");
        categories.add("leadership");
        categories.add("adaptability");
        categories.add("big_five_openness");
        categories.add("big_five_conscientiousness");
        categories.add("big_five_extraversion");
        categories.add("big_five_agreeableness");
        categories.add("big_five_neuroticism");
        
        // Add soft skills and hobbies categories if available
        if (userInfo != null) {
            String softSkills = userInfo.getSoftSkills() != null ? userInfo.getSoftSkills().toLowerCase() : "";
            String hobbies = userInfo.getHobbies() != null ? userInfo.getHobbies().toLowerCase() : "";
            
            if (softSkills.contains("communication")) {
                categories.add("communication_effectiveness");
            }
            if (softSkills.contains("teamwork")) {
                categories.add("teamwork_and_collaboration");
            }
            if (hobbies.contains("reading")) {
                categories.add("intellectual_curiosity");
            }
            if (hobbies.contains("sport") || hobbies.contains("fitness")) {
                categories.add("discipline_and_commitment");
            }
        }
        
        // Ensure we have at least the core categories
        if (categories.size() < 9) {
            categories = Arrays.asList(
                    "conflict_resolution",
                    "attention_to_detail",
                    "leadership",
                    "adaptability",
                    "big_five_openness",
                    "big_five_conscientiousness",
                    "big_five_extraversion",
                    "big_five_agreeableness",
                    "big_five_neuroticism");
        }
        
        return generateSectionQuestionsPlaceholder(2, categories, "LIKERT");
    }

    private List<Question> buildDomainSectionPlaceholder(UserInfo userInfo) {
        // Use same category logic as buildDomainSection for consistency
        List<String> categories = new ArrayList<>();
        
        String techSkills = userInfo.getTechnicalSkills() != null ? userInfo.getTechnicalSkills().toLowerCase() : "";
        String softSkills = userInfo.getSoftSkills() != null ? userInfo.getSoftSkills().toLowerCase() : "";
        String specialization = userInfo.getSpecialization() != null ? userInfo.getSpecialization().toLowerCase() : "";
        String degree = userInfo.getDegree() != null ? userInfo.getDegree().toLowerCase() : "";
        
        // Add skill and specialization based categories
        if (techSkills.contains("react") || techSkills.contains("javascript")) {
            categories.add("frontend_development");
        }
        if (techSkills.contains("python") || techSkills.contains("data")) {
            categories.add("data_analysis");
        }
        if (specialization.contains("cse") || specialization.contains("computer")) {
            categories.add("software_engineering");
        }
        if (specialization.contains("finance")) {
            categories.add("financial_analysis");
        }
        if (degree.contains("b.tech") || degree.contains("btech")) {
            categories.add("technical_problem_solving");
        } else if (degree.contains("bba")) {
            categories.add("business_analysis");
        }
        
        // Fallback to generic categories if needed
        if (categories.isEmpty()) {
            categories = Arrays.asList("career_alignment", "domain_expertise", "professional_application", "skill_application", "specialization_knowledge");
        }
        
        return generateSectionQuestionsPlaceholder(3, categories, "SCENARIO");
    }

    private List<Question> generateSectionQuestionsWithOpenAI(int sectionNumber, List<String> categories, 
                                                               String questionType, UserInfo userInfo) {
        int total = TOTAL_QUESTIONS_PER_SECTION;
        // Use consistent batch size of 10 for all sections for optimal performance
        int maxBatchSize = QUESTIONS_PER_BATCH;
        
        // Create all batch requests as Monos for parallel execution
        List<Mono<List<Question>>> batchMonos = new ArrayList<>();
        
        for (int batchStart = 0; batchStart < total; batchStart += maxBatchSize) {
            int batchSize = Math.min(maxBatchSize, total - batchStart);
            List<String> batchCategories = new ArrayList<>();
            for (int i = 0; i < batchSize; i++) {
                batchCategories.add(categories.get((batchStart + i) % categories.size()));
            }
            
            int finalBatchStart = batchStart;
            // Create async mono for each batch (non-blocking)
            Mono<List<Question>> batchMono = generateBatchWithOpenAIAsync(
                sectionNumber, batchCategories, questionType, finalBatchStart + 1, userInfo);
            batchMonos.add(batchMono);
        }
        
        // Execute all batches in parallel and collect results
        List<Question> results = new ArrayList<>();
        try {
            List<List<Question>> allBatches = Flux.merge(batchMonos)
                .collectList()
                .block();
            
            if (allBatches != null) {
                for (List<Question> batch : allBatches) {
                    results.addAll(batch);
                }
            }
            
            // Validation: Ensure exactly 40 questions are generated
            System.out.println("Section " + sectionNumber + " generated " + results.size() + " questions (expected: " + total + ")");
            
            // If we don't have exactly 40 questions, fill with placeholders for missing ones
            if (results.size() < total) {
                System.err.println("WARNING: Section " + sectionNumber + " only generated " + results.size() + 
                                 " questions. Filling remaining " + (total - results.size()) + " with placeholders.");
                int missing = total - results.size();

                // Section 2: prefer the curated backup bank instead of generic "Placeholder prompt..." questions.
                if (sectionNumber == 2) {
                    List<Question> backup = generateSection2BehavioralBackupQuestions(missing, questionType);
                    results.addAll(backup);
                    missing -= backup.size();
                }

                if (missing > 0) {
                    List<String> missingCategories = new ArrayList<>();
                    for (int i = 0; i < missing; i++) {
                        missingCategories.add(categories.get((results.size() + i) % categories.size()));
                    }
                    List<Question> placeholders = generateSectionQuestionsPlaceholderBatch(
                        sectionNumber, missingCategories, questionType, results.size() + 1);
                    results.addAll(placeholders);
                }

                System.out.println("Section " + sectionNumber + " now has " + results.size() + " questions after adding placeholders.");
            }
            
        } catch (Exception e) {
            System.err.println("Error in parallel question generation: " + e.getMessage());
            e.printStackTrace();
            // Fallback: generate placeholder questions
            return generateSectionQuestionsPlaceholder(sectionNumber, categories, questionType);
        }
        
        return results;
    }

    private List<Question> generateBatchWithOpenAI(int sectionNumber, List<String> categories, 
                                                    String questionType, int startIndex, UserInfo userInfo) {
        try {
            String prompt = buildPromptForBatch(sectionNumber, categories, questionType, startIndex, userInfo);
            OpenAIRequest request = new OpenAIRequest(prompt);
            
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
                return parseQuestionsFromResponse(content, sectionNumber, categories, questionType, startIndex);
            }
        } catch (Exception e) {
            System.err.println("Error calling OpenAI API: " + e.getMessage());
            e.printStackTrace();
        }
        
        return generateSectionQuestionsPlaceholderBatch(sectionNumber, categories, questionType, startIndex);
    }

    /**
     * Async version of generateBatchWithOpenAI for parallel execution.
     * Returns a Mono that emits a list of questions when the API call completes.
     */
    private Mono<List<Question>> generateBatchWithOpenAIAsync(int sectionNumber, List<String> categories, 
                                                               String questionType, int startIndex, UserInfo userInfo) {
        String prompt = buildPromptForBatch(sectionNumber, categories, questionType, startIndex, userInfo);
        OpenAIRequest request = new OpenAIRequest(prompt);
        
        WebClient webClient = webClientBuilder
            .baseUrl(OPENAI_API_URL)
            .defaultHeader("Authorization", "Bearer " + openAiApiKey)
            .defaultHeader("Content-Type", "application/json")
            .build();
        
        return webClient.post()
            .bodyValue(request)
            .retrieve()
            .bodyToMono(OpenAIResponse.class)
            .map(response -> {
                if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                    String content = response.getChoices().get(0).getMessage().getContent();
                    return parseQuestionsFromResponse(content, sectionNumber, categories, questionType, startIndex);
                }
                return generateSectionQuestionsPlaceholderBatch(sectionNumber, categories, questionType, startIndex);
            })
            .onErrorResume(e -> {
                System.err.println("Error calling OpenAI API for batch starting at " + startIndex + ": " + e.getMessage());
                e.printStackTrace();
                return Mono.just(generateSectionQuestionsPlaceholderBatch(sectionNumber, categories, questionType, startIndex));
            });
    }

    private String buildPromptForBatch(int sectionNumber, List<String> categories, String questionType, 
                                       int startIndex, UserInfo userInfo) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a psychometric assessment question generator. Generate ")
              .append(categories.size())
              .append(" high-quality questions for a psychometric test.\n\n");
        
        if (sectionNumber == 1) {
            prompt.append("Section: Aptitude & Cognitive Assessment\n");
            prompt.append("Question Type: Multiple Choice (MCQ)\n");
            prompt.append("Difficulty Level: HARD (Advanced cognitive assessment requiring multi-step reasoning)\n\n");
            
            prompt.append("Aptitude Question Design Requirements:\n");
            prompt.append("1. NUMERICAL REASONING:\n");
            prompt.append("   - Use complex multi-step problems requiring 3+ operations\n");
            prompt.append("   - Include percentage calculations, ratios, proportions, and compound operations\n");
            prompt.append("   - Problems should involve real-world business scenarios (profit/loss, investments, time-speed-distance)\n");
            prompt.append("   - Use numbers that don't simplify easily to test calculation accuracy\n");
            prompt.append("   - Example difficulty: 'A product's price increased by 20%, then decreased by 15%. If the final price is $408, what was the original price?'\n");
            prompt.append("   - Include data interpretation questions with tables or complex numerical patterns\n\n");
            
            prompt.append("2. VERBAL REASONING:\n");
            prompt.append("   - Use advanced vocabulary and complex sentence structures\n");
            prompt.append("   - Include analogies requiring deep understanding of relationships\n");
            prompt.append("   - Test critical reading comprehension with inference-based questions\n");
            prompt.append("   - Include sentence completion requiring contextual and semantic understanding\n");
            prompt.append("   - Use vocabulary at graduate level (GRE/GMAT difficulty)\n");
            prompt.append("   - Example: Analogy questions like 'Ephemeral : Permanent :: Verbose : ?' or complex reading passages\n\n");
            
            prompt.append("3. ABSTRACT REASONING:\n");
            prompt.append("   - Create complex pattern recognition problems with multiple transformation rules\n");
            prompt.append("   - Use sequences involving rotation, reflection, addition/removal of elements, and color changes\n");
            prompt.append("   - Include matrix reasoning problems with 2-3 simultaneous patterns\n");
            prompt.append("   - Test spatial visualization and mental rotation abilities\n");
            prompt.append("   - Patterns should not be immediately obvious - require deep analysis\n\n");
            
            prompt.append("4. LOGICAL REASONING:\n");
            prompt.append("   - Include complex syllogisms with 3+ premises\n");
            prompt.append("   - Use conditional logic problems (if-then statements with multiple conditions)\n");
            prompt.append("   - Include logical puzzles requiring elimination and deduction\n");
            prompt.append("   - Test understanding of necessary vs sufficient conditions\n");
            prompt.append("   - Include problems with negations and complex logical operators\n");
            prompt.append("   - Example: 'If all A are B, some B are C, and no C are D, which statement must be true?'\n\n");
            
            prompt.append("5. SITUATIONAL/PROBLEM SOLVING:\n");
            prompt.append("   - Present complex workplace scenarios requiring analytical thinking\n");
            prompt.append("   - Include problems with multiple constraints and optimization requirements\n");
            prompt.append("   - Test decision-making with incomplete information\n");
            prompt.append("   - Require prioritization and trade-off analysis\n");
            prompt.append("   - Include data-driven decision scenarios\n\n");
            
            prompt.append("General Requirements:\n");
            prompt.append("- ALL questions must be at ADVANCED difficulty level, suitable for challenging graduate-level candidates\n");
            prompt.append("- Avoid simple arithmetic, basic vocabulary, or obvious patterns\n");
            prompt.append("- Distractors (wrong options) should be plausible and require careful analysis to eliminate\n");
            prompt.append("- Each question should take 60-90 seconds of focused thinking to solve\n");
            prompt.append("- Questions should genuinely test cognitive ability, not just recall\n");
            prompt.append("- Ensure mathematical precision and logical correctness in all questions\n\n");
        } else if (sectionNumber == 2) {
            prompt.append("Section: Behavioral & Personality Assessment (Section 2)\n");
            prompt.append("Question Format: Situational Judgment Test (SJT), scenario-based and objectively scorable.\n");

            // Include soft skills and hobbies information for personalized questions
            if (userInfo.getSoftSkills() != null && !userInfo.getSoftSkills().trim().isEmpty()) {
                prompt.append("User Soft Skills: ").append(userInfo.getSoftSkills()).append("\n");
            }
            if (userInfo.getHobbies() != null && !userInfo.getHobbies().trim().isEmpty()) {
                prompt.append("User Hobbies: ").append(userInfo.getHobbies()).append("\n");
            }

            prompt.append("\nBehavioral Question Design Requirements:\n");
            prompt.append("1. For each question, write a short, clear stem that directly describes the situation and ends with an explicit question, e.g.:\n");
            prompt.append("   - \"While leading a project, a better approach is suggested by a junior team member. What do you do?\"\n");
            prompt.append("   - \"Two teammates disagree strongly during a discussion. What is the best action?\"\n");
            prompt.append("2. Focus only on observable actions, decisions, or outcomes—no abstract emotions, unverifiable internal states, or self‑labels.\n");
            prompt.append("3. Do NOT use Agree/Disagree scales or statements like \"I feel\", \"I believe\", \"I am\", \"I see myself as\".\n");
            prompt.append("4. For each question, generate exactly 4 concrete action options that describe what the person DOES (A/B/C/D style behaviors like the examples above).\n");
            prompt.append("5. For each question, there should be one clearly BEST option (highest effectiveness) and the others should be clearly less effective.\n");
            prompt.append("   Each option must represent a HIGH, MEDIUM, or LOW effectiveness behavior for the target trait for that category:\n");
            prompt.append("   - For conflict_resolution: behaviors that de-escalate, seek win‑win, and use constructive communication are high effectiveness.\n");
            prompt.append("   - For attention_to_detail / accuracy: behaviors that verify information, double‑check critical data, and correct errors are high effectiveness.\n");
            prompt.append("   - For leadership: behaviors that take ownership, align the team, give clear direction, and support others are high effectiveness.\n");
            prompt.append("   - For adaptability: behaviors that remain flexible, adjust plans sensibly, and stay effective under change are high effectiveness.\n");
            prompt.append("   - For big_five_* categories, treat the category as the target trait (e.g., big_five_conscientiousness = conscientious behavior).\n");
            prompt.append("6. Avoid vague outcomes like \"everyone is happy\"; instead describe concrete, externally visible results when needed.\n");

            prompt.append("\nScoring & JSON Output Requirements:\n");
            prompt.append("- For EACH question, output a JSON object with:\n");
            prompt.append("  - \"scenario\": short 1–3 line real-world description of the situation (can be the same as the question stem without the final question).\n");
            prompt.append("  - \"prompt\": a brief question asking what the person should do next (full stem as shown to the user).\n");
            prompt.append("  - \"options\": an array of 4–5 objects, each with:\n");
            prompt.append("      { \"text\": \"concrete action choice\",\n");
            prompt.append("        \"traitImpactScore\": <number>,  // 0, 25, 50, 75, or 100 where 0 = very ineffective, 100 = highly effective\n");
            prompt.append("        \"effectivenessLevel\": \"LOW\" | \"MEDIUM\" | \"HIGH\",\n");
            prompt.append("        \"rationale\": \"1 short sentence explaining why this behavior is effective or ineffective\"\n");
            prompt.append("      }\n");
            prompt.append("- traitImpactScore MUST be chosen so that higher scores always mean better behavior for the target trait of that category.\n");
            prompt.append("- Options must be behavior-based and mutually distinct; do not use synonyms or soft rephrases of the same behavior.\n");
            prompt.append("- STRICTLY FORBIDDEN in option text and rationale: first-person self‑descriptions (\"I am\", \"I see myself as\"), pure feelings without actions (\"I feel anxious\"), or unverifiable claims.\n");
            prompt.append("- REQUIRED: all content must be programmatically scorable from the traitImpactScore values alone.\n");
            prompt.append("- CRITICAL: RANDOMIZE the position of the highest-scoring option (traitImpactScore=100). Do NOT always place it in the same position (e.g., always second). The best answer should appear at different positions across questions (first, second, third, or fourth option randomly).\n");

            prompt.append("\nQuestion Focus:\n");
            prompt.append("Generate questions that assess core behavioral topics (conflict resolution, accuracy/attention to detail, leadership, adaptability, and Big Five traits) ");
            prompt.append("AND behavioral aspects related to the user's soft skills and hobbies. ");
            prompt.append("When a category relates to their mentioned soft skills or hobbies, personalize the scenario to reflect those specific areas.\n");
        } else {
            prompt.append("Section: Domain and Career Alignment Assessment\n");
            prompt.append("Question Type: Scenario-based\n");
            prompt.append("Difficulty Level: MEDIUM (not too easy, not too hard - appropriate for someone with their background)\n\n");
            
            prompt.append("User Background:\n");
            prompt.append("- Education/Degree: ").append(userInfo.getDegree() != null ? userInfo.getDegree() : "Not specified").append("\n");
            prompt.append("- Specialization: ").append(userInfo.getSpecialization() != null ? userInfo.getSpecialization() : "Not specified").append("\n");
            
            if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().trim().isEmpty()) {
                prompt.append("- Technical Skills: ").append(userInfo.getTechnicalSkills()).append("\n");
            }
            if (userInfo.getSoftSkills() != null && !userInfo.getSoftSkills().trim().isEmpty()) {
                prompt.append("- Soft Skills: ").append(userInfo.getSoftSkills()).append("\n");
            }
            if (userInfo.getInterests() != null && !userInfo.getInterests().trim().isEmpty()) {
                prompt.append("- Interests: ").append(userInfo.getInterests()).append("\n");
            }
            if (userInfo.getCareerInterest() != null && !userInfo.getCareerInterest().trim().isEmpty()) {
                prompt.append("- Career Interest: ").append(userInfo.getCareerInterest()).append("\n");
            }
            
            prompt.append("\nQuestion Generation Guidelines:\n");
            prompt.append("1. PRIORITY: Generate MOST questions (60-70%) based on the user's Technical Skills and Specialization\n");
            prompt.append("2. SECONDARY: Generate some questions (20-30%) based on their Education/Degree and Interests\n");
            prompt.append("3. All questions should be at MEDIUM difficulty level - challenging enough to assess competency but not overly complex\n");
            prompt.append("4. Questions should test practical application of skills, domain knowledge, and career alignment\n");
            prompt.append("5. Make questions relevant to their stated specialization and technical skills\n");
            prompt.append("6. Include scenario-based questions that relate to real-world applications of their skills\n");
        }
        
        prompt.append("\nCategories for this batch:\n");
        for (int i = 0; i < categories.size(); i++) {
            prompt.append((i + 1)).append(". ").append(categories.get(i)).append("\n");
        }
        
        prompt.append("\nGenerate exactly ").append(categories.size()).append(" questions, one for each category.\n");
        prompt.append("Return ONLY a valid JSON array with no additional text or markdown.\n");
        if (sectionNumber == 2) {
            prompt.append("\n**CRITICAL POSITION RANDOMIZATION REQUIREMENT:**\n");
            prompt.append("The option with traitImpactScore=100 (the best answer) MUST appear at DIFFERENT positions across your questions:\n");
            prompt.append("- Question 1: Best answer could be at position 3 (index 2)\n");
            prompt.append("- Question 2: Best answer could be at position 1 (index 0)\n");
            prompt.append("- Question 3: Best answer could be at position 4 (index 3)\n");
            prompt.append("- Question 4: Best answer could be at position 2 (index 1)\n");
            prompt.append("Continue this pattern throughout ALL questions. NO more than 30% of questions should have the best answer in the same position.\n");
            prompt.append("This is a HARD REQUIREMENT for test validity. Distribution should be roughly equal across all 4 positions.\n\n");
            
            prompt.append("Each question must follow this JSON shape:\n");
            prompt.append("[\n");
            prompt.append("  {\n");
            prompt.append("    \"scenario\": \"2–3 line real-world situation\",\n");
            prompt.append("    \"prompt\": \"What should the person do next?\",\n");
            prompt.append("    \"options\": [\n");
            prompt.append("      { \"text\": \"action 1\", \"traitImpactScore\": 25, \"effectivenessLevel\": \"LOW\", \"rationale\": \"...\" },\n");
            prompt.append("      { \"text\": \"action 2\", \"traitImpactScore\": 50, \"effectivenessLevel\": \"MEDIUM\", \"rationale\": \"...\" },\n");
            prompt.append("      { \"text\": \"action 3\", \"traitImpactScore\": 0, \"effectivenessLevel\": \"LOW\", \"rationale\": \"...\" },\n");
            prompt.append("      { \"text\": \"action 4\", \"traitImpactScore\": 100, \"effectivenessLevel\": \"HIGH\", \"rationale\": \"...\" }\n");
            prompt.append("    ]\n");
            prompt.append("  },\n");
            prompt.append("  {\n");
            prompt.append("    \"scenario\": \"another situation\",\n");
            prompt.append("    \"prompt\": \"What should be done?\",\n");
            prompt.append("    \"options\": [\n");
            prompt.append("      { \"text\": \"action 1\", \"traitImpactScore\": 100, \"effectivenessLevel\": \"HIGH\", \"rationale\": \"...\" },\n");
            prompt.append("      { \"text\": \"action 2\", \"traitImpactScore\": 25, \"effectivenessLevel\": \"LOW\", \"rationale\": \"...\" },\n");
            prompt.append("      { \"text\": \"action 3\", \"traitImpactScore\": 50, \"effectivenessLevel\": \"MEDIUM\", \"rationale\": \"...\" },\n");
            prompt.append("      { \"text\": \"action 4\", \"traitImpactScore\": 0, \"effectivenessLevel\": \"LOW\", \"rationale\": \"...\" }\n");
            prompt.append("    ]\n");
            prompt.append("  }\n");
            prompt.append("]\n");
            prompt.append("^^^ NOTICE: First question has best answer at position 4, second question at position 1. VARY THIS THROUGHOUT! ^^^\n\n");
        } else {
            prompt.append("Each question should be an object with this exact format:\n");
            prompt.append("[\n");
            prompt.append("  {\n");
            prompt.append("    \"prompt\": \"The actual question text here\",\n");
            if ("LIKERT".equals(questionType)) {
                prompt.append("    \"options\": [\"Strongly disagree\", \"Disagree\", \"Neutral\", \"Agree\", \"Strongly agree\"],\n");
            } else {
                prompt.append("    \"options\": [\"First option text\", \"Second option text\", \"Third option text\", \"Fourth option text\"],\n");
            }
            prompt.append("    \"correctOptionIndex\": 0  // Index (0-based) of the correct answer option\n");
            prompt.append("  },\n");
            prompt.append("  ... (repeat for each question)\n");
            prompt.append("]\n\n");
            prompt.append("CRITICAL: Each question MUST include a \"correctOptionIndex\" field (0-based index) indicating which option is the correct answer.\n");
        }
        if (sectionNumber == 1) {
            prompt.append("IMPORTANT: Return ONLY the JSON array, no explanations, no markdown code blocks, just pure JSON. ");
            prompt.append("Make each question CHALLENGING and ADVANCED, requiring deep analytical thinking and multiple steps to solve. ");
            prompt.append("These questions should differentiate high-performing candidates from average ones. ");
            prompt.append("Difficulty level must be HARD throughout - do not include easy or basic questions. ");
            prompt.append("Wrong answer options should be plausible and require careful reasoning to eliminate. ");
        } else if (sectionNumber == 3) {
            prompt.append("IMPORTANT: Return ONLY the JSON array, no explanations, no markdown code blocks, just pure JSON. ");
            prompt.append("Make each question relevant, realistic, professional, and appropriate for psychometric assessment. ");
            prompt.append("Focus questions on practical application of skills and specialization. ");
            prompt.append("Difficulty should be MEDIUM - assess competency without being overly complex. ");
            if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().trim().isEmpty()) {
                prompt.append("Prioritize questions that test knowledge and application of: ").append(userInfo.getTechnicalSkills()).append(". ");
            }
            if (userInfo.getSpecialization() != null && !userInfo.getSpecialization().trim().isEmpty()) {
                prompt.append("Ensure questions align with specialization: ").append(userInfo.getSpecialization()).append(". ");
            }
        } else {
            // Section 2: Behavioral
            prompt.append("IMPORTANT: Return ONLY the JSON array, no explanations, no markdown code blocks, just pure JSON. ");
            prompt.append("Make each question relevant, realistic, professional, and appropriate for psychometric assessment. ");
            prompt.append("Ensure all questions are suitable for someone with degree: ").append(userInfo.getDegree())
                   .append(", specialization: ").append(userInfo.getSpecialization()).append(". ");
            prompt.append("\n\n**FINAL REMINDER - ANSWER POSITION DISTRIBUTION:**\n");
            prompt.append("Before submitting your response, verify that the position of traitImpactScore=100 is distributed across all questions:\n");
            prompt.append("- Approximately 25% of questions should have the best answer (score=100) at position 1 (index 0)\n");
            prompt.append("- Approximately 25% at position 2 (index 1)\n");
            prompt.append("- Approximately 25% at position 3 (index 2)\n");
            prompt.append("- Approximately 25% at position 4 (index 3)\n");
            prompt.append("DO NOT cluster all best answers in position 1 or any single position. Actively distribute them evenly.");
        }
        
        return prompt.toString();
    }

    private List<Question> parseQuestionsFromResponse(String content, int sectionNumber, 
                                                       List<String> categories, String questionType, int startIndex) {
        List<Question> questions = new ArrayList<>();
        
        try {
            String jsonContent = extractJsonArray(content);
            ObjectMapper mapper = new ObjectMapper();
            
            @SuppressWarnings("unchecked")
            List<java.util.Map<String, Object>> questionList = mapper.readValue(jsonContent, List.class);
            
            // Parse all questions returned by OpenAI (don't limit by categories.size())
            for (int i = 0; i < questionList.size(); i++) {
                java.util.Map<String, Object> qData = questionList.get(i);
                Question question = new Question();
                question.setId(UUID.randomUUID().toString());
                question.setSectionNumber(sectionNumber);
                // Use modulo to wrap around categories if needed
                question.setCategory(categories.get(i % categories.size()));
                question.setQuestionType(questionType);

                // Section 2: Behavioral SJT with scenario, per-option scores, and rationales
                if (sectionNumber == 2) {
                    String scenario = (String) qData.get("scenario");
                    String promptText = (String) qData.get("prompt");
                    if (scenario == null && promptText != null) {
                        scenario = promptText;
                    }
                    question.setScenario(scenario);

                    // For UI, show a complete stem: scenario + explicit question
                    String combinedPrompt;
                    if (scenario != null && promptText != null && !promptText.isBlank()) {
                        combinedPrompt = scenario + " " + promptText;
                    } else if (scenario != null) {
                        combinedPrompt = scenario;
                    } else {
                        combinedPrompt = promptText;
                    }
                    question.setPrompt(combinedPrompt);

                    @SuppressWarnings("unchecked")
                    List<Object> rawOptions = (List<Object>) qData.get("options");
                    List<String> optionTexts = new ArrayList<>();
                    List<Integer> impactScores = new ArrayList<>();
                    List<String> rationales = new ArrayList<>();

                    if (rawOptions != null) {
                        for (Object optObj : rawOptions) {
                            if (optObj instanceof java.util.Map) {
                                @SuppressWarnings("unchecked")
                                java.util.Map<String, Object> optMap = (java.util.Map<String, Object>) optObj;
                                Object textObj = optMap.get("text");
                                Object scoreObj = optMap.get("traitImpactScore");
                                Object rationaleObj = optMap.get("rationale");

                                if (textObj instanceof String) {
                                    optionTexts.add((String) textObj);
                                }
                                if (scoreObj instanceof Number) {
                                    impactScores.add(((Number) scoreObj).intValue());
                                } else {
                                    // Default mid effectiveness if missing
                                    impactScores.add(50);
                                }
                                if (rationaleObj instanceof String) {
                                    rationales.add((String) rationaleObj);
                                } else {
                                    rationales.add("");
                                }
                            } else if (optObj instanceof String) {
                                // Fallback: string-only options
                                optionTexts.add((String) optObj);
                                impactScores.add(50);
                                rationales.add("");
                            }
                        }
                    }

                    question.setOptions(optionTexts.isEmpty() ? defaultOptions(questionType) : optionTexts);
                    question.setTraitImpactScores(impactScores);
                    question.setRationales(rationales);
                    
                    // Set correctOptionIndex to the option with the highest traitImpactScore (typically 100)
                    Integer correctIndex = null;
                    if (!impactScores.isEmpty()) {
                        int maxScore = impactScores.get(0);
                        correctIndex = 0;
                        for (int idx = 1; idx < impactScores.size(); idx++) {
                            if (impactScores.get(idx) > maxScore) {
                                maxScore = impactScores.get(idx);
                                correctIndex = idx;
                            }
                        }
                    }
                    question.setCorrectOptionIndex(correctIndex);
                } else {
                    // Sections 1 & 3: Aptitude and Domain questions
                    question.setPrompt((String) qData.get("prompt"));

                    @SuppressWarnings("unchecked")
                    List<String> options = (List<String>) qData.get("options");
                    if (options != null) {
                        question.setOptions(options);
                    } else {
                        question.setOptions(defaultOptions(questionType));
                    }

                    // Parse correctOptionIndex from OpenAI response
                    Integer correctOptionIndex = null;
                    Object correctIndexObj = qData.get("correctOptionIndex");
                    if (correctIndexObj instanceof Number) {
                        correctOptionIndex = ((Number) correctIndexObj).intValue();
                        // Validate the index is within bounds
                        if (correctOptionIndex < 0 || (question.getOptions() != null && correctOptionIndex >= question.getOptions().size())) {
                            // If invalid, default to 0 for MCQ, null for others
                            correctOptionIndex = "MCQ".equals(questionType) ? 0 : null;
                        }
                    } else {
                        // Fallback: default to 0 for MCQ questions if not provided
                        correctOptionIndex = "MCQ".equals(questionType) ? 0 : null;
                    }
                    question.setCorrectOptionIndex(correctOptionIndex);
                }

                questions.add(question);
            }
        } catch (Exception e) {
            System.err.println("Error parsing OpenAI response: " + e.getMessage());
            return generateSectionQuestionsPlaceholderBatch(sectionNumber, categories, questionType, startIndex);
        }
        
        return questions;
    }

    private String extractJsonArray(String content) {
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
        
        Pattern pattern = Pattern.compile("\\[.*\\]", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group();
        }
        return content;
    }

    private List<Question> generateSectionQuestionsPlaceholder(int sectionNumber, List<String> categories, String questionType) {
        List<Question> results = new ArrayList<>();
        int total = TOTAL_QUESTIONS_PER_SECTION;
        for (int i = 0; i < total; i++) {
            String category = categories.get(i % categories.size());
            if (sectionNumber == 2) {
                // For behavioral section placeholders, use curated backup questions when possible.
                Question backupTemplate = SECTION2_BEHAVIORAL_BACKUP_BY_CATEGORY.get(category);
                if (backupTemplate != null) {
                    results.add(cloneBehavioralTemplate(backupTemplate, questionType));
                } else {
                    results.add(buildGenericPlaceholderQuestion(sectionNumber, category, questionType, (i + 1)));
                }
            } else {
                results.add(buildGenericPlaceholderQuestion(sectionNumber, category, questionType, (i + 1)));
            }
        }
        return results;
    }

    private List<Question> generateSectionQuestionsPlaceholderBatch(int sectionNumber, List<String> categories, 
                                                                     String questionType, int startIndex) {
        List<Question> results = new ArrayList<>();
        for (int i = 0; i < categories.size(); i++) {
            String category = categories.get(i);
            if (sectionNumber == 2) {
                Question backupTemplate = SECTION2_BEHAVIORAL_BACKUP_BY_CATEGORY.get(category);
                if (backupTemplate != null) {
                    results.add(cloneBehavioralTemplate(backupTemplate, questionType));
                } else {
                    results.add(buildGenericPlaceholderQuestion(sectionNumber, category, questionType, (startIndex + i)));
                }
            } else {
                results.add(buildGenericPlaceholderQuestion(sectionNumber, category, questionType, (startIndex + i)));
            }
        }
        return results;
    }

    private List<String> defaultOptions(String questionType) {
        if ("LIKERT".equals(questionType)) {
            return Arrays.asList("Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree");
        }
        return Arrays.asList("Option A", "Option B", "Option C", "Option D");
    }

    private Question buildGenericPlaceholderQuestion(int sectionNumber, String category, String questionType, int index) {
        Question question = new Question();
        question.setId(UUID.randomUUID().toString());
        question.setSectionNumber(sectionNumber);
        question.setCategory(category);
        question.setQuestionType(questionType);
        question.setPrompt("Placeholder prompt for " + category + " question " + index + " in section "
                + sectionNumber + ". Replace with OpenAI generated text.");
        question.setOptions(defaultOptions(questionType));
        question.setCorrectOptionIndex("MCQ".equals(questionType) ? 0 : null);

        // For Section 2 (behavioral), add trait impact scores for proper scoring
        if (sectionNumber == 2) {
            question.setTraitImpactScores(Arrays.asList(0, 25, 50, 75, 100));
        }

        return question;
    }

    /**
     * Generates up to {@code count} curated backup questions for Section 2.
     * This is used when OpenAI returns fewer than expected questions (e.g., 37 instead of 40).
     */
    private List<Question> generateSection2BehavioralBackupQuestions(int count, String questionType) {
        if (count <= 0) {
            return Collections.emptyList();
        }
        List<Question> out = new ArrayList<>();
        for (int i = 0; i < SECTION2_BEHAVIORAL_BACKUP_TEMPLATES.size() && out.size() < count; i++) {
            out.add(cloneBehavioralTemplate(SECTION2_BEHAVIORAL_BACKUP_TEMPLATES.get(i), questionType));
        }
        return out;
    }

    private static Question cloneBehavioralTemplate(Question template, String questionType) {
        Question q = new Question();
        q.setId(UUID.randomUUID().toString());
        q.setSectionNumber(2);
        q.setCategory(template.getCategory());
        q.setQuestionType(questionType);
        q.setScenario(template.getScenario());
        q.setPrompt(template.getPrompt());
        q.setOptions(template.getOptions());
        q.setTraitImpactScores(template.getTraitImpactScores());
        q.setRationales(template.getRationales());
        q.setCorrectOptionIndex(template.getCorrectOptionIndex());
        return q;
    }

    private static Map<String, Question> indexBackupByCategory(List<Question> templates) {
        Map<String, Question> map = new HashMap<>();
        for (Question q : templates) {
            if (q.getCategory() != null && !q.getCategory().isBlank()) {
                map.put(q.getCategory(), q);
            }
        }
        return map;
    }

    /**
     * Curated backup questions provided by the team for Section 2 Behavioral, used if generation
     * returns fewer than 40 questions.
     */
    private static List<Question> buildSection2BehavioralBackupTemplates() {
        List<Question> out = new ArrayList<>();

        // 1) Conflict Resolution (Preferred: C)
        {
            Question q = new Question();
            q.setSectionNumber(2);
            q.setCategory("conflict_resolution");
            q.setScenario("Two team members strongly disagree on how to complete a task.");
            q.setPrompt("When two team members strongly disagree on how to complete a task, what do you usually do first?");
            q.setOptions(Arrays.asList(
                "Allow them to resolve it on their own",
                "Take control and decide the solution yourself",
                "Listen to both sides and help reach a compromise",
                "Escalate the issue to a senior authority"
            ));
            q.setCorrectOptionIndex(2);
            q.setTraitImpactScores(Arrays.asList(50, 25, 100, 0));
            q.setRationales(Arrays.asList(
                "Gives them space, but may allow the disagreement to intensify without guidance.",
                "Ends the conflict quickly, but can reduce ownership and miss important context.",
                "Balances viewpoints and de-escalates tension while keeping the team aligned.",
                "Escalating immediately can undermine trust and skips direct resolution."
            ));
            out.add(q);
        }

        // 2) Accuracy & Attention to Detail (Preferred: B)
        {
            Question q = new Question();
            q.setSectionNumber(2);
            q.setCategory("attention_to_detail");
            q.setScenario("You notice a small error in your work just before submission, but fixing it may delay the deadline.");
            q.setPrompt("What do you do?");
            q.setOptions(Arrays.asList(
                "Submit the work as it is to meet the deadline",
                "Fix the error and inform the concerned person about the delay",
                "Ignore the error since it is minor",
                "Ask someone else to review and decide"
            ));
            q.setCorrectOptionIndex(1);
            q.setTraitImpactScores(Arrays.asList(25, 100, 0, 50));
            q.setRationales(Arrays.asList(
                "Meets timing but risks quality and credibility due to a known error.",
                "Protects quality and communicates proactively about impact to timelines.",
                "Knowingly shipping an error shows low accountability for outcomes.",
                "Seeking help can reduce risk, but avoids taking ownership of the fix."
            ));
            out.add(q);
        }

        // 3) Leadership (Preferred: C)
        {
            Question q = new Question();
            q.setSectionNumber(2);
            q.setCategory("leadership");
            q.setScenario("Your team is falling behind schedule and motivation is low.");
            q.setPrompt("What is your most likely action?");
            q.setOptions(Arrays.asList(
                "Focus only on completing your own assigned tasks",
                "Inform the manager about the team’s performance",
                "Motivate the team, redistribute tasks, and set short goals",
                "Wait for instructions from leadership"
            ));
            q.setCorrectOptionIndex(2);
            q.setTraitImpactScores(Arrays.asList(0, 50, 100, 25));
            q.setRationales(Arrays.asList(
                "Helps your output, but doesn’t address the team’s shared risk or coordination needs.",
                "Escalation can help, but it doesn’t directly restore momentum or clarity for the team.",
                "Creates structure, increases motivation, and improves execution through ownership and clarity.",
                "Waiting delays action and can worsen the schedule and morale."
            ));
            out.add(q);
        }

        // 4) Adaptability (Preferred: C)
        {
            Question q = new Question();
            q.setSectionNumber(2);
            q.setCategory("adaptability");
            q.setScenario("You are asked to work on a task that requires a tool or skill you are not familiar with.");
            q.setPrompt("How do you respond?");
            q.setOptions(Arrays.asList(
                "Decline the task due to lack of experience",
                "Ask for the task to be reassigned",
                "Learn the basics quickly and attempt the task",
                "Delay the task until proper training is provided"
            ));
            q.setCorrectOptionIndex(2);
            q.setTraitImpactScores(Arrays.asList(0, 25, 100, 50));
            q.setRationales(Arrays.asList(
                "Avoids short-term risk, but blocks growth and reduces contribution.",
                "May protect quality, but reduces flexibility and ownership.",
                "Shows learning agility and adapts while still delivering progress.",
                "Training can help, but delaying without action risks timeline and momentum."
            ));
            out.add(q);
        }

        // 5) Big Five – Emotional Stability & Conscientiousness (Preferred: D)
        {
            Question q = new Question();
            q.setSectionNumber(2);
            // Map to an existing category where "better" behavior aligns with higher score.
            q.setCategory("big_five_conscientiousness");
            q.setScenario("You receive critical feedback on your work.");
            q.setPrompt("What is your usual reaction?");
            q.setOptions(Arrays.asList(
                "Feel discouraged and lose motivation",
                "Ignore the feedback",
                "Defend your work without considering the feedback",
                "Analyze the feedback and improve your performance"
            ));
            q.setCorrectOptionIndex(3);
            q.setTraitImpactScores(Arrays.asList(25, 0, 25, 100));
            q.setRationales(Arrays.asList(
                "A setback is normal, but losing motivation reduces follow-through and growth.",
                "Ignoring feedback misses an opportunity to improve and align expectations.",
                "Defensiveness blocks learning and can damage collaboration.",
                "Processing feedback calmly and improving shows maturity and strong ownership."
            ));
            out.add(q);
        }

        return out;
    }
}


