import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Spinner,
  Form 
} from "react-bootstrap";

const CONTRACT_ADDRESS = "0x46C079d1388e79278A22689704608ffF8199b82E";
const DonationABI = DonationJSON.abi;

const Login = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkWalletConnection() {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            await initializeContract(web3Instance, accounts[0]);
          }
          setWeb3(web3Instance);
        } catch (error) {
          console.error("Error checking wallet:", error);
        }
      } else {
        console.log("MetaMask not detected");
      }
    }
    checkWalletConnection();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      setLoading(true);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3Instance = new Web3(window.ethereum);
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);

      await initializeContract(web3Instance, accounts[0]);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Failed to connect MetaMask. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeContract = async (web3Instance, userAccount) => {
    try {
      const contractInstance = new web3Instance.eth.Contract(DonationABI, CONTRACT_ADDRESS);
      setContract(contractInstance);

      setCheckingRole(true); // Show spinner while checking role
      const isOrg = await contractInstance.methods.isOrganization(userAccount).call();
      setRole(isOrg ? "Organization" : "Donor");
    } catch (error) {
      console.error("Error loading contract:", error);
      alert("Failed to load contract. Try again.");
    } finally {
      setCheckingRole(false);
    }
  };

  const handleLogin = () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    if (role === "Organization") {
      navigate("/dashboard");
    } else {
      navigate("/donor-dashboard");
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h2 className="fw-bold mb-0">Decentralized Charity</h2>
            </Card.Header>
            
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <img 
                  src="/donation.png" 
                  alt="Charity Logo" 
                  className="mb-3 w-25"  
                />
                <h3 className="mb-3">Welcome Back</h3>
                <p className="text-muted">Connect your wallet to continue</p>
              </div>
              
              {account ? (
                <div className="text-center">
                  <Alert variant="success" className="d-flex align-items-center justify-content-center">
                    <div className="d-flex align-items-center">
                      <div className="bg-success rounded-circle me-2" style={{ width: '10px', height: '10px' }}></div>
                      <span>
                        Connected: <strong className="text-break">{account}</strong>
                      </span>
                    </div>
                  </Alert>
                  
                  <div className="mt-3 mb-3">
                    {checkingRole ? (
                      <div className="d-flex justify-content-center align-items-center">
                        <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                        <span>Detecting account type...</span>
                      </div>
                    ) : (
                      <Alert variant="info">
                        Account Type: <strong>{role}</strong>
                      </Alert>
                    )}
                  </div>
                  
                  {!checkingRole && (
                    <Button 
                      onClick={handleLogin} 
                      variant="primary" 
                      size="lg" 
                      className="w-100 mt-3"
                    >
                      Continue as {role}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <Button 
                    onClick={connectWallet} 
                    variant="primary" 
                    size="lg" 
                    className="w-100" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Connecting...
                      </>
                    ) : (
                      <>Connect MetaMask Wallet</>
                    )}
                  </Button>
                  
                  <div className="mt-3 text-center">
                    <small className="text-muted">
                      Don't have MetaMask installed?{" "}
                      <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">
                        Get MetaMask
                      </a>
                    </small>
                  </div>
                </div>
              )}
            </Card.Body>
            
            <Card.Footer className="text-center text-muted py-3 bg-light">
              <small>Secure, transparent and decentralized charitable giving</small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;