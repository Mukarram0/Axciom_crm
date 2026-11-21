import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Main Application Pages
import Dashboard from '../pages/dashboard/Dashboard';
import CustomerList from '../pages/customers/CustomerList';
import CustomerDetail from '../pages/customers/CustomerDetail';
import LeadList from '../pages/leads/LeadList';
import LeadDetail from '../pages/leads/LeadDetail';
import OpportunityList from '../pages/opportunities/OpportunityList';
import FollowUpList from '../pages/followups/FollowUpList';
import ActivityList from '../pages/activities/ActivityList';
import UserList from '../pages/users/UserList';
import AuditLogList from '../pages/audit/AuditLogList';
import ReportsHub from '../pages/reports/ReportsHub';
import Profile from '../pages/profile/Profile';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected CRM Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Customer Management */}
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />

          {/* Lead Management */}
          <Route path="/leads" element={<LeadList />} />
          <Route path="/leads/:id" element={<LeadDetail />} />

          {/* Opportunity Management */}
          <Route path="/opportunities" element={<OpportunityList />} />

          {/* Follow-Ups & Activities */}
          <Route path="/followups" element={<FollowUpList />} />
          <Route path="/activities" element={<ActivityList />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportsHub />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />

          {/* Administration Routes: Admin & Manager */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
            <Route path="/users" element={<UserList />} />
          </Route>

          {/* Audit Logs: Strictly Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/audit" element={<AuditLogList />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
