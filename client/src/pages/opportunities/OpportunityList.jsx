import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Row, Col, Card, Badge, Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { opportunityService } from '../../services/opportunityService';
import { customerService } from '../../services/customerService';
import { userService } from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  BsPlusLg,
  BsPencilSquare,
  BsTrash,
  BsBriefcase,
  BsKanban,
  BsListUl,
  BsCurrencyRupee,
  BsCheckCircle,
  BsXCircle,
} from 'react-icons/bs';

const STAGE_DEFAULT_PROBABILITIES = {
  Qualification: 10,
  Proposal: 40,
  Negotiation: 70,
  Won: 100,
  Lost: 0,
};

const OpportunityList = () => {
  const { user, isAdmin, isManager } = useAuth();

  const [opportunities, setOpportunities] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [summary, setSummary] = useState({
    totalPipelineAmount: 0,
    totalWeightedPipeline: 0,
    wonAmount: 0,
    countOpen: 0,
    countWon: 0,
    countLost: 0,
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'pipeline'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalForm, setModalForm] = useState({
    opportunityName: '',
    customerId: '',
    amount: '',
    stage: 'Qualification',
    probability: 10,
    expectedCloseDate: '',
    assignedTo: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState({ type: '', text: '' });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });

  useEffect(() => {
    loadOpportunities();
  }, [currentPage, search, stageFilter, statusFilter]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const res = await opportunityService.getAll({
        page: currentPage,
        limit: 10,
        search,
        stage: stageFilter,
        status: statusFilter,
      });
      if (res.success) {
        setOpportunities(res.data.opportunities);
        setSummary(res.data.summary);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [custRes, userRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        userService.getAll(),
      ]);
      if (custRes.success) setCustomersList(custRes.data.customers);
      if (userRes.success) setUsersList(userRes.data.users);
    } catch (err) {
      console.warn('Metadata loading warning:', err);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    setModalForm({
      opportunityName: '',
      customerId: customersList[0]?._id || '',
      amount: '',
      stage: 'Qualification',
      probability: 10,
      expectedCloseDate: futureDate.toISOString().slice(0, 10),
      assignedTo: user._id,
      notes: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (opp) => {
    setIsEditing(true);
    setEditingId(opp._id);
    setModalForm({
      opportunityName: opp.opportunityName,
      customerId: opp.customerId?._id || '',
      amount: opp.amount,
      stage: opp.stage,
      probability: opp.probability,
      expectedCloseDate: opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toISOString().slice(0, 10) : '',
      assignedTo: opp.assignedTo?._id || user._id,
      notes: opp.notes || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleStageChangeInForm = (newStage) => {
    const defaultProb = STAGE_DEFAULT_PROBABILITIES[newStage] ?? modalForm.probability;
    setModalForm({
      ...modalForm,
      stage: newStage,
      probability: defaultProb,
    });
  };

  const validateModalForm = () => {
    const errors = {};
    if (!modalForm.opportunityName.trim()) {
      errors.opportunityName = 'Opportunity Name is required.';
    }

    if (!modalForm.customerId) {
      errors.customerId = 'Customer reference is required.';
    }

    const amt = parseFloat(modalForm.amount);
    if (isNaN(amt) || amt <= 0) {
      errors.amount = 'Opportunity Amount must be greater than 0.';
    }

    const prob = parseFloat(modalForm.probability);
    if (isNaN(prob) || prob < 0 || prob > 100) {
      errors.probability = 'Probability must be between 0 and 100.';
    }

    if (!modalForm.expectedCloseDate) {
      errors.expectedCloseDate = 'Expected Close Date is required.';
    } else if (modalForm.stage !== 'Won' && modalForm.stage !== 'Lost') {
      const closeDate = new Date(modalForm.expectedCloseDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (closeDate < today) {
        errors.expectedCloseDate = 'Expected Close Date cannot be in the past.';
      }
    }

    if (!modalForm.assignedTo) {
      errors.assignedTo = 'Assigned sales representative is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOpportunity = async (e) => {
    e.preventDefault();
    if (!validateModalForm()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await opportunityService.update(editingId, modalForm);
        setServerMessage({ type: 'success', text: 'Opportunity updated successfully.' });
      } else {
        await opportunityService.create(modalForm);
        setServerMessage({ type: 'success', text: 'Opportunity created successfully.' });
      }
      setShowModal(false);
      loadOpportunities();
    } catch (err) {
      setFormErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStageMove = async (oppId, newStage) => {
    try {
      await opportunityService.update(oppId, { stage: newStage });
      setServerMessage({ type: 'success', text: `Opportunity advanced to ${newStage}.` });
      loadOpportunities();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await opportunityService.delete(deleteModal.id);
      setDeleteModal({ show: false, id: null, name: '' });
      setServerMessage({ type: 'success', text: 'Opportunity removed successfully.' });
      loadOpportunities();
    } catch (err) {
      setServerMessage({ type: 'danger', text: err.message });
      setDeleteModal({ show: false, id: null, name: '' });
    }
  };

  const stagesList = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  return (
    <div>
      <PageHeader
        title="Sales Pipeline & Opportunities"
        subtitle="Manage deal stages, forecast weighted revenue, and monitor sales velocity"
      >
        <Nav variant="pills" activeKey={viewMode} onSelect={(k) => setViewMode(k)} className="me-2 bg-light p-1 rounded">
          <Nav.Item>
            <Nav.Link eventKey="list" className="py-1 px-3 small d-flex align-items-center gap-1">
              <BsListUl /> Table View
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="pipeline" className="py-1 px-3 small d-flex align-items-center gap-1">
              <BsKanban /> Pipeline Board
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Button variant="primary" onClick={handleOpenCreate} className="d-flex align-items-center gap-2">
          <BsPlusLg /> Add Opportunity
        </Button>
      </PageHeader>

      <AlertMessage
        variant={serverMessage.type}
        message={serverMessage.text}
        onClose={() => setServerMessage({ type: '', text: '' })}
      />

      {/* Summary Pipeline Bar */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} md={3}>
          <div className="card-crm p-3 border-start border-4 border-primary">
            <span className="small text-muted fw-semibold d-block">ACTIVE PIPELINE</span>
            <div className="fs-5 fw-bold text-dark">{formatCurrency(summary.totalPipelineAmount)}</div>
            <span className="small text-muted">{summary.countOpen} Open Deals</span>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="card-crm p-3 border-start border-4 border-info">
            <span className="small text-muted fw-semibold d-block">WEIGHTED PIPELINE</span>
            <div className="fs-5 fw-bold text-info">{formatCurrency(summary.totalWeightedPipeline)}</div>
            <span className="small text-muted">Amount × Probability %</span>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="card-crm p-3 border-start border-4 border-success">
            <span className="small text-muted fw-semibold d-block">CLOSED WON</span>
            <div className="fs-5 fw-bold text-success">{formatCurrency(summary.wonAmount)}</div>
            <span className="small text-muted">{summary.countWon} Won Deals</span>
          </div>
        </Col>

        <Col xs={12} sm={6} md={3}>
          <div className="card-crm p-3 border-start border-4 border-danger">
            <span className="small text-muted fw-semibold d-block">CLOSED LOST</span>
            <div className="fs-5 fw-bold text-danger">{summary.countLost} Deals</div>
            <span className="small text-muted">Lost during negotiations</span>
          </div>
        </Col>
      </Row>

      {/* Filters Bar */}
      <Card className="card-crm p-3 mb-3">
        <Row className="g-2 justify-content-between align-items-center">
          <Col xs={12} md={5}>
            <SearchBar onSearch={setSearch} placeholder="Search by opportunity name..." />
          </Col>
          <Col xs={12} md={5} className="d-flex gap-2 justify-content-md-end flex-wrap">
            <Form.Select
              size="sm"
              style={{ width: '160px' }}
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Stages</option>
              <option value="Qualification">Qualification (10%)</option>
              <option value="Proposal">Proposal (40%)</option>
              <option value="Negotiation">Negotiation (70%)</option>
              <option value="Won">Won (100%)</option>
              <option value="Lost">Lost (0%)</option>
            </Form.Select>

            <Form.Select
              size="sm"
              style={{ width: '140px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </Form.Select>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <LoadingSpinner text="Loading sales pipeline..." />
      ) : viewMode === 'pipeline' ? (
        /* Kanban Pipeline Board View */
        <Row className="g-3 overflow-auto flex-nowrap pb-3">
          {stagesList.map((stageName) => {
            const stageOpps = opportunities.filter((o) => o.stage === stageName);
            const stageTotal = stageOpps.reduce((acc, curr) => acc + (curr.amount || 0), 0);

            return (
              <Col key={stageName} style={{ minWidth: '280px', maxWidth: '320px' }}>
                <Card className="border-0 bg-light p-2 h-100 shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="fw-bold small text-secondary">{stageName.toUpperCase()}</span>
                    <Badge bg="secondary">{stageOpps.length}</Badge>
                  </div>
                  <div className="small fw-semibold text-primary px-1 mb-2">{formatCurrency(stageTotal)}</div>

                  <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '600px' }}>
                    {stageOpps.map((opp) => (
                      <Card key={opp._id} className="p-2 border-0 shadow-sm bg-white">
                        <div className="fw-semibold text-dark small mb-1">{opp.opportunityName}</div>
                        <div className="text-muted small mb-2">{opp.customerId?.customerName}</div>
                        <div className="d-flex justify-content-between align-items-center small">
                          <span className="fw-bold text-success">{formatCurrency(opp.amount)}</span>
                          <span className="text-muted">{opp.probability}%</span>
                        </div>
                        <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center small">
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {formatDate(opp.expectedCloseDate)}
                          </span>
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="p-0 px-1"
                              onClick={() => handleOpenEdit(opp)}
                            >
                              <BsPencilSquare />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* Table View */
        <Card className="card-crm p-3">
          {opportunities.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <BsBriefcase className="fs-1 mb-2 text-secondary" />
              <p className="mb-0">No opportunity records found matching the criteria.</p>
            </div>
          ) : (
            <Table responsive hover className="table-crm align-middle">
              <thead>
                <tr>
                  <th>Opportunity Name</th>
                  <th>Customer</th>
                  <th>Amount (₹)</th>
                  <th>Probability</th>
                  <th>Weighted Amount</th>
                  <th>Stage</th>
                  <th>Expected Close</th>
                  <th>Assigned Rep</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp._id}>
                    <td>
                      <span className="fw-semibold text-dark">{opp.opportunityName}</span>
                    </td>
                    <td>
                      {opp.customerId ? (
                        <NavLink to={`/customers/${opp.customerId._id}`} className="text-decoration-none small">
                          {opp.customerId.customerName}
                        </NavLink>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="fw-bold text-dark">{formatCurrency(opp.amount)}</td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <div className="progress flex-grow-1" style={{ height: '6px', width: '50px' }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{ width: `${opp.probability}%` }}
                          />
                        </div>
                        <span className="small text-muted">{opp.probability}%</span>
                      </div>
                    </td>
                    <td className="fw-semibold text-primary">{formatCurrency(opp.weightedAmount)}</td>
                    <td>
                      <StatusBadge status={opp.stage} />
                    </td>
                    <td className="small text-muted">{formatDate(opp.expectedCloseDate)}</td>
                    <td className="small">{opp.assignedTo?.name}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {opp.stage !== 'Won' && opp.stage !== 'Lost' && (
                          <>
                            <Button
                              variant="outline-success"
                              onClick={() => handleQuickStageMove(opp._id, 'Won')}
                              title="Mark Won"
                            >
                              <BsCheckCircle />
                            </Button>
                            <Button
                              variant="outline-danger"
                              onClick={() => handleQuickStageMove(opp._id, 'Lost')}
                              title="Mark Lost"
                            >
                              <BsXCircle />
                            </Button>
                          </>
                        )}
                        <Button variant="outline-primary" onClick={() => handleOpenEdit(opp)} title="Edit">
                          <BsPencilSquare />
                        </Button>
                        {(isAdmin || isManager) && (
                          <Button
                            variant="outline-danger"
                            onClick={() => setDeleteModal({ show: true, id: opp._id, name: opp.opportunityName })}
                            title="Delete"
                          >
                            <BsTrash />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </Card>
      )}

      {/* Create / Edit Opportunity Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">{isEditing ? 'Edit Opportunity' : 'Create Sales Opportunity'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveOpportunity} noValidate>
          <Modal.Body>
            {formErrors.general && <div className="alert alert-danger py-2 small">{formErrors.general}</div>}

            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Opportunity Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={modalForm.opportunityName}
                    onChange={(e) => setModalForm({ ...modalForm, opportunityName: e.target.value })}
                    isInvalid={!!formErrors.opportunityName}
                    placeholder="e.g. Enterprise Cloud ERP Migration"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.opportunityName}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Customer Account *</Form.Label>
                  <Form.Select
                    value={modalForm.customerId}
                    onChange={(e) => setModalForm({ ...modalForm, customerId: e.target.value })}
                    isInvalid={!!formErrors.customerId}
                  >
                    <option value="">Select Customer...</option>
                    {customersList.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.customerName} ({c.customerCode})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{formErrors.customerId}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Deal Amount (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={modalForm.amount}
                    onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                    isInvalid={!!formErrors.amount}
                    placeholder="500000"
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.amount}</Form.Control.Feedback>
                  <Form.Text className="text-muted">Must be greater than 0</Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Pipeline Stage *</Form.Label>
                  <Form.Select
                    value={modalForm.stage}
                    onChange={(e) => handleStageChangeInForm(e.target.value)}
                  >
                    <option value="Qualification">Qualification (10%)</option>
                    <option value="Proposal">Proposal (40%)</option>
                    <option value="Negotiation">Negotiation (70%)</option>
                    <option value="Won">Won (100%)</option>
                    <option value="Lost">Lost (0%)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Probability (0-100%) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    value={modalForm.probability}
                    onChange={(e) => setModalForm({ ...modalForm, probability: e.target.value })}
                    isInvalid={!!formErrors.probability}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.probability}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Expected Close Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={modalForm.expectedCloseDate}
                    onChange={(e) => setModalForm({ ...modalForm, expectedCloseDate: e.target.value })}
                    isInvalid={!!formErrors.expectedCloseDate}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.expectedCloseDate}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              {(isAdmin || isManager) && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold">Assigned Sales Executive *</Form.Label>
                    <Form.Select
                      value={modalForm.assignedTo}
                      onChange={(e) => setModalForm({ ...modalForm, assignedTo: e.target.value })}
                      isInvalid={!!formErrors.assignedTo}
                    >
                      <option value="">Select Representative...</option>
                      {usersList.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.assignedTo}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              )}

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Opportunity Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={modalForm.notes}
                    onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                    placeholder="Decision makers, budget timeline, competitor details..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update Opportunity' : 'Create Opportunity'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Opportunity"
        message={`Are you sure you want to remove opportunity '${deleteModal.name}'?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default OpportunityList;
