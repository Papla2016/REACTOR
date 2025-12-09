import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Ошибка запроса');
  }
  return res.json();
}

function HighlightedText({ text, entities }) {
  if (!text) return null;
  const sorted = [...entities].sort((a, b) => a.start_offset - b.start_offset);
  const chunks = [];
  let cursor = 0;
  sorted.forEach((ent, idx) => {
    if (cursor < ent.start_offset) {
      chunks.push({ key: `plain-${idx}-${cursor}`, text: text.slice(cursor, ent.start_offset), entity: null });
    }
    chunks.push({ key: `ent-${ent.id || idx}`, text: text.slice(ent.start_offset, ent.end_offset), entity: ent });
    cursor = ent.end_offset;
  });
  if (cursor < text.length) {
    chunks.push({ key: `tail-${cursor}`, text: text.slice(cursor), entity: null });
  }

  return (
    <p className="report-text">
      {chunks.map((c) =>
        c.entity ? (
          <span key={c.key} className={`tag tag-${c.entity.source || 'auto'}`} title={`${c.entity.entity_type} (${c.entity.source})`}>
            {c.text}
          </span>
        ) : (
          <span key={c.key}>{c.text}</span>
        ),
      )}
    </p>
  );
}

function EntitiesList({ entities }) {
  return (
    <div className="entities-list">
      {entities.length === 0 && <div className="muted">Сущности пока не найдены</div>}
      {entities.map((ent) => (
        <div key={`${ent.id}-${ent.start_offset}`} className="entity-card">
          <div className="entity-type">{ent.entity_type}</div>
          <div className="entity-value">{ent.value}</div>
          <div className="entity-meta">Источник: {ent.source || 'auto'}</div>
          <div className="entity-meta">Позиции: {ent.start_offset}–{ent.end_offset}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [medic, setMedic] = useState(() => {
    const raw = localStorage.getItem('medic');
    return raw ? JSON.parse(raw) : null;
  });
  const [loginForm, setLoginForm] = useState({ email: 'doctor@example.com', password: 'doctor123' });
  const [reportForm, setReportForm] = useState({
    patient_full_name: '',
    patient_date_of_birth: '',
    viewer_full_name: '',
    raw_text: '',
  });
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [detectedEntities, setDetectedEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const selectionRef = useRef(null);
  const [manualModal, setManualModal] = useState({ open: false, selection: null, type: 'ФИО' });

  useEffect(() => {
    if (medic) {
      localStorage.setItem('medic', JSON.stringify(medic));
      loadReports();
    }
  }, [medic]);

  const loadReports = async () => {
    if (!medic) return;
    const data = await api(`/reports?medic_id=${medic.id}`);
    setReports(data);
  };

  const loadReport = async (id) => {
    const data = await api(`/reports/${id}`);
    setCurrentReport(data);
    setDetectedEntities([]);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(loginForm) });
      setMedic(data.medic);
      setMessage('Успешный вход');
    } catch (err) {
      setMessage(err.message || 'Ошибка входа');
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!medic) return;
    setLoading(true);
    setMessage('');
    try {
      const payload = { ...reportForm, medic_id: medic.id };
      const created = await api('/reports', { method: 'POST', body: JSON.stringify(payload) });
      setReportForm({ patient_full_name: '', patient_date_of_birth: '', viewer_full_name: '', raw_text: '' });
      await loadReports();
      await loadReport(created.id);
      setMessage('Отчёт создан');
    } catch (err) {
      setMessage(err.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!currentReport) return;
    setLoading(true);
    setMessage('');
    try {
      const ner = await api('/ner/process', { method: 'POST', body: JSON.stringify({ text: currentReport.raw_text }) });
      setDetectedEntities(ner.entities);
      const mapped = ner.entities.map((e) => ({
        start_offset: e.start,
        end_offset: e.end,
        value: e.value,
        entity_type: e.entity_type,
        source: 'auto',
      }));
      if (mapped.length > 0) {
        await api(`/reports/${currentReport.id}/entities/auto`, { method: 'POST', body: JSON.stringify(mapped) });
        await loadReport(currentReport.id);
      }
      setMessage('Авторазметка завершена');
    } catch (err) {
      setMessage(err.message || 'Ошибка обработки');
    } finally {
      setLoading(false);
    }
  };

  const onTextContextMenu = (e) => {
    if (!selectionRef.current) return;
    const textarea = selectionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;
    const value = textarea.value.slice(start, end);
    e.preventDefault();
    setManualModal({ open: true, selection: { start, end, value }, type: 'ФИО' });
  };

  const saveManual = async () => {
    if (!currentReport || !manualModal.selection) return;
    const payload = {
      start_offset: manualModal.selection.start,
      end_offset: manualModal.selection.end,
      value: manualModal.selection.value,
      entity_type: manualModal.type,
      source: 'manual',
      created_by: medic?.full_name,
    };
    try {
      await api(`/reports/${currentReport.id}/entities/manual`, { method: 'POST', body: JSON.stringify(payload) });
      await loadReport(currentReport.id);
      setManualModal({ open: false, selection: null, type: 'ФИО' });
      setMessage('Сущность сохранена');
    } catch (err) {
      setMessage(err.message || 'Ошибка сохранения');
    }
  };

  const combinedEntities = useMemo(() => {
    if (!currentReport) return [];
    const existing = currentReport.entities || [];
    const autos = detectedEntities.map((e, idx) => ({
      id: `auto-${idx}`,
      start_offset: e.start,
      end_offset: e.end,
      value: e.value,
      entity_type: e.entity_type,
      source: e.source || 'auto',
    }));
    return [...existing, ...autos];
  }, [currentReport, detectedEntities]);

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Демо обезличивания мед. отчётов</h1>
          <p className="muted">FastAPI + Natasha + PostgreSQL</p>
        </div>
        {medic && (
          <div className="badge">{medic.full_name}</div>
        )}
      </header>

      <div className="grid">
        <section className="card">
          <h2>Вход медика</h2>
          <form className="form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </label>
            <button type="submit">Войти</button>
          </form>
          {message && <div className="info">{message}</div>}
        </section>

        <section className="card">
          <h2>Новый отчёт</h2>
          {!medic && <div className="muted">Сначала войдите как медик</div>}
          <form className="form" onSubmit={handleCreateReport}>
            <label>
              ФИО пациента
              <input
                type="text"
                value={reportForm.patient_full_name}
                onChange={(e) => setReportForm({ ...reportForm, patient_full_name: e.target.value })}
                required
                disabled={!medic}
              />
            </label>
            <label>
              Дата рождения
              <input
                type="date"
                value={reportForm.patient_date_of_birth}
                onChange={(e) => setReportForm({ ...reportForm, patient_date_of_birth: e.target.value })}
                disabled={!medic}
              />
            </label>
            <label>
              ФИО ответственного зрителя
              <input
                type="text"
                value={reportForm.viewer_full_name}
                onChange={(e) => setReportForm({ ...reportForm, viewer_full_name: e.target.value })}
                required
                disabled={!medic}
              />
            </label>
            <label>
              Текст отчёта
              <textarea
                value={reportForm.raw_text}
                onChange={(e) => setReportForm({ ...reportForm, raw_text: e.target.value })}
                rows={5}
                required
                disabled={!medic}
              />
            </label>
            <button type="submit" disabled={!medic || loading}>
              Сохранить отчёт
            </button>
          </form>
        </section>
      </div>

      <div className="grid">
        <section className="card">
          <h2>Отчёты медика</h2>
          {reports.length === 0 && <div className="muted">Пока нет сохранённых отчётов</div>}
          <ul className="report-list">
            {reports.map((r) => (
              <li key={r.id} className={currentReport?.id === r.id ? 'active' : ''} onClick={() => loadReport(r.id)}>
                <div className="title">Отчёт #{r.id}</div>
                <div className="muted">{new Date(r.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Детали отчёта</h2>
          {!currentReport && <div className="muted">Выберите отчёт для просмотра и обработки</div>}
          {currentReport && (
            <>
              <div className="meta">Пациент: {currentReport.patient?.full_name || 'Не указан'}</div>
              <div className="meta">Право просмотра: {currentReport.viewer_full_name}</div>
              <div className="actions">
                <button onClick={handleProcess} disabled={loading}>Обработать нейросетью</button>
              </div>
              <div className="text-block">
                <div className="text-title">Текст с подсветкой</div>
                <HighlightedText text={currentReport.raw_text} entities={combinedEntities} />
              </div>
              <div className="text-block">
                <div className="text-title">Выделите фрагмент (ПКМ по выделению)</div>
                <textarea
                  ref={selectionRef}
                  value={currentReport.raw_text}
                  readOnly
                  onContextMenu={onTextContextMenu}
                  rows={6}
                />
              </div>
              <EntitiesList entities={combinedEntities} />
            </>
          )}
        </section>
      </div>

      {manualModal.open && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Добавление сущности</h3>
            <p className="muted">Текст: {manualModal.selection?.value}</p>
            <label>
              Тип
              <select value={manualModal.type} onChange={(e) => setManualModal({ ...manualModal, type: e.target.value })}>
                <option>ФИО</option>
                <option>ИНН</option>
                <option>номер СНИЛС</option>
                <option>номер паспорта</option>
                <option>номер телефона</option>
                <option>e-mail</option>
                <option>адрес</option>
                <option>другое</option>
              </select>
            </label>
            <div className="modal-actions">
              <button onClick={saveManual}>Сохранить</button>
              <button className="secondary" onClick={() => setManualModal({ open: false, selection: null, type: 'ФИО' })}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
