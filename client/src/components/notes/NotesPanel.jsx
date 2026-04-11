import { useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import './NotesPanel.css'

const NotesPanel = ({ story, currentUser, sessionCode }) => {
  const socket = useSocket()
  const [note, setNote] = useState('')

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!note.trim() || !story || !currentUser) return
    socket.emit('add-note', {
      sessionCode,
      storyId: story._id,
      userId: currentUser.userId,
      userName: currentUser.name,
      content: note.trim()
    })
    setNote('')
  }

  const handleDeleteNote = (noteId) => {
    socket.emit('delete-note', { sessionCode, storyId: story._id, noteId })
  }

  if (!story) {
    return (
      <div className="notes-panel empty">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No story selected</h3>
          <p>Select a user story from the sidebar to add notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notes-panel">
      <div className="notes-story-header">
        <h3>📝 Notes</h3>
        <span className="notes-story-title">{story.title}</span>
      </div>

      <form className="note-input-form" onSubmit={handleAddNote}>
        <textarea
          className="note-textarea"
          placeholder="Share your opinion or comment about this story…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <div className="note-form-footer">
          <span className="char-count">{note.length}/500</span>
          <button type="submit" className="btn btn-primary" disabled={!note.trim()}>
            Add Note
          </button>
        </div>
      </form>

      <div className="notes-list">
        {!story.notes?.length ? (
          <p className="no-notes-msg">No notes yet — be the first to comment!</p>
        ) : (
          story.notes.map((n) => (
            <div key={n._id} className="note-item">
              <div className="note-item-header">
                <span className="note-avatar">{n.userName[0].toUpperCase()}</span>
                <span className="note-author">{n.userName}</span>
                <span className="note-time">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {n.userId === currentUser?.userId && (
                  <button
                    className="note-delete-btn"
                    onClick={() => handleDeleteNote(n._id)}
                    title="Delete note"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="note-content">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotesPanel
