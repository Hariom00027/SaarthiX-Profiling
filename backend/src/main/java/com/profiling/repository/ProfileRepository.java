package com.profiling.repository;

import com.profiling.model.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends MongoRepository<Profile, String> {
    List<Profile> findAllByUserId(String userId);
    Optional<Profile> findByIdAndUserId(String id, String userId);
    void deleteAllByUserId(String userId);
}

