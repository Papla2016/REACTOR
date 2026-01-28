import { useEffect, useRef, useState } from 'react'
import api from '../api/client'

type Marker = {
  marker: string
  type: string
  original_value: string
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

const markerTypes = ['NAME', 'PASSPORT', 'PHONE', 'EMAIL', 'CITY', 'OTHER']

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
    setMarkers([...markers, { marker, type: selectedType, original_value: selectedText }])
    setContextMenu(null)
  }

  const autoDeidentify = async () => {
    const res = await api.post('/deidentify', { text })
    setMaskedText(res.data.masked_text)
    setMarkers(res.data.markers)
  }

  const createPatient = async () => {
    const res = await api.post('/patients', { full_name: patientQuery, email: newPatientEmail || undefined })
    setSelectedPatient(res.data)
    setPatientName(res.data.full_name)
    setPatientQuery(res.data.full_name)
    setPatientOptions([])
  }

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
      markers,
    })
    setText('')
    setMaskedText('')
    setMarkers([])
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
