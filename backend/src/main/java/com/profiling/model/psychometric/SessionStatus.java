package com.profiling.model.psychometric;

public enum SessionStatus {
    CREATED,
    GENERATING,
    /**
     * At least one section of questions is ready, remaining sections are still generating.
     * Used to allow the UI to start while background generation continues.
     */
    PARTIAL_READY,
    READY,
    IN_PROGRESS,
    COMPLETED,
    FAILED
}


