use crate::{db::DBState, models::Subject};
use async_trait::async_trait;
use sqlx::mysql::MySqlQueryResult;

#[async_trait]
pub trait Subjects {
    async fn add_subject(&self, name: &str, group_id: &i64) -> Result<Subject, sqlx::Error>;
    async fn edit_subject(&self, id: &i64, new_name: &str) -> Result<Subject, sqlx::Error>;
    async fn delete_subject(&self, id: i64) -> Result<i16, sqlx::Error>;
    async fn get_subject_by_id(&self, id: i64) -> Result<Subject, sqlx::Error>;
    async fn get_subjects_by_group_id(&self, group_id: i64) -> Result<Vec<Subject>, sqlx::Error>;
}

#[async_trait]
impl Subjects for DBState {
    async fn add_subject(&self, name: &str, group_id: &i64) -> Result<Subject, sqlx::Error> {
        let result: MySqlQueryResult =
            sqlx::query("INSERT INTO subjects (name, group_id) VALUES (?, ?)")
                .bind(name)
                .bind(group_id)
                .execute(&self.db)
                .await?;

        let id = result.last_insert_id() as i64;

        let subject =
            sqlx::query_as::<_, Subject>("SELECT id, name, group_id FROM subjects WHERE id=?")
                .bind(id)
                .fetch_one(&self.db)
                .await?;

        Ok(subject)
    }

    async fn edit_subject(&self, id: &i64, new_name: &str) -> Result<Subject, sqlx::Error> {
        let result: MySqlQueryResult = sqlx::query("UPDATE subjects SET name=? WHERE id=?")
            .bind(new_name)
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        let subject =
            sqlx::query_as::<_, Subject>("SELECT id, name, group_id FROM subjects WHERE id=?")
                .bind(id)
                .fetch_one(&self.db)
                .await?;

        Ok(subject)
    }

    async fn delete_subject(&self, id: i64) -> Result<i16, sqlx::Error> {
        let subject =
            sqlx::query_as::<_, Subject>("SELECT id, name, group_id FROM subjects WHERE id=?")
                .bind(id)
                .fetch_one(&self.db)
                .await?;

        let result: MySqlQueryResult = sqlx::query("DELETE FROM subjects WHERE id=?")
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(200)
    }

    async fn get_subject_by_id(&self, id: i64) -> Result<Subject, sqlx::Error> {
        let subject =
            sqlx::query_as::<_, Subject>("SELECT id, name, group_id FROM subjects WHERE id=?")
                .bind(id)
                .fetch_one(&self.db)
                .await?;

        Ok(subject)
    }

    async fn get_subjects_by_group_id(&self, group_id: i64) -> Result<Vec<Subject>, sqlx::Error> {
        let subjects = sqlx::query_as::<_, Subject>("SELECT * FROM subjects WHERE group_id=?")
            .bind(group_id)
            .fetch_all(&self.db)
            .await?;

        Ok(subjects)
    }
}
