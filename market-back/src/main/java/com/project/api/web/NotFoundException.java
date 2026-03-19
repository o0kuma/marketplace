package com.project.api.web;

/**
 * 404 Not Found - resource does not exist.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
