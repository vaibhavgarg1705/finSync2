import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ImportInvoices from './pages/ImportInvoices.jsx';
import ImportPayments from './pages/ImportPayments.jsx';
import Matching from './pages/Matching.jsx';
import Suggestions from './pages/Suggestions.jsx';
import ManualAllocation from './pages/ManualAllocation.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/import/invoices" element={<ImportInvoices />} />
        <Route path="/import/payments" element={<ImportPayments />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="/allocations" element={<ManualAllocation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}