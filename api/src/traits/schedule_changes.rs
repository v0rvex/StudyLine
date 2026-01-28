use crate::{db::DBState, models::ScheduleChange};
use async_trait::async_trait;
use chrono::Local;
use sqlx::mysql::MySqlQueryResult;

#[async_trait]
pub trait ScheduleChanges {
    async fn get_schedule_changes(&self, group_id: i64)
    -> Result<Vec<ScheduleChange>, sqlx::Error>;
    async fn add_schedule_changes(
        &self,
        schedule_changes: Vec<ScheduleChange>,
    ) -> Result<Vec<ScheduleChange>, sqlx::Error>;
    async fn delete_schedule_changes(&self, schedule_ids: Vec<i64>) -> Result<i64, sqlx::Error>;
    async fn edit_schedule_changes(
        &self,
        new_schedule_change: ScheduleChange,
    ) -> Result<ScheduleChange, sqlx::Error>;
    async fn get_changes_by_ids(
        &self,
        schedule_ids: Vec<i64>,
    ) -> Result<Vec<ScheduleChange>, sqlx::Error>;
}

#[async_trait]
impl ScheduleChanges for DBState {
    async fn get_schedule_changes(
        &self,
        group_id: i64,
    ) -> Result<Vec<ScheduleChange>, sqlx::Error> {
        let mut outdated_changes: Vec<i64> = vec![];
        let mut schedule_changes =
            sqlx::query_as::<_, ScheduleChange>("SELECT * FROM schedule_changes WHERE group_id=?")
                .bind(group_id)
                .fetch_all(&self.db)
                .await?;

        let today = Local::now().date_naive();

        for change in &schedule_changes {
            if today > change.date {
                outdated_changes.push(change.schedule_id);
            }
        }
        self.delete_schedule_changes(outdated_changes).await?;

        schedule_changes.retain(|schedule_change| schedule_change.date >= today);

        Ok(schedule_changes)
    }

    async fn add_schedule_changes(
        &self,
        schedule_changes: Vec<ScheduleChange>,
    ) -> Result<Vec<ScheduleChange>, sqlx::Error> {
        for change in &schedule_changes {
            sqlx::query("INSERT INTO schedule_changes(schedule_id, group_id, new_subject_id, new_teacher_id, date, new_start_time, new_end_time, cabinet, is_canceled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(change.schedule_id)
                .bind(change.group_id)
                .bind(change.new_subject_id)
                .bind(change.new_teacher_id)
                .bind(change.date)
                .bind(change.new_start_time)
                .bind(change.new_end_time)
                .bind(&change.cabinet)
                .bind(&change.is_canceled)
                .execute(&self.db)
                .await?;
        }
        Ok(schedule_changes)
    }

    async fn delete_schedule_changes(&self, schedule_ids: Vec<i64>) -> Result<i64, sqlx::Error> {
        for id in schedule_ids {
            let result: MySqlQueryResult =
                sqlx::query("DELETE FROM schedule_changes WHERE schedule_id=?")
                    .bind(id)
                    .execute(&self.db)
                    .await?;
            if result.rows_affected() == 0 {
                return Err(sqlx::Error::RowNotFound);
            }
        }
        Ok(200)
    }

    async fn edit_schedule_changes(
        &self,
        new_schedule_change: ScheduleChange,
    ) -> Result<ScheduleChange, sqlx::Error> {
        let result: MySqlQueryResult =
            sqlx::query("UPDATE schedule_changes SET group_id=?, new_subject_id=?, new_teacher_id=?, date=?, new_start_time=?, new_end_time=?, cabinet=?, is_canceled=? WHERE schedule_id=?")
                .bind(new_schedule_change.group_id)
                .bind(new_schedule_change.new_subject_id)
                .bind(new_schedule_change.new_teacher_id)
                .bind(new_schedule_change.date)
                .bind(new_schedule_change.new_start_time)
                .bind(new_schedule_change.new_end_time)
                .bind(&new_schedule_change.cabinet)
                .bind(new_schedule_change.is_canceled)
                .bind(new_schedule_change.schedule_id)
                .execute(&self.db)
                .await?;
        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(new_schedule_change)
    }

    async fn get_changes_by_ids(
        &self,
        schedule_ids: Vec<i64>,
    ) -> Result<Vec<ScheduleChange>, sqlx::Error> {
        let mut changes = Vec::new();

        for id in schedule_ids {
            let result = sqlx::query_as::<_, ScheduleChange>(
                "SELECT * FROM schedule_changes WHERE schedule_id=?",
            )
            .bind(id)
            .fetch_one(&self.db)
            .await?;

            changes.push(result)
        }

        Ok(changes)
    }
}
