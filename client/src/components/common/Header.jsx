import { useNavigate, useLocation } from 'react-router-dom'
import { useSession } from '../../context/SessionContext'
import './Header.css'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, session } = useSession()
  const isSession = location.pathname.startsWith('/session')

  return (
    <header className="app-header">
      <div className="header-brand" onClick={() => navigate('/')}>
        <span className="header-logo">🃏</span>
        <span className="header-title">Scrum Planning</span>
      </div>

      {isSession && session && (
        <div className="header-center">
          <span className="header-session-label">{session.name}</span>
        </div>
      )}

      <div className="header-right">
        {currentUser && (
          <div className="header-user">
            <span className="user-avatar">{currentUser.name[0].toUpperCase()}</span>
            <span className="user-name">{currentUser.name}</span>
            {currentUser.isAdmin && <span className="admin-tag">Admin</span>}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
