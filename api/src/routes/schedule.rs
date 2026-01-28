use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::{AddScheduleRequest, Schedule},
    traits::Schedules,
};

#[utoipa::path(
    get,
    path = "/get_schedule/{group_id}",
    tag = "Schedule",
    params(
        ("group_id" = i64, Path, description = "Group identificator")
    ),
    responses(
        (status = 200, description = "Get schedule", body = [Vec<Schedule>])
    ),
)]
pub async fn get_schedule(
    State(app_state): State<AppState>,
    Path(group_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.get_schedule(group_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    delete,
    path = "/delete_day/{group_id}/{weekday}",
    tag = "Schedule",
    params(
        ("group_id" = i64, Path, description = "Group identificator"),
        ("weekday" = i8, Path, description = "Weekday (a number from 1 to 7)"),
    ),
    responses(
        (status = 200, description = "Day deleted"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn delete_day(
    State(app_state): State<AppState>,
    Path((group_id, weekday)): Path<(i64, i8)>,
) -> impl IntoResponse {
    match app_state.db.delete_day(group_id, weekday).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    delete,
    path = "/delete_pair/{pair_id}",
    tag = "Schedule",
    params(
        ("pair_id" = i64, Path, description = "Pair identificator")),
    responses(
        (status = 200, description = "Pair deleted"),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn delete_pair(
    State(app_state): State<AppState>,
    Path(pair_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.delete_pair(pair_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    post,
    path = "/add_pairs",
    tag = "Schedule",
    request_body = AddScheduleRequest, 
    responses(
        (status = 200, description = "Pairs added", body = [Vec<Schedule>]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn add_pairs(
    State(app_state): State<AppState>,
    Json(payload): Json<AddScheduleRequest>,
) -> impl IntoResponse {
    match app_state.db.add_pairs(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/edit_pairs",
    tag = "Schedule",
    request_body = Schedule, 
    responses(
        (status = 200, description = "Day edited", body = [Vec<Schedule>]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn edit_pairs(State(app_state): State<AppState>, Json(payload): Json<Schedule>) -> impl IntoResponse{
    match app_state.db.edit_pairs(payload).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}
