package com.profiling.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when AI service operations fail (e.g., OpenAI API errors).
 * This exception provides meaningful error messages to the user.
 */
public class AIServiceException extends ApplicationException {

    public AIServiceException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }

    public AIServiceException(String message, Throwable cause) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message, cause);
    }
}
