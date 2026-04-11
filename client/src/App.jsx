import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import { SessionProvider } from './context/SessionContext'
import Header from './components/common/Header'
import Home from './pages/Home'
import JoinSession from './pages/JoinSession'
import Session from './pages/Session'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <SessionProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/join" element={<JoinSession />} />
                <Route path="/join/:code" element={<JoinSession />} />
                <Route path="/session/:code" element={<Session />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </SessionProvider>
      </SocketProvider>
    </BrowserRouter>
  )
}

export default App
