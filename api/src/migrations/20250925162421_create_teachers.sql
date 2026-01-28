CREATE TABLE teachers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL DEFAULT 'teacher'
);

INSERT INTO teachers (login, password_hash, full_name, role)
VALUES ('admin', '$argon2id$v=19$m=19456,t=2,p=1$Ebj+LAv04o5Z5CYGh0CGbQ$uWZGAvXeb5m3xzqKaC6pBKQCyT/fX0rrSkgrtsUtrxw', 'admin', 'admin')
ON DUPLICATE KEY UPDATE login=login;
