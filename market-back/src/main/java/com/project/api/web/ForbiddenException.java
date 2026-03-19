package com.project.api.web;

/**
 * 403 Forbidden - authenticated but not allowed (e.g. not owner).
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
