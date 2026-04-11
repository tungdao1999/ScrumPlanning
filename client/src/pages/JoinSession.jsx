import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { joinSession } from '../services/api'
import { useSession } from '../context/SessionContext'
import './JoinSession.css'

const JoinSession = () => {
  const { code: paramCode } = useParams()
  const [code, setCode] = useState(paramCode || '')
  /* Pre-fill name from localStorage if returning user */
  const savedUser = (() => {
    try { return JSON.parse(localStorage.getItem('scrumUser') || 'null') } catch { return null }
  })()
  const [name, setName] = useState(savedUser?.name || '')
  const [role, setRole] = useState('dev')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { saveCurrentUser, setSession, setStories } = useSession()

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await joinSession(code.toUpperCase(), { name: name.trim(), role })
      saveCurrentUser({ userId: data.userId, name: name.trim(), isAdmin: false, role }, data.session.code)
      setSession(data.session)
      setStories(data.stories)
      navigate(`/session/${data.session.code}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Session not found. Check the code and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="join-page">
      <div className="join-card">
        <div className="join-icon">🎯</div>
        <h1>Join Session</h1>
        <form onSubmit={handleJoin} className="form">
          <div className="form-group">
            <label>Session Code</label>
            <input
              type="text"
              placeholder="Enter 6-character code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="code-input"
            />
          </div>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label>Your Role</label>
            <div className="role-picker">
              <button
                type="button"
                className={`role-option ${role === 'sm' ? 'active' : ''}`}
                onClick={() => setRole('sm')}
              >
                <span className="role-icon">📋</span>
                <span className="role-name">Scrum Master</span>
                <span className="role-desc">Manages stories &amp; voting, does not vote</span>
              </button>
              <button
                type="button"
                className={`role-option ${role === 'dev' ? 'active' : ''}`}
                onClick={() => setRole('dev')}
              >
                <span className="role-icon">🔨</span>
                <span className="role-name">Developer</span>
                <span className="role-desc">Votes on story points</span>
              </button>
            </div>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Joining...' : '✈️ Join Session'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </form>
      </div>
    </div>
  )
}

export default JoinSession
