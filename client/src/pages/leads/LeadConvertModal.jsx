import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { leadService } from '../../services/leadService';
import { BsArrowRightCircle, BsCheck2Circle } from 'react-icons/bs';

const LeadConvertModal = ({ show, onHide, lead, onConverted }) => {
  if (!lead) return null;

  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState(`${lead.companyName || lead.leadName} - Initial Deal`);
  const [amount, setAmount] = useState(lead.expectedValue || 50000);
  const [expectedCloseDate, setExpectedCloseDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleConvert = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (createOpportunity && (!amount || parseFloat(amount) <= 0)) {
      setErrorMessage('Opportunity Amount must be greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await leadService.convert(lead._id, {
        createOpportunity,
        opportunityName,
        amount: parseFloat(amount),
        expectedCloseDate,
        notes,
      });

      if (res.success) {
        onConverted(res.data);
        onHide();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Lead conversion failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fs-5 d-flex align-items-center gap-2 text-primary">
          <BsArrowRightCircle /> Convert Lead to Customer
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleConvert}>
        <Modal.Body>
          {errorMessage && <Alert variant="danger" className="py-2 small">{errorMessage}</Alert>}

          <div className="alert alert-info py-2 small mb-3">
            <strong>Conversion Workflow:</strong> Converting <strong>{lead.leadName}</strong> ({lead.leadCode}) will create a permanent Customer Account, retain lead qualification history, and record this conversion in the immutable Audit Log.
          </div>

          <Card className="p-3 bg-light border-0 mb-3">
            <h6 className="fw-bold text-dark small mb-2">Customer Account Summary to be Created:</h6>
            <Row className="g-2 small">
              <Col sm={6}><strong>Name:</strong> {lead.leadName}</Col>
              <Col sm={6}><strong>Company:</strong> {lead.companyName || '—'}</Col>
              <Col sm={6}><strong>Email:</strong> {lead.email}</Col>
              <Col sm={6}><strong>Phone:</strong> {lead.phone}</Col>
            </Row>
          </Card>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              id="create-opp-checkbox"
              label="Also create a Sales Opportunity for this new customer"
              checked={createOpportunity}
              onChange={(e) => setCreateOpportunity(e.target.checked)}
              className="fw-semibold text-primary"
            />
          </Form.Group>

          {createOpportunity && (
            <Row className="g-3 p-3 border rounded mb-3 bg-white">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Opportunity Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={opportunityName}
                    onChange={(e) => setOpportunityName(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Deal Amount (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">Must be greater than 0</Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold">Expected Close Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          <Form.Group>
            <Form.Label className="small fw-semibold">Handover Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special customer preferences, negotiated pricing..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={submitting} className="d-flex align-items-center gap-1">
            <BsCheck2Circle /> {submitting ? 'Converting...' : 'Complete Lead Conversion'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LeadConvertModal;
