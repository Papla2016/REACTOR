import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function DoctorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('access_token', res.data.access_token)
      localStorage.setItem('refresh_token', res.data.refresh_token)
      localStorage.setItem('role', 'DOCTOR')
      navigate('/doctor')
    } catch {
      setError('Неверные данные')
    }
  }

  const oauthStart = (provider: string) => {
    localStorage.setItem('role', 'DOCTOR')
    window.location.href = `${api.defaults.baseURL}/oauth/${provider}/start?role=DOCTOR`
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: '60px auto' }}>
        <h2>Вход врача</h2>
        <form onSubmit={submit}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ color: '#cf222e' }}>{error}</p>}
          <button className="button primary" style={{ width: '100%', marginTop: 12 }} type="submit">Войти</button>
        </form>
        <div style={{ textAlign: 'center', margin: '16px 0' }}>или</div>
        <button className="button secondary" style={{ width: '100%' }} onClick={() => oauthStart('gosuslugi')}>Продолжить с Госуслугами</button>
        <button className="button secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => oauthStart('yandex')}>Продолжить с Яндексом</button>
        <div style={{ marginTop: 16 }}>
          <Link to="/">Назад</Link>
        </div>
      </div>
    </div>
  )
}
