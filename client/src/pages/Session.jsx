import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { useSocket } from '../context/SocketContext'
import { getSession } from '../services/api'
import UserStoryList from '../components/userstory/UserStoryList'
import PokerBoard from '../components/poker/PokerBoard'
import NotesPanel from '../components/notes/NotesPanel'
import LuckyRound from '../components/luckyround/LuckyRound'
import TeamPanel from '../components/team/TeamPanel'
import Loading from '../components/common/Loading'
import './Session.css'

const Session = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()
  const {
    session, setSession,
    stories, setStories,
    currentUser,
    activeStory, setActiveStory,
    luckyWinner,
    updateLastSeen
  } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('poker')
  const [showLuckyRound, setShowLuckyRound] = useState(false)

  /* Redirect if no user identity */
  useEffect(() => {
    const saved = localStorage.getItem('scrumUser')
    if (!saved) {
      navigate(`/join/${code}`)
    }
  }, [code, navigate])

  /* Load session data from REST */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getSession(code)
        setSession(data.session)
        setStories(data.stories)
        if (data.session.currentStoryId) {
          const current = data.stories.find((s) => s._id === data.session.currentStoryId?.toString())
          if (current) setActiveStory(current)
        }
      } catch {
        setError('Session not found or has expired.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [code])

  /* Emit socket join event once socket and session are ready */
  useEffect(() => {
    if (!socket || !currentUser || !session) return
    socket.emit('join-session', {
      sessionCode: code,
      userId: currentUser.userId,
      userName: currentUser.name
    })
    updateLastSeen(code)
  }, [socket, currentUser?.userId, session?._id])

  /* Auto-show lucky round when winner is selected by server */
  useEffect(() => {
    if (luckyWinner) setShowLuckyRound(true)
  }, [luckyWinner])

  const copyCode = () => navigator.clipboard?.writeText(code)

  if (loading) return <Loading />
  if (error) {
    return (
      <div className="error-page">
        <div className="error-icon">😕</div>
        <h2>{error}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    )
  }

  // Use live participant record so newly-granted admins get controls without re-login
  const myParticipant = session?.participants?.find((p) => p.userId === currentUser?.userId)
  const isAdmin = myParticipant?.isAdmin ?? currentUser?.isAdmin
  const onlineCount = session?.participants?.filter((p) => p.isOnline).length || 0
  const myPermissions = myParticipant?.permissions || []
  const isSM = myParticipant?.role === 'sm'
  // canManage: full session control (voting, stories, set point, lucky round)
  const canManageVoting = isAdmin || isSM
  const canCreateStory = canManageVoting || myPermissions.includes('create_story')
  const canDeleteStory = canManageVoting || myPermissions.includes('delete_story')

  return (
    <div className="session-page">
      {/* Session top bar */}
      <div className="session-topbar">
        <div className="session-info">
          <h2 className="session-title">{session?.name}</h2>
          <button className="session-code-btn" onClick={copyCode} title="Click to copy invite code">
            <span>Code:</span>
            <strong>{code}</strong>
            <span className="copy-icon">📋</span>
          </button>
        </div>

        <div className="participants-row">
          <span className="online-count">{onlineCount} online</span>
          {session?.participants?.map((p) => (
            <div key={p.userId} className={`participant-chip ${p.isOnline ? 'online' : 'offline'}`}>
              <span className="participant-avatar">{p.name[0].toUpperCase()}</span>
              <span className="participant-name">{p.name}</span>
              {p.isAdmin && <span className="admin-star" title="Admin">★</span>}
              {p.role === 'sm' && !p.isAdmin && <span className="role-dot sm" title="Scrum Master">SM</span>}
              <span className={`status-dot ${p.isOnline ? 'green' : 'grey'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Main layout */}
      <div className="session-layout">
        {/* Left sidebar: User Stories */}
        <aside className="stories-sidebar">
          <UserStoryList
            stories={stories}
            activeStory={activeStory}
            sessionCode={code}
            sessionId={session?._id}
            isAdmin={isAdmin}
            canCreate={canCreateStory}
            canDelete={canDeleteStory}
            onSelect={setActiveStory}
          />
        </aside>

        {/* Right main area: Tabs */}
        <main className="session-main">
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'poker' ? 'active' : ''}`}
              onClick={() => setActiveTab('poker')}
            >
              🃏 Poker Board
            </button>
            <button
              className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              📝 Notes
              {activeStory?.notes?.length > 0 && (
                <span className="note-count-badge">{activeStory.notes.length}</span>
              )}
            </button>
            <button
              className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              👥 Team
            </button>
          </div>

          {activeTab === 'poker' && (
            <PokerBoard
              story={activeStory}
              participants={session?.participants || []}
              currentUser={currentUser}
              sessionCode={code}
              isAdmin={isAdmin}
              isSM={isSM}
              canManage={canManageVoting}
              onLuckyRound={() => setShowLuckyRound(true)}
            />
          )}

          {activeTab === 'notes' && (
            <NotesPanel
              story={activeStory}
              currentUser={currentUser}
              sessionCode={code}
            />
          )}

          {activeTab === 'team' && (
            <TeamPanel
              participants={session?.participants || []}
              currentUser={currentUser}
              sessionCode={code}
            />
          )}
        </main>
      </div>

      {/* Lucky Round overlay */}
      {showLuckyRound && (
        <LuckyRound
          participants={session?.participants?.filter((p) => p.isOnline) || []}
          story={activeStory}
          sessionCode={code}
          luckyWinner={luckyWinner}
          canManage={canManageVoting}
          onClose={() => setShowLuckyRound(false)}
        />
      )}
    </div>
  )
}

export default Session
