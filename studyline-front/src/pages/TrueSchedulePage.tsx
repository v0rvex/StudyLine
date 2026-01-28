// src/pages/ScheduleWeekView.tsx
import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  get_schedule,
  get_schedule_changes,
  get_teachers,
  get_subjects_by_group_id,
  get_group_by_id,
  send_notifications_to_group
} from "../api/sdk";
import { useError } from "../contexts/ErrorContext";
import Cookies from "js-cookie";
import { BellRing } from 'lucide-react';

export default function TrueSchedulePage() {
  const { id } = useParams<{ id: string }>();
  const gid = Number(id || 0);
  const { show } = useError();
  const isAdmin = Cookies.get("role") === "admin";
  /* === LOAD DATA === */

  const { data: schedule } = useQuery({
    queryKey: ["schedule", gid],
    queryFn: async () => (await get_schedule(gid)).data,
    enabled: !!gid,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить расписание'),
  });

  const { data: changes } = useQuery({
    queryKey: ["schedule_changes_view", gid],
    queryFn: async () => (await get_schedule_changes(gid)).data,
    enabled: !!gid,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить замены'),
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await get_teachers()).data,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить преподавателей'),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", gid],
    queryFn: async () => (await get_subjects_by_group_id(gid)).data,
    enabled: !!gid,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить предметы'),
  });

  const { data: group } = useQuery({
    queryKey: ["group", gid],
    queryFn: async () => (await get_group_by_id(gid)).data,
    enabled: !!gid,
    onError: (e: any) => show('Ошибка', e?.message || 'Не удалось получить название группы'),
  });

  const sendGroup = useMutation({
    mutationFn: async (data: {group_id: number}) => await send_notifications_to_group(data),
    onSuccess: () => show("Успех", "Уведомления отправлены!"),
    onError: (e: any) => show("Ошибка", e?.message)
  })

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  /* === HELPERS === */
  const teacherName = (id: number) =>
    teachers?.find((t: any) => t.id === id)?.full_name || "—";

  const subjectName = (id: number) =>
    subjects?.find((s: any) => s.id === id)?.name || "—";

  const changesMap = React.useMemo(() => {
    const map = new Map<number, any>();
    for (const c of changes || []) {
      map.set(c.schedule_id, c);
    }
    return map;
  }, [changes]);

  /* === MERGE SCHEDULE + CHANGES === */
  const finalSchedule = React.useMemo(() => {
    if (!schedule) return [];

    return schedule.map((day: any) => {
      const pairs = day.pairs.map((p: any) => {
        const change = changesMap.get(p.id);

        if (!change) return { ...p, changed: false };

        if (change.is_canceled) {
          return {
            ...p,
            is_canceled: true,
            changed: true,
          };
        }

        return {
          ...p,
          changed: true,
          subject_id: change.new_subject_id || p.subject_id,
          teacher_id: change.new_teacher_id || p.teacher_id,
          start_time: change.new_start_time || p.start_time,
          end_time: change.new_end_time || p.end_time,
          cabinet: change.cabinet || p.cabinet,
        };
      });

      return { ...day, pairs };
    });
  }, [schedule, changesMap]);

  /* === RENDER === */

  if (!gid)
    return <div className="container">Группа не выбрана</div>;

  return (
    <div className="container">
      <h3>Расписание — {group?.name || `Группа #${gid}`}</h3>
      {isAdmin && (
        <button className="btn" style={{display: 'inline-flex', alignItems: 'center'}} onClick={() => sendGroup.mutate({group_id: gid})}>
         <BellRing/> Отправить уведомления
        </button>
      )}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))",
          gap: 12,
          marginTop: 12,
        }}
      >
        {finalSchedule.map((day) => (
          <div
            key={day.weekday}
            className="day-cell"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--card)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <b style={{ marginBottom: 8 }}>
              {weekdays[day.weekday - 1]}
            </b>

            {day.pairs.map((p: any) => (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 8,
                  border: p.changed
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: p.changed ? "var(--bg)" : "var(--bg)",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9em" }}>
                  {subjectName(p.subject_id)}
                </div>

                {p.is_canceled ? (
                  <div style={{ color: "red", marginTop: 4 }}>
                    Урок отменен
                  </div>
                ) : (
                  <>
                    <div className="small">
                      {teacherName(p.teacher_id)} |
                      &nbsp; {p.start_time} – {p.end_time}
                    </div>
                    {p.cabinet && (
                      <div className="small">Кабинет: {p.cabinet}</div>
                    )}
                  </>
                )}

                {p.changed && !p.is_canceled && (
                  <div
                    style={{
                      fontSize: "0.75em",
                      marginTop: 6,
                      color: "var(--accent)",
                    }}
                  >
                    (заменено)
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

