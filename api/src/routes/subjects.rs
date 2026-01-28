use axum::{extract::{Path, State}, http::StatusCode, response::IntoResponse, Json};

use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::{AddSubjectRequest, EditSubjectRequest, Subject},
    traits::Subjects,
};

#[utoipa::path(
    post,
    path = "/add_subject",
    tag = "Subjects",
    request_body = AddSubjectRequest,
    responses(
        (status = 200, description = "Added subject", body = [Subject]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn add_subject(
    State(app_state): State<AppState>,
    Json(payload): Json<AddSubjectRequest>,
) -> impl IntoResponse {
    match app_state
        .db
        .add_subject(&payload.name, &payload.group_id)
        .await
    {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    patch,
    path = "/edit_subject",
    tag = "Subjects",
    request_body = EditSubjectRequest,
    responses(
        (status = 200, description = "Subject edited", body = [Subject]),
        (status = 500, description = "Database error", body = [ErrorResponse])
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn edit_subject(State(app_state): State<AppState>, Json(payload): Json<EditSubjectRequest>) -> impl IntoResponse{
   match app_state.db.edit_subject(&payload.id, &payload.new_name).await{
       Ok(result) => (StatusCode::OK, Json(result)).into_response(),
       Err(e) => AppError::Database(e).into_response()
   } 
}

#[utoipa::path(
    delete,
    path = "/delete_subject/{subject_id}",
    tag = "Subjects",
    responses(
        (status = 200, description = "Subject deleted"),
        (status = 500, description = "Database error", body = [ErrorResponse])
    ),
    security(
        ("bearer_auth"=[])
    ),
    params(
        ("subject_id" = i64, Path, description = "Subject identificator")
    ),
)]
pub async fn delete_subject(State(app_state): State<AppState>, Path(subject_id): Path<i64>) -> impl IntoResponse{
    match app_state.db.delete_subject(subject_id).await{
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response(),
    }
}

#[utoipa::path(
    get,
    path = "/get_subjects_by_group_id/{group_id}",
    tag = "Subjects",
    responses(
        (status = 200, description = "List of subjects", body = [Vec<Subject>]),
        (status = 500, description = "Database error", body = [ErrorResponse]),
    ),
    params(
        ("group_id" = i64, Path, description = "Group identificator")
    ),
)]
pub async fn get_subjects_by_group_id(State(app_state): State<AppState>, Path(group_id): Path<i64>) -> impl IntoResponse{
    match app_state.db.get_subjects_by_group_id(group_id).await{
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(e) => AppError::Database(e).into_response()
    }
}
