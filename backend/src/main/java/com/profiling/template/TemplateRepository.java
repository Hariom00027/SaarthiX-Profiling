package com.profiling.template;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TemplateRepository extends MongoRepository<TemplateEntity, String> {
    List<TemplateEntity> findAllByUserIdIsNull(); // Global templates
    List<TemplateEntity> findAllByUserId(String userId); // User custom templates
    Optional<TemplateEntity> findByIdAndUserId(String id, String userId);
    Optional<TemplateEntity> findByIdAndUserIdIsNull(String id); // Global template by id

    @Query("{ 'userId': null, $or: [ { 'enabled': true }, { 'enabled': { $exists: false } } ] }")
    List<TemplateEntity> findAllEnabledGlobalTemplates();

    @Query("{ 'id': ?0, 'userId': null, $or: [ { 'enabled': true }, { 'enabled': { $exists: false } } ] }")
    Optional<TemplateEntity> findEnabledByIdAndUserIdIsNull(String id);
}


