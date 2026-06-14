import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { GeofencesPage } from './pages/GeofencesPage'
import { VehiclesPage } from './pages/VehiclesPage'
import { AlertConfigPage } from './pages/AlertConfigPage'
import { ViolationsPage } from './pages/ViolationsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/geofences" element={<GeofencesPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/alerts" element={<AlertConfigPage />} />
            <Route path="/violations" element={<ViolationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors expand />
    </QueryClientProvider>
  )
}
