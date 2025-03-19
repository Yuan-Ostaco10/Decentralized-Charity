import React from "react";
import { Link } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import NavigationBar from "../components/Navbar"; // Import Navbar

const Home = () => {
  return (
    <>
      <NavigationBar />
      <Container className="text-center mt-5">
        <h1 className="display-4">Welcome to Decentralized Charity</h1>
        <p className="lead">
          Donate securely and transparently using blockchain technology.
        </p>
        <hr className="my-4" />
        <p>Every donation is recorded on the blockchain, ensuring transparency and accountability.</p>
        <Link to="/donor-donate">
          <Button variant="primary" size="lg">Start Donating</Button>
        </Link>
      </Container>
    </>
  );
};

export default Home;
