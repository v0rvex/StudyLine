use {
    crate::{db::DBState, redis::RedisState, services::notifications::FCM},
    dotenv,
    std::env,
};

#[derive(Debug)]
pub struct Config {
    pub database_url: String,
    pub ip: String,
    pub port: String,
    pub redis_address: String,
}

impl Config {
    pub fn new() -> Self {
        dotenv::dotenv().ok();
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL is not found");
        let ip = env::var("IP").expect("IP is not found");
        let port = env::var("PORT").expect("PORT is not found");
        let redis_address = env::var("REDIS_ADDRESS").expect("REDIS_ADDRESS is not found");

        Self {
            database_url,
            ip,
            port,
            redis_address,
        }
    }
}

#[derive(Clone)]
pub struct AppState {
    pub db: DBState,
    pub redis: RedisState,
    pub fcm: FCM,
}
