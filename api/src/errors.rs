use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
pub struct ErrorResponse {
    //pub status: u64,
    pub error: String,
}

#[allow(dead_code)]
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    //System errors
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    #[error("Internal server error")]
    Internal,

    //Authorization and access
    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Not found")]
    NotFound,

    #[error("Conflict")]
    Conflict,

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    //Restrictions
    #[error("Too many requests")]
    RateLimit,

    #[error("Request timeout")]
    Timeout,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            //System
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
            AppError::Redis(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Redis error"),
            AppError::Internal => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
            //Authorization
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unathorized"),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "Forbidden"),
            //Client errors
            AppError::NotFound => (StatusCode::NOT_FOUND, "Not Found"),
            AppError::Conflict => (StatusCode::CONFLICT, "Conflict"),
            AppError::Validation(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.as_str()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.as_str()),
            //Restrictions
            AppError::RateLimit => (StatusCode::TOO_MANY_REQUESTS, "Too many requests"),
            AppError::Timeout => (StatusCode::REQUEST_TIMEOUT, "Request timeout"),
        };

        let body = Json(ErrorResponse {
            error: message.to_string(),
        });

        (status, body).into_response()
    }
}
