import React from 'react';
import { Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { BsPersonCircle, BsBoxArrowRight, BsShieldCheck } from 'react-icons/bs';

const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Admin':
        return 'danger';
      case 'Manager':
        return 'primary';
      default:
        return 'success';
    }
  };

  return (
    <header className="top-navbar d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-2">
        <span className="fw-semibold text-secondary">AcxiomCRM Enterprise Portal</span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <Badge bg={getRoleBadgeVariant(user?.role)} className="px-2 py-1 fs-7">
          <BsShieldCheck className="me-1" />
          {user?.role}
        </Badge>

        <Dropdown align="end">
          <Dropdown.Toggle
            variant="light"
            id="user-dropdown"
            className="d-flex align-items-center gap-2 border-0 bg-transparent py-1 px-2"
          >
            <BsPersonCircle className="fs-5 text-secondary" />
            <span className="d-none d-sm-inline fw-medium text-dark">{user?.name}</span>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow border-0 mt-2">
            <Dropdown.Header>
              <div className="fw-bold">{user?.name}</div>
              <div className="text-muted small">{user?.email}</div>
            </Dropdown.Header>
            <Dropdown.Divider />
            <Dropdown.Item as={NavLink} to="/profile">
              <BsPersonCircle className="me-2 text-muted" /> My Profile
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={logout} className="text-danger">
              <BsBoxArrowRight className="me-2" /> Log Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default Navbar;
