import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
})

export const createSession = (data) => API.post('/sessions', data)
export const getSession = (code) => API.get(`/sessions/${code}`)
export const joinSession = (code, data) => API.post(`/sessions/${code}/join`, data)

export const addUserStory = (data) => API.post('/stories', data)
export const getUserStories = (sessionId) => API.get(`/stories/session/${sessionId}`)
export const updateUserStory = (id, data) => API.put(`/stories/${id}`, data)
export const deleteUserStory = (id) => API.delete(`/stories/${id}`)

export default API
