use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct Subject {
    pub id: i64,
    pub name: String,
    pub group_id: i64,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct AddSubjectRequest {
    pub name: String,
    pub group_id: i64,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct EditSubjectRequest {
    pub id: i64,
    pub new_name: String,
}
