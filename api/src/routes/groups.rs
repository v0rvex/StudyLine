use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::{AddGroupRequest, group::Group},
    traits::Groups,
};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};

#[utoipa::path(
    get,
    path = "/get_groups",
    tag = "Groups",
    responses(
        (status = 200, description = "Get groups list", body = [Vec<Group>])
    )
)]
pub async fn get_groups(State(app_state): State<AppState>) -> Result<Json<Vec<Group>>, AppError> {
    let groups = app_state.db.get_groups().await?;
    Ok(Json(groups))
}

#[utoipa::path(
    get,
    path = "/get_group_by_id/{group_id}",
    tag = "Groups",
    params(
        ("group_id" = i64, Path, description = "Group identificator")
    ),
    responses(
        (status = 200, description = "Get group by id", body = [Group]),
        (status = 404, description = "Not found", body = [ErrorResponse])
    ),
)]
pub async fn get_group_by_id(
    State(app_state): State<AppState>,
    Path(group_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.get_group_by_id(group_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(_) => AppError::NotFound.into_response(),
    }
}

#[utoipa::path(
    post,
    path = "/add_group",
    tag = "Groups",
    request_body = AddGroupRequest,
    responses(
        (status = 200, description = "Added group", body = [Group]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn add_group(
    State(app_state): State<AppState>,
    Json(payload): Json<AddGroupRequest>,
) -> impl IntoResponse {
    match app_state.db.add_group(&payload.name, payload.shift).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/edit_group",
    tag = "Groups",
    request_body = Group,
    responses(
        (status = 200, description = "Group edited", body = [Group]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn edit_group(
    State(app_state): State<AppState>,
    Json(payload): Json<Group>,
) -> impl IntoResponse {
    match app_state.db.update_group(payload.id, &payload.name, payload.shift).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    delete,
    path = "/delete_group/{group_id}",
    tag = "Groups",
    params(
        ("group_id" = i64, Path, description = "Group identificator")
    ),
    responses(
        (status = 200, description = "Group deleted"),
        (status = 500, description = "Database error", body = [ErrorResponse])
    ),
    security(
        ("bearer_auth"=[])
    )
)]
pub async fn delete_group(
    State(app_state): State<AppState>,
    Path(group_id): Path<i64>,
) -> impl IntoResponse {
    match app_state.db.delete_group(group_id).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => {dbg!(&e);AppError::Database(e).into_response()},
    }
}
