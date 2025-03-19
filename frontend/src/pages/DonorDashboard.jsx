import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import DonationTokenJSON from "../DonationTokenABI.json";
import { Container, Table, Alert, Form, Button, Spinner, Card } from "react-bootstrap";
import DonorNavbar from "../components/DonorNavbar";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../App.css";


const CONTRACT_ADDRESS = "0xc31538c92024b5E9ceCdbefD615B5C805726a83A";
const TOKEN_ADDRESS = "0xe00C88a88D8581a68357046784B17D3383509aDE";
const DonationABI = DonationJSON.abi;
const DonationTokenABI = DonationTokenJSON.abi;

const DonorDashboard = () => {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [donations, setDonations] = useState([]);
  const [totalDonated, setTotalDonated] = useState("0");
  const [dtkBalance, setDtkBalance] = useState("0");
  const [selectedReward, setSelectedReward] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isOrg, setIsOrg] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [fundAmount, setFundAmount] = useState("1000");
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
          const tokenInstance = new web3Instance.eth.Contract(DonationTokenABI, TOKEN_ADDRESS);
          setContract(contractInstance);
          setTokenContract(tokenInstance);
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
  
          // Check if user is contract owner
          const ownerAddress = await contractInstance.methods.owner().call();
          setIsOwner(accounts[0].toLowerCase() === ownerAddress.toLowerCase());
  
          // IMPORTANT: First try to restore cached data
          const cachedTotalDonated = localStorage.getItem(`totalDonated_${accounts[0]}`);
          const cachedDonations = localStorage.getItem(`donations_${accounts[0]}`);
          const cachedDtkBalance = localStorage.getItem(`dtkBalance_${accounts[0]}`);
  
          if (cachedTotalDonated) setTotalDonated(cachedTotalDonated);
          if (cachedDonations) {
            try {
              const parsedDonations = JSON.parse(cachedDonations);
              if (Array.isArray(parsedDonations) && parsedDonations.length > 0) {
                setDonations(parsedDonations);
              }
            } catch (e) {
              console.error("Error parsing cached donations:", e);
            }
          }
          if (cachedDtkBalance) setDtkBalance(cachedDtkBalance);
  
          // Then fetch fresh data from blockchain
          await fetchTotalDonated(contractInstance, accounts[0]);
          await fetchDonationHistory(contractInstance, accounts[0]);
          await fetchDtkBalance(tokenInstance, accounts[0]);
  
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        } finally {
          setLoadingData(false);
        }
      } else {
        console.log("MetaMask not detected");
        alert("Please install MetaMask to use this application");
      }
    }
    init();
    
    // Listen for blockchain events that might affect our data
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        window.location.reload();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [navigate]);

  // Fetch total donations of the logged-in donor
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

 // Fetch donor's donation history and store persistently
