use crate::{db::DBState, models::Group};
use async_trait::async_trait;
use sqlx::mysql::MySqlQueryResult;

#[async_trait]
pub trait Groups {
    async fn add_group(&self, name: &str, shift: i8) -> Result<Group, sqlx::Error>;
    async fn get_groups(&self) -> Result<Vec<Group>, sqlx::Error>;
    async fn get_group_by_id(&self, id: i64) -> Result<Group, sqlx::Error>;
    async fn update_group(
        &self,
        id: i64,
        new_name: &str,
        new_shift: i8,
    ) -> Result<Group, sqlx::Error>;
    async fn delete_group(&self, id: i64) -> Result<u16, sqlx::Error>;
}

#[async_trait]
impl Groups for DBState {
    async fn add_group(&self, name: &str, shift: i8) -> Result<Group, sqlx::Error> {
        let result: MySqlQueryResult =
            sqlx::query("INSERT INTO groups (name, shift) VALUES (?, ?)")
                .bind(name)
                .bind(shift)
                .execute(&self.db)
                .await?;

        let id = result.last_insert_id() as u64;

        let group = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(group)
    }

    async fn get_groups(&self) -> Result<Vec<Group>, sqlx::Error> {
        let groups = sqlx::query_as::<_, Group>("SELECT * FROM groups")
            .fetch_all(&self.db)
            .await?;

        Ok(groups)
    }

    async fn get_group_by_id(&self, id: i64) -> Result<Group, sqlx::Error> {
        let group = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(group)
    }

    async fn update_group(
        &self,
        id: i64,
        new_name: &str,
        new_shift: i8,
    ) -> Result<Group, sqlx::Error> {
        let result: MySqlQueryResult = sqlx::query("UPDATE groups SET name=?, shift=? WHERE id=?")
            .bind(new_name)
            .bind(new_shift)
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        let group = sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        Ok(group)
    }

    async fn delete_group(&self, id: i64) -> Result<u16, sqlx::Error> {
        sqlx::query_as::<_, Group>("SELECT * FROM groups WHERE id=?")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        let result: MySqlQueryResult = sqlx::query("DELETE FROM groups WHERE id=?")
            .bind(id)
            .execute(&self.db)
            .await?;

        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(200)
    }
}
