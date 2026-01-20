import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import PsychometricApp from './PsychometricApp.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import './index.css'

// Handle Google OAuth redirect
window.addEventListener('load', () => {
  const path = window.location.pathname;
  if (path.includes('/oauth2/code/google') || path.includes('/login/oauth2/code/google')) {
    // Redirect handled by backend, check if token is in response
    // The backend callback should redirect back to frontend with token
  }
});

const path = window.location.pathname;
const isAdminRoute = path.startsWith('/admin')
const isPsychometricRoute = path.startsWith('/psychometric')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastContainer />
    <BrowserRouter>
      {isAdminRoute ? (
        <AdminApp />
      ) : isPsychometricRoute ? (
        <AuthProvider>
          <PsychometricApp />
        </AuthProvider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </React.StrictMode>,
)

