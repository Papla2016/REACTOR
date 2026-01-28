import { useEffect, useState } from 'react'
import api from '../api/client'

type CaseSummary = {
  id: number
  patient_name: string
  doctor_name: string
  visit_date: string
  disease: string
  direction: string
}

type CaseDetail = CaseSummary & {
  notes: string
  analysis_result: string
  text: string
}

export default function PatientDashboard() {
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [selected, setSelected] = useState<CaseDetail | null>(null)

  const loadCases = async () => {
    const res = await api.get('/cases')
    setCases(res.data)
  }

  const openCase = async (id: number) => {
    const res = await api.get(`/cases/${id}`)
    setSelected(res.data)
  }

  useEffect(() => {
    loadCases()
  }, [])

  return (
    <div className="container">
      <h1>Кабинет пациента</h1>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Мои дела</h3>
        <ul>
          {cases.map((item) => (
            <li key={item.id} style={{ marginBottom: 8 }}>
              <button className="button secondary" onClick={() => openCase(item.id)}>
                {item.visit_date} — {item.disease}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {selected && (
        <div className="card">
          <h3>Дело #{selected.id}</h3>
          <p><strong>Пациент:</strong> {selected.patient_name}</p>
          <p><strong>Врач:</strong> {selected.doctor_name}</p>
          <p><strong>Диагноз:</strong> {selected.disease}</p>
          <p><strong>Направление:</strong> {selected.direction}</p>
          <p><strong>Заметки:</strong> {selected.notes}</p>
          <p><strong>Результат анализа:</strong> {selected.analysis_result}</p>
          <div>
            <label>Текст дела</label>
            <textarea rows={6} value={selected.text} readOnly />
          </div>
        </div>
      )}
    </div>
  )
}
