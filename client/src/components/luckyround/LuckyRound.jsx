import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../../context/SocketContext'
import './LuckyRound.css'

const COLORS = ['#6c63ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#f77f00', '#00b4d8']

const LuckyRound = ({ participants, story, sessionCode, luckyWinner, canManage, onClose }) => {
  const socket = useSocket()
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const [spinning, setSpinning] = useState(false)
  const [currentAngle, setCurrentAngle] = useState(0)
  const [displayWinner, setDisplayWinner] = useState(luckyWinner || null)
  const [excluded, setExcluded] = useState(new Set())

  // SM participants are observers/managers — only Dev members are eligible for lucky round
  const eligible = participants.filter((p) => p.isOnline && p.role !== 'sm' && !excluded.has(p.userId))

  const removeMember = (userId) => {
    setExcluded((prev) => new Set([...prev, userId]))
  }

  const handleSpinAgain = () => {
    // Exclude the previous winner so they won't be picked again immediately
    if (displayWinner?.userId) {
      setExcluded((prev) => new Set([...prev, displayWinner.userId]))
    }
    setDisplayWinner(null)
    setSpinning(false)
  }

  /* Update display winner when server responds */
  useEffect(() => {
    if (luckyWinner) {
      setDisplayWinner(luckyWinner)
      setSpinning(false)
    }
  }, [luckyWinner])

  /* Draw the wheel whenever angle or participants change */
  useEffect(() => {
    drawWheel(currentAngle)
  }, [currentAngle, eligible.length])

  const drawWheel = (angle) => {
    const canvas = canvasRef.current
    if (!canvas || eligible.length === 0) return
    const ctx = canvas.getContext('2d')
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const r = cx - 12
    const slice = (2 * Math.PI) / eligible.length

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    /* Draw slices */
    eligible.forEach((p, i) => {
      const start = i * slice + angle
      const end = start + slice

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = '#0f0e17'
      ctx.lineWidth = 2
      ctx.stroke()

      /* Label */
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + slice / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 13px system-ui, sans-serif'
      const label = p.name.length > 11 ? p.name.slice(0, 11) + '…' : p.name
      ctx.fillText(label, r - 10, 5)
      ctx.restore()
    })

    /* Center cap */
    ctx.beginPath()
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI)
    ctx.fillStyle = '#0f0e17'
    ctx.fill()
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 3
    ctx.stroke()

    /* Pointer arrow */
    ctx.beginPath()
    ctx.moveTo(canvas.width - 4, cy)
    ctx.lineTo(canvas.width - 28, cy - 14)
    ctx.lineTo(canvas.width - 28, cy + 14)
    ctx.closePath()
    ctx.fillStyle = '#ff6b6b'
    ctx.fill()
  }

  const handleSpin = () => {
    if (spinning || eligible.length === 0 || displayWinner) return
    setSpinning(true)

    const extraTurns = 5 + Math.floor(Math.random() * 5)
    const targetAngle = currentAngle + extraTurns * 2 * Math.PI + Math.random() * 2 * Math.PI
    const duration = 3500
    const startTime = performance.now()
    const startAngle = currentAngle

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      /* Ease-out cubic */
      const eased = 1 - Math.pow(1 - progress, 3)
      const angle = startAngle + (targetAngle - startAngle) * eased

      setCurrentAngle(angle)
      drawWheel(angle)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        /* Let the server pick the winner deterministically */
        socket.emit('lucky-round', {
          sessionCode,
          storyId: story._id,
          participants: eligible
        })
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  /* Clean up animation on unmount */
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <div className="lucky-overlay" onClick={onClose}>
      <div className="lucky-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lucky-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="lucky-title">🎲 Lucky Round</h2>
        <p className="lucky-subtitle">Spin to select the owner of this story!</p>

        {story && (
          <div className="lucky-story-name">
            Story: <strong>{story.title}</strong>
          </div>
        )}

        {/* Participant pool — canManage can remove members before/after spin */}
        {canManage && (
          <div className="participants-pool">
            {participants
              .filter((p) => p.isOnline && p.role !== 'sm')
              .map((p) => {
                const isExcluded = excluded.has(p.userId)
                return (
                  <div key={p.userId} className={`pool-chip ${isExcluded ? 'excluded' : ''}`}>
                    <span>{p.name}</span>
                    {!isExcluded ? (
                      <button
                        className="pool-chip-remove"
                        onClick={() => removeMember(p.userId)}
                        title={`Remove ${p.name} from pool`}
                      >✕</button>
                    ) : (
                      <button
                        className="pool-chip-restore"
                        onClick={() => setExcluded((prev) => { const s = new Set(prev); s.delete(p.userId); return s })}
                        title={`Restore ${p.name}`}
                      >↩</button>
                    )}
                  </div>
                )
              })}
          </div>
        )}

        <div className="wheel-wrap">
          {eligible.length === 0 ? (
            <p className="no-players">No eligible participants — restore some members above</p>
          ) : (
            <canvas ref={canvasRef} width={320} height={320} className="wheel-canvas" />
          )}
        </div>

        {eligible.length > 0 && !displayWinner && (
          <button
            className={`btn btn-spin ${spinning ? 'spinning' : ''}`}
            onClick={handleSpin}
            disabled={spinning}
          >
            {spinning ? '🌀 Spinning…' : '🎰 Spin the Wheel!'}
          </button>
        )}

        {displayWinner && (
          <div className="winner-card">
            <div className="winner-confetti">🎉🎊🎉</div>
            <h3>Owner Selected!</h3>
            <div className="winner-name-display">{displayWinner.name}</div>
            <p>will be the owner of this user story</p>
            <div className="winner-actions">
              {canManage && eligible.filter((p) => p.userId !== displayWinner.userId).length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={handleSpinAgain}>
                  🔄 Spin Again
                </button>
              )}
              <button className="btn btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LuckyRound
