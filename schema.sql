-- PostgreSQL schema for users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  age INTEGER CHECK (age >= 0),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Optimize sorting queries on created_at
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- Sample seed data
INSERT INTO users (first_name, last_name, email, phone, age)
VALUES 
  ('John', 'Doe', 'john.doe@example.com', '+1-555-0143', 28),
  ('Sarah', 'Connor', 'sarah.connor@example.com', '+1-555-0182', 34),
  ('Alex', 'Rivera', 'alex.rivera@example.com', '+1-555-0199', 22)
ON CONFLICT (email) DO NOTHING;
