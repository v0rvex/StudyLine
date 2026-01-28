export type LoginRequest = { login: string; password: string }
export type LoginResponse = { token?: string }
export type ScheduleDay = { group_id: number; weekday: number; pairs: Pair[] }

export type Teacher = { id: number; full_name?: string; name?: string; login?: string }
export type Subject = { id: number; name: string }

export type LoginRequest = { login: string; password: string }
export type LoginResponse = { token?: string }

export type Group = { id: number; name: string; shift: number}

export type Pair = {
  id: number
  pair_number: number
  subject_id: number
  teacher_id: number
  start_time: string
  end_time: string
  cabinet?: string
}


