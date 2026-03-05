import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../api/client'

type Marker = {
  marker: string
  type: string
  original_value: string
  source?: 'AUTO' | 'MANUAL'
}

type CaseSummary = {
  id: number
  patient_name: string
  doctor_name: string
  visit_date: string
  disease: string
  direction: string
}

type PatientOption = {
  id: number
  full_name: string
  email?: string
}

type DoctorDraft = {
  patientQuery: string
  newPatientEmail: string
  doctorName: string
  patientName: string
  visitDate: string
  disease: string
  direction: string
  notes: string
  analysisResult: string
  text: string
  maskedText: string
  markers: Marker[]
  selectedPatient: PatientOption | null
}

const markerTypes = ['NAME', 'PASSPORT', 'PHONE', 'EMAIL', 'CITY', 'OTHER']
const draftKey = 'doctor_case_draft_v1'

export default function DoctorDashboard() {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [patientQuery, setPatientQuery] = useState('')
  const [patientOptions, setPatientOptions] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)
  const [newPatientEmail, setNewPatientEmail] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [patientName, setPatientName] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [disease, setDisease] = useState('')
  const [direction, setDirection] = useState('')
  const [notes, setNotes] = useState('')
  const [analysisResult, setAnalysisResult] = useState('')
  const [text, setText] = useState('')
  const [maskedText, setMaskedText] = useState('')
  const [markers, setMarkers] = useState<Marker[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [selectedType, setSelectedType] = useState('NAME')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const markerCounters = markers.reduce<Record<string, number>>((acc, item) => {
    const count = acc[item.type] || 0
    acc[item.type] = Math.max(count, parseInt(item.marker.replace(item.type, ''), 10) || 0)
    return acc
  }, {})

  const loadCases = async () => {
    const res = await api.get('/cases')
    setCases(res.data)
  }

  useEffect(() => {
    loadCases()
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(draftKey)
    if (!raw) return
    try {
      const draft = JSON.parse(raw) as DoctorDraft
      setPatientQuery(draft.patientQuery || '')
      setNewPatientEmail(draft.newPatientEmail || '')
      setDoctorName(draft.doctorName || '')
      setPatientName(draft.patientName || '')
      setVisitDate(draft.visitDate || '')
      setDisease(draft.disease || '')
      setDirection(draft.direction || '')
      setNotes(draft.notes || '')
      setAnalysisResult(draft.analysisResult || '')
      setText(draft.text || '')
      setMaskedText(draft.maskedText || '')
      setMarkers(draft.markers || [])
      setSelectedPatient(draft.selectedPatient || null)
    } catch {
      localStorage.removeItem(draftKey)
    }
  }, [])

  useEffect(() => {
    const draft: DoctorDraft = {
      patientQuery,
      newPatientEmail,
      doctorName,
      patientName,
      visitDate,
      disease,
      direction,
      notes,
      analysisResult,
      text,
      maskedText,
      markers,
      selectedPatient,
    }
    localStorage.setItem(draftKey, JSON.stringify(draft))
  }, [patientQuery, newPatientEmail, doctorName, patientName, visitDate, disease, direction, notes, analysisResult, text, maskedText, markers, selectedPatient])

  useEffect(() => {
    if (patientQuery.trim().length < 2) {
      setPatientOptions([])
      return
    }
    const run = async () => {
      const res = await api.get('/patients', { params: { query: patientQuery } })
      setPatientOptions(res.data)
    }
    run()
  }, [patientQuery])

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const selection = window.getSelection()?.toString() || ''
    const element = textareaRef.current
    if (!element) {
      return
    }
    const start = element.selectionStart
    const end = element.selectionEnd
    if (!selection || start === end) {
      return
    }
    e.preventDefault()
    setSelectedText(text.substring(start, end))
    setContextMenu({ x: e.pageX, y: e.pageY })
  }

  const applyManualMarker = () => {
    if (!selectedText || !textareaRef.current) {
      return
    }
    const element = textareaRef.current
    const start = element.selectionStart
    const end = element.selectionEnd
    const nextCount = (markerCounters[selectedType] || 0) + 1
    const marker = `${selectedType}${nextCount}`
    const updatedText = text.slice(0, start) + marker + text.slice(end)
    setText(updatedText)
    setMaskedText(updatedText)
    setMarkers([...markers, { marker, type: selectedType, original_value: selectedText, source: 'MANUAL' }])
    setContextMenu(null)
  }

  const autoDeidentify = async () => {
    const res = await api.post('/deidentify', { text })
    setMaskedText(res.data.masked_text)
    setMarkers(res.data.markers.map((item: Marker) => ({ ...item, source: 'AUTO' })))
  }

  const createPatient = async () => {
    const res = await api.post('/patients', { full_name: patientQuery, email: newPatientEmail || undefined })
    setSelectedPatient(res.data)
    setPatientName(res.data.full_name)
    setPatientQuery(res.data.full_name)
    setPatientOptions([])
  }

  const markerGroups = useMemo(() => {
    const grouped = { AUTO: [] as Marker[], MANUAL: [] as Marker[] }
    for (const marker of markers) {
      grouped[marker.source === 'MANUAL' ? 'MANUAL' : 'AUTO'].push(marker)
    }
    return grouped
  }, [markers])

  const submitCase = async () => {
    if (!selectedPatient) return
    await api.post('/cases', {
      patient_id: selectedPatient.id,
      patient_name: patientName,
      doctor_name: doctorName,
      visit_date: visitDate,
      disease,
      direction,
      notes,
      analysis_result: analysisResult,
      masked_text: maskedText || text,
      markers: markers.map(({ marker, type, original_value }) => ({ marker, type, original_value })),
    })
    setText('')
    setMaskedText('')
    setMarkers([])
    localStorage.removeItem(draftKey)
    loadCases()
  }

  return (
    <div className="container">
      <h1>Панель врача</h1>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Новое медицинское дело</h3>
        <div className="form-grid">
          <div>
            <label>Пациент (ФИО)</label>
            <input
              value={patientQuery}
              onChange={(e) => {
                setPatientQuery(e.target.value)
                setSelectedPatient(null)
              }}
            />
            {patientOptions.length > 0 && (
              <div className="card" style={{ marginTop: 8, padding: 12 }}>
                {patientOptions.map((patient) => (
                  <div key={patient.id} style={{ padding: 6, cursor: 'pointer' }} onClick={() => {
                    setSelectedPatient(patient)
                    setPatientName(patient.full_name)
                    setPatientQuery(patient.full_name)
                    setPatientOptions([])
                  }}>
                    {patient.full_name} {patient.email && <span className="badge">{patient.email}</span>}
                  </div>
                ))}
              </div>
            )}
            {patientQuery && patientOptions.length === 0 && !selectedPatient && (
              <div style={{ marginTop: 8 }}>
                <label>Email (опционально)</label>
                <input value={newPatientEmail} onChange={(e) => setNewPatientEmail(e.target.value)} />
                <button className="button secondary" style={{ marginTop: 8 }} onClick={createPatient}>Добавить пациента</button>
              </div>
            )}
          </div>
          <div>
            <label>ФИО врача</label>
            <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </div>
          <div>
            <label>ФИО пациента</label>
            <input value={patientName} onChange={(e) => setPatientName(e.target.value)} />
          </div>
          <div>
            <label>Дата приема</label>
            <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label>Диагноз</label>
            <input value={disease} onChange={(e) => setDisease(e.target.value)} />
          </div>
          <div>
            <label>Направление</label>
            <input value={direction} onChange={(e) => setDirection(e.target.value)} />
          </div>
          <div>
            <label>Заметки</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <label>Результат анализа</label>
            <textarea rows={3} value={analysisResult} onChange={(e) => setAnalysisResult(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label>Текст дела</label>
          <textarea
            ref={textareaRef}
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onContextMenu={handleContextMenu}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <label>Обезличенный текст</label>
          <textarea rows={6} value={maskedText} readOnly />
        </div>
        {markers.length > 0 && (
          <details style={{ marginTop: 16 }}>
            <summary>Меню обезличивания (авто / ручной)</summary>
            <div className="form-grid" style={{ marginTop: 8 }}>
              <div>
                <strong>Авто</strong>
                {markerGroups.AUTO.length === 0 ? <p>Нет</p> : markerGroups.AUTO.map((item) => <div key={item.marker}>{item.marker} → {item.original_value}</div>)}
              </div>
              <div>
                <strong>Ручной</strong>
                {markerGroups.MANUAL.length === 0 ? <p>Нет</p> : markerGroups.MANUAL.map((item) => <div key={item.marker}>{item.marker} → {item.original_value}</div>)}
              </div>
            </div>
          </details>
        )}
        {contextMenu && (
          <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
            <div style={{ padding: 10 }}>
              <label>Тип маркера</label>
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                {markerTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button onClick={applyManualMarker} style={{ marginTop: 8 }}>Обезличить</button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button className="button secondary" onClick={autoDeidentify}>Обезличить (авто)</button>
          <button className="button primary" onClick={submitCase}>Сохранить дело</button>
        </div>
      </div>
      <div className="card">
        <h3>Мои дела</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Пациент</th>
              <th>Дата</th>
              <th>Диагноз</th>
              <th>Направление</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((item) => (
              <tr key={item.id}>
                <td>{item.patient_name}</td>
                <td>{item.visit_date}</td>
                <td>{item.disease}</td>
                <td>{item.direction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
