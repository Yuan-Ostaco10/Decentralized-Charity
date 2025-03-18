const Donation = artifacts.require("Donation");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Donation);
  const donationInstance = await Donation.deployed();

  // Add organizations (Replace these with actual MetaMask addresses)
  await donationInstance.addOrganization("0x5CfE6ef4E8cff3b918224dAC699B20e383370B41");
  await donationInstance.addOrganization("0x8929E3230FebF6545E147957981045b13A2c5b54");
  await donationInstance.addOrganization("0xDAbC4DB9C9c66b2D6de8dFD53036c0f97334903B");

  console.log("Organizations added successfully!");
};
