// src/pages/TeacherScheduleMe.tsx
import React from "react";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";
import {
  get_groups,
  get_schedule,
  get_schedule_changes,
  get_subjects_by_group_id,
  get_teachers,
  get_group_by_id
} from "../api/sdk";
import { useError } from "../contexts/ErrorContext";

type Pair = any
type Change = any
type Group = any

export default function TeacherScheduleMe() {
  const teacherId = Number(Cookies.get("id") || 0);
  const { show } = useError();

  /* LOAD EVERYTHING */

  const { data: result, isLoading } = useQuery({
    queryKey: ["teacherSchedule", teacherId],
    enabled: teacherId > 0,
    queryFn: async () => {
      // 1. Load all groups
      const groups = (await get_groups()).data || [];

      // 2. Load global teacher list
      const teachers = (await get_teachers()).data || [];

      // 3. For each group load:
      //    - schedule
      //    - changes
      //    - subjects
      //    - group name
      const full = await Promise.all(
        groups.map(async (g: Group) => {
          const [scheduleRes, changesRes, subjectsRes, groupNameRes] =
            await Promise.all([
              get_schedule(g.id),
              get_schedule_changes(g.id),
              get_subjects_by_group_id(g.id),
              get_group_by_id(g.id),
            ]);

          return {
            group: g,
            groupName: groupNameRes.data?.name || "",
            schedule: scheduleRes.data || [],
            subjects: subjectsRes.data || [],
            changes: changesRes.data || [],
          };
        })
      );

      // Build a global subjects map and groupNames map
      const subjectMap = new Map<number, string>();
      const groupMap = new Map<number, string>();

      for (const block of full) {
        groupMap.set(block.group.id, block.groupName);
        for (const s of block.subjects) {
          subjectMap.set(s.id, s.name);
        }
      }

      const teacherMap = new Map<number, string>();
      for (const t of teachers) teacherMap.set(t.id, t.full_name);

      // === BUILD RESULTING TEACHER SCHEDULE ===

      const entriesByDay = new Map<number, any[]>();

      for (let d = 1; d <= 7; d++) entriesByDay.set(d, []);

      for (const block of full) {
        const groupId = block.group.id;
        const groupName = block.groupName;

        // quickly map schedule_id -> changes[]
        const chMap = new Map<number, Change[]>();
        for (const c of block.changes) {
          if (!chMap.has(c.schedule_id)) chMap.set(c.schedule_id, []);
          chMap.get(c.schedule_id)!.push(c);
        }

        for (const day of block.schedule) {
          const weekday = day.weekday;

          for (const p of day.pairs) {
            const list = entriesByDay.get(weekday)!;
            const chList = chMap.get(p.id) || [];
            const lastChange = chList[chList.length - 1];

            if (lastChange) {
              // CANCELLED
              if (lastChange.is_canceled && p.teacher_id === teacherId) {
                list.push({
                  pair_number: p.pair_number,
                  start_time: lastChange.new_start_time || p.start_time,
                  end_time: lastChange.new_end_time || p.end_time,
                  subject: subjectMap.get(lastChange.new_subject_id) || subjectMap.get(p.subject_id) || "—",
                  teacher: teacherMap.get(p.teacher_id) || "—",
                  group: groupName,
                  cabinet: lastChange.cabinet || p.cabinet,
                  canceled: true,
                  change: true,
                  date: lastChange.date
                });
                continue;
              }

              // REASSIGNED TO ME
              if (!lastChange.is_canceled && lastChange.new_teacher_id === teacherId) {
                list.push({
                  pair_number: lastChange.pair_number || p.pair_number,
                  start_time: lastChange.new_start_time || p.start_time,
                  end_time: lastChange.new_end_time || p.end_time,
                  subject: subjectMap.get(lastChange.new_subject_id) || "—",
                  teacher: teacherMap.get(lastChange.new_teacher_id) || "—",
                  group: groupName,
                  cabinet: lastChange.cabinet || p.cabinet,
                  change: true,
                  date: lastChange.date
                });
                continue;
              }

              // UPDATED BUT STILL MY PAIR
              if (!lastChange.is_canceled && p.teacher_id === teacherId) {
                list.push({
                  pair_number: lastChange.pair_number || p.pair_number,
                  start_time: lastChange.new_start_time || p.start_time,
                  end_time: lastChange.new_end_time || p.end_time,
                  subject: subjectMap.get(lastChange.new_subject_id) || subjectMap.get(p.subject_id) || "—",
                  teacher: teacherMap.get(p.teacher_id) || "—",
                  group: groupName,
                  cabinet: lastChange.cabinet || p.cabinet,
                  change: true,
                  date: lastChange.date
                });
                continue;
              }
            }

            // NORMAL PAIR
            if (p.teacher_id === teacherId) {
              list.push({
                pair_number: p.pair_number,
                start_time: p.start_time,
                end_time: p.end_time,
                subject: subjectMap.get(p.subject_id) || "—",
                teacher: teacherMap.get(p.teacher_id) || "—",
                group: groupName,
                cabinet: p.cabinet,
                change: false
              });
            }
          }
        }
      }

      // Sort
      for (let d = 1; d <= 7; d++) {
        entriesByDay.get(d)!.sort((a, b) => a.pair_number - b.pair_number);
      }

      // Detect parallels
      const parallelKey = new Set<string>();
      for (let d = 1; d <= 7; d++) {
        const list = entriesByDay.get(d)!;
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            if (
              list[i].start_time === list[j].start_time &&
              list[i].end_time === list[j].end_time
            ) {
              parallelKey.add(`${d}-${i}`);
              parallelKey.add(`${d}-${j}`);
            }
          }
        }
      }

      return { entriesByDay, parallelKey };
    }
  });

  if (!teacherId)
    return <div className="container"><div className="card">Нет id преподавателя в Cookies</div></div>;

  if (isLoading)
    return <div className="container"><div className="card">Загрузка...</div></div>;

  const { entriesByDay, parallelKey } = result!;

  const WD = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  return (
    <div className="container">
      <h3>Моё расписание</h3>

      <div
        className="card"
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 12,
        }}
      >
        {WD.map((name, i) => {
          const day = i + 1;
          const list = entriesByDay.get(day)!;

          return (
            <div key={day} className="card" style={{ padding: 12 }}>
              <b>{name}</b>

              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {list.length === 0 && <div className="muted">Нет пар</div>}

                {list.map((p, idx) => {
                  const isParallel = parallelKey.has(`${day}-${idx}`);

                  return (
                    <div
                      key={idx}
                      className="card"
                      style={{
                        padding: 10,
                        background: p.change ? "var(--card-contrast)" : "var(--card)",
                        border: isParallel ? "2px solid #f6c84c" : "1px solid var(--border)",
                        opacity: p.canceled ? 0.6 : 1
                      }}
                    >
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <b>#{p.pair_number} {p.start_time} – {p.end_time}</b>
                        <span className="small">{p.group}</span>
                      </div>


                      <div style={{ marginTop: 6 }}>
                        <b>{p.subject}</b>
                      </div>

                      <div className="small">{p.cabinet ? `Кабинет: ${p.cabinet} ` : ""}</div>

                      {p.change && (
                        <div style={{ marginTop: 6 }}>
                          {p.canceled ? (
                            <span style={{ color: "crimson" }}>Пара отменена</span>
                          ) : (
                            <>
                              <div style={{ fontWeight: 600 }}>Замена</div>
                              <div className="small">До {p.date}</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

