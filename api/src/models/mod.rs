pub mod auth;
pub mod fcm;
pub mod group;
pub mod schedule;
pub mod schedule_changes;
pub mod subject;
pub mod teacher;
pub mod teacher_links;

pub use auth::{LoginRequest, LoginResponse, LogoutRequest};
pub use fcm::{FcmGroupRequest, FcmTeachersRequest};
pub use group::{AddGroupRequest, Group};
pub use schedule::{AddPair, AddScheduleRequest, Pair, Schedule, ScheduleRow};
pub use schedule_changes::ScheduleChange;
pub use subject::{AddSubjectRequest, EditSubjectRequest, Subject};
pub use teacher::{
    AddTeacherRequest, EditTeacherFullnameRequest, EditTeacherLoginRequest,
    EditTeacherPasswordRequest, Teacher, TeacherSafe,
};
pub use teacher_links::TeacherLink;
