import { createContext, useContext, useState, useEffect } from 'react'
import { useSocket } from './SocketContext'

const SessionContext = createContext(null)

export const useSession = () => useContext(SessionContext)

export const SessionProvider = ({ children }) => {
  const socket = useSocket()
  const [session, setSession] = useState(null)
  const [stories, setStories] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [activeStory, setActiveStory] = useState(null)
  const [luckyWinner, setLuckyWinner] = useState(null)

  /* Restore user from localStorage on first load */
  useEffect(() => {
    const saved = localStorage.getItem('scrumUser')
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('scrumUser')
      }
    }
  }, [])

  /* Socket event listeners */
  useEffect(() => {
    if (!socket) return

    socket.on('session-updated', ({ session, stories }) => {
      setSession(session)
      setStories(stories)
    })

    socket.on('stories-updated', ({ stories }) => {
      setStories(stories)
    })

    socket.on('voting-started', ({ story, session }) => {
      // Update stories list and session but don't force-navigate anyone
      setSession(session)
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
    })

    socket.on('story-selected', ({ story, session }) => {
      // Update stories list and session but don't force-navigate anyone
      setSession(session)
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
    })

    socket.on('vote-submitted', ({ story }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
    })

    socket.on('votes-revealed', ({ story }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
    })

    socket.on('final-point-set', ({ story }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
    })

    socket.on('owner-selected', ({ story, winner }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
      setLuckyWinner(winner)
      setTimeout(() => setLuckyWinner(null), 6000)
    })

    // Direct owner assignment (no lucky round overlay)
    socket.on('owner-set', ({ story }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
    })

    socket.on('note-added', ({ story }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
    })

    socket.on('note-deleted', ({ story }) => {
      setActiveStory((prev) => (prev?._id === story._id ? story : prev))
      setStories((prev) => prev.map((s) => (s._id === story._id ? story : s)))
    })

    socket.on('permissions-updated', ({ participants }) => {
      setSession((prev) => prev ? { ...prev, participants } : prev)
    })

    socket.on('permission-denied', ({ action }) => {
      console.warn('Permission denied for action:', action)
    })

    return () => {
      socket.off('session-updated')
      socket.off('stories-updated')
      socket.off('voting-started')
      socket.off('story-selected')
      socket.off('vote-submitted')
      socket.off('votes-revealed')
      socket.off('final-point-set')
      socket.off('owner-selected')
      socket.off('owner-set')
      socket.off('note-added')
      socket.off('note-deleted')
      socket.off('permissions-updated')
      socket.off('permission-denied')
    }
  }, [socket])

  const saveCurrentUser = (user, sessionCode) => {
    const payload = {
      ...user,
      lastSessionCode: sessionCode || user.lastSessionCode || null,
      lastSeen: new Date().toISOString()
    }
    setCurrentUser(payload)
    localStorage.setItem('scrumUser', JSON.stringify(payload))
  }

  const updateLastSeen = (sessionCode) => {
    const saved = localStorage.getItem('scrumUser')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      const updated = { ...parsed, lastSessionCode: sessionCode, lastSeen: new Date().toISOString() }
      setCurrentUser(updated)
      localStorage.setItem('scrumUser', JSON.stringify(updated))
    } catch { /* ignore */ }
  }

  const clearCurrentUser = () => {
    setCurrentUser(null)
    localStorage.removeItem('scrumUser')
  }

  return (
    <SessionContext.Provider
      value={{
        session, setSession,
        stories, setStories,
        currentUser, saveCurrentUser, clearCurrentUser, updateLastSeen,
        activeStory, setActiveStory,
        luckyWinner, setLuckyWinner
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}
