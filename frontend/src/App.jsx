import { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "./DonationABI.json"; // Ensure correct path
import "bootstrap/dist/css/bootstrap.min.css";


const CONTRACT_ADDRESS = "0xac861EeefE4De6c603E8b761b6EFb2702973f85A";
const DonationABI = DonationJSON.abi; // Extract only ABI

function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(""); // Track selected organization
  const [donationAmount, setDonationAmount] = useState(""); // User input for donation amount

  const organizations = [
    { name: "Org 1", address: "0x5CfE6ef4E8cff3b918224dAC699B20e383370B41" },
    { name: "Org 2", address: "0x8929E3230FebF6545E147957981045b13A2c5b54" },
    { name: "Org 3", address: "0xDAbC4DB9C9c66b2D6de8dFD53036c0f97334903B" },
  ]; // Replace with actual contract addresses

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

          // Fetch balance of selected organization (if any)
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
  }, [selectedOrg]); // Fetch balance when selected organization changes

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

        // Fetch the latest balance after donation
        const updatedBalance = await contract.methods.getBalance(selectedOrg).call();
        setBalance(web3.utils.fromWei(updatedBalance, "ether"));

        alert(`Donated ${donationAmount} ETH to ${selectedOrg}`);
        setDonationAmount(""); // Reset input field
      } catch (error) {
        console.error("Donation failed:", error);
        alert("Donation failed. Check console for details.");
      }
    }
  };

  const withdraw = async () => {
    if (contract && account) {
      try {
        await contract.methods.withdraw().send({ from: account });

        // Update balance after withdrawal
        const updatedBalance = await contract.methods.getBalance(account).call();
        setBalance(web3.utils.fromWei(updatedBalance, "ether"));

        alert("Withdrawal successful!");
      } catch (error) {
        console.error("Withdrawal failed:", error);
        alert("Withdrawal failed. Your address must match the organization address");
      }
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Decentralized Charity Donation</h1>
      
      <div className="card p-4 shadow-sm">
        <p><strong>Your Address:</strong> {account}</p>
  
        <div className="mb-3">
          <label className="form-label">Select Organization:</label>
          <select 
            onChange={(e) => setSelectedOrg(e.target.value)} 
            className="form-select"
          >
            <option value="">-- Select Organization --</option>
            {organizations.map((org) => (
              <option key={org.address} value={org.address}>{org.name}</option>
            ))}
          </select>
        </div>
  
        <div className="mb-3">
          <label className="form-label">Enter Donation Amount (ETH):</label>
          <input 
            type="number" 
            value={donationAmount} 
            onChange={(e) => setDonationAmount(e.target.value)} 
            className="form-control"
            placeholder="Enter amount"
          />
        </div>
  
        <button onClick={donate} className="btn btn-primary me-2">
          Donate
        </button>
  
        <button onClick={withdraw} className="btn btn-danger">
          Withdraw Funds
        </button>
  
        <p className="mt-3"><strong>Selected Organization Balance:</strong> {balance} ETH</p>
      </div>
    </div>
  );
  
}

export default App;
