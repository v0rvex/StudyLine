mod auth;
mod config;
mod db;
mod errors;
mod models;
mod redis;
mod routes;
mod services;
mod swagger;
mod traits;
mod utils;

use auth::{auth_middleware, require_role};
use axum::http::{
    HeaderValue,
    header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE},
};
use axum::routing::{delete, get, patch, post};
use axum::{Router, middleware};
use sqlx::migrate;
use tokio;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

use services::notifications::FCM;
use {config::AppState, config::Config, db::DBState, redis::RedisState};

#[tokio::main]
async fn main() {
    let config: Config = Config::new();
    let app_state = AppState {
        db: DBState::init_pool(&config.database_url).await.unwrap(),
        redis: RedisState::init(&config.redis_address).await.unwrap(),
        fcm: FCM::init(),
    };

    migrate!("src/migrations").run(&app_state.db.db).await;

    let cors = CorsLayer::new()
        .allow_origin("http://127.0.0.1:3000".parse::<HeaderValue>().unwrap())
        .allow_headers([AUTHORIZATION, CONTENT_TYPE, ACCEPT])
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PATCH,
            axum::http::Method::DELETE,
        ])
        .allow_credentials(true);

    let protected_routes: Router =
        Router::new()
            //FCM
            .route(
                "/send_notifications_to_group",
                post(routes::fcm::send_notifications_to_group).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/send_notifications_to_teachers",
                post(routes::fcm::send_notifications_to_teachers).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            //TEACHER LINKS ROUTES
            .route(
                "/add_teacher_link",
                post(routes::teacher_links::add_teacher_link).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/delete_teacher_link",
                delete(routes::teacher_links::delete_teacher_link).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            //SCHEDULE CHANGES ROUTES
            .route(
                "/add_schedule_changes",
                post(routes::schedule_changes::add_schedule_changes).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/delete_schedule_changes",
                delete(routes::schedule_changes::delete_schedule_changes).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/edit_schedule_changes",
                patch(routes::schedule_changes::edit_schedule_changes).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            //SCHEDULE ROUTES
            .route(
                "/delete_day/{group_id}/{weekday}",
                delete(routes::schedule::delete_day).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/delete_pair/{schedule_id}",
                delete(routes::schedule::delete_pair).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/add_pairs",
                post(routes::schedule::add_pairs).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/edit_pairs",
                patch(routes::schedule::edit_pairs).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            //TEACHER ROUTES
            .route(
                "/add_teacher",
                post(routes::teachers::add_teacher).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/delete_teacher/{teacher_id}",
                delete(routes::teachers::delete_teacher).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/update_teacher_password",
                patch(routes::teachers::update_teacher_password).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/update_teacher_login",
                patch(routes::teachers::update_teacher_login).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/update_teacher_fullname",
                patch(routes::teachers::update_teacher_fullname).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .route(
                "/get_teacher_by_id/{teacher_id}",
                get(routes::teachers::get_teacher_by_id).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            //GROUP ROUTES
            .route(
                "/add_group",
                post(routes::groups::add_group).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/edit_group",
                patch(routes::groups::edit_group).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/delete_group/{group_id}",
                delete(routes::groups::delete_group).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            //SUBJECT ROUTES
            .route(
                "/add_subject",
                post(routes::subjects::add_subject).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/edit_subject",
                patch(routes::subjects::edit_subject).route_layer(middleware::from_fn_with_state(
                    app_state.clone(),
                    require_role(&[]),
                )),
            )
            .route(
                "/delete_subject/{subject_id}",
                delete(routes::subjects::delete_subject).route_layer(
                    middleware::from_fn_with_state(app_state.clone(), require_role(&[])),
                ),
            )
            .with_state(app_state.clone());

    let app: Router = Router::new()
        .route(
            "/get_teacher_links/{group_id}",
            get(routes::teacher_links::get_teacher_links),
        )
        .route(
            "/get_schedule_changes/{group_id}",
            get(routes::schedule_changes::get_schedule_changes),
        )
        .route(
            "/get_schedule/{group_id}",
            get(routes::schedule::get_schedule),
        )
        .route("/get_teachers", get(routes::teachers::get_teachers))
        .route("/get_groups", get(routes::groups::get_groups))
        .route(
            "/get_group_by_id/{group_id}",
            get(routes::groups::get_group_by_id),
        )
        .route(
            "/get_subjects_by_group_id/{group_id}",
            get(routes::subjects::get_subjects_by_group_id),
        )
        .route("/login", post(auth::handlers::login))
        .route("/logout", post(auth::handlers::logout))
        .merge(swagger::swagger_ui())
        .with_state(app_state.clone())
        .merge(protected_routes.route_layer(middleware::from_fn_with_state(
            app_state.clone(),
            auth_middleware,
        )))
        .layer(cors);

    let listener: TcpListener = TcpListener::bind(format!("0.0.0.0:{}", config.port))
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}
