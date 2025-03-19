// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DonationToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 1 billion tokens with 18 decimals

    constructor() ERC20("Donation Token", "DTK") {
        _mint(msg.sender, 1000000 * 10**18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _mint(to, amount);
    }

    function mintForDonation(address donor, uint256 amount) external {
        require(msg.sender == owner() || isApprovedDonationContract(msg.sender), 
                "Only owner or approved donation contracts can mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");

        _mint(donor, amount);
    }

    // 🔹 New burn function to allow token burning
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // 🔹 Approved Donation Contracts
    mapping(address => bool) private approvedDonationContracts;

    function setDonationContract(address contractAddress, bool approved) external onlyOwner {
        approvedDonationContracts[contractAddress] = approved;
    }

    function isApprovedDonationContract(address contractAddress) public view returns (bool) {
        return approvedDonationContracts[contractAddress];
    }
}
