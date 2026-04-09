import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SitesPage from './pages/SitesPage';
import AlertsPage from './pages/AlertsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/sites" replace />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/:pileId" element={<SitesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
      </Routes>
    </Layout>
  );
}
