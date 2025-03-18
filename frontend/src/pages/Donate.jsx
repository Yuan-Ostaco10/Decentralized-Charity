import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Button, Form, Card } from "react-bootstrap";
import NavigationBar from "../components/Navbar"; // Import Navbar

const CONTRACT_ADDRESS = "0x46C079d1388e79278A22689704608ffF8199b82E";
const DonationABI = DonationJSON.abi;

function Donate() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [donationAmount, setDonationAmount] = useState("");

  const organizations = [
    { name: "Org 1", address: "0x5CfE6ef4E8cff3b918224dAC699B20e383370B41" },
    { name: "Org 2", address: "0x8929E3230FebF6545E147957981045b13A2c5b54" },
    { name: "Org 3", address: "0xDAbC4DB9C9c66b2D6de8dFD53036c0f97334903B" },
  ];

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

          if (selectedOrg) {
            const orgBalance = await contractInstance.methods.getBalance(selectedOrg).call();
            setBalance(web3Instance.utils.fromWei(orgBalance, "ether"));
          }
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else {
        console.log("MetaMask not detected");
      }
    }
    init();
  }, [selectedOrg]);

  const donate = async () => {
    if (!selectedOrg) {
      alert("Please select an organization!");
      return;
    }

    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
      alert("Please enter a valid donation amount!");
      return;
    }

    if (contract && web3) {
      try {
        await contract.methods.donate(selectedOrg).send({
          from: account,
          value: web3.utils.toWei(donationAmount, "ether"),
        });

        const updatedBalance = await contract.methods.getBalance(selectedOrg).call();
        setBalance(web3.utils.fromWei(updatedBalance, "ether"));

        alert(`Donated ${donationAmount} ETH to ${selectedOrg}`);
        setDonationAmount("");
      } catch (error) {
        console.error("Donation failed:", error);
        alert("Donation failed. Check console for details.");
      }
    }
  };

  return (
    <>
      <NavigationBar />
      <Container className="mt-5">
        <h1 className="text-center">Make a Donation</h1>
        <Card className="p-4 shadow-sm">
          <p><strong>Your Address:</strong> {account}</p>

          <Form.Group>
            <Form.Label>Select Organization:</Form.Label>
            <Form.Select onChange={(e) => setSelectedOrg(e.target.value)}>
              <option value="">-- Select Organization --</option>
              {organizations.map((org) => (
                <option key={org.address} value={org.address}>{org.name}</option>
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
            />
          </Form.Group>

          <Button onClick={donate} className="mt-3" variant="primary">
            Donate
          </Button>
        </Card>
      </Container>
    </>
  );
}

export default Donate;
