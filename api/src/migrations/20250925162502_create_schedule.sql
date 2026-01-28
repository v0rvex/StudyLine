CREATE TABLE schedule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pair_number TINYINT NOT NULL,
    group_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,
    weekday TINYINT NOT NULL CHECK (weekday BETWEEN 1 AND 7), -- 1 = Понедельник
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    cabinet VARCHAR(100) NOT NULL,

    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);
