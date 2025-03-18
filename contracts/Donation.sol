// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Donation {
    address public owner;

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

    constructor() {
        owner = msg.sender;
    }

    function addOrganization(address _organization) public {
        require(msg.sender == owner, "Only owner can add organizations");
        require(!organizations[_organization], "Organization already exists");

        organizations[_organization] = true;
        organizationList.push(_organization); // ✅ Store organization in list
        emit OrganizationAdded(_organization);
    }

    function donate(address _organization) public payable {
        require(msg.value > 0, "Donation must be greater than 0");
        require(organizations[_organization], "Invalid organization");

        donations[msg.sender] += msg.value;
        organizationBalances[_organization] += msg.value;

        // ✅ Store donation record for organization
        donationHistory[_organization].push(DonationRecord(msg.sender, msg.value, block.timestamp));

        emit Donated(msg.sender, _organization, msg.value);
    }

    function withdraw(uint256 amount) public {
        require(organizations[msg.sender], "Only organizations can withdraw");
        require(amount > 0, "Amount must be greater than zero");
        require(organizationBalances[msg.sender] >= amount, "Insufficient balance");

        organizationBalances[msg.sender] -= amount;

        // ✅ Store withdrawal history
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

    // ✅ **New function: Get all registered organizations**
    function getOrganizations() public view returns (address[] memory) {
        return organizationList;
    }

    // ✅ **New function: Get donation history for the logged-in organization**
    function getDonationsForOrganization() public view returns (DonationRecord[] memory) {
        require(organizations[msg.sender], "Only organizations can view their donations");
        return donationHistory[msg.sender];
    }
}
