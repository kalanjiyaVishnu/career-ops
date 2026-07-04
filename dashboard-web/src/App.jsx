import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Applications from './pages/Applications.jsx';
import ApplicationDetail from './pages/ApplicationDetail.jsx';
import Interviews from './pages/Interviews.jsx';
import Pipeline from './pages/Pipeline.jsx';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 10_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="pipeline" element={<Pipeline />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
