import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: number | string
  label: string
}

interface SearchSelectProps {
  value: number | string
  options: Option[]
  placeholder?: string
  onChange: (v: number | string) => void
}

export default function SearchSelect({
  value,
  options,
  onChange,
  placeholder = "Выберите..."
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)?.label || ""

  const filtered = query.trim().length
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase())
      )
    : options

  // закрытие при клике вне области
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="select-container">
      <div
        className="select-input"
        onClick={() => setOpen(!open)}
      >
        {selected || <span className="placeholder">{placeholder}</span>}
      </div>

      {open && (
        <div className="select-dropdown">
          <input
            className="select-search"
            placeholder="Поиск..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          <div className="select-options">
            {filtered.length === 0 && (
              <div className="select-empty">Ничего не найдено</div>
            )}

            {filtered.map(o => (
              <div
                key={o.value}
                className="select-option"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQuery("")
                }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

