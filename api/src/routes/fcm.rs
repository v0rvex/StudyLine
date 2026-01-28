use crate::{
    config::AppState,
    errors::{AppError, ErrorResponse},
    models::{FcmGroupRequest, FcmTeachersRequest}
};
use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::IntoResponse,
};

#[utoipa::path(
    post,
    path = "/send_notifications_to_teachers",
    tag = "fcm",
    request_body = FcmTeachersRequest,
    responses(
        (status = 200, description = "Succesfully sent notifications"),
        (status = 400, description = "Error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn send_notifications_to_teachers(
    State(mut app_state): State<AppState>,
    Json(payload): Json<FcmTeachersRequest>,
)-> impl IntoResponse {
   for teacher_id in payload.teacher_ids {
       match app_state.fcm.send_to_teacher(teacher_id).await {
           Ok(_) => (StatusCode::OK, Json(200)).into_response(),
           Err(e) => AppError::BadRequest(e.to_string()).into_response(),
       };
   }; 
   (StatusCode::OK, Json(200)).into_response()
}

#[utoipa::path(
    post,
    path = "/send_notifications_to_group",
    tag = "fcm",
    request_body = FcmGroupRequest,
    responses(
        (status = 200, description = "Succesfully sent notifications"),
        (status = 400, description = "Error", body = [ErrorResponse]),
    ),
    security(
        ("bearer_auth"=[])
    ) 
)]
pub async fn send_notifications_to_group(
    State(mut app_state): State<AppState>,
    Json(payload): Json<FcmGroupRequest>,
)-> impl IntoResponse {
    match app_state.fcm.send_to_group(payload.group_id).await {
       Ok(_) => (StatusCode::OK, Json(200)).into_response(),
       Err(e) => {dbg!(&e); AppError::BadRequest(e.to_string()).into_response()},
    }
}
