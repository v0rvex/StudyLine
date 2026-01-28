// src/pages/ReplacementsPage.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  get_schedule_changes,
  add_schedule_changes,
  delete_schedule_changes,
  edit_schedule_changes,
  get_teachers,
  get_subjects_by_group_id,
  get_schedule,
  get_group_by_id,
} from "../api/sdk";
import Modal from "../components/Modal";
import SearchSelect from "../components/SearchSelect.tsx";
import Cookies from "js-cookie";
import { useError } from "../contexts/ErrorContext";

export default function ScheduleChanges() {
  const { id } = useParams<{ id: string }>();
  const gid = Number(id || 0);

  const qc = useQueryClient();
  const { show } = useError();
  const isAdmin = Cookies.get("role") === "admin";

  const [openModal, setOpenModal] = React.useState(false);
  const [editing, setEditing] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<(() => void) | null>(null);

  const [form, setForm] = React.useState({
    schedule_id: 0,
    group_id: gid,
    date: "",
    new_subject_id: 0,
    new_teacher_id: 0,
    new_start_time: "",
    new_end_time: "",
    cabinet: "",
    is_canceled: false,
  });

  const { data: schedule } = useQuery({
    queryKey: ["schedule", gid],
    queryFn: async () => (await get_schedule(gid)).data,
    enabled: !!gid,
  });

  const { data: changes } = useQuery({
    queryKey: ["schedule_changes", gid],
    queryFn: async () => (await get_schedule_changes(gid)).data,
    enabled: !!gid,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", gid],
    queryFn: async () => (await get_subjects_by_group_id(gid)).data,
    enabled: !!gid,
  });

  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => (await get_teachers()).data,
  });

  const { data: groupName, isLoading } = useQuery({
    queryKey: ["groupName", gid],
    queryFn: async () => (await get_group_by_id(gid)).data,
    enabled: !!gid,
  });

  const addMut = useMutation({
    mutationFn: async (arr: any[]) => await add_schedule_changes(arr),
    onSuccess: () => qc.invalidateQueries(["schedule_changes", gid]),
  });

  const editMut = useMutation({
    mutationFn: async (body: any) => await edit_schedule_changes(body),
    onSuccess: () => qc.invalidateQueries(["schedule_changes", gid]),
  });

  const delMut = useMutation({
    mutationFn: async (ids: number[]) => await delete_schedule_changes(ids),
    onSuccess: () => qc.invalidateQueries(["schedule_changes", gid]),
  });

  const teacherName = (id: number) =>
    teachers?.find((t: any) => t.id === id)?.full_name || "—";

  const subjectName = (id: number) =>
    subjects?.find((s: any) => s.id === id)?.name || "—";

  const pairInfo = (schedule_id: number) => {
    for (const day of schedule || []) {
      const found = day.pairs.find((p: any) => p.id === schedule_id);
      if (found) return { ...found, weekday: day.weekday };
    }
    return null;
  };

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  function openAdd() {
    setEditing(false);
    setForm({
      schedule_id: 0,
      group_id: gid,
      date: "",
      new_subject_id: 0,
      new_teacher_id: 0,
      new_start_time: "",
      new_end_time: "",
      cabinet: "",
      is_canceled: false,
    });
    setOpenModal(true);
  }

  function openEdit(change: any) {
    const base = pairInfo(change.schedule_id);

    setEditing(true);
    setForm({
      ...change,
      new_start_time: change.new_start_time || base?.start_time || "",
      new_end_time: change.new_end_time || base?.end_time || "",
    });

    setOpenModal(true);
  }

  function save() {
    const payload = { ...form, group_id: gid };

    if (editing) editMut.mutate(payload);
    else addMut.mutate([payload]);

    setOpenModal(false);
  }

  function remove(change: any) {
    setConfirmAction(() => () => delMut.mutate([change.schedule_id]));
    setConfirmOpen(true);
  }

  const groupedByWeekday: Record<number, any[]> = React.useMemo(() => {
    const out: Record<number, any[]> = {};

    for (const c of changes || []) {
      const info = pairInfo(c.schedule_id);
      if (!info) continue;

      if (!out[info.weekday]) out[info.weekday] = [];
      out[info.weekday].push({ ...c, base: info });
    }

    for (const k of Object.keys(out)) {
      out[Number(k)].sort((a, b) => a.base.pair_number - b.base.pair_number);
    }

    return out;
  }, [changes, schedule]);

  return (
    <div className="container">
      <h3>Замены — {isLoading ? "..." : groupName.name}</h3>

      {isAdmin && (
        <button className="btn" style={{ margin: "12px 0" }} onClick={openAdd}>
          + Добавить замену
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Object.keys(groupedByWeekday).length === 0 && (
          <div className="muted">Замен нет</div>
        )}

        {Object.entries(groupedByWeekday).map(([weekday, list]) => (
          <div key={weekday} className="card" style={{ padding: 12 }}>
            <div
              style={{
                padding: "4px 10px",
                background: "var(--text)",
                color: "var(--bg)",
                display: "inline-block",
                borderRadius: 6,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              {weekdays[Number(weekday) - 1]}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {list.map((c) => (
                <div
                  key={c.schedule_id}
                  className="card"
                  onClick={() => isAdmin && openEdit(c)}
                  style={{
                    padding: 10,
                    cursor: isAdmin ? "pointer" : "default",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      background: "var(--text)",
                      color: "var(--bg)",
                      padding: "2px 6px",
                      borderRadius: 6,
                      display: "inline-block",
                      marginBottom: 6,
                      fontSize: "0.8em",
                    }}
                  >
                    {c.base.pair_number} урок
                  </div>

                  {c.is_canceled ? (
                    <div style={{ color: "red", fontWeight: 600 }}>
                      Пара отменена
                    </div>
                  ) : (
                    <>
                      <div>Предмет: <b>{subjectName(c.new_subject_id)}</b></div>
                      <div>Преподаватель: <b>{teacherName(c.new_teacher_id)}</b></div>
                      <div>Время: <b>{c.new_start_time}–{c.new_end_time}</b></div>
                      {c.cabinet && (
                        <div>Кабинет: <b>{c.cabinet}</b></div>
                      )}
                    </>
                  )}

                  {isAdmin && (
                    <button
                      className="nav-btn"
                      style={{ marginTop: 6 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(c);
                      }}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN MODAL */}
      <Modal visible={openModal} onClose={() => setOpenModal(false)} title="Замена">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label>Пара</label>
          <SearchSelect
            className="input"
            value={form.schedule_id}
            onChange={(e) => {
              const id = Number(e);
              const info = pairInfo(id);

              if (info)
                setForm({
                  ...form,
                  schedule_id: id,
                  new_start_time: info.start_time,
                  new_end_time: info.end_time,
                });
              else
                setForm({ ...form, schedule_id: id });
            }}
            options={(schedule || []).flatMap((day) =>
              day.pairs.map((p) => ({
                value: p.id,
                label: `${weekdays[day.weekday - 1]}, ${p.pair_number} пара (${subjectName(p.subject_id)})`,
              }))
            )}
          />

          <label>Дата</label>
          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <label style={{ display: "flex", alignItems: "center" }}>
            <input
            className="select_checkbox"
              type="checkbox"
              checked={form.is_canceled}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_canceled: e.target.checked,
                  new_subject_id: 0,
                  new_teacher_id: 0,
                })
              }
            />
            &nbsp; Пара отменена
          </label>

          {!form.is_canceled && (
            <>
              <SearchSelect
                className="input"
                value={form.new_subject_id}
                onChange={(e) =>
                  setForm({ ...form, new_subject_id: Number(e) })
                }
                options={(subjects || []).map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                placeholder="Выберите предмет"
              />

              <SearchSelect
                className="input"
                value={form.new_teacher_id}
                onChange={(e) =>
                  setForm({ ...form, new_teacher_id: Number(e) })
                }
                options={(teachers || []).map((t) => ({
                  value: t.id,
                  label: t.full_name,
                }))}
                placeholder="Выберите преподавателя"
              />

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  placeholder="Начало"
                  value={form.new_start_time}
                  onChange={(e) =>
                    setForm({ ...form, new_start_time: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Конец"
                  value={form.new_end_time}
                  onChange={(e) =>
                    setForm({ ...form, new_end_time: e.target.value })
                  }
                />
              </div>

              <input
                className="input"
                placeholder="Кабинет"
                value={form.cabinet}
                onChange={(e) =>
                  setForm({ ...form, cabinet: e.target.value })
                }
              />
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn" onClick={save}>
              Сохранить
            </button>
            <button className="nav-btn" onClick={() => setOpenModal(false)}>
              Отмена
            </button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        visible={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Подтверждение удаления"
      >
        <p>Удалить эту замену?</p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            className="btn"
            onClick={() => {
              confirmAction?.();
              setConfirmOpen(false);
            }}
          >
            Да
          </button>

          <button
            className="nav-btn"
            onClick={() => setConfirmOpen(false)}
          >
            Нет
          </button>
        </div>
      </Modal>
    </div>
  );
}

