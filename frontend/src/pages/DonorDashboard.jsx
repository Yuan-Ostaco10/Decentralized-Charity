import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Table, Alert, Form, Button, Spinner, Card } from "react-bootstrap";
import DonorNavbar from "../components/DonorNavbar";
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
  const [selectedOrg, setSelectedOrg] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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

          // ✅ Restore cached total donations and donation history
          const cachedTotalDonated = localStorage.getItem(`totalDonated_${accounts[0]}`);
          const cachedDonations = localStorage.getItem(`donations_${accounts[0]}`);

          if (cachedTotalDonated) {
            setTotalDonated(cachedTotalDonated);
          }
          if (cachedDonations) {
            setDonations(JSON.parse(cachedDonations));
          }

          await fetchOrganizations(contractInstance);
          await fetchTotalDonated(contractInstance, accounts[0]);
          await fetchDonationHistory(contractInstance, accounts[0]);

        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        } finally {
          setLoadingData(false);
        }
      } else {
        console.log("MetaMask not detected");
      }
    }
    init();
  }, []);

  // ✅ Fetch all registered organizations
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

  // ✅ Fetch total donations of the logged-in donor
  async function fetchTotalDonated(contractInstance, userAccount) {
    try {
      if (!contractInstance || !userAccount) return;
      
      const totalDonatedWei = await contractInstance.methods.getTotalDonations(userAccount).call();
      const totalInEth = web3.utils.fromWei(totalDonatedWei, "ether");
      
      setTotalDonated(totalInEth);
      localStorage.setItem(`totalDonated_${userAccount}`, totalInEth);
    } catch (error) {
      console.error("Error fetching total donations:", error);
    }
  }

  // ✅ Fetch donor's donation history and store persistently
  async function fetchDonationHistory(contractInstance, userAccount) {
    try {
      const eventDonations = await contractInstance.getPastEvents("Donated", {
        fromBlock: 0,
        toBlock: "latest",
      });

      const donationList = eventDonations
        .map(event => ({
          donor: event.returnValues.donor,
          organization: event.returnValues.organization,
          amount: web3.utils.fromWei(event.returnValues.amount, "ether"),
        }))
        .filter(donation => donation.donor.toLowerCase() === userAccount.toLowerCase());

      // ✅ Store in localStorage after fetching from blockchain
      if (donationList.length > 0) {
        localStorage.setItem(`donations_${userAccount}`, JSON.stringify(donationList));
      }

      setDonations(donationList);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  }

  // ✅ Handle donation process
  const handleDonate = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !donationAmount || parseFloat(donationAmount) <= 0) {
      alert("Please select an organization and enter a valid amount.");
      return;
    }

    setIsLoading(true);
    try {
      await contract.methods.donate(selectedOrg).send({
        from: account,
        value: web3.utils.toWei(donationAmount, "ether"),
      });

      alert(`Donated ${donationAmount} ETH to ${selectedOrg}`);
      setDonationAmount("");

      // ✅ Update stored data
      await fetchTotalDonated(contract, account);
      await fetchDonationHistory(contract, account);
    } catch (error) {
      console.error("Donation failed:", error);
      alert("Transaction failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DonorNavbar account={account} />
      <Container className="mt-5">
        <h1 className="text-center">Donor Dashboard</h1>
        <p className="text-center">Track your donations and make new ones.</p>

        {loadingData ? (
          <Spinner animation="border" className="d-block mx-auto" />
        ) : (
          <>
            <h3 className="text-center my-3">Total Donated: {totalDonated} ETH</h3>

            {/* ✅ Donation Form */}
            <Card className="p-4 shadow-sm">
              <Form onSubmit={handleDonate}>
                <Form.Group>
                  <Form.Label>Select Organization:</Form.Label>
                  <Form.Select onChange={(e) => setSelectedOrg(e.target.value)} required>
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
                    min="0.01"
                    step="0.01"
                    required
                  />
                </Form.Group>

                <Button type="submit" className="mt-3" variant="primary" disabled={isLoading}>
                  {isLoading ? <Spinner animation="border" size="sm" /> : "Donate"}
                </Button>
              </Form>
            </Card>

            {/* ✅ Donation History Table */}
            <h3 className="text-center mt-4">Your Donation History</h3>
            {donations.length > 0 ? (
              <Table striped bordered hover className="mb-5">
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
          </>
        )}
      </Container>
    </>
  );
};

export default DonorDashboard;
