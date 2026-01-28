import api from "./client";
import Cookies from "js-cookie";

// 🔑 Helper для токена
function authHeaders() {
  const token = Cookies.get("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ============================================================
   AUTH
============================================================ */
export const login = (data: { login: string; password: string }) =>
  api.post("/login", data);

export const logout = (data: { token: string }) =>
  api.post("/logout", data, { headers: authHeaders() });

/* ============================================================
   TEACHER LINKS
============================================================ */
export const add_teacher_link = (data: {group_id: number; teacher_id: number; subject_id: number}) =>
  api.post("/add_teacher_link", data, {headers: authHeaders()});
export const delete_teacher_link = (data: {group_id: number; teacher_id: number; subject_id: number}) =>
  api.delete("/delete_teacher_link", data, {headers: authHeaders()});
export const get_teacher_links = (group_id: number) =>
  api.get(`/get_teacher_links/${group_id}`);

/* ============================================================
   GROUPS
============================================================ */
export const get_groups = () => api.get("/get_groups");
export const get_group_by_id = (group_id: number) =>
  api.get(`/get_group_by_id/${group_id}`);
export const add_group = (data: { name: string }) =>
  api.post("/add_group", data, { headers: authHeaders() });
export const delete_group = (group_id: number) =>
  api.delete(`/delete_group/${group_id}`, { headers: authHeaders() });
export const edit_group = (data: { id: number; name: string }) =>
  api.patch("/edit_group", data, { headers: authHeaders() });

/* ============================================================
   SUBJECTS
============================================================ */
export const get_subjects_by_group_id = (group_id: number) =>
  api.get(`/get_subjects_by_group_id/${group_id}`);
export const add_subject = (data: { name: string; group_id: number }) =>
  api.post("/add_subject", data, { headers: authHeaders() });
export const delete_subject = (subject_id: number) =>
  api.delete(`/delete_subject/${subject_id}`, { headers: authHeaders() });
export const edit_subject = (data: { id: number; new_name: string }) =>
  api.patch("/edit_subject", data, { headers: authHeaders() });

/* ============================================================
   TEACHERS
============================================================ */
export const get_teachers = () => api.get("/get_teachers");

// ⚠️ Требует токен, т.к. возвращает конфиденциальные данные
export const get_teacher_by_id = (teacher_id: number) =>
  api.get(`/get_teacher_by_id/${teacher_id}`, { headers: authHeaders() });

export const add_teacher = (data: {
  login: string;
  password: string;
  full_name: string;
}) => api.post("/add_teacher", data, { headers: authHeaders() });

export const delete_teacher = (teacher_id: number) =>
  api.delete(`/delete_teacher/${teacher_id}`, { headers: authHeaders() });

export const update_teacher_fullname = (data: {
  id: number;
  full_name: string;
}) =>
  api.patch("/update_teacher_fullname", data, { headers: authHeaders() });

export const update_teacher_login = (data: { id: number; login: string }) =>
  api.patch("/update_teacher_login", data, { headers: authHeaders() });

export const update_teacher_password = (data: {
  id: number;
  password: string;
}) =>
  api.patch("/update_teacher_password", data, { headers: authHeaders() });

/* ============================================================
   SCHEDULE
============================================================ */
export const get_schedule = (group_id: number) =>
  api.get(`/get_schedule/${group_id}`);

export const add_schedule_day = (data: {
  group_id: number;
  weekday: number;
  pairs: any[];
}) => api.post("/add_pairs", data, { headers: authHeaders() });

export const edit_schedule_day = (data: {
  group_id: number;
  weekday: number;
  pairs: any[];
}) => api.patch("/edit_pairs", data, { headers: authHeaders() });

export const delete_schedule_day = (group_id: number, weekday: number) =>
  api.delete(`/delete_day/${group_id}/${weekday}`, { headers: authHeaders() });

export const delete_schedule_pair = (id: number) =>
  api.delete(`/delete_pair/${id}`, { headers: authHeaders() });
/* ============================================================
   SCHEDULE CHANGES
============================================================ */
export const get_schedule_changes = (group_id: number) =>
  api.get(`/get_schedule_changes/${group_id}`);
export const add_schedule_changes = (data: any[]) =>
  api.post("/add_schedule_changes", data, { headers: authHeaders() });
export const edit_schedule_changes = (data: any) =>
  api.patch("/edit_schedule_changes", data, { headers: authHeaders() });
export const delete_schedule_changes = (data: number[]) =>
  api.delete("/delete_schedule_changes", {data, headers: authHeaders() });
/* ============================================================
   FCM NOTIFICATIONS
============================================================ */
export const send_notifications_to_group = (group_id: {teacher_id: number}) =>
  api.post("/send_notifications_to_group", group_id, {headers: authHeaders() });
export const send_notifications_to_teachers = (data: {teacher_ids: number[];}) =>
  api.post("/send_notifications_to_teachers", data, {headers: authHeaders() })
