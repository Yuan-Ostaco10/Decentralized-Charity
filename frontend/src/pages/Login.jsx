import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import { Container, Button, Alert, Spinner } from "react-bootstrap";

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
    <Container className="text-center mt-5">
      <h1 className="mb-4">Login to Decentralized Charity</h1>

      {account ? (
        <>
          <Alert variant="success">
            Connected as: <strong>{account}</strong> ({checkingRole ? "Checking..." : role})
          </Alert>
          {checkingRole ? (
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          ) : (
            <Button onClick={handleLogin} className="btn btn-primary">
              Continue as {role}
            </Button>
          )}
        </>
      ) : (
        <Button onClick={connectWallet} className="btn btn-primary" disabled={loading}>
          {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : "Connect Wallet"}
        </Button>
      )}
    </Container>
  );
};

export default Login;
