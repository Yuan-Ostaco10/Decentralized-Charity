import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Form, Button, Spinner, Card, Alert } from "react-bootstrap";
import DonorNavbar from "../components/DonorNavbar";
import { useNavigate } from "react-router-dom";
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
      <Container className="mt-5">
        <h1 className="text-center mb-4">Make a Donation</h1>
        <p className="text-center mb-4">Support your favorite organization.</p>

        {/* Success Message */}
        {successMessage && (
          <Alert variant="success" className="mb-4 text-center">
            {successMessage}
          </Alert>
        )}

        {/* Donation Form */}
        <Card className="p-4 shadow-sm mb-4 mx-auto" style={{ maxWidth: "600px" }}>
          <h3 className="mb-3 text-center">Donation Details</h3>
          <Form onSubmit={handleDonate}>
            <Form.Group>
              <Form.Label>Select Organization:</Form.Label>
              <Form.Select 
                onChange={(e) => setSelectedOrg(e.target.value)} 
                value={selectedOrg}
                required
              >
                <option value="">-- Select Organization --</option>
                {organizations.map((org, index) => (
                  <option key={index} value={org}>{org}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Enter Donation Amount (ETH):</Form.Label>
              <Form.Control
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter amount"
                min="0.001"
                step="0.001"
                required
              />
              <Form.Text className="text-muted">
                You will receive {donationAmount ? parseFloat(donationAmount) * 1000 : 0} DTK tokens for this donation.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => navigate("/donor-dashboard")}>
                Back to Dashboard
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? <Spinner animation="border" size="sm" /> : "Donate Now"}
              </Button>
            </div>
          </Form>
        </Card>
      </Container>
    </>
  );
};

export default DonorDonate;