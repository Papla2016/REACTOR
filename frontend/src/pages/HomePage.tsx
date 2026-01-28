import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', marginTop: '80px' }}>
        <h1>Медицинские дела</h1>
        <p>Выберите тип входа</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
          <Link className="button primary" to="/login/patient">Я пациент</Link>
          <Link className="button secondary" to="/login/doctor">Я врач</Link>
        </div>
      </div>
    </div>
  )
}
