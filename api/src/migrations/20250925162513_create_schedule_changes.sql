CREATE TABLE schedule_changes (
    schedule_id BIGINT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    new_subject_id BIGINT NULL,
    new_teacher_id BIGINT NULL,
    date DATE NOT NULL, 
    new_start_time TIME NULL,
    new_end_time TIME NULL,
    cabinet VARCHAR(100) NULL,
    is_canceled BOOLEAN DEFAULT FALSE, 

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schedule_id) REFERENCES schedule(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
