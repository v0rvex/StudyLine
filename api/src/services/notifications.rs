use fcm_service::{FcmMessage, FcmNotification, FcmService, Target};
use std::sync::Arc;

#[derive(Clone)]
pub struct FCM {
    service: Arc<FcmService>,
    message: FcmMessage,
}

impl FCM {
    pub fn init() -> Self {
        let mut notification = FcmNotification::new();
        notification.set_title("Расписание обновлено!".to_string());
        notification.set_body("Проверьте изменения в приложении.".to_string());

        let mut message = FcmMessage::new();
        message.set_notification(Some(notification));

        Self {
            service: Arc::new(FcmService::new("../college-schedule-firebase.json")),
            message,
        }
    }

    pub async fn send_to_group(&mut self, group_id: i64) -> Result<(), Box<dyn std::error::Error>> {
        let mut message = self.message.clone();
        message.set_target(Target::Topic(format!("group{}", group_id)));
        self.service.send_notification(message).await?;

        Ok(())
    }

    pub async fn send_to_teacher(
        &mut self,
        teacher_id: i64,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut message = self.message.clone();
        message.set_target(Target::Topic(format!("teacher{}", teacher_id)));
        self.service.send_notification(message).await?;

        Ok(())
    }
}
