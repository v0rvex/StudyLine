use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct FcmGroupRequest {
    pub group_id: i64,
}

#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct FcmTeachersRequest {
    pub teacher_ids: Vec<i64>,
}
