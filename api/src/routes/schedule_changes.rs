use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::ScheduleChange,
    traits::ScheduleChanges,
};

#[utoipa::path(
get,
    path = "/get_schedule_changes/{group_id}",
    tag = "Schedule changes",
    params(
        ("group_id" = i64, Path, description = "Group identificator")
    ),
    responses(
        (status = 200, description = "Get schedule changes", body = [Vec<ScheduleChange>])
    ),
)]
pub async fn get_schedule_changes(
    State(app_state): State<AppState>,
    Path(group_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.get_schedule_changes(group_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    post,
    path = "/add_schedule_changes",
    tag = "Schedule changes",
    request_body = Vec<ScheduleChange>,
    responses(
        (status = 200, description = "Schedule changes added"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn add_schedule_changes(
    State(app_state): State<AppState>,
    Json(payload): Json<Vec<ScheduleChange>>,
) -> impl IntoResponse {
    match app_state.db.add_schedule_changes(payload).await {
        Ok(result) => {
            let mut teacher_ids = Vec::new();
            let mut group_ids = Vec::new();

            for change in &result {
                if !group_ids.contains(&change.group_id) {
                    group_ids.push(change.group_id);
                }

                if !teacher_ids.contains(&change.new_teacher_id) {
                    teacher_ids.push(change.new_teacher_id);
                }
            }

            (StatusCode::OK, Json(result)).into_response()
        }
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    delete,
    path = "/delete_schedule_changes",
    tag = "Schedule changes",
    request_body = Vec<i64>,
    responses(
        (status = 200, description = "Schedule changes deleted"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn delete_schedule_changes(
    State(app_state): State<AppState>,
    Json(payload): Json<Vec<i64>>,
) -> impl IntoResponse {
    match app_state.db.delete_schedule_changes(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/edit_schedule_changes",
    tag = "Schedule changes",
    request_body = ScheduleChange,
    responses(
        (status = 200, description = "Schedule changes edited"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn edit_schedule_changes(
    State(app_state): State<AppState>,
    Json(payload): Json<ScheduleChange>,
) -> impl IntoResponse {
    match app_state.db.edit_schedule_changes(payload.clone()).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => {
            dbg!(payload.clone());
            dbg!(&e);
            AppError::Database(e).into_response()
        }
    }
}
