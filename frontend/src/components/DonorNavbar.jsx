import React from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container, Button } from "react-bootstrap";

const DonorNavbar = ({ account, handleLogout }) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/donor-dashboard">Donor Dashboard</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/donor-dashboard">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/donate">Transaction History</Nav.Link>
          </Nav>
          <span className="text-light mx-3">
            <strong>Wallet:</strong> {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not Connected"}
          </span>
          <Button variant="danger" onClick={handleLogout}>Logout</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default DonorNavbar;
