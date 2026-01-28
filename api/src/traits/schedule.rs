use crate::{
    db::DBState,
    models::{AddPair, AddScheduleRequest, Pair, Schedule, ScheduleRow},
};
use async_trait::async_trait;
use chrono::NaiveTime;
use sqlx::mysql::MySqlQueryResult;

#[async_trait]
pub trait Schedules {
    async fn get_schedule(&self, group_id: i64) -> Result<Vec<Schedule>, sqlx::Error>;
    async fn add_pairs(&self, schedule: AddScheduleRequest) -> Result<Vec<Schedule>, sqlx::Error>;
    async fn edit_pairs(&self, new_schedule: Schedule) -> Result<Vec<Schedule>, sqlx::Error>;
    async fn delete_day(&self, group_id: i64, weekday: i8) -> Result<i64, sqlx::Error>;
    async fn delete_pair(&self, id: i64) -> Result<i64, sqlx::Error>;
}

#[async_trait]
impl Schedules for DBState {
    async fn get_schedule(&self, group_id: i64) -> Result<Vec<Schedule>, sqlx::Error> {
        let pairs = sqlx::query_as::<_, ScheduleRow>(
            "SELECT * FROM schedule WHERE group_id=? ORDER BY weekday ASC, pair_number ASC",
        )
        .bind(group_id)
        .fetch_all(&self.db)
        .await?;

        let mut schedules: Vec<Schedule> = Vec::new();

        for row in pairs {
            if let Some(existing) = schedules.iter_mut().find(|s| s.weekday == row.weekday) {
                existing.pairs.push(Pair {
                    id: row.id,
                    pair_number: row.pair_number,
                    teacher_id: row.teacher_id,
                    subject_id: row.subject_id,
                    cabinet: row.cabinet,
                    end_time: row.end_time,
                    start_time: row.start_time,
                });
            } else {
                schedules.push(Schedule {
                    group_id: group_id,
                    weekday: row.weekday,
                    pairs: vec![Pair {
                        id: row.id,
                        pair_number: row.pair_number,
                        teacher_id: row.teacher_id,
                        subject_id: row.subject_id,
                        start_time: row.start_time,
                        end_time: row.end_time,
                        cabinet: row.cabinet,
                    }],
                })
            }
        }

        Ok(schedules)
    }

    async fn add_pairs(&self, schedule: AddScheduleRequest) -> Result<Vec<Schedule>, sqlx::Error> {
        for pair in &schedule.pairs {
            sqlx::query("INSERT INTO schedule(pair_number, group_id, subject_id, teacher_id, weekday, start_time, end_time, cabinet) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                .bind(pair.pair_number)
                .bind(schedule.group_id)
                .bind(pair.subject_id)
                .bind(pair.teacher_id)
                .bind(schedule.weekday)
                .bind(pair.start_time)
                .bind(pair.end_time)
                .bind(&pair.cabinet)
                .execute(&self.db)
                .await?;
        }

        Ok(self.get_schedule(schedule.group_id).await?)
    }

    async fn edit_pairs(&self, new_schedule: Schedule) -> Result<Vec<Schedule>, sqlx::Error> {
        for pair in &new_schedule.pairs {
            let result: MySqlQueryResult = sqlx::query("UPDATE schedule SET weekday=?, pair_number=?, subject_id=?, teacher_id=?, start_time=?, end_time=?, cabinet=? WHERE id=?")
                .bind(new_schedule.weekday)
                .bind(pair.pair_number)
                .bind(pair.subject_id)
                .bind(pair.teacher_id)
                .bind(pair.start_time)
                .bind(pair.end_time)
                .bind(&pair.cabinet)
                .bind(pair.id)
                .execute(&self.db)
                .await?;
            if result.rows_affected() == 0 {
                return Err(sqlx::Error::RowNotFound);
            }
        }

        Ok(self.get_schedule(new_schedule.group_id).await?)
    }

    async fn delete_day(&self, group_id: i64, weekday: i8) -> Result<i64, sqlx::Error> {
        let result: MySqlQueryResult =
            sqlx::query("DELETE FROM schedule WHERE group_id=? AND weekday=?")
                .bind(group_id)
                .bind(weekday)
                .execute(&self.db)
                .await?;
        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(200)
    }

    async fn delete_pair(&self, id: i64) -> Result<i64, sqlx::Error> {
        let result: MySqlQueryResult = sqlx::query("DELETE FROM schedule WHERE id=?")
            .bind(id)
            .execute(&self.db)
            .await?;
        if result.rows_affected() == 0 {
            return Err(sqlx::Error::RowNotFound);
        }

        Ok(200)
    }
}
