
const CoinFlip = artifacts.require("CoinFlip");

module.exports = deployer => {
  deployer.deploy(CoinFlip);
}
