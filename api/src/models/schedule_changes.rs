use chrono::{NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema, Clone)]
pub struct ScheduleChange {
    pub schedule_id: i64,
    pub group_id: i64,
    pub new_subject_id: i64,
    pub new_teacher_id: i64,
    pub date: NaiveDate,
    pub new_start_time: NaiveTime,
    pub new_end_time: NaiveTime,
    pub cabinet: String,
    pub is_canceled: bool,
}
