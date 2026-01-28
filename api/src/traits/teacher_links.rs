use crate::{db::DBState, models::TeacherLink};
use async_trait::async_trait;
use sqlx::mysql::MySqlQueryResult;

#[async_trait]
pub trait TeacherLinks {
    async fn add_teacher_link(
        &self,
        group_id: i64,
        teacher_id: i64,
        subject_id: i64,
    ) -> Result<TeacherLink, sqlx::Error>;
    async fn get_teacher_links(&self, group_id: i64) -> Result<Vec<TeacherLink>, sqlx::Error>;
    async fn delete_teacher_link(
        &self,
        group_id: i64,
        teacher_id: i64,
        subject_id: i64,
    ) -> Result<i16, sqlx::Error>;
}

#[async_trait]
impl TeacherLinks for DBState {
    async fn add_teacher_link(
        &self,
        group_id: i64,
        teacher_id: i64,
        subject_id: i64,
    ) -> Result<TeacherLink, sqlx::Error> {
        sqlx::query(
            "INSERT INTO teacher_links (teacher_id, group_id, subject_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teacher_id=?",
        )
        .bind(teacher_id)
        .bind(group_id)
        .bind(subject_id)
        .bind(teacher_id)
        .execute(&self.db)
        .await?;

        let group = sqlx::query_as::<_, TeacherLink>(
            "SELECT * FROM teacher_links WHERE group_id=? AND teacher_id=? AND subject_id=? ",
        )
        .bind(group_id)
        .bind(teacher_id)
        .bind(subject_id)
        .fetch_one(&self.db)
        .await?;

        Ok(group)
    }

    async fn get_teacher_links(&self, group_id: i64) -> Result<Vec<TeacherLink>, sqlx::Error> {
        let groups =
            sqlx::query_as::<_, TeacherLink>("SELECT * FROM teacher_links WHERE group_id=?")
                .bind(group_id)
                .fetch_all(&self.db)
                .await?;
        Ok(groups)
    }

    async fn delete_teacher_link(
        &self,
        group_id: i64,
        teacher_id: i64,
        subject_id: i64,
    ) -> Result<i16, sqlx::Error> {
        sqlx::query_as::<_, TeacherLink>(
            "SELECT * FROM teacher_links WHERE group_id=? AND teacher_id=? AND subject_id=?",
        )
        .bind(group_id)
        .bind(teacher_id)
        .bind(subject_id)
        .fetch_one(&self.db)
        .await?;

        let result: MySqlQueryResult = sqlx::query(
            "DELETE FROM teacher_links WHERE group_id=? AND teacher_id=? AND subject_id=?",
        )
        .bind(group_id)
        .bind(teacher_id)
        .bind(subject_id)
        .execute(&self.db)
        .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(200)
    }
}
