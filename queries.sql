DROP TABLE IF EXISTS visited_countries;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS countries;

CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(15) UNIQUE NOT NULL,
  color VARCHAR(15)
);

CREATE TABLE countries (
  country_code CHAR(2) PRIMARY KEY,
  country_name TEXT NOT NULL
);

CREATE TABLE visited_countries(
  id SERIAL PRIMARY KEY,
  country_code CHAR(2) NOT NULL REFERENCES countries(country_code),
  user_id INTEGER NOT NULL REFERENCES users(id),
  UNIQUE (country_code, user_id)
);

INSERT INTO users (name, color)
VALUES ('Angela', 'teal'), ('Jack', 'powderblue')
ON CONFLICT (name) DO NOTHING;

INSERT INTO countries (country_code, country_name) VALUES
('FR', 'France'),
('GB', 'United Kingdom'),
('CA', 'Canada'),
('US', 'United States'),
('DE', 'Germany'),
('IL', 'Israel')
ON CONFLICT (country_code) DO NOTHING;

INSERT INTO visited_countries (country_code, user_id)
VALUES ('FR', 1), ('GB', 1), ('CA', 2), ('FR', 2)
ON CONFLICT DO NOTHING;
