const Donation = artifacts.require("Donation");
const DonationToken = artifacts.require("DonationToken");

module.exports = async function (deployer, network, accounts) {
  // 🚀 Deploy the ERC-20 token first
  await deployer.deploy(DonationToken);
  const tokenInstance = await DonationToken.deployed();

  // 🚀 Deploy the Donation contract, passing the token's address
  await deployer.deploy(Donation, tokenInstance.address);
  const donationInstance = await Donation.deployed();

  // 🚀 **Fund the Donation contract with DTK tokens**
  await tokenInstance.transfer(donationInstance.address, web3.utils.toWei("100000", "ether")); // Transfer 100,000 DTK

  // ✅ **Add charity organizations** (Use real addresses from MetaMask)
  await donationInstance.addOrganization("0x5CfE6ef4E8cff3b918224dAC699B20e383370B41");
  await donationInstance.addOrganization("0x8929E3230FebF6545E147957981045b13A2c5b54");
  await donationInstance.addOrganization("0xDAbC4DB9C9c66b2D6de8dFD53036c0f97334903B");

  console.log("🚀 Donation contract deployed at:", donationInstance.address);
  console.log("🚀 Token contract deployed at:", tokenInstance.address);
  console.log("✅ Organizations added successfully!");
};
