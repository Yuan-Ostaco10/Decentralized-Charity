import React from "react";
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Card, 
  Nav, 
  Navbar, 
  Badge,
  Carousel,
  ListGroup
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaChartLine, FaHandHoldingUsd, FaLock, FaUsers, FaRegLightbulb, FaArrowRight } from "react-icons/fa";

const HomePage = () => {
  return (
    <>
      {/* Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand href="#home">Decentralized Charity</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link href="/" active>Home</Nav.Link>
              <Nav.Link href="#about">About</Nav.Link>
              <Nav.Link href="#how-it-works">How It Works</Nav.Link>
              <Nav.Link href="#charities">Charities</Nav.Link>
              <Nav.Link as={Link} to="/login" className="ms-3">
                <Button variant="outline-light" size="sm">Login</Button>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="py-3">
                <Badge bg="light" text="dark" className="mb-2">Blockchain Powered</Badge>
                <h1 className="display-4 fw-bold mb-3">Transparent Charity Giving</h1>
                <p className="lead mb-4">
                  Track every donation in real-time with our blockchain-based platform. 
                  See exactly how your contribution makes an impact.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Button as={Link} to="/login" variant="light" size="lg">Get Started</Button>
                  <Button variant="outline-light" size="lg">Learn More</Button>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <img 
                src="/api/placeholder/600/400" 
                alt="Blockchain Charity" 
                className="img-fluid rounded shadow-lg" 
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Mission Statement */}
      <Container className="py-5" id="about">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <div className="text-center">
              <h2 className="mb-4">Our Mission</h2>
              <div className="p-4 bg-light rounded shadow-sm">
                <p className="lead">
                  The Decentralized Charity Donation Platform uses blockchain technology to transform the tracking and making of charitable gifts. 
                  By utilizing the immutable ledger of blockchain technology, our platform solves the transparency problem by guaranteeing that 
                  each transaction is documented and made available to the public.
                </p>
                <p>
                  Our goal is to provide a transparent and trustless donations environment that allows real-time tracking of money from giver to recipient. 
                  The system automates the donation process by incorporating smart contracts, which lessens the need for intermediaries and guarantees that 
                  money is disbursed exactly as intended.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Key Features */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">Key Features</h2>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: "80px", height: "80px"}}>
                    <FaLock size={30} />
                  </div>
                  <Card.Title>Blockchain Transparency</Card.Title>
                  <Card.Text>
                    Every transaction is recorded on the blockchain, creating an immutable and public record of all donations and disbursements.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: "80px", height: "80px"}}>
                    <FaChartLine size={30} />
                  </div>
                  <Card.Title>Real-Time Tracking</Card.Title>
                  <Card.Text>
                    Follow your donation's journey in real-time, from the moment you give until it reaches its intended beneficiaries.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-4" style={{width: "80px", height: "80px"}}>
                    <FaHandHoldingUsd size={30} />
                  </div>
                  <Card.Title>Smart Contract Automation</Card.Title>
                  <Card.Text>
                    Automated smart contracts ensure funds are disbursed according to predefined conditions, eliminating middlemen.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* How It Works */}
      <Container className="mt-5" id="how-it-works">
        <h2 className="text-center mb-5">How It Works</h2>
        <Row className="align-items-center mb-5">
          <Col lg={6} className="mb-4 mb-lg-0">
            <img src="/api/placeholder/500/300" alt="Connect Wallet" className="img-fluid rounded shadow" />
          </Col>
          <Col lg={6}>
            <h3>1. Connect Your Wallet</h3>
            <p>
              Link your MetaMask or other compatible cryptocurrency wallet to our platform. 
              This allows you to make secure donations using cryptocurrency.
            </p>
            <ListGroup variant="flush" className="border-0">
              <ListGroup.Item className="border-0 ps-0">
                <FaRegLightbulb className="text-primary me-2" /> Secure connection using Web3 technology
              </ListGroup.Item>
              <ListGroup.Item className="border-0 ps-0">
                <FaRegLightbulb className="text-primary me-2" /> Support for multiple blockchain networks
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>
        
        <Row className="align-items-center mb-5 flex-lg-row-reverse">
          <Col lg={6} className="mb-4 mb-lg-0">
            <img src="/api/placeholder/500/300" alt="Choose Charity" className="img-fluid rounded shadow" />
          </Col>
          <Col lg={6}>
            <h3>2. Choose a Charity</h3>
            <p>
              Browse verified charitable organizations on our platform. Each charity has a transparent 
              profile showing their mission, past projects, and fund allocation history.
            </p>
            <ListGroup variant="flush" className="border-0">
              <ListGroup.Item className="border-0 ps-0">
                <FaRegLightbulb className="text-primary me-2" /> Verified charity profiles with detailed information
              </ListGroup.Item>
              <ListGroup.Item className="border-0 ps-0">
                <FaRegLightbulb className="text-primary me-2" /> Filter by cause, location, or impact metrics
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>
        
        <Row className="align-items-center">
          <Col lg={6} className="mb-4 mb-lg-0">
            <img src="/api/placeholder/500/300" alt="Track Impact" className="img-fluid rounded shadow" />
          </Col>
          <Col lg={6}>
            <h3>3. Make a Donation & Track Impact</h3>
            <p>
              Donate directly through our platform and receive a unique transaction ID. Use this ID to 
              track your donation's journey and see exactly how your contribution is making an impact.
            </p>
            <ListGroup variant="flush" className="border-0">
              <ListGroup.Item className="border-0 ps-0">
                <FaRegLightbulb className="text-primary me-2" /> Immutable record of your donation on the blockchain
              </ListGroup.Item>
              <ListGroup.Item className="border-0 ps-0">
                <FaRegLightbulb className="text-primary me-2" /> Real-time updates on fund utilization
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>
      </Container>

      {/* Featured Charities */}
      <div className="bg-light py-5" id="charities">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Featured Charities</h2>
          </div>
          <Row>
            {[1, 2, 3].map((item) => (
              <Col md={4} key={item} className="mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Img variant="top" src={`/api/placeholder/400/200`} alt={`Charity ${item}`} />
                  <Card.Body>
                    <Badge bg="success" className="mb-2">Verified</Badge>
                    <Card.Title>Charity Organization {item}</Card.Title>
                    <Card.Text>
                      Supporting education, healthcare, and community development in underserved regions.
                    </Card.Text>
                  </Card.Body>
                  <Card.Footer className="bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">Projects: 12</small>
                      <Button variant="primary" size="sm">Donate Now</Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>

      {/* Testimonials */}
      <Container className="py-5">
        <h2 className="text-center mb-4">What Our Donors Say</h2>
        <Row className="justify-content-center">
          <Col md={8}>
            <Carousel indicators={false} className="bg-light p-4 rounded shadow-sm">
              {[1, 2, 3].map((item) => (
                <Carousel.Item key={item}>
                  <div className="text-center px-4">
                    <p className="lead mb-3">
                      "I love being able to see exactly where my donation goes. The transparency provided 
                      by this platform has made me a more confident and regular donor."
                    </p>
                    <div className="d-flex justify-content-center align-items-center">
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{width: "40px", height: "40px"}}>
                        <FaUsers size={20} />
                      </div>
                      <div className="text-left">
                        <h5 className="mb-0">River Yuan</h5>
                        <small className="text-muted">Regular Contributor</small>
                      </div>
                    </div>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </Col>
        </Row>
      </Container>

      {/* CTA */}
      <div className="bg-primary text-white py-5">
        <Container className="text-center">
          <h2 className="mb-3">Ready to Make a Difference?</h2>
          <p className="lead mb-4">Join our platform to transform how charitable giving works.</p>
          <Button as={Link} to="/login" variant="light" size="lg" className="px-4">
            Start Donating
          </Button>
        </Container>
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
         
        
          <div className="text-center text-white small">
            <p className="mb-0">&copy; {new Date().getFullYear()} Decentralized Charity. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </>
  );
};

export default HomePage;