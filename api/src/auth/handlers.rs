use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};

use crate::{
    config::AppState,
    errors::AppError,
    models::{LoginRequest, LoginResponse, LogoutRequest},
    services::auth::verify_password,
    traits::Teachers,
};

#[utoipa::path(
    post,
    path = "/login",
    tag = "Auth",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Succesfully logged in", body = LoginResponse),
        (status = 401, description = "Invalid login or password"),
    )
)]
pub async fn login(
    State(app_state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, AppError> {
    let teacher = app_state.db.get_teacher_by_login(&payload.login).await?;

    if !verify_password(&payload.password, &teacher.password_hash) {
        return Err(AppError::BadRequest(String::from("Invalid password")));
    }

    let token = app_state.redis.create_session(teacher.id).await?;
    Ok((
        StatusCode::OK,
        Json(LoginResponse {
            token,
            role: teacher.role,
            id: teacher.id,
        }),
    ))
}

#[utoipa::path(
    post,
    path = "/logout",
    tag = "Auth",
    request_body = LogoutRequest,
    responses(
        (status = 200, description = "Succesfully logged out")
    )
)]
pub async fn logout(
    State(app_state): State<AppState>,
    Json(payload): Json<LogoutRequest>,
) -> Result<impl IntoResponse, AppError> {
    app_state.redis.delete_session(&payload.token).await?;

    Ok((StatusCode::OK, "Logged out".to_string()))
}
