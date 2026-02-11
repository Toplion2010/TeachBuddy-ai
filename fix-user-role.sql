-- Fix user role to teacher
-- This updates the current logged-in user's role to 'teacher'

-- First, let's see all users and their roles
SELECT id, email, role FROM profiles;

-- Update a specific user to be a teacher
-- Replace 'your-email@example.com' with your actual email
UPDATE profiles
SET role = 'teacher'
WHERE email = 'your-email@example.com';

-- Or update all users to be teachers (if you want everyone to be a teacher)
-- UPDATE profiles SET role = 'teacher';
