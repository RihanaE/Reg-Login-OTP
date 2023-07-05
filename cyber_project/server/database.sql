CREATE DATABASE records;

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL
);

CREATE TABLE userVerification (
  user_id uuid PRIMARY KEY REFERENCES users(user_id),
  user_verification_code VARCHAR(255) NOT NULL
);

CREATE TABLE userAttempt(
    user_id uuid PRIMARY KEY REFERENCES users(user_id),
    user_attempt_count INT NOT NULL,
    user_attempt_time TIMESTAMP NOT NULL
    
);