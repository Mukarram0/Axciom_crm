import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { BsSearch, BsX } from 'react-icons/bs';

const SearchBar = ({ onSearch, placeholder = 'Search by name, email, phone...', delay = 400 }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchTerm);
    }, delay);

    return () => clearTimeout(handler);
  }, [searchTerm, delay]);

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <InputGroup className="shadow-sm" style={{ maxWidth: '420px' }}>
      <InputGroup.Text className="bg-white border-end-0 text-muted">
        <BsSearch />
      </InputGroup.Text>
      <Form.Control
        type="text"
        placeholder={placeholder}
        className="border-start-0 border-end-0 shadow-none ps-0"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <Button variant="outline-secondary" className="border-start-0 bg-white" onClick={handleClear}>
          <BsX className="fs-5" />
        </Button>
      )}
    </InputGroup>
  );
};

export default SearchBar;
