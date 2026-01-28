use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::{
        AddTeacherRequest, EditTeacherFullnameRequest, EditTeacherLoginRequest,
        EditTeacherPasswordRequest, Teacher, TeacherSafe,
    },
    services::auth::hash_password,
    traits::Teachers,
};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

#[utoipa::path(
    post,
    path = "/add_teacher",
    tag = "Teachers",
    request_body = AddTeacherRequest,
    responses(
        (status = 200, description = "Added teacher", body = [Teacher]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn add_teacher(
    State(app_state): State<AppState>,
    Json(payload): Json<AddTeacherRequest>,
) -> impl IntoResponse {
    let password_hash = hash_password(&payload.password);
    match app_state
        .db
        .add_teacher(&payload.login, &password_hash, &payload.full_name)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => {dbg!(&e);AppError::Database(e).into_response()},
    }
}

#[utoipa::path(
    delete,
    path = "/delete_teacher/{teacher_id}",
    tag = "Teachers",
    params(
        ("teacher_id" = i64, Path, description = "Teacher identificator")
    ),
    responses(
        (status = 200, description = "Deleted teacher"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn delete_teacher(
    State(app_state): State<AppState>,
    Path(teacher_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.delete_teacher(teacher_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/update_teacher_password",
    tag = "Teachers",
    request_body = EditTeacherPasswordRequest,
    responses(
        (status = 200, description = "Edited teachers password", body = [Teacher]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn update_teacher_password(
    State(app_state): State<AppState>,
    Json(payload): Json<EditTeacherPasswordRequest>,
) -> impl IntoResponse {
    let new_hash = hash_password(&payload.password);
    match app_state
        .db
        .update_teacher_hash(payload.id, &new_hash)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/update_teacher_login",
    tag = "Teachers",
    request_body = EditTeacherLoginRequest,
    responses(
        (status = 200, description = "Edited teacher login", body = [Teacher]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn update_teacher_login(
    State(app_state): State<AppState>,
    Json(payload): Json<EditTeacherLoginRequest>,
) -> impl IntoResponse {
    match app_state
        .db
        .update_teacher_login(payload.id, &payload.login)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/update_teacher_fullname",
    tag = "Teachers",
    request_body = EditTeacherFullnameRequest,
    responses(
        (status = 200, description = "Edited teacher fullname", body = [Teacher]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn update_teacher_fullname(
    State(app_state): State<AppState>,
    Json(payload): Json<EditTeacherFullnameRequest>,
) -> impl IntoResponse {
    match app_state
        .db
        .update_teacher_fullname(payload.id, &payload.full_name)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => {dbg!(&e);AppError::Database(e).into_response()},
    }
}

#[utoipa::path(
    get,
    path = "/get_teachers",
    tag = "Teachers",
    responses(
        (status = 200, description = "Get teacher list", body = [Vec<TeacherSafe>])
    )
)]
pub async fn get_teachers(State(app_state): State<AppState>) -> impl IntoResponse {
    match app_state.db.get_teachers().await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    get,
    path = "/get_teacher_by_id/{teacher_id}",
    tag = "Teachers",
    params(
        ("teacher_id" = i64, Path, description = "Teacher identificator")
    ),
    responses(
        (status = 200, description = "Get teacher", body = [Teacher])
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn get_teacher_by_id(
    State(app_state): State<AppState>,
    Path(teacher_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.get_teacher_by_id(teacher_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}
