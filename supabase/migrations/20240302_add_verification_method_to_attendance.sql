-- Add verification_method column to attendance table
ALTER TABLE attendance ADD COLUMN verification_method VARCHAR(20) DEFAULT 'geolocation'; 