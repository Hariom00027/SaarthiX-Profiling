package com.profiling.exception;

import org.springframework.http.HttpStatus;

public class DataSaveException extends ApplicationException {

    public DataSaveException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message);
    }

    public DataSaveException(String message, Throwable cause) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message, cause);
    }
}













