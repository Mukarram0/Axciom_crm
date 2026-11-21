import React from 'react';
import { Pagination as BSPagination } from 'react-bootstrap';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const items = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let number = startPage; number <= endPage; number++) {
    items.push(
      <BSPagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => onPageChange(number)}
      >
        {number}
      </BSPagination.Item>
    );
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
      <span className="text-muted small">
        Page {currentPage} of {totalPages}
      </span>
      <BSPagination className="mb-0 shadow-sm">
        <BSPagination.Prev
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        />
        {startPage > 1 && (
          <>
            <BSPagination.Item onClick={() => onPageChange(1)}>1</BSPagination.Item>
            {startPage > 2 && <BSPagination.Ellipsis disabled />}
          </>
        )}
        {items}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <BSPagination.Ellipsis disabled />}
            <BSPagination.Item onClick={() => onPageChange(totalPages)}>{totalPages}</BSPagination.Item>
          </>
        )}
        <BSPagination.Next
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </BSPagination>
    </div>
  );
};

export default Pagination;
