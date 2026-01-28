use crate::{
    db::DBState,
    models::{Teacher, TeacherSafe},
};
use async_trait::async_trait;
use sqlx::mysql::MySqlQueryResult;

#[async_trait]
pub trait Teachers {
    async fn get_teachers(&self) -> Result<Vec<TeacherSafe>, sqlx::Error>;

    async fn add_teacher(
        &self,
        login: &str,
        password_hash: &str,
        fullname: &str,
    ) -> Result<Teacher, sqlx::Error>;

    async fn delete_teacher(&self, id: i64) -> Result<i16, sqlx::Error>;

    async fn update_teacher_hash(
        &self,
        id: i64,
        password_hash: &str,
    ) -> Result<Teacher, sqlx::Error>;

    async fn update_teacher_login(&self, id: i64, login: &str) -> Result<Teacher, sqlx::Error>;

    async fn update_teacher_fullname(
        &self,
        id: i64,
        fullname: &str,
    ) -> Result<Teacher, sqlx::Error>;

    async fn get_teacher_by_id(&self, id: i64) -> Result<Teacher, sqlx::Error>;

    async fn get_teacher_by_login(&self, login: &str) -> Result<Teacher, sqlx::Error>;
}

#[async_trait]
impl Teachers for DBState {
    async fn get_teachers(&self) -> Result<Vec<TeacherSafe>, sqlx::Error> {
        let teachers = sqlx::query_as::<_, TeacherSafe>("SELECT id, full_name, role FROM teachers")
            .fetch_all(&self.db)
            .await?;

        Ok(teachers)
    }

    async fn add_teacher(
        &self,
        login: &str,
        password_hash: &str,
        fullname: &str,
    ) -> Result<Teacher, sqlx::Error> {
        let result: MySqlQueryResult =
            sqlx::query("INSERT INTO teachers (login, password_hash, full_name) VALUES (?, ?, ?)")
                .bind(login)
                .bind(password_hash)
                .bind(fullname)
                .execute(&self.db)
                .await?;

        let id = result.last_insert_id() as i64;

        let teacher = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(teacher)
    }

    async fn delete_teacher(&self, id: i64) -> Result<i16, sqlx::Error> {
        let teacher = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        let result: MySqlQueryResult = sqlx::query("DELETE FROM teachers WHERE id=?")
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(200)
    }

    async fn update_teacher_hash(&self, id: i64, new_hash: &str) -> Result<Teacher, sqlx::Error> {
        let result: MySqlQueryResult =
            sqlx::query("UPDATE teachers SET password_hash=? WHERE id=?")
                .bind(new_hash)
                .bind(id)
                .execute(&self.db)
                .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        let teacher = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(teacher)
    }

    async fn update_teacher_login(&self, id: i64, new_login: &str) -> Result<Teacher, sqlx::Error> {
        let result: MySqlQueryResult = sqlx::query("UPDATE teachers SET login=? WHERE id=?")
            .bind(new_login)
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        let teacher = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(teacher)
    }

    async fn update_teacher_fullname(
        &self,
        id: i64,
        new_fullname: &str,
    ) -> Result<Teacher, sqlx::Error> {
        let result: MySqlQueryResult = sqlx::query("UPDATE teachers SET full_name=? WHERE id=?")
            .bind(new_fullname)
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        let teacher = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(teacher)
    }

    async fn get_teacher_by_id(&self, id: i64) -> Result<Teacher, sqlx::Error> {
        let teacher = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(teacher)
    }

    async fn get_teacher_by_login(&self, login: &str) -> Result<Teacher, sqlx::Error> {
        let hash = sqlx::query_as::<_, Teacher>("SELECT * FROM teachers WHERE login=?")
            .bind(login)
            .fetch_one(&self.db)
            .await?;

        Ok(hash)
    }
}
