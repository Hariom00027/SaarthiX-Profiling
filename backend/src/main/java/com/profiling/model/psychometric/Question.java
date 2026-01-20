package com.profiling.model.psychometric;

import java.util.List;

public class Question {
    private String id;
    private int sectionNumber;
    private String category;
    private String prompt;
    private List<String> options;
    private Integer correctOptionIndex;
    private String questionType;

    /**
     * Optional short scenario text for situational questions (used primarily in
     * Section 2 behavioral SJTs). For legacy questions, this may be null and the
     * scenario will be embedded in the prompt.
     */
    private String scenario;

    /**
     * Optional per-option numeric impact scores (0-100) indicating effectiveness
     * for the target behavioral trait. Indexes align with the options list. Used
     * mainly for Section 2 behavioral / Big Five scoring.
     */
    private List<Integer> traitImpactScores;

    /**
     * Optional short rationale per option explaining why the behavior is effective
     * or ineffective. Indexes align with the options list.
     */
    private List<String> rationales;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getSectionNumber() {
        return sectionNumber;
    }

    public void setSectionNumber(int sectionNumber) {
        this.sectionNumber = sectionNumber;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public Integer getCorrectOptionIndex() {
        return correctOptionIndex;
    }

    public void setCorrectOptionIndex(Integer correctOptionIndex) {
        this.correctOptionIndex = correctOptionIndex;
    }

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public String getScenario() {
        return scenario;
    }

    public void setScenario(String scenario) {
        this.scenario = scenario;
    }

    public List<Integer> getTraitImpactScores() {
        return traitImpactScores;
    }

    public void setTraitImpactScores(List<Integer> traitImpactScores) {
        this.traitImpactScores = traitImpactScores;
    }

    public List<String> getRationales() {
        return rationales;
    }

    public void setRationales(List<String> rationales) {
        this.rationales = rationales;
    }
}


