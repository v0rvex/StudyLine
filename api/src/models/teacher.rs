use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

#[derive(Debug, Clone, FromRow, Deserialize, Serialize, ToSchema)]
pub struct Teacher {
    pub id: i64,
    pub login: String,
    pub password_hash: String,
    pub full_name: String,
    pub role: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, ToSchema)]
pub struct TeacherSafe {
    pub id: i64,
    pub full_name: String,
    pub role: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, ToSchema)]
pub struct AddTeacherRequest {
    pub login: String,
    pub password: String,
    pub full_name: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, ToSchema)]
pub struct EditTeacherLoginRequest {
    pub id: i64,
    pub login: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, ToSchema)]
pub struct EditTeacherPasswordRequest {
    pub id: i64,
    pub password: String,
}

#[derive(Debug, FromRow, Deserialize, Serialize, ToSchema)]
pub struct EditTeacherFullnameRequest {
    pub id: i64,
    pub full_name: String,
}
