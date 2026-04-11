import { useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import UserStoryCard from './UserStoryCard'
import UserStoryForm from './UserStoryForm'
import './UserStoryList.css'

const UserStoryList = ({ stories, activeStory, sessionCode, sessionId, isAdmin, canCreate, canDelete, onSelect }) => {
  const socket = useSocket()
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (title, description) => {
    socket.emit('add-story', { sessionCode, title, description, sessionId })
    setShowForm(false)
  }

  const handleDelete = (storyId) => {
    if (!window.confirm('Delete this user story?')) return
    socket.emit('delete-story', { sessionCode, storyId, sessionId })
  }

  // All users can freely navigate to any story locally (no socket emission)
  const handleSelect = (story) => {
    onSelect?.(story)
  }

  const doneCount = stories.filter((s) => s.status === 'done').length

  return (
    <div className="story-list">
      <div className="story-list-header">
        <div className="story-list-title">
          <h3>User Stories</h3>
          <span className="story-progress">{doneCount}/{stories.length} done</span>
        </div>
        {canCreate && (
          <button
            className="add-story-btn"
            onClick={() => setShowForm((v) => !v)}
            title="Add user story"
          >
            {showForm ? '✕' : '+ Add'}
          </button>
        )}
      </div>

      {showForm && (
        <UserStoryForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {stories.length === 0 ? (
        <div className="empty-stories">
          <p>No user stories yet.</p>
          {canCreate && <p className="hint">Click "+ Add" to create your first story.</p>}
        </div>
      ) : (
        <div className="story-items">
          {stories.map((story) => (
            <UserStoryCard
              key={story._id}
              story={story}
              isActive={activeStory?._id === story._id}
              canDelete={canDelete}
              onSelect={() => handleSelect(story)}
              onDelete={() => handleDelete(story._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default UserStoryList
