use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct Group {
    pub id: i64,
    pub name: String,
    pub shift: i8,
}

#[derive(Debug, Deserialize, Serialize, FromRow, ToSchema)]
pub struct AddGroupRequest {
    pub name: String,
    pub shift: i8,
}
