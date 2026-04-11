import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'
    const newSocket = io(serverUrl, { transports: ['websocket'] })

    newSocket.on('connect', () => console.log('Socket connected:', newSocket.id))
    newSocket.on('connect_error', (err) => console.error('Socket error:', err.message))

    setSocket(newSocket)
    return () => newSocket.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
