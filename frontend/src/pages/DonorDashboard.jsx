import React, { useState, useEffect } from "react";
import Web3 from "web3";
import DonationJSON from "../DonationABI.json";
import DonationTokenJSON from "../DonationTokenABI.json";
import { Container, Table, Alert, Form, Button, Spinner, Card, Row, Col, Badge } from "react-bootstrap";
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

  // Rewards data
  const rewards = [
    { id: "t-shirt", name: "T-Shirt", cost: 50, image: "👕", description: "Limited edition branded T-shirt" },
    { id: "sticker-pack", name: "Sticker Pack", cost: 30, image: "🏷️", description: "Set of 5 exclusive stickers" },
    { id: "discount-coupon", name: "Discount Coupon", cost: 20, image: "🎟️", description: "10% off on your next purchase" }
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
  const handleRedeem = async (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      alert("Invalid reward selection.");
      return;
    }

    if (parseFloat(dtkBalance) < reward.cost) {
      alert(`Not enough DTK to redeem ${reward.name}. You need ${reward.cost} DTK.`);
      return;
    }

    setIsLoading(true);
    setSelectedReward(rewardId);
    
    try {
      await tokenContract.methods.transfer(CONTRACT_ADDRESS, web3.utils.toWei(reward.cost.toString(), "ether")).send({ from: account });
      alert(`Successfully redeemed: ${reward.name}`);
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
      
      <Container fluid className="p-4">
        <Row className="mb-4">
          <Col>
            <h1 className="text-center">Donor Dashboard</h1>
            <p className="text-center text-muted">Track your donations and manage your rewards</p>
          </Col>
        </Row>

        {loadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading your data...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <Row className="mb-4">
              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Body className="text-center">
                    <Card.Title>Total Donations</Card.Title>
                    <h2 className="display-4">{totalDonated} ETH</h2>
                    <p className="text-muted">Thank you for your generosity!</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Body className="text-center">
                    <Card.Title>DTK Balance</Card.Title>
                    <h2 className="display-4">{dtkBalance} DTK</h2>
                    <p className="text-muted">Available for rewards redemption</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Action Buttons */}
            <Row className="mb-4">
              <Col className="text-center">
                <Button variant="primary" size="lg" className="me-2" onClick={navigateToDonate}>
                  Make a New Donation
                </Button>
                <Button variant="outline-secondary" onClick={refreshData}>
                  ↻ Refresh Data
                </Button>
              </Col>
            </Row>

            {/* Rewards Section */}
            <Row className="mb-5">
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className=" bg-primary text-custom">
                    <h3 className="mb-0">Available Rewards</h3>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {rewards.map((reward) => (
                        <Col md={4} key={reward.id} className="mb-3">
                          <Card className={`h-100 ${selectedReward === reward.id ? 'border-primary' : ''}`}>
                            <Card.Body className="text-center">
                              <div className="display-4 mb-2">{reward.image}</div>
                              <Card.Title>{reward.name}</Card.Title>
                              <Badge bg="info" className="mb-2">{reward.cost} DTK</Badge>
                              <Card.Text className="mb-3">{reward.description}</Card.Text>
                              <Button 
                                variant={parseFloat(dtkBalance) >= reward.cost ? "success" : "secondary"}
                                disabled={isLoading || parseFloat(dtkBalance) < reward.cost}
                                onClick={() => handleRedeem(reward.id)}
                                className="w-100"
                              >
                                {isLoading && selectedReward === reward.id ? (
                                  <Spinner animation="border" size="sm" />
                                ) : parseFloat(dtkBalance) >= reward.cost ? (
                                  "Redeem Now"
                                ) : (
                                  "Not Enough DTK"
                                )}
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Donation History */}
            <Row>
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h3 className="mb-0">Donation History</h3>
                  </Card.Header>
                  <Card.Body>
                    {donations.length > 0 ? (
                      <div className="table-responsive">
                        <Table striped bordered hover>
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
                      </div>
                    ) : (
                      <Alert variant="info" className="text-center mb-0">
                        No donations yet. Make your first donation to start earning DTK rewards!
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            
          </>
        )}
      </Container>
    </>
  );
};

export default DonorDashboard;