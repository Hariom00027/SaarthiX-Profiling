// MongoDB initialization script for profiling database

// Switch to the profiling_db database
db = db.getSiblingDB('profiling_db');

// Create collections if they don't exist
db.createCollection('profiles');

// Create indexes for better performance (using MongoDB's default _id field)
db.profiles.createIndex({ "name": 1 });
db.profiles.createIndex({ "email": 1 });

print("MongoDB initialization completed successfully!");
print("Database 'profiling_db' created with profiles collection and indexes.");