package com.profiling.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.profiling.model.psychometric.PsychometricSession;

@Repository
public interface PsychometricSessionRepository extends MongoRepository<PsychometricSession, String> {
}


