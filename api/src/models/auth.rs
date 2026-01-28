use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema, Debug)]
pub struct LoginRequest {
    pub login: String,
    pub password: String,
}

#[derive(Serialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
    pub role: String,
    pub id: i64,
}

#[derive(Deserialize, ToSchema)]
pub struct LogoutRequest {
    pub token: String,
}
