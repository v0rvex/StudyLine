import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import api from '../api/client'
import type { ScheduleChange } from '../api/openapi-types'

export default function ImportDropzone() {
  const mut = useMutation(async (payload: ScheduleChange[]) => {
    await api.post('/add_schedule_changes', payload)
  })

  const onDrop = React.useCallback((files: File[]) => {
    const f = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        let arr: any[] = []
        if (f.name.endsWith('.json')) arr = JSON.parse(text)
        else {
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
          const headers = lines[0].split(',')
          arr = lines.slice(1).map(line => {
            const cells = line.split(',')
            const obj: any = {}
            headers.forEach((h, i) => obj[h.trim()] = cells[i]?.trim())
            return obj
          })
        }
        mut.mutate(arr as ScheduleChange[])
      } catch (e) {
        alert('Failed to parse file')
      }
    }
    reader.readAsText(f)
  }, [mut])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/json': ['.json'], 'text/csv': ['.csv'] } })

  return (
    <div className="card">
      <h3>Import schedule changes</h3>
      <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '16px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer' }}>
        <input {...getInputProps()} />
        <p>{isDragActive ? 'Drop file here...' : 'Drop JSON/CSV file here, or click to select'}</p>
      </div>
      {mut.isLoading && <p>Uploading...</p>}
      {mut.isError && <p style={{ color: 'crimson' }}>Error</p>}
      {mut.isSuccess && <p style={{ color: 'green' }}>Imported</p>}
    </div>
  )
}
