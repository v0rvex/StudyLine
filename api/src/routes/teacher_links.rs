use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::{teacher_links::TeacherLink},
    traits::TeacherLinks,
};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

#[utoipa::path(
    get,
    path = "/get_teacher_links/{group_id}",
    tag = "Teacher links",
    params(
        ("group_id" = i64, Path, description = "Group identificator")
    ),
    responses(
        (status = 200, description = "Get teacher list", body = [Vec<TeacherLink>])
    )
)]
pub async fn get_teacher_links(
    State(app_state): State<AppState>,
    Path(group_id): Path<i64>,
) -> Result<Json<Vec<TeacherLink>>, AppError> {
    let groups = app_state.db.get_teacher_links(group_id).await?;
    Ok(Json(groups))
}

#[utoipa::path(
    post,
    path = "/add_teacher_link",
    tag = "Teacher links",
    request_body = TeacherLink,
    responses(
        (status = 200, description = "Added link", body = [TeacherLink]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn add_teacher_link(
    State(app_state): State<AppState>,
    Json(payload): Json<TeacherLink>,
) -> impl IntoResponse {
    //ФИКС ДУБЛИКАТОВ
    match app_state.db.add_teacher_link(payload.group_id, payload.teacher_id, payload.subject_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    delete,
    path = "/delete_teacher_link",
    tag = "Teacher links",
    request_body = TeacherLink,
    responses(
        (status = 200, description = "Deleted teacher link"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn delete_teacher_link(
    State(app_state): State<AppState>,
    Json(payload): Json<TeacherLink>,
) -> impl IntoResponse {
    match app_state.db.delete_teacher_link(payload.group_id, payload.teacher_id, payload.subject_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}
