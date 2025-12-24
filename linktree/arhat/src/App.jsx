import React from 'react'
import { Routes, Route } from 'react-router-dom'
import PublicProfile from './user/PublicProfile'
import AdminPanel from './admin/AdminPanel'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicProfile />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  )
}

export default App
