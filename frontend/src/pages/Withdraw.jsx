import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Badge } from "react-bootstrap";
import DashboardNavbar from "../components/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

const CONTRACT_ADDRESS = "0xc31538c92024b5E9ceCdbefD615B5C805726a83A";
const DonationABI = DonationJSON.abi;

const Withdraw = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState("0");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [isOrganization, setIsOrganization] = useState(null);
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

          const isOrg = await contractInstance.methods.isOrganization(accounts[0]).call();
          setIsOrganization(isOrg);

          if (!isOrg) {
            alert("Access denied: You are not an organization.");
            navigate("/login");
            return;
          }

          const orgBalance = await contractInstance.methods.getBalance(accounts[0]).call();
          setBalance(web3Instance.utils.fromWei(orgBalance, "ether"));

          const historyData = await contractInstance.methods.getWithdrawalHistory().call({ from: accounts[0] });
          const formattedHistory = historyData.map(entry => ({
            amount: web3Instance.utils.fromWei(entry.amount, "ether"),
            timestamp: new Date(parseInt(entry.timestamp) * 1000).toLocaleString(),
          }));
          setWithdrawHistory(formattedHistory);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
          setMessage("Failed to connect to MetaMask.");
        }
      } else {
        console.log("MetaMask not detected");
        setMessage("Please install MetaMask.");
      }
    }
    init();
  }, [navigate]);

  const handleWithdraw = async () => {
    if (!web3 || !contract || !account) {
      setMessage("Web3 or contract not initialized.");
      return;
    }

    const amountInWei = web3.utils.toWei(withdrawAmount, "ether");

    try {
      setLoading(true);
      setMessage("");

      await contract.methods.withdraw(amountInWei).send({ from: account });

      setMessage(`Successfully withdrew ${withdrawAmount} ETH`);

      const newBalance = await contract.methods.getBalance(account).call();
      setBalance(web3.utils.fromWei(newBalance, "ether"));

      const historyData = await contract.methods.getWithdrawalHistory().call({ from: account });
      const formattedHistory = historyData.map(entry => ({
        amount: web3.utils.fromWei(entry.amount, "ether"),
        timestamp: new Date(parseInt(entry.timestamp) * 1000).toLocaleString(),
      }));
      setWithdrawHistory(formattedHistory);

      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setMessage("Withdrawal failed. Ensure you have enough balance and try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="lead text-muted">Manage your organization's funds</p>
        </Container>
      </Container>

      <Container className="py-4">
        {/* Balance Summary Card */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body className="p-4">
            <Row>
              <Col md={6}>
                <h3>Available Balance</h3>
                <h2 className="display-4 mb-0">{balance} <small className="text-muted">ETH</small></h2>
                <p className="text-muted">Current withdrawable balance</p>
              </Col>
              <Col md={6} className="d-flex align-items-center justify-content-md-end">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="px-4 py-2" 
                  disabled={parseFloat(balance) <= 0}
                  onClick={() => document.getElementById('withdrawForm').scrollIntoView({ behavior: 'smooth' })}
                >
                  Withdraw Funds
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Row>
          {/* Withdrawal Form */}
          <Col lg={5} className="mb-4">
            <Card className="h-100 shadow-sm border-0" id="withdrawForm">
              <Card.Header className="bg-white border-0 pt-4 px-4">
                <h3>Withdraw Funds</h3>
                <p className="text-muted mb-0">Transfer your donations to your wallet</p>
              </Card.Header>
              <Card.Body className="p-4">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Withdrawal Amount (ETH)</Form.Label>
                    <Form.Control
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount to withdraw"
                      className="form-control-lg"
                    />
                    <Form.Text className="text-muted">
                      Maximum: {balance} ETH
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button
                      variant="danger"
                      size="lg"
                      disabled={loading || parseFloat(balance) <= 0 || !withdrawAmount}
                      onClick={handleWithdraw}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Processing...
                        </>
                      ) : (
                        "Withdraw Funds"
                      )}
                    </Button>
                  </div>
                </Form>

                {message && (
                  <Alert variant={message.includes("Successfully") ? "success" : "danger"} className="mt-3">
                    {message}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Withdrawal History */}
          <Col lg={7} className="mb-4">
            <Card className="h-100 shadow-sm border-0">
              <Card.Header className="bg-white border-0 pt-4 px-4">
                <h3>Transaction History</h3>
                <p className="text-muted mb-0">Your past withdrawal transactions</p>
              </Card.Header>
              <Card.Body className="p-4">
                {withdrawHistory.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Amount</th>
                          <th>Date & Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawHistory.map((entry, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{entry.amount} ETH</strong>
                            </td>
                            <td>{entry.timestamp}</td>
                            <td>
                              <Badge bg="success">Completed</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-clock-history text-muted" viewBox="0 0 16 16">
                        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.834 1.79a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z"/>
                        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z"/>
                        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
                      </svg>
                    </div>
                    <h5>No withdrawal history yet</h5>
                    <p className="text-muted">Your past withdrawals will appear here</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Withdraw;