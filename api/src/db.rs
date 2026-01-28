use sqlx::{MySqlPool, mysql::MySqlPoolOptions};

#[derive(Clone)]
pub struct DBState {
    pub db: MySqlPool,
}

impl DBState {
    pub async fn init_pool(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = MySqlPoolOptions::new()
            .max_connections(20)
            .connect(database_url)
            .await?;
        Ok(Self { db: pool })
    }
}
