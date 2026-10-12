
CREATE DATABASE IF NOT EXISTS safelinker_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE safelinker_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(2083) NOT NULL,
    risk_level ENUM('Low Risk', 'Medium Risk', 'High Risk') NOT NULL,
    score INT NOT NULL DEFAULT 0,
    reasons JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_scans_user_date (user_id, created_at),
    INDEX idx_scans_risk (risk_level),
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_quiz_user_date (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);
