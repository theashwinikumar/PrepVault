import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/index.css'
import AppRoutes from './routes/AppRoutes.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { Analytics } from '@vercel/analytics/react'
import Clarity from '@microsoft/clarity'
import { AdminQuestionProvider } from './context/AdminQuestionContext.jsx'

const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID || "x9ngo867az";
if (projectId) {
  Clarity.init(projectId);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AdminQuestionProvider>
          {/* First tab stop on every page: lets keyboard users skip the nav. */}
          <a href="#main-content" className="skip-link">Skip to content</a>
          <ScrollToTop />
          <AppRoutes />
        </AdminQuestionProvider>
      </BrowserRouter>
    </ErrorBoundary>
    <Analytics />
  </StrictMode>,
)
