import './PokerCard.css'

const PokerCard = ({ point, selected, onClick, disabled }) => {
  return (
    <button
      className={`poker-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      <div className="card-face">
        <span className="card-corner tl">{point}</span>
        <span className="card-center">{point}</span>
        <span className="card-corner br">{point}</span>
      </div>
    </button>
  )
}

export default PokerCard
