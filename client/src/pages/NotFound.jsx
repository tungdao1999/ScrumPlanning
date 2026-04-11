import { useNavigate } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div className="error-page">
      <div className="error-icon">🃏</div>
      <h1>404</h1>
      <p>This page doesn't exist</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Back to Home
      </button>
    </div>
  )
}

export default NotFound
