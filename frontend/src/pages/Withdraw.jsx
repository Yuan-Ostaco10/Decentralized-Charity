import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Row, Col, Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import DashboardNavbar from "../components/DashboardNavbar";
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = "0x46C079d1388e79278A22689704608ffF8199b82E"; // Replace after redeploying
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
  const [isOrganization, setIsOrganization] = useState(null); // 🔹 Track if user is an organization
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

          // 🔹 Check if the user is an organization
          const isOrg = await contractInstance.methods.isOrganization(accounts[0]).call();
          setIsOrganization(isOrg);

          if (!isOrg) {
            alert("Access denied: You are not an organization.");
            navigate("/login"); // Redirect unauthorized users
            return;
          }

          // Fetch organization balance
          const orgBalance = await contractInstance.methods.getBalance(accounts[0]).call();
          setBalance(web3Instance.utils.fromWei(orgBalance, "ether"));

          // Fetch past withdrawals from the blockchain
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
  }, [navigate]); // 🔹 Depend on `navigate` to trigger redirect properly

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

      // Refresh balance and withdrawal history
      const newBalance = await contract.methods.getBalance(account).call();
      setBalance(web3.utils.fromWei(newBalance, "ether"));

      const historyData = await contract.methods.getWithdrawalHistory().call({ from: account });
      const formattedHistory = historyData.map(entry => ({
        amount: web3.utils.fromWei(entry.amount, "ether"),
        timestamp: new Date(parseInt(entry.timestamp) * 1000).toLocaleString(),
      }));
      setWithdrawHistory(formattedHistory);

      setWithdrawAmount(""); // Reset input field
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setMessage("Withdrawal failed. Ensure you have enough balance and try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Show loading indicator until authentication check is done
  if (isOrganization === null) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Checking access...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <>
      <DashboardNavbar account={account} handleLogout={() => navigate("/login")} />
      <Container className="mt-5">
        <Row>
          {/* Left Column - Withdraw Funds */}
          <Col md={6}>
            <Card className="p-4 shadow-sm">
              <h3>Withdraw Funds</h3>
              <p>Organizations can withdraw their received donations here.</p>

              <Alert variant={parseFloat(balance) > 0 ? "success" : "warning"}>
                <strong>Available Balance:</strong> {balance} ETH
              </Alert>

              <Form.Group>
                <Form.Label>Enter Withdrawal Amount (ETH):</Form.Label>
                <Form.Control
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </Form.Group>

              <Button
                className="btn btn-danger mt-3"
                disabled={loading || parseFloat(balance) <= 0 || !withdrawAmount}
                onClick={handleWithdraw} // Attach function here
              >
                {loading ? <Spinner animation="border" size="sm" /> : "Withdraw Funds"}
              </Button>

              {message && <Alert className="mt-3">{message}</Alert>}
            </Card>
          </Col>

          {/* Right Column - Withdrawal History */}
          <Col md={6}>
            <Card className="p-4 shadow-sm">
              <h3>Withdrawal History</h3>
              {withdrawHistory.length > 0 ? (
                <ul className="list-group">
                  {withdrawHistory.map((entry, index) => (
                    <li key={index} className="list-group-item">
                      <strong>{entry.amount} ETH</strong> - {entry.timestamp}
                    </li>
                  ))}
                </ul>
              ) : (
                <Alert variant="info">No withdrawals yet.</Alert>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Withdraw;
