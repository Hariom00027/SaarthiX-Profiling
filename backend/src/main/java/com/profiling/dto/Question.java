package com.profiling.dto;

/**
 * DTO representing a single question
 */
public class Question {
    private String text;
    private int stage;
    private int index;

    public Question() {
    }

    public Question(String text, int stage, int index) {
        this.text = text;
        this.stage = stage;
        this.index = index;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public int getStage() {
        return stage;
    }

    public void setStage(int stage) {
        this.stage = stage;
    }

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }
}

