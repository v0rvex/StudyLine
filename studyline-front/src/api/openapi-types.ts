export type LoginRequest = { login: string; password: string }
export type LoginResponse = { token: string; role: string }
export type Pair = { id: number; pair_number: number; subject_id: number; teacher_id: number; start_time: string; end_time: string; cabinet?: string; }
export type ScheduleDay = { group_id: number; weekday: number; pairs: Pair[]; }
export type ScheduleChange = { schedule_id?: number; group_id: number; new_subject_id?: number; new_teacher_id?: number; date: string; new_start_time?: string; new_end_time?: string; cabinet?: string, is_canceled: boolean }
