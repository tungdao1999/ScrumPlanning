import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../services/api'
import { useSession } from '../context/SessionContext'
import './Home.css'

const Home = () => {
  const [sessionName, setSessionName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [creatorRole, setCreatorRole] = useState('sm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { saveCurrentUser, setSession } = useSession()

  /* Returning user — read last session from localStorage */
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('scrumUser') || 'null') } catch { return null }
  })()
  const hasLastSession = savedUser?.lastSessionCode && savedUser?.name

  const formatLastSeen = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return d.toLocaleDateString()
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!sessionName.trim() || !adminName.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await createSession({ name: sessionName.trim(), adminName: adminName.trim(), role: creatorRole })
      saveCurrentUser({ userId: data.userId, name: adminName.trim(), isAdmin: true, role: creatorRole }, data.session.code)
      setSession(data.session)
      navigate(`/session/${data.session.code}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      {/* Returning user banner */}
      {hasLastSession && (
        <div className="returning-banner">
          <div className="returning-info">
            <span className="returning-avatar">{savedUser.name[0].toUpperCase()}</span>
            <div>
              <span className="returning-greeting">Welcome back, <strong>{savedUser.name}</strong></span>
              <span className="returning-meta">
                Last session: <strong>{savedUser.lastSessionCode}</strong>
                {savedUser.lastSeen && <> · {formatLastSeen(savedUser.lastSeen)}</>}
              </span>
            </div>
          </div>
          <div className="returning-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/session/${savedUser.lastSessionCode}`)}
            >
              🔄 Rejoin Session
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { localStorage.removeItem('scrumUser'); window.location.reload() }}
            >
              ✕ Forget me
            </button>
          </div>
        </div>
      )}
      <div className="hero">
        <div className="hero-icon">🃏</div>
        <h1>Scrum Planning Poker</h1>
        <p>Estimate user stories with your team using planning poker</p>
      </div>

      <div className="home-cards">
        <div className="card">
          <h2>Create Session</h2>
          <p>Start a new planning poker session for your team</p>
          <form onSubmit={handleCreate} className="form">
            <div className="form-group">
              <label>Session Name</label>
              <input
                type="text"
                placeholder="e.g. Sprint 42"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="form-group">
              <label>Your Role</label>
              <div className="role-picker">
                <button
                  type="button"
                  className={`role-option ${creatorRole === 'sm' ? 'active' : ''}`}
                  onClick={() => setCreatorRole('sm')}
                >
                  <span className="role-icon">📋</span>
                  <span className="role-name">Scrum Master</span>
                  <span className="role-desc">Manages stories &amp; voting, does not vote</span>
                </button>
                <button
                  type="button"
                  className={`role-option ${creatorRole === 'dev' ? 'active' : ''}`}
                  onClick={() => setCreatorRole('dev')}
                >
                  <span className="role-icon">🔨</span>
                  <span className="role-name">Developer</span>
                  <span className="role-desc">Votes on story points</span>
                </button>
              </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : '🚀 Create Session'}
            </button>
          </form>
        </div>

        <div className="card-divider">
          <span>or</span>
        </div>

        <div className="card card-join">
          <h2>Join Session</h2>
          <p>Have a session code? Join your team's session</p>
          <button className="btn btn-secondary" onClick={() => navigate('/join')}>
            🎯 Join with Code
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home
