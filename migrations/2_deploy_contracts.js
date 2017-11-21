var Inventory = artifacts.require("./Inventory.sol");

module.exports = function(deployer) {
  deployer.deploy(Inventory);
};
