import { useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import PokerCard from './PokerCard'
import VoteResults from './VoteResults'
import './PokerBoard.css'

const STORY_POINTS = ['0', '½', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕']

const PokerBoard = ({ story, participants, currentUser, sessionCode, isAdmin, isSM, canManage, onLuckyRound }) => {
  const socket = useSocket()
  const isVoting = story?.status === 'voting'
  const isRevealed = story?.status === 'revealed' || story?.status === 'done'
  const myVote = story?.votes?.find((v) => v.userId === currentUser?.userId)

  // Draft state for Quick Assign — selections not submitted until user clicks Submit
  const [qaPoint, setQaPoint] = useState(null)
  const [qaOwner, setQaOwner] = useState(null)

  // Reset drafts when the active story changes
  const storyId = story?._id
  const [lastStoryId, setLastStoryId] = useState(storyId)
  if (storyId !== lastStoryId) {
    setLastStoryId(storyId)
    setQaPoint(null)
    setQaOwner(null)
  }

  const handleVote = (point) => {
    if (!isVoting || !story || !currentUser) return
    socket.emit('submit-vote', {
      sessionCode,
      storyId: story._id,
      userId: currentUser.userId,
      userName: currentUser.name,
      point
    })
  }

  const handleReveal = () => {
    if (!story) return
    socket.emit('reveal-votes', { sessionCode, storyId: story._id })
  }

  const handleStartVoting = () => {
    if (!story) return
    socket.emit('start-voting', { sessionCode, storyId: story._id })
  }

  const handleFinalPoint = (point) => {
    socket.emit('set-final-point', { sessionCode, storyId: story._id, finalPoint: point })
  }

  const handleSetOwner = (participant) => {
    socket.emit('set-owner', {
      sessionCode,
      storyId: story._id,
      ownerId: participant.userId,
      ownerName: participant.name
    })
  }

  const handleQuickAssignSubmit = () => {
    if (!story) return
    if (qaPoint) {
      socket.emit('set-final-point', { sessionCode, storyId: story._id, finalPoint: qaPoint })
    }
    if (qaOwner) {
      socket.emit('set-owner', {
        sessionCode,
        storyId: story._id,
        ownerId: qaOwner.userId,
        ownerName: qaOwner.name
      })
    }
    setQaPoint(null)
    setQaOwner(null)
  }

  if (!story) {
    return (
      <div className="poker-board empty">
        <div className="empty-state">
          <div className="empty-icon">🎮</div>
          <h3>No story selected</h3>
          <p>
            {canManage
              ? 'Click a user story in the sidebar to start voting'
              : 'Waiting for the SM/admin to select a story…'}
          </p>
        </div>
      </div>
    )
  }

  const votedCount = story.votes?.length || 0
  const totalCount = participants?.length || 0

  return (
    <div className="poker-board">
      {/* Current story info */}
      <div className="current-story-banner">
        <div className="story-meta-badges">
          <span className={`status-badge badge-${story.status}`}>{story.status}</span>
          {story.finalPoint && (
            <span className="final-badge">✅ {story.finalPoint} pts</span>
          )}
          {story.owner?.userName && (
            <span className="owner-badge">👤 {story.owner.userName}</span>
          )}
        </div>
        <h3 className="story-banner-title">{story.title}</h3>
        {story.description && <p className="story-banner-desc">{story.description}</p>}
      </div>

      {/* Voter status row — SM participants shown without vote card when role is sm */}
      <div className="voter-status-row">
        {participants.map((p) => {
          const vote = story.votes?.find((v) => v.userId === p.userId)
          const isSMParticipant = p.role === 'sm'
          return (
            <div key={p.userId} className="voter-chip">
              <div
                className={[
                  'mini-card',
                  isSMParticipant ? 'sm-observer' : '',
                  vote ? 'voted' : '',
                  isRevealed && vote ? 'revealed' : ''
                ].join(' ')}
              >
                {isSMParticipant ? '📋' : isRevealed && vote ? vote.point : vote ? '✓' : '–'}
              </div>
              <span className="voter-name">{p.name}</span>
              {!p.isOnline && <span className="offline-tag">away</span>}
            </div>
          )
        })}
        <div className="vote-progress">
          {votedCount}/{totalCount} voted
        </div>
      </div>

      {/* Management controls for admin or SM */}
      {canManage && (
        <div className="poker-controls">
          {story.status === 'pending' && (
            <button className="btn btn-primary" onClick={handleStartVoting}>
              ▶ Start Voting
            </button>
          )}
          {isVoting && (
            <>
              <button className="btn btn-warning" onClick={handleReveal}>
                👁 Reveal Cards
              </button>
              <button className="btn btn-ghost" onClick={handleStartVoting}>
                🔄 Restart Round
              </button>
            </>
          )}
          {isRevealed && story.status !== 'done' && (
            <>
              <button className="btn btn-ghost" onClick={handleStartVoting}>
                🔄 Re-vote
              </button>
              <button className="btn btn-accent" onClick={onLuckyRound}>
                🎲 Lucky Round — Pick Owner
              </button>
            </>
          )}
          {story.status === 'done' && (
            <>
              <button className="btn btn-ghost" onClick={handleStartVoting}>
                🔄 Re-vote
              </button>
              <button className="btn btn-accent" onClick={onLuckyRound}>
                🎲 Lucky Round — Change Owner
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick Assign — canManage can bypass voting on pending/voting/revealed stories */}
      {canManage && (story.status === 'pending' || story.status === 'voting' || story.status === 'revealed') && (
        <div className="quick-assign-section">
          <div className="quick-assign-header">
            <span className="qa-title">⚡ Assign</span>
            <span className="qa-hint">Optionally set point and/or owner, then submit</span>
          </div>
          <div className="quick-assign-row">
            <span className="qa-label">Point</span>
            <div className="qa-chips">
              {STORY_POINTS.map((p) => (
                <button
                  key={p}
                  className={`qa-point-btn ${qaPoint === p ? 'active' : ''}`}
                  onClick={() => setQaPoint((prev) => (prev === p ? null : p))}
                  title={qaPoint === p ? 'Click to deselect' : ''}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="quick-assign-row">
            <span className="qa-label">Owner</span>
            <div className="qa-chips">
              {participants
                .filter((p) => p.role !== 'sm' && p.isOnline)
                .map((p) => (
                  <button
                    key={p.userId}
                    className={`qa-owner-btn ${qaOwner?.userId === p.userId ? 'active' : ''}`}
                    onClick={() => setQaOwner((prev) => (prev?.userId === p.userId ? null : p))}
                    title={qaOwner?.userId === p.userId ? 'Click to deselect' : ''}
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          </div>
          <div className="quick-assign-footer">
            {(qaPoint || qaOwner) && (
              <span className="qa-summary">
                {[qaPoint && `📌 ${qaPoint} pts`, qaOwner && `👤 ${qaOwner.name}`]
                  .filter(Boolean)
                  .join('  ·  ')}
              </span>
            )}
            <button
              className="btn btn-primary btn-sm qa-submit"
              onClick={handleQuickAssignSubmit}
              disabled={!qaPoint && !qaOwner}
            >
              ✓ Submit
            </button>
          </div>
        </div>
      )}

      {/* Vote results when revealed */}
      {isRevealed && (
        <VoteResults
          story={story}
          isAdmin={isAdmin}
          isSM={isSM}
          onFinalPoint={handleFinalPoint}
          onLuckyRound={onLuckyRound}
        />
      )}

      {/* Poker cards — Dev/Admin-Dev only (SM observes, does not vote) */}
      {isVoting && !isSM && (
        <div className="poker-cards-section">
          <h4 className="cards-label">
            {myVote
              ? `Your vote: ${myVote.point} — click to change`
              : 'Pick your story point estimate:'}
          </h4>
          <div className="poker-cards-grid">
            {STORY_POINTS.map((point) => (
              <PokerCard
                key={point}
                point={point}
                selected={myVote?.point === point}
                onClick={() => handleVote(point)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SM observing message */}
      {isVoting && isSM && (
        <div className="sm-observing-msg">
          <span>📋</span>
          <span>SM mode — observing this round. Results will appear after reveal.</span>
        </div>
      )}

      {/* Waiting message for dev during pending */}
      {!canManage && story.status === 'pending' && (
        <div className="waiting-state">
          <p>⏳ Waiting for SM/admin to start voting…</p>
        </div>
      )}
    </div>
  )
}

export default PokerBoard
