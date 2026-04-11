import { useState } from 'react'
import './UserStoryForm.css'

const UserStoryForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit(title.trim(), description.trim())
    setTitle('')
    setDescription('')
  }

  return (
    <form className="story-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          type="text"
          placeholder="User story title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          autoFocus
        />
      </div>
      <div className="form-group">
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-sm btn-primary" disabled={!title.trim()}>
          Add Story
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default UserStoryForm
