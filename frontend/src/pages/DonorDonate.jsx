import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Form, Button, Spinner, Card, Alert, Row, Col, Badge } from "react-bootstrap";
import DonorNavbar from "../components/DonorNavbar";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

const CONTRACT_ADDRESS = "0xc31538c92024b5E9ceCdbefD615B5C805726a83A";
const TOKEN_ADDRESS = "0xe00C88a88D8581a68357046784B17D3383509aDE";
const DonationABI = DonationJSON.abi;

const DonorDonate = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrg, setIsOrg] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          const contractInstance = new web3Instance.eth.Contract(DonationABI, CONTRACT_ADDRESS);
          setContract(contractInstance);
          setWeb3(web3Instance);

          // Check if the user is an organization
          const isOrganization = await contractInstance.methods.isOrganization(accounts[0]).call();
          setIsOrg(isOrganization);

          // Redirect organizations to login page
          if (isOrganization) {
            alert("Access denied: This page is for donors only.");
            navigate("/login");
            return;
          }

          await fetchOrganizations(contractInstance);

        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.log("MetaMask not detected");
        alert("Please install MetaMask to use this application");
      }
    }
    init();
  }, [navigate]);

  // Fetch all registered organizations
  async function fetchOrganizations(contractInstance) {
    try {
      const orgs = await contractInstance.methods.getOrganizations().call();
      if (Array.isArray(orgs)) {
        setOrganizations(orgs);
      } else {
        console.error("Invalid organization data received.");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  }

  // Handle donation process
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !donationAmount || parseFloat(donationAmount) <= 0) {
      alert("Please select an organization and enter a valid amount.");
      return;
    }

    setIsLoading(true);
    setSuccessMessage(""); // Clear any previous success message
    
    try {
      await contract.methods.donate(selectedOrg).send({
        from: account,
        value: web3.utils.toWei(donationAmount, "ether"),
      });

      // Update local storage for donation history synchronization
      updateLocalStorageDonations(account, selectedOrg, donationAmount);
      
      // Show success message instead of navigating
      setSuccessMessage(`Donated Successfully! You donated ${donationAmount} ETH to ${selectedOrg} and received ${parseFloat(donationAmount) * 1000} DTK tokens.`);
      
      // Clear form fields
      setDonationAmount("");
      setSelectedOrg("");
      
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Transaction failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update local storage to reflect new donation immediately
  const updateLocalStorageDonations = (userAccount, organization, amount) => {
    try {
      // Update total donated
      const currentTotal = localStorage.getItem(`totalDonated_${userAccount}`) || "0";
      const newTotal = (parseFloat(currentTotal) + parseFloat(amount)).toString();
      localStorage.setItem(`totalDonated_${userAccount}`, newTotal);
      
      // Update donations history
      const currentDonations = JSON.parse(localStorage.getItem(`donations_${userAccount}`) || "[]");
      const newDonation = {
        donor: userAccount,
        organization: organization,
        amount: amount,
        timestamp: new Date().toLocaleString(),
      };
      
      currentDonations.push(newDonation);
      localStorage.setItem(`donations_${userAccount}`, JSON.stringify(currentDonations));
      
      // Update DTK balance (token reward is 1000× the ETH amount)
      const currentDTK = localStorage.getItem(`dtkBalance_${userAccount}`) || "0";
      const newDTK = (parseFloat(currentDTK) + parseFloat(amount) * 1000).toString();
      localStorage.setItem(`dtkBalance_${userAccount}`, newDTK);
    } catch (error) {
      console.error("Error updating local storage:", error);
    }
  };

  // Logout Function
  const handleLogout = () => {
    try {
      setAccount("");
      setWeb3(null);
      setContract(null);
      
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Handle direct donation from featured charities
  const handleDirectDonation = (orgName) => {
    setSelectedOrg(orgName);
    // Scroll to the donation form
    document.getElementById("donationForm").scrollIntoView({ behavior: "smooth" });
  };

  // Prevent rendering while checking organization status
  if (isOrg === null) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Checking access...</p>
      </Container>
    );
  }

  return (
    <>
      <DonorNavbar account={account} handleLogout={handleLogout} />
      <Container className="py-5">
        <h1 className="text-center mb-1">Make a Donation</h1>
        <p className="text-center mb-5">Support your favorite organization with blockchain-based donations</p>

        {/* Success Message */}
        {successMessage && (
          <Alert variant="success" className="mb-4 text-center">
            {successMessage}
          </Alert>
        )}

        <Row className="g-4">
          {/* Donation Form Column */}
          <Col lg={5} className="mb-4">
            <Card className="shadow-sm h-100" id="donationForm">
              <Card.Header className="bg-primary text-white py-3">
                <h3 className="m-0 text-center">Donation Details</h3>
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleDonate}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Organization:</Form.Label>
                    <Form.Select 
                      onChange={(e) => setSelectedOrg(e.target.value)} 
                      value={selectedOrg}
                      required
                      className="form-control-lg"
                    >
                      <option value="">-- Select Organization --</option>
                      {organizations.map((org, index) => (
                        <option key={index} value={org}>{org}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Enter Donation Amount (ETH):</Form.Label>
                    <Form.Control
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0.001"
                      step="0.001"
                      required
                      className="form-control-lg"
                    />
                    <Form.Text className="text-muted">
                      You will receive {donationAmount ? parseFloat(donationAmount) * 1000 : 0} DTK tokens for this donation.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2 mt-4">
                    <Button type="submit" variant="primary" size="lg" disabled={isLoading}>
                      {isLoading ? <><Spinner animation="border" size="sm" /> Processing...</> : "Donate Now"}
                    </Button>
                    <Button variant="outline-secondary" onClick={() => navigate("/donor-dashboard")}>
                      Back to Dashboard
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Featured Charities Column */}
          <Col lg={7}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white py-3">
                <h3 className="m-0 text-center">Featured Charities</h3>
              </Card.Header>
              <Card.Body className="p-3" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <Row className="g-3">
                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Row className="g-0">
                        <Col md={4} className="charity-img-container">
                          <Card.Img 
                            src="/charity1.jpg" 
                            alt="Global Education Initiative" 
                            style={{ height: "100%", objectFit: "cover" }}
                          />
                        </Col>
                        <Col md={8}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Card.Title>Global Education Initiative</Card.Title>
                              <Badge bg="success">Verified</Badge>
                            </div>
                            <Card.Text>
                              Providing educational resources and building schools in underserved communities across 27 countries.
                            </Card.Text>
                            <small className="text-muted d-block mb-3">
                              Address: 0x5CfE6ef4E8cff3b918224dAC699B20e383370B41
                            </small>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  
                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Row className="g-0">
                        <Col md={4} className="charity-img-container">
                          <Card.Img 
                            src="/charity2.jpg" 
                            alt="Ocean Conservation Alliance" 
                            style={{ height: "100%", objectFit: "cover" }}
                          />
                        </Col>
                        <Col md={8}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Card.Title>Ocean Conservation Alliance</Card.Title>
                              <Badge bg="info">Top Rated</Badge>
                            </div>
                            <Card.Text>
                              Working to protect marine ecosystems through cleanup initiatives, research, and sustainable fishing advocacy.
                            </Card.Text>
                            <small className="text-muted d-block mb-3">
                              Address: 0x8929E3230FebF6545E147957981045b13A2c5b54
                            </small>
                            
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                  
                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Row className="g-0">
                        <Col md={4} className="charity-img-container">
                          <Card.Img 
                            src="/charity3.jpg" 
                            alt="Disaster Relief Network" 
                            style={{ height: "100%", objectFit: "cover" }}
                          />
                        </Col>
                        <Col md={8}>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Card.Title>Disaster Relief Network</Card.Title>
                              <Badge bg="danger">Urgent</Badge>
                            </div>
                            <Card.Text>
                              Providing emergency aid, shelter, and medical assistance to communities affected by natural disasters.
                            </Card.Text>
                            <small className="text-muted d-block mb-3">
                              Address: 0xDAbC4DB9C9c66b2D6de8dFD53036c0f97334903B
                            </small>
                           
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Add some custom CSS for the charity image containers */}
      <style jsx="true">{`
        .charity-img-container {
          max-height: 200px;
          overflow: hidden;
        }
        
        @media (max-width: 767px) {
          .charity-img-container {
            height: 200px;
          }
        }
      `}</style>
    </>
  );
};

export default DonorDonate;