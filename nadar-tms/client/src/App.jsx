import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/UI/Toast';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';


// Pages
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Institutions from './pages/admin/Institutions';
import Buses from './pages/admin/Buses';
import Spare from './pages/admin/Spare';
import Drivers from './pages/admin/Drivers';
import DriverMasterEdit from './pages/admin/DriverMasterEdit';
import DriverSalary from './pages/admin/DriverSalary';
import Students from './pages/admin/Students';
import RoutesStops from './pages/admin/RoutesStops';
import Assignments from './pages/admin/Assignments';
import Users from './pages/admin/Users';
import Reports from './pages/admin/Reports';
import DieselUsage from './pages/admin/DieselUsage';
import Maintenance from './pages/admin/Maintenance';
import JobCards from './pages/admin/JobCards';
import Tyres from './pages/admin/Tyres';
import FleetAlerts from './pages/admin/FleetAlerts';
import AttendanceReport from './pages/admin/AttendanceReport';
import Attendance from './pages/incharge/Attendance';
import DriverPanel from './pages/driver/DriverPanel';
import ParentTracker from './pages/parent/ParentTracker';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (['admin', 'executive', 'institution'].includes(role)) return <Navigate to="/admin" replace />;
  if (role === 'incharge') return <Navigate to="/incharge" replace />;
  if (role === 'driver') return <Navigate to="/driver" replace />;
  if (role === 'parent') return <Navigate to="/parent" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Admin Console Route Layer */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin', 'executive', 'institution']}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="institutions" element={<Institutions />} />
                <Route path="buses" element={<Buses />} />
                <Route path="spare" element={<Spare />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="driver-master-edit" element={<DriverMasterEdit />} />
                <Route path="driver-salary" element={<DriverSalary />} />
                <Route path="students" element={<Students />} />
                <Route path="routes" element={<RoutesStops />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="users" element={<Users />} />
                <Route path="attendance-report" element={<AttendanceReport />} />
                <Route path="reports" element={<Reports />} />
                <Route path="diesel" element={<DieselUsage />} />
                <Route path="maintenance" element={<Maintenance defaultTab="maintenance" />} />
                <Route path="job-cards" element={<JobCards />} />
                <Route path="inventory" element={<Maintenance defaultTab="inventory" />} />
                <Route path="tyres" element={<Tyres />} />
                <Route path="alerts" element={<FleetAlerts />} />
              </Route>

              {/* Incharge attendance marker */}
              <Route path="/incharge" element={
                <ProtectedRoute roles={['incharge', 'admin']}>
                  <Attendance />
                </ProtectedRoute>
              } />

              {/* Driver trip & fuel logger */}
              <Route path="/driver" element={
                <ProtectedRoute roles={['driver', 'admin']}>
                  <DriverPanel />
                </ProtectedRoute>
              } />

              {/* Parent live tracker */}
              <Route path="/parent" element={
                <ProtectedRoute roles={['parent', 'admin']}>
                  <ParentTracker />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

