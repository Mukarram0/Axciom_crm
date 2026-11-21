import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BsSpeedometer2,
  BsPeople,
  BsFunnel,
  BsBriefcase,
  BsCalendarCheck,
  BsListCheck,
  BsShieldLock,
  BsJournalText,
  BsFileEarmarkBarGraph,
  BsPersonCircle,
  BsBoxArrowRight,
} from 'react-icons/bs';

const Sidebar = () => {
  const { user, isAdmin, isManager, logout } = useAuth();

  return (
    <aside className="sidebar shadow">
      {/* Brand Header */}
      <NavLink to="/dashboard" className="sidebar-brand">
        <span className="bg-primary text-white rounded p-1 px-2 fw-bold">A</span>
        <span>AcxiomCRM</span>
      </NavLink>

      {/* Navigation Links */}
      <div className="flex-grow-1 overflow-auto py-2">
        <div className="sidebar-heading">Main Navigation</div>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsSpeedometer2 className="fs-5" />
          <span>Dashboard</span>
        </NavLink>

        <div className="sidebar-heading">Sales Lifecycle</div>

        <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsPeople className="fs-5" />
          <span>Customers</span>
        </NavLink>

        <NavLink to="/leads" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsFunnel className="fs-5" />
          <span>Leads</span>
        </NavLink>

        <NavLink to="/opportunities" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsBriefcase className="fs-5" />
          <span>Opportunities</span>
        </NavLink>

        <NavLink to="/followups" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsCalendarCheck className="fs-5" />
          <span>Follow-Ups</span>
        </NavLink>

        <NavLink to="/activities" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsListCheck className="fs-5" />
          <span>Activities</span>
        </NavLink>

        <div className="sidebar-heading">Analytics & Reports</div>

        <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <BsFileEarmarkBarGraph className="fs-5" />
          <span>Reports Hub</span>
        </NavLink>

        {/* Administration Section: Restricted to Admin / Manager */}
        {(isAdmin || isManager) && (
          <>
            <div className="sidebar-heading">System Administration</div>
            <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <BsShieldLock className="fs-5" />
              <span>Users & Roles</span>
            </NavLink>
          </>
        )}

        {/* Audit Log: Strictly Admin Only */}
        {isAdmin && (
          <NavLink to="/audit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <BsJournalText className="fs-5" />
            <span>Audit Trail</span>
          </NavLink>
        )}
      </div>

      {/* User Footer in Sidebar */}
      <div className="p-3 border-top border-secondary border-opacity-25 bg-black bg-opacity-25">
        <div className="d-flex align-items-center justify-content-between">
          <NavLink to="/profile" className="text-decoration-none text-light d-flex align-items-center gap-2 overflow-hidden me-2">
            <BsPersonCircle className="fs-4 flex-shrink-0 text-info" />
            <div className="text-truncate">
              <div className="small fw-bold text-truncate">{user?.name}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                {user?.role}
              </div>
            </div>
          </NavLink>
          <button
            onClick={logout}
            className="btn btn-sm btn-outline-danger border-0 p-1"
            title="Logout"
          >
            <BsBoxArrowRight className="fs-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
