import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Table, Alert, Spinner } from "react-bootstrap";
import DashboardNavbar from "../components/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";

const CONTRACT_ADDRESS = "0x46C079d1388e79278A22689704608ffF8199b82E";
const DonationABI = DonationJSON.abi;

const Dashboard = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isOrganization, setIsOrganization] = useState(null); // 🔹 Track organization status
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
            alert("Access denied: Only organizations can view this page.");
            navigate("/login"); // Redirect unauthorized users
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
            }))
            .filter(donation => donation.organization.toLowerCase() === accounts[0].toLowerCase()); // Only donations to this org

          setDonations(donationList);
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.log("MetaMask not detected");
      }
    }
    init();
  }, [navigate]);

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
        <h1 className="text-center">Donation History</h1>
        <p className="text-center">See who has donated to your organization.</p>

        {donations.length > 0 ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Donor</th>
                <th>Amount (ETH)</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation, index) => (
                <tr key={index}>
                  <td>{donation.donor}</td>
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

export default Dashboard;
