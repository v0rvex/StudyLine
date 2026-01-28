use crate::auth::handlers::{__path_login, __path_logout};
use crate::routes::groups::{__path_get_group_by_id, __path_get_groups, __path_add_group, __path_edit_group, __path_delete_group};
use crate::routes::subjects::{__path_add_subject, __path_edit_subject, __path_delete_subject, __path_get_subjects_by_group_id};
use crate::routes::teachers::{__path_add_teacher, __path_delete_teacher, __path_get_teachers, __path_get_teacher_by_id, __path_update_teacher_login, __path_update_teacher_fullname, __path_update_teacher_password};
use crate::routes::schedule::{__path_delete_pair, __path_delete_day, __path_add_pairs, __path_edit_pairs, __path_get_schedule};
use crate::routes::schedule_changes::{__path_add_schedule_changes, __path_get_schedule_changes, __path_edit_schedule_changes, __path_delete_schedule_changes};
use crate::routes::teacher_links::{__path_delete_teacher_link, __path_add_teacher_link, __path_get_teacher_links};
use crate::routes::fcm::{__path_send_notifications_to_teachers, __path_send_notifications_to_group};
use utoipa::{
    Modify, OpenApi,
    openapi::{
        self, ComponentsBuilder,
        security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
    },
};
use utoipa_swagger_ui::SwaggerUi;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut openapi::OpenApi) {
        let bearer_scheme = SecurityScheme::Http(
            HttpBuilder::new()
                .scheme(HttpAuthScheme::Bearer)
                .bearer_format("UUID")
                .build(),
        );

        if let Some(components) = &mut openapi.components {
            components.add_security_scheme("bearer_auth", bearer_scheme);
        } else {
            let components = ComponentsBuilder::new()
                .security_scheme("bearer_auth", bearer_scheme)
                .build();
            openapi.components = Some(components)
        }
    }
}

#[derive(OpenApi)]
#[openapi(
    paths(
        send_notifications_to_group,
        send_notifications_to_teachers,

        add_schedule_changes,
        get_schedule_changes,
        edit_schedule_changes,
        delete_schedule_changes,

        edit_pairs,
        add_pairs,
        delete_day,
        delete_pair,
        get_schedule,

        add_teacher,
        delete_teacher,
        get_teachers,
        get_teacher_by_id,
        update_teacher_login,
        update_teacher_password,
        update_teacher_fullname,

        add_teacher_link,
        delete_teacher_link,
        get_teacher_links,

        add_subject,
        edit_subject,
        delete_subject,
        get_subjects_by_group_id,

        delete_group, 
        edit_group, 
        add_group, 
        get_groups, 
        get_group_by_id, 

        login, 
        logout
    ),
    components(
        schemas(
            crate::models::FcmTeachersRequest,
            crate::models::FcmGroupRequest,

            crate::models::TeacherLink,

            crate::models::Teacher,
            crate::models::TeacherSafe,
            crate::models::AddTeacherRequest,
            crate::models::EditTeacherLoginRequest,
            crate::models::EditTeacherPasswordRequest,
            crate::models::EditTeacherFullnameRequest,

            crate::models::Subject,
            crate::models::AddSubjectRequest,
            crate::models::EditSubjectRequest,

            crate::models::Group,
            crate::models::AddGroupRequest,

            crate::errors::ErrorResponse, 
            
            crate::models::auth::LoginRequest, 
            crate::models::auth::LogoutRequest, 
            crate::models::auth::LoginResponse,

            crate::models::schedule::Schedule,
            crate::models::schedule::AddScheduleRequest,

            crate::models::schedule_changes::ScheduleChange
            )
        ),
    modifiers(&SecurityAddon),
)]
pub struct ApiDoc;

pub fn swagger_ui() -> SwaggerUi {
    SwaggerUi::new("/swagger").url("/api-docs/openapi.json", ApiDoc::openapi())
}