// Fetch donor's donation history and store persistently
async function fetchDonationHistory(contractInstance, userAccount) {
  try {
    // Get existing cached donations first
    let existingDonations = [];
    const cachedDonations = localStorage.getItem(`donations_${userAccount}`);
    if (cachedDonations) {
      try {
        existingDonations = JSON.parse(cachedDonations);
      } catch (e) {
        console.error("Error parsing cached donations:", e);
      }
    }
    
    // Then fetch new donations from blockchain
    const eventDonations = await contractInstance.getPastEvents("Donated", {
      filter: { donor: userAccount },
      fromBlock: 0,
      toBlock: "latest",
    });

    // Process new donations
    const donationList = await Promise.all(eventDonations.map(async (event) => {
      // Create a unique ID for this donation to prevent duplicates
      const donationId = `${event.transactionHash}_${event.logIndex}`;
      
      // Process timestamp
      let formattedDate;
      try {
        if (event.returnValues.timestamp && !isNaN(event.returnValues.timestamp)) {
          formattedDate = new Date(parseInt(event.returnValues.timestamp) * 1000).toLocaleString();
        } else {
          // Fallback to block timestamp
          const block = await web3.eth.getBlock(event.blockNumber);
          formattedDate = block ? new Date(parseInt(block.timestamp) * 1000).toLocaleString() : new Date().toLocaleString();
        }
      } catch (err) {
        console.error("Error processing timestamp:", err);
        formattedDate = new Date().toLocaleString();
      }
      
      return {
        id: donationId,
        donor: event.returnValues.donor,
        organization: event.returnValues.organization,
        amount: web3.utils.fromWei(event.returnValues.amount, "ether"),
        timestamp: formattedDate,
        transactionHash: event.transactionHash
      };
    }));

    // Combine with existing donations, removing duplicates
    const allDonations = [...existingDonations];
    
    // Add new donations that aren't already in the list (using the ID to check)
    donationList.forEach(newDonation => {
      if (!allDonations.some(existing => 
        existing.id === newDonation.id || 
        existing.transactionHash === newDonation.transactionHash
      )) {
        allDonations.push(newDonation);
      }
    });

    // Store the combined list
    localStorage.setItem(`donations_${userAccount}`, JSON.stringify(allDonations));
    setDonations(allDonations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    
    // If blockchain fetch fails, at least show cached data
    const cachedDonations = localStorage.getItem(`donations_${userAccount}`);
    if (cachedDonations) {
      try {
        setDonations(JSON.parse(cachedDonations));
      } catch (e) {
        console.error("Error parsing cached donations:", e);
      }
    }
  }
}

  // Fetch DTK token balance
  async function fetchDtkBalance(tokenInstance, userAccount) {
    try {
      if (!tokenInstance || !userAccount) return;
      
      const balance = await tokenInstance.methods.balanceOf(userAccount).call();
      const balanceInEth = web3.utils.fromWei(balance, "ether");
      
      setDtkBalance(balanceInEth);
      localStorage.setItem(`dtkBalance_${userAccount}`, balanceInEth);
    } catch (error) {
      console.error("Error fetching DTK balance:", error);
    }
  }

  // Handle reward redemption
  const handleRedeem = async () => {
    if (!selectedReward) {
      alert("Please select a reward to redeem.");
      return;
    }

    const rewardCosts = {
      "T-Shirt": 50,
      "Sticker Pack": 30,
      "Discount Coupon": 20,
    };

    const cost = rewardCosts[selectedReward];

    if (parseFloat(dtkBalance) < cost) {
      alert("Not enough DTK to redeem this reward.");
      return;
    }

    setIsLoading(true);
    try {
      await tokenContract.methods.transfer(CONTRACT_ADDRESS, web3.utils.toWei(cost.toString(), "ether")).send({ from: account });
      alert(`Successfully redeemed: ${selectedReward}`);
      setSelectedReward("");
      await fetchDtkBalance(tokenContract, account);
    } catch (error) {
      console.error("Redemption failed:", error);
      alert("Redemption failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fund contract with tokens (admin only)
  const handleFundContract = async () => {
    if (!isOwner) {
      alert("Only the contract owner can fund the contract with tokens.");
      return;
    }

    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      alert("Please enter a valid amount to fund.");
      return;
    }

    setIsLoading(true);
    try {
      // First approve tokens
      await tokenContract.methods.approve(
        CONTRACT_ADDRESS,
        web3.utils.toWei(fundAmount, "ether")
      ).send({ from: account });
      
      // Then fund the contract
      await contract.methods.fundContract(
        web3.utils.toWei(fundAmount, "ether")
      ).send({ from: account });
      
      alert(`Contract funded successfully with ${fundAmount} DTK`);
      setFundAmount("");
      await fetchDtkBalance(tokenContract, account);
    } catch (error) {
      console.error("Funding contract failed:", error);
      alert("Failed to fund contract. See console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to Donate Page
  const navigateToDonate = () => {
    navigate("/donor-donate");
  };

  // Logout Function
const handleLogout = () => {
  try {
    setAccount("");
    setWeb3(null);
    setContract(null);
    setTokenContract(null);
    
    // DON'T clear the donation history data
    // Just clear the UI state
    setDonations([]);
    setTotalDonated("0");
    setDtkBalance("0");
    setSelectedReward("");
    
    navigate("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

  // Refresh donation history and balances
const refreshData = async () => {
  if (contract && tokenContract && account) {
    setLoadingData(true);
    try {
      // Clear localStorage cached donations to force fresh fetch
      localStorage.removeItem(`donations_${account}`);
      
      await fetchTotalDonated(contract, account);
      await fetchDonationHistory(contract, account);
      await fetchDtkBalance(tokenContract, account);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoadingData(false);
    }
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
        <h1 className="text-center">Donor Dashboard</h1>
        <p className="text-center">Track your donations and make new ones.</p>

        {loadingData ? (
          <Spinner animation="border" className="d-block mx-auto" />
        ) : (
          <>
            <div className="d-flex justify-content-center gap-4 my-3">
              <Card className="text-center p-3">
                <h4>Total Donated</h4>
                <h3>{totalDonated} ETH</h3>
              </Card>
              <Card className="text-center p-3">
                <h4>DTK Balance</h4>
                <h3>{dtkBalance} DTK</h3>
              </Card>
            </div>

            {/* Donate Button */}
            <div className="text-center mb-4">
              <Button variant="primary" size="lg" onClick={navigateToDonate}>
                Make a New Donation
              </Button>
              <Button variant="outline-secondary" size="sm" className="ms-2" onClick={refreshData}>
                ↻ Refresh Data
              </Button>
            </div>

            {/* Rewards Redemption */}
            <Card className="p-4 shadow-sm mb-4">
              <h3 className="mb-3">Redeem Rewards</h3>
              <Form.Group>
                <Form.Label>Select a Reward:</Form.Label>
                <Form.Select 
                  onChange={(e) => setSelectedReward(e.target.value)}
                  value={selectedReward}
                >
                  <option value="">-- Select Reward --</option>
                  <option value="T-Shirt">T-Shirt (50 DTK)</option>
                  <option value="Sticker Pack">Sticker Pack (30 DTK)</option>
                  <option value="Discount Coupon">Discount Coupon (20 DTK)</option>
                </Form.Select>
              </Form.Group>
              <Button 
                className="mt-3" 
                variant="success" 
                onClick={handleRedeem}
                disabled={isLoading || !selectedReward}
              >
                {isLoading ? <Spinner animation="border" size="sm" /> : "Redeem"}
              </Button>
            </Card>

            {/* Donation History Table */}
            <h3 className="text-center mt-4">Your Donation History</h3>
            {donations.length > 0 ? (
              <Table striped bordered hover className="mb-5">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Amount (ETH)</th>
                    <th>DTK Reward</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation, index) => (
                    <tr key={index}>
                      <td>{donation.organization}</td>
                      <td>{donation.amount} ETH</td>
                      <td>{parseFloat(donation.amount) * 1000} DTK</td>
                      <td>{donation.timestamp}</td>
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