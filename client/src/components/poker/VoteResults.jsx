import './VoteResults.css'

const VoteResults = ({ story }) => {
  if (!story?.votes?.length) return null

  const numericVotes = story.votes
    .filter((v) => !isNaN(parseFloat(v.point)))
    .map((v) => parseFloat(v.point))

  const avg =
    numericVotes.length
      ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1)
      : null

  const min = numericVotes.length ? Math.min(...numericVotes) : null
  const max = numericVotes.length ? Math.max(...numericVotes) : null
  const consensus = story.votes.length > 0 && story.votes.every((v) => v.point === story.votes[0].point)

  /* Group votes by point value */
  const groups = story.votes.reduce((acc, v) => {
    acc[v.point] = acc[v.point] || []
    acc[v.point].push(v.userName)
    return acc
  }, {})

  /* Sort groups by numeric value descending */
  const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
    const na = parseFloat(a)
    const nb = parseFloat(b)
    if (!isNaN(na) && !isNaN(nb)) return nb - na
    return 0
  })

  return (
    <div className="vote-results">
      <div className="results-header">
        <h4>📊 Vote Results</h4>
        {consensus && <span className="consensus-tag">🎉 Consensus!</span>}
      </div>

      <div className="vote-breakdown">
        {sortedGroups.map(([point, voters]) => (
          <div key={point} className="vote-group">
            <div className="vote-badge">{point}</div>
            <div className="vote-bar-wrap">
              <div
                className="vote-bar"
                style={{ width: `${(voters.length / story.votes.length) * 100}%` }}
              />
            </div>
            <div className="vote-names">{voters.join(', ')}</div>
            <div className="vote-tally">{voters.length}</div>
          </div>
        ))}
      </div>

      {avg !== null && (
        <div className="vote-stats">
          <span>Avg: <strong>{avg}</strong></span>
          {min !== null && <span>Min: <strong>{min}</strong></span>}
          {max !== null && <span>Max: <strong>{max}</strong></span>}
        </div>
      )}

      {story.finalPoint && (
        <div className="final-point-display">
          Final Story Point: <strong>{story.finalPoint}</strong>
        </div>
      )}
    </div>
  )
}

export default VoteResults
