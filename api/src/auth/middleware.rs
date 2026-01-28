use axum::{
    body::Body,
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

use crate::{config::AppState, errors::AppError, traits::Teachers};

pub async fn auth_middleware(
    State(app_state): State<AppState>,
    mut req: Request<Body>,
    next: Next,
) -> Result<Response, AppError> {
    let token = req
        .headers()
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|s| s.to_string());

    let Some(token) = token else {
        return Err(AppError::BadRequest(String::from("Missing token")));
    };

    match app_state.redis.get_session(&token).await {
        Ok(Some(user_id)) => {
            req.extensions_mut().insert(user_id as i64);
            Ok(next.run(req).await)
        }
        Ok(None) => Err(AppError::BadRequest(String::from("Invalid token"))),
        Err(_) => Err(AppError::Internal),
    }
}

pub fn require_role(
    roles: &'static [&'static str],
) -> impl Clone
+ Send
+ Sync
+ 'static
+ Fn(
    State<AppState>,
    Request<Body>,
    Next,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Response, AppError>> + Send>> {
    move |State(app_state): State<AppState>, mut req: Request<Body>, next: Next| {
        let app_state = app_state.clone();

        Box::pin(async move {
            let user_id = req
                .extensions_mut()
                .get::<i64>()
                .ok_or(AppError::Unauthorized)?;

            let teacher = app_state
                .db
                .get_teacher_by_id(*user_id)
                .await
                .map_err(|_| AppError::Internal)?;

            if teacher.role == "admin" || roles.contains(&teacher.role.as_str()) {
                req.extensions_mut().insert(teacher);
                Ok(next.run(req).await)
            } else {
                Err(AppError::Forbidden)
            }
        })
    }
}
