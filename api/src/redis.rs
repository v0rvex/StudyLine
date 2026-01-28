use redis::{AsyncCommands, Client};
use uuid::Uuid;

#[derive(Clone)]
pub struct RedisState {
    pub client: Client,
}

impl RedisState {
    pub async fn init(url: &str) -> redis::RedisResult<Self> {
        let client = Client::open(url)?;
        Ok(Self { client })
    }

    pub async fn create_session(&self, user_id: i64) -> redis::RedisResult<String> {
        let mut conn = self.client.get_multiplexed_tokio_connection().await?;
        let token: String = Uuid::new_v4().to_string();
        conn.set_ex::<&str, i64, ()>(&token, user_id, 86400).await?;

        Ok(token)
    }

    pub async fn get_session(&self, token: &str) -> redis::RedisResult<Option<i32>> {
        let mut conn = self.client.get_multiplexed_tokio_connection().await?;
        conn.get(token).await
    }

    pub async fn delete_session(&self, token: &str) -> redis::RedisResult<()> {
        let mut conn = self.client.get_multiplexed_tokio_connection().await?;
        let _: () = conn.del(token).await?;

        Ok(())
    }
}
