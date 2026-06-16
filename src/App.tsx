import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Patients from '@/pages/Patients';
import Assessment from '@/pages/Assessment';
import FollowUp from '@/pages/FollowUp';
import Alerts from '@/pages/Alerts';
import Reports from '@/pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/patients" replace />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/assessment/:id" element={<Assessment />} />
          <Route path="/follow-up" element={<FollowUp />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
