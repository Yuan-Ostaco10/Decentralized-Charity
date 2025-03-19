import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Table, Alert, Spinner, Card, Row, Col, Badge } from "react-bootstrap";
import DashboardNavbar from "../components/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

const CONTRACT_ADDRESS = "0xc31538c92024b5E9ceCdbefD615B5C805726a83A";
const DonationABI = DonationJSON.abi;

const Dashboard = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isOrganization, setIsOrganization] = useState(null);
  const [totalDonations, setTotalDonations] = useState(0);
  const [uniqueDonors, setUniqueDonors] = useState(0);
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
          const isOrg = await contractInstance.methods.isOrganization(accounts[0]).call();
          setIsOrganization(isOrg);

          if (!isOrg) {
            alert("Access denied: Only organizations can view this page.");
            navigate("/login");
            return;
          }

          // Fetch donation history for this organization
          const eventDonations = await contractInstance.getPastEvents("Donated", {
            fromBlock: 0,
            toBlock: "latest",
          });

          // Filter donations specific to the logged-in organization
          const donationList = eventDonations
            .map(event => ({
              donor: event.returnValues.donor,
              organization: event.returnValues.organization,
              amount: web3Instance.utils.fromWei(event.returnValues.amount, "ether"),
              timestamp: new Date().toLocaleString() // This would ideally come from the blockchain
            }))
            .filter(donation => donation.organization.toLowerCase() === accounts[0].toLowerCase());

          setDonations(donationList);
          
          // Calculate total donation amount
          const total = donationList.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
          setTotalDonations(total.toFixed(4));
          
          // Calculate unique donors
          const uniqueDonorSet = new Set(donationList.map(donation => donation.donor));
          setUniqueDonors(uniqueDonorSet.size);
          
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.log("MetaMask not detected");
      }
    }
    init();
  }, [navigate]);

  // Show loading indicator until authentication check is done
  if (isOrganization === null) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" style={{ width: "3rem", height: "3rem" }} />
          <p className="mt-3">Checking organization status...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <DashboardNavbar account={account} handleLogout={() => navigate("/login")} />
      
      <Container fluid className="py-4 bg-light">
        <Container>
          <h1 className="display-5 mb-0">Organization Dashboard</h1>
          <p className="lead text-muted">Track your donations and supporter activity</p>
        </Container>
      </Container>

      <Container className="py-4">
        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={4} className="mb-3 mb-md-0">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-cash text-primary" viewBox="0 0 16 16">
                      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
                      <path d="M0 4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V4zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V6a2 2 0 0 1-2-2H3z"/>
                    </svg>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Total Donations</h6>
                    <h3 className="mb-0">{totalDonations} ETH</h3>
                  </div>
                </div>
                <p className="text-muted mb-0">All time donation volume</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3 mb-md-0">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-people text-success" viewBox="0 0 16 16">
                      <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                    </svg>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Unique Donors</h6>
                    <h3 className="mb-0">{uniqueDonors}</h3>
                  </div>
                </div>
                <p className="text-muted mb-0">Individual supporters</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-wallet2 text-info" viewBox="0 0 16 16">
                      <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
                    </svg>
                  </div>
                  <div>
                    <h6 className="text-muted mb-1">Actions</h6>
                    <h3 className="mb-0">Manage</h3>
                  </div>
                </div>
                <div className="d-grid">
                  <a href="/withdraw" className="btn btn-outline-primary">Withdraw Funds</a>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Donation History */}
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white border-0 pt-4 px-4">
            <h3>Donation History</h3>
            <p className="text-muted mb-0">Complete record of your organization's received donations</p>
          </Card.Header>
          <Card.Body className="p-4">
            {donations.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th>Donor Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-light rounded-circle p-2 me-3">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
                              </svg>
                            </div>
                            <div className="text-truncate" style={{ maxWidth: "200px" }}>
                              {donation.donor}
                            </div>
                          </div>
                        </td>
                        <td><strong>{donation.amount} ETH</strong></td>
                        <td><Badge bg="success">Confirmed</Badge></td>
                        <td>{donation.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-5">
                <div className="mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-cash-coin text-muted" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm5-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
                    <path d="M9.438 11.944c.047.596.518 1.06 1.363 1.116v.44h.375v-.443c.875-.061 1.386-.529 1.386-1.207 0-.618-.39-.936-1.09-1.1l-.296-.07v-1.2c.376.043.614.248.671.532h.658c-.047-.575-.54-1.024-1.329-1.073V8.5h-.375v.45c-.747.073-1.255.522-1.255 1.158 0 .562.378.92 1.007 1.066l.248.061v1.272c-.384-.058-.639-.27-.696-.563h-.668zm1.36-1.354c-.369-.085-.569-.26-.569-.522 0-.294.216-.514.572-.578v1.1h-.003zm.432.746c.449.104.655.272.655.569 0 .339-.257.571-.709.614v-1.195l.054.012z"/>
                    <path d="M1 0a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h4.083c.058-.344.145-.678.258-1H3a2 2 0 0 0-2-2V3a2 2 0 0 0 2-2h10a2 2 0 0 0 2 2v3.528c.38.34.717.728 1 1.154V1a1 1 0 0 0-1-1H1z"/>
                    <path d="M9.998 5.083 10 5a2 2 0 1 0-3.132 1.65 5.982 5.982 0 0 1 3.13-1.567z"/>
                  </svg>
                </div>
                <h5>No donations yet</h5>
                <p className="text-muted">Donations to your organization will appear here</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default Dashboard;