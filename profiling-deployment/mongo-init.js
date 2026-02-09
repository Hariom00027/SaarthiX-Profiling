// MongoDB initialization script for saarthix database

// Switch to the saarthix database
db = db.getSiblingDB('saarthix');

// Create collections if they don't exist
db.createCollection('profiles');

// Create indexes for better performance (using MongoDB's default _id field)
db.profiles.createIndex({ "name": 1 });
db.profiles.createIndex({ "email": 1 });

print("SaarthiX MongoDB initialization completed successfully!");
print("Database 'saarthix' initialized with profiles collection and indexes.");