-- Drop old tables if they exist
DROP TABLE IF EXISTS visited_countries, users, countries;

-- Users
CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(15) UNIQUE NOT NULL,
  color VARCHAR(15)
);

-- Visited countries
CREATE TABLE visited_countries(
  id SERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  user_id INTEGER REFERENCES users(id)
);

-- Countries (lookup table)
CREATE TABLE countries (
  country_code CHAR(2) PRIMARY KEY,
  country_name TEXT NOT NULL
);

-- Seed data
INSERT INTO users (name, color)
VALUES ('Angela', 'teal'), ('Jack', 'powderblue')
ON CONFLICT (name) DO NOTHING;

INSERT INTO visited_countries (country_code, user_id)
VALUES ('FR', 1), ('GB', 1), ('CA', 2), ('FR', 2)
ON CONFLICT DO NOTHING;

INSERT INTO countries (country_code, country_name) VALUES
('FR', 'France'),
('GB', 'United Kingdom'),
('CA', 'Canada'),
('US', 'United States'),
('DE', 'Germany'),
('IL', 'Israel')
ON CONFLICT (country_code) DO NOTHING;
