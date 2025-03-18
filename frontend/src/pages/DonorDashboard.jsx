import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Table, Alert, Form, Button, Spinner } from "react-bootstrap";
import DonorNavbar from "../components/DonorNavbar"; // ✅ Import Donor Navbar
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = "0x46C079d1388e79278A22689704608ffF8199b82E";
const DonationABI = DonationJSON.abi;

const DonorDashboard = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [donations, setDonations] = useState([]);
  const [totalDonated, setTotalDonated] = useState("0");
  const [donationAmount, setDonationAmount] = useState("");
  const [organization, setOrganization] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

          // Fetch data
          await fetchDonations(contractInstance, accounts[0]);
          await fetchTotalDonated(contractInstance, accounts[0]);
          await fetchOrganizations(contractInstance);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.log("MetaMask not detected");
      }
    }
    init();
  }, []);

  // Fetch organizations from contract
  async function fetchOrganizations(contractInstance) {
    try {
      const orgs = await contractInstance.methods.getOrganizations().call();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  }

  // Fetch donor's donation history
  async function fetchDonations(contractInstance, userAccount) {
    try {
      const donationsList = await contractInstance.methods.getTotalDonations(userAccount).call();
      setTotalDonated(web3.utils.fromWei(donationsList, "ether"));
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  }

  // Fetch total donated amount
  async function fetchTotalDonated(contractInstance, userAccount) {
    try {
      const totalDonatedWei = await contractInstance.methods.getTotalDonations(userAccount).call();
      setTotalDonated(web3.utils.fromWei(totalDonatedWei, "ether"));
    } catch (error) {
      console.error("Error fetching total donations:", error);
    }
  }

  // Handle Donation
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!organization || !donationAmount) {
      alert("Please select an organization and enter an amount.");
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods.donate(organization).send({
        from: account,
        value: web3.utils.toWei(donationAmount, "ether"),
      });

      alert("Donation successful!");
      setDonationAmount(""); // Reset input field
      fetchTotalDonated(contract, account); // Update total donated
    } catch (error) {
      console.error("Donation failed:", error);
    }
    setIsLoading(false);
  };

  return (
    <>
      <DonorNavbar account={account} /> {/* ✅ Updated Navbar */}
      <Container className="mt-5">
        <h1 className="text-center">Donor Dashboard</h1>
        <p className="text-center">Track your donations and make new ones.</p>

        <h3 className="text-center my-3">Total Donated: {totalDonated} ETH</h3>

        {/* Donation Form */}
        <Form onSubmit={handleDonate} className="mb-4">
          <Form.Group controlId="organization">
            <Form.Label>Select Organization</Form.Label>
            <Form.Control as="select" value={organization} onChange={(e) => setOrganization(e.target.value)} required>
              <option value="">Choose an organization</option>
              {organizations.length > 0 ? (
                organizations.map((org, index) => (
                  <option key={index} value={org}>{org}</option>
                ))
              ) : (
                <option disabled>No organizations available</option>
              )}
            </Form.Control>
          </Form.Group>

          <Form.Group controlId="amount" className="mt-2">
            <Form.Label>Donation Amount (ETH)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0.01"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="mt-3" disabled={isLoading}>
            {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Donate"}
          </Button>
        </Form>

        {/* Donation History Table */}
        <h3 className="text-center mt-4">Your Donation History</h3>
        {donations.length > 0 ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Amount (ETH)</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation, index) => (
                <tr key={index}>
                  <td>{donation.organization}</td>
                  <td>{donation.amount}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Alert variant="info" className="text-center">No donations yet.</Alert>
        )}
      </Container>
    </>
  );
};

export default DonorDashboard;
