package com.profiling.dto;

/**
 * Request DTO for chatbot chat endpoint
 */
public class ChatRequest {
    private String userMessage;
    private ChatState conversationState;

    public ChatRequest() {
    }

    public String getUserMessage() {
        return userMessage;
    }

    public void setUserMessage(String userMessage) {
        this.userMessage = userMessage;
    }

    public ChatState getConversationState() {
        return conversationState;
    }

    public void setConversationState(ChatState conversationState) {
        this.conversationState = conversationState;
    }
}

