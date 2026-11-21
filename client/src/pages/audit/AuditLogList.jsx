import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Row, Col, Badge, Modal, Button } from 'react-bootstrap';
import { auditService } from '../../services/auditService';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatDateTime } from '../../utils/formatters';
import { BsJournalText, BsEye, BsShieldCheck } from 'react-icons/bs';

const AuditLogList = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal to inspect oldValue / newValue diff
  const [detailModal, setDetailModal] = useState({ show: false, log: null });
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, actionFilter, entityFilter, resultFilter, startDate, endDate]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await auditService.getAll({
        page: currentPage,
        limit: 15,
        action: actionFilter,
        entityName: entityFilter,
        result: resultFilter,
        startDate,
        endDate,
      });

      if (res.success) {
        setLogs(res.data.auditLogs);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeVariant = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'LOGOUT':
      case 'UNLOCK':
        return 'info';
      case 'CREATE':
      case 'CONVERT':
        return 'success';
      case 'UPDATE':
      case 'STATUS_CHANGE':
        return 'primary';
      case 'DELETE':
      case 'LOCKOUT':
      case 'FAILED_LOGIN':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div>
      <PageHeader
        title="Audit Trail & Security Log"
        subtitle="Immutable append-only record of system operations, authentication events, and data changes"
      />

      <AlertMessage message={serverError} onClose={() => setServerError('')} />

      <Card className="card-crm p-3">
        {/* Filter Controls */}
        <Row className="g-2 mb-3">
          <Col xs={12} sm={6} md={3}>
            <Form.Select
              size="sm"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="FAILED_LOGIN">FAILED_LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="LOCKOUT">LOCKOUT</option>
              <option value="UNLOCK">UNLOCK</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="CONVERT">CONVERT</option>
              <option value="STATUS_CHANGE">STATUS_CHANGE</option>
              <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md={3}>
            <Form.Select
              size="sm"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Modules / Entities</option>
              <option value="Auth">Auth / Security</option>
              <option value="User">User</option>
              <option value="Customer">Customer</option>
              <option value="Lead">Lead</option>
              <option value="Opportunity">Opportunity</option>
              <option value="FollowUp">FollowUp</option>
              <option value="Activity">Activity</option>
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md={2}>
            <Form.Select
              size="sm"
              value={resultFilter}
              onChange={(e) => {
                setResultFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Results</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md={2}>
            <Form.Control
              type="date"
              size="sm"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>

          <Col xs={12} sm={6} md={2}>
            <Form.Control
              type="date"
              size="sm"
              placeholder="To Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </Col>
        </Row>

        {loading ? (
          <LoadingSpinner text="Querying immutable audit logs..." />
        ) : logs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BsJournalText className="fs-1 mb-2 text-secondary" />
            <p className="mb-0">No audit log entries found matching criteria.</p>
          </div>
        ) : (
          <Table responsive hover className="table-crm align-middle">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor / User</th>
                <th>Action</th>
                <th>Entity Module</th>
                <th>IP Address</th>
                <th>Result</th>
                <th>Operational Details</th>
                <th className="text-end">Diff</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="small text-muted text-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td>
                    {log.userId ? (
                      <div>
                        <div className="fw-medium text-dark small">{log.userId.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {log.userId.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted small">System / Anonymous</span>
                    )}
                  </td>
                  <td>
                    <Badge bg={getActionBadgeVariant(log.action)} className="px-2 py-1">
                      {log.action}
                    </Badge>
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border">{log.entityName}</span>
                  </td>
                  <td className="small text-muted font-monospace">{log.ipAddress || '127.0.0.1'}</td>
                  <td>
                    {log.result === 'SUCCESS' ? (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                        SUCCESS
                      </span>
                    ) : (
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                        FAILURE
                      </span>
                    )}
                  </td>
                  <td className="small text-dark text-truncate" style={{ maxWidth: '300px' }}>
                    {log.details || '—'}
                  </td>
                  <td className="text-end">
                    {(log.oldValue || log.newValue) && (
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => setDetailModal({ show: true, log })}
                        title="View Change Diff"
                      >
                        <BsEye />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </Card>

      {/* Audit Log Diff Inspection Modal */}
      <Modal
        show={detailModal.show}
        onHide={() => setDetailModal({ show: false, log: null })}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <BsShieldCheck className="text-primary" /> Audit Record Inspection
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailModal.log && (
            <div>
              <div className="mb-3 small">
                <strong>Action:</strong> {detailModal.log.action} | <strong>Entity:</strong>{' '}
                {detailModal.log.entityName} | <strong>Record ID:</strong> {detailModal.log.recordId || 'N/A'}
              </div>

              <Row className="g-3">
                <Col md={6}>
                  <h6 className="fw-bold small text-muted">PREVIOUS STATE (OLD VALUE)</h6>
                  <pre className="p-3 bg-light rounded small" style={{ maxHeight: '250px', overflow: 'auto' }}>
                    {detailModal.log.oldValue ? JSON.stringify(detailModal.log.oldValue, null, 2) : 'No previous state'}
                  </pre>
                </Col>
                <Col md={6}>
                  <h6 className="fw-bold small text-primary">COMMITTED STATE (NEW VALUE)</h6>
                  <pre className="p-3 bg-light rounded small" style={{ maxHeight: '250px', overflow: 'auto' }}>
                    {detailModal.log.newValue ? JSON.stringify(detailModal.log.newValue, null, 2) : 'No state change recorded'}
                  </pre>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDetailModal({ show: false, log: null })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AuditLogList;
