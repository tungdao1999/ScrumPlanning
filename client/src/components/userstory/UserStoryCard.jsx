import './UserStoryCard.css'

const STATUS_COLOR = {
  pending: '#6b7280',
  voting: '#ffd93d',
  revealed: '#4d96ff',
  done: '#6bcb77'
}

const UserStoryCard = ({ story, isActive, canDelete, onSelect, onDelete }) => {
  return (
    <div
      className={`story-card clickable ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      title={story.status === 'voting' ? 'This story is currently being voted on' : 'Click to view'}
    >
      <div className="story-card-top">
        <span
          className="story-status-dot"
          style={{ background: STATUS_COLOR[story.status] || '#6b7280' }}
        />
        <span className="story-card-title">{story.title}</span>
        {canDelete && (
          <button
            className="story-delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            title="Delete story"
          >
            ✕
          </button>
        )}
      </div>

      <div className="story-card-bottom">
        {story.finalPoint && (
          <span className="story-pts-badge">{story.finalPoint} pts</span>
        )}
        {story.owner?.userName && (
          <span className="story-owner-tag">👤 {story.owner.userName}</span>
        )}
        {story.notes?.length > 0 && (
          <span className="story-notes-tag">📝 {story.notes.length}</span>
        )}
        {story.votes?.length > 0 && story.status !== 'pending' && (
          <span className="story-votes-tag">🗳 {story.votes.length}</span>
        )}
        <span className={`story-status-label s-${story.status}`}>{story.status}</span>
      </div>
    </div>
  )
}

export default UserStoryCard
