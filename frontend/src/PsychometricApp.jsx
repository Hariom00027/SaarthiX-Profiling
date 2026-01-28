import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import PsychometricStart from './pages/psychometric/PsychometricStart'
import PsychometricSkills from './pages/psychometric/PsychometricSkills'
import PsychometricInstructions from './pages/psychometric/PsychometricInstructions'
import PsychometricAssessment from './pages/psychometric/PsychometricAssessment'
import PsychometricResult from './pages/psychometric/PsychometricResult'
import PsychometricLoading from './pages/psychometric/PsychometricLoading'
import PsychometricReport from './pages/psychometric/PsychometricReport'
import SavedPsychometricReports from './pages/psychometric/SavedPsychometricReports'
import ProfilePreview from './pages/psychometric/ProfilePreview'
import PsychometricProfileFromReport from './pages/psychometric/PsychometricProfileFromReport'
import Header from './components/Header'
import './styles/psychometric.css'

function PsychometricApp() {
  const location = useLocation()
  const navigate = useNavigate()

  // Hide navbar during the actual assessment test
  const isAssessmentPage = location.pathname.includes('/psychometric/assessment/')

  const handleNavigateToStart = () => {
    window.location.href = '/profiling/start'
  }

  return (
    <div className="relative min-h-screen">
      {/* Show header on all psychometric pages except during the actual assessment */}
      {!isAssessmentPage && (
        <Header onNavigateToStart={handleNavigateToStart} />
      )}

      <Routes>
        <Route path="/psychometric/start" element={<PsychometricStart />} />
        <Route path="/psychometric/skills" element={<PsychometricSkills />} />
        <Route path="/psychometric/instructions/:sessionId" element={<PsychometricInstructions />} />
        <Route path="/psychometric/loading/:sessionId" element={<PsychometricLoading />} />
        <Route path="/psychometric/assessment/:sessionId" element={<PsychometricAssessment />} />
        <Route path="/psychometric/result/:sessionId" element={<PsychometricResult />} />
        <Route path="/psychometric/report/:sessionId" element={<PsychometricReport />} />
        <Route path="/psychometric/saved-reports" element={<SavedPsychometricReports />} />
        <Route path="/psychometric/profile-preview" element={<ProfilePreview />} />
        <Route path="/psychometric/profile-from-report/:sessionId" element={<PsychometricProfileFromReport />} />
        <Route path="/psychometric" element={<Navigate to="/psychometric/start" replace />} />
        <Route path="*" element={<Navigate to="/psychometric/start" replace />} />
      </Routes>
    </div>
  )
}

export default PsychometricApp

