// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./DonationToken.sol";

contract Donation {
    address public owner;
    DonationToken public token;

    struct WithdrawalRecord {
        uint256 amount;
        uint256 timestamp;
    }

    struct DonationRecord {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => uint256) public donations;
    mapping(address => uint256) public organizationBalances;
    mapping(address => bool) public organizations;
    mapping(address => WithdrawalRecord[]) private withdrawalHistory;
    mapping(address => DonationRecord[]) private donationHistory;
    address[] private organizationList;

    event Donated(address indexed donor, address indexed organization, uint256 amount);
    event Withdrawn(address indexed organization, uint256 amount, uint256 timestamp);
    event OrganizationAdded(address indexed organization);
    event Rewarded(address indexed donor, uint256 tokenAmount);

    constructor(address _tokenAddress) {
        owner = msg.sender;
        token = DonationToken(_tokenAddress);
    }

    function addOrganization(address _organization) public {
        require(msg.sender == owner, "Only owner can add organizations");
        require(!organizations[_organization], "Organization already exists");

        organizations[_organization] = true;
        organizationList.push(_organization);
        emit OrganizationAdded(_organization);
    }

    function donate(address _organization) public payable {
    require(msg.value > 0, "Donation must be greater than 0");
    require(organizations[_organization], "Invalid organization");

    donations[msg.sender] += msg.value;
    organizationBalances[_organization] += msg.value;
    donationHistory[_organization].push(DonationRecord(msg.sender, msg.value, block.timestamp));

    emit Donated(msg.sender, _organization, msg.value);

    // 🔹 Correct ETH to DTK conversion (1 DTK per 0.001 ETH)
    uint256 rewardAmount = (msg.value * 1000 * 10**18) / 1 ether; 

    // 🔹 Mint tokens directly to donor (ensuring decimals match)
    try token.mintForDonation(msg.sender, rewardAmount) {
        emit Rewarded(msg.sender, rewardAmount);
    } catch {
        // 🔹 Fallback: If minting fails, transfer existing tokens
        if (token.balanceOf(address(this)) >= rewardAmount) {
            token.transfer(msg.sender, rewardAmount);
            emit Rewarded(msg.sender, rewardAmount);
        }
    }
}


    function withdraw(uint256 amount) public {
        require(organizations[msg.sender], "Only organizations can withdraw");
        require(amount > 0, "Amount must be greater than zero");
        require(organizationBalances[msg.sender] >= amount, "Insufficient balance");

        organizationBalances[msg.sender] -= amount;
        withdrawalHistory[msg.sender].push(WithdrawalRecord(amount, block.timestamp));

        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    function getBalance(address _organization) public view returns (uint256) {
        return organizationBalances[_organization];
    }

    function isOrganization(address _user) public view returns (bool) {
        return organizations[_user];
    }

    function getTotalDonations(address _donor) public view returns (uint256) {
        return donations[_donor];
    }

    function getWithdrawalHistory() public view returns (WithdrawalRecord[] memory) {
        require(organizations[msg.sender], "Only organizations can view their withdrawals");
        return withdrawalHistory[msg.sender];
    }

    function getOrganizations() public view returns (address[] memory) {
        return organizationList;
    }

    function getDonationsForOrganization() public view returns (DonationRecord[] memory) {
        require(organizations[msg.sender], "Only organizations can view their donations");
        return donationHistory[msg.sender];
    }

    // Owner can still fund contract with DTK tokens if needed
    function fundContract(uint256 amount) public {
        require(msg.sender == owner, "Only owner can fund contract");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");

        token.transferFrom(msg.sender, address(this), amount);
    }
    
    // Initialize the token contract to allow this contract to mint tokens
    function setupTokenPermissions() external {
        require(msg.sender == owner, "Only owner can setup permissions");
        token.setDonationContract(address(this), true);
    }
}