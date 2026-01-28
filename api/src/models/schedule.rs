use chrono::NaiveTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct ScheduleRow {
    pub id: i64,
    pub pair_number: i8,
    pub group_id: i64,
    pub subject_id: i64,
    pub teacher_id: i64,
    pub weekday: i8,
    pub start_time: NaiveTime,
    pub end_time: NaiveTime,
    pub cabinet: String,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct Schedule {
    pub group_id: i64,
    pub weekday: i8,
    pub pairs: Vec<Pair>,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct Pair {
    pub id: i64,
    pub pair_number: i8,
    pub teacher_id: i64,
    pub subject_id: i64,

    pub start_time: NaiveTime,
    pub end_time: NaiveTime,

    pub cabinet: String,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct AddScheduleRequest {
    pub group_id: i64,
    pub weekday: i8,
    pub pairs: Vec<AddPair>,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct AddPair {
    pub pair_number: i8,
    pub teacher_id: i64,
    pub subject_id: i64,

    pub start_time: NaiveTime,
    pub end_time: NaiveTime,

    pub cabinet: String,
}
