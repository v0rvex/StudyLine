use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct TeacherLink {
    pub teacher_id: i64,
    pub group_id: i64,
    pub subject_id: i64,
}
