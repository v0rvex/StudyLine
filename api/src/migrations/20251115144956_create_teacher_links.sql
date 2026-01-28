CREATE TABLE teacher_links (
  teacher_id BIGINT,
  group_id BIGINT,
  subject_id BIGINT,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREiGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, subject_id)
);

