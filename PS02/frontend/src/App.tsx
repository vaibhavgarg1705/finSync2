import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ImportWizard from './pages/ImportWizard'
import Results from './pages/Results'
import Queue from './pages/Queue'
import History from './pages/History'
import Reports from './pages/Reports'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/import" element={<ImportWizard />} />
            <Route path="/runs/:runId/results" element={<Results />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
