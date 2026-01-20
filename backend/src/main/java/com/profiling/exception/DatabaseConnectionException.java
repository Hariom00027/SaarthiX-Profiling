package com.profiling.exception;

import org.springframework.http.HttpStatus;

public class DatabaseConnectionException extends ApplicationException {

    public DatabaseConnectionException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message);
    }

    public DatabaseConnectionException(String message, Throwable cause) {
        super(HttpStatus.SERVICE_UNAVAILABLE, message, cause);
    }
}













