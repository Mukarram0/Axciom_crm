import React from 'react';
import { Card, Row, Col, Badge, Table } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import { formatDate } from '../../utils/formatters';
import { BsPersonCircle, BsShieldCheck, BsEnvelope, BsTelephone, BsCheckLg } from 'react-icons/bs';

const Profile = () => {
  const { user, isAdmin, isManager, isSalesExecutive } = useAuth();

  return (
    <div>
      <PageHeader
        title="My Profile & Security Context"
        subtitle="Manage your personal profile, role permissions, and access privileges"
      />

      <Row className="g-3 mb-4">
        <Col md={5}>
          <Card className="card-crm p-4 text-center h-100">
            <div className="mb-3">
              <BsPersonCircle className="display-3 text-primary" />
            </div>
            <h4 className="fw-bold mb-1">{user?.name}</h4>
            <div className="text-muted small mb-3">{user?.email}</div>
            <div className="mb-4">
              <Badge
                bg={isAdmin ? 'danger' : isManager ? 'primary' : 'success'}
                className="px-3 py-2 fs-6"
              >
                <BsShieldCheck className="me-1" /> {user?.role}
              </Badge>
            </div>

            <div className="text-start border-top pt-3 small">
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Account Status:</span>
                <span className="text-success fw-bold">Active & Verified</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Contact Phone:</span>
                <span>{user?.phone || 'Not provided'}</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Member Since:</span>
                <span>{formatDate(user?.createdAt)}</span>
              </div>
              <div className="mb-2 d-flex justify-content-between">
                <span className="text-muted">Session Storage:</span>
                <span className="font-monospace text-primary">HttpOnly Cookie</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="card-crm p-4 h-100">
            <h5 className="fw-bold text-secondary mb-3">Role & Permission Capabilities</h5>
            <p className="text-muted small mb-3">
              Your account has been granted the <strong>{user?.role}</strong> role. Under AcxiomCRM's Role-Based Access Control (RBAC), your data boundaries and administrative functions are defined as follows:
            </p>

            <Table responsive bordered size="sm" className="small align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>System Module</th>
                  <th>Permission Level</th>
                  <th>Data Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Dashboard Analytics</td>
                  <td><Badge bg="success"><BsCheckLg /> Full View</Badge></td>
                  <td>{isAdmin ? 'Organization-wide' : isManager ? 'Supervised Team' : 'Assigned Records'}</td>
                </tr>
                <tr>
                  <td>Customer Management</td>
                  <td><Badge bg="success"><BsCheckLg /> CRUD</Badge></td>
                  <td>{isAdmin ? 'All Accounts' : isManager ? 'Team Accounts' : 'Assigned Accounts'}</td>
                </tr>
                <tr>
                  <td>Lead Qualification</td>
                  <td><Badge bg="success"><BsCheckLg /> Conversion</Badge></td>
                  <td>{isAdmin ? 'All Leads' : isManager ? 'Team Leads' : 'Assigned Leads'}</td>
                </tr>
                <tr>
                  <td>Opportunity Pipeline</td>
                  <td><Badge bg="success"><BsCheckLg /> Stage Pipeline</Badge></td>
                  <td>{isAdmin ? 'All Deals' : isManager ? 'Team Deals' : 'Assigned Deals'}</td>
                </tr>
                <tr>
                  <td>User Administration</td>
                  <td>
                    {isAdmin ? (
                      <Badge bg="success"><BsCheckLg /> Full Admin</Badge>
                    ) : isManager ? (
                      <Badge bg="info">Team View</Badge>
                    ) : (
                      <Badge bg="secondary">Restricted</Badge>
                    )}
                  </td>
                  <td>{isAdmin ? 'All Users & Passwords' : isManager ? 'Direct Reports' : 'None'}</td>
                </tr>
                <tr>
                  <td>Audit Trail Inspection</td>
                  <td>
                    {isAdmin ? (
                      <Badge bg="success"><BsCheckLg /> Immutable Logs</Badge>
                    ) : (
                      <Badge bg="secondary">Restricted</Badge>
                    )}
                  </td>
                  <td>{isAdmin ? 'All Security Events' : 'None'}</td>
                </tr>
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
