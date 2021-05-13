
const CoinFlip = artifacts.require("CoinFlip");

module.exports = async (deployer, network, accounts) => {
  const contract = await deployer.deploy(CoinFlip);

  try {
    await contract.methods.fundPool().send({from: accounts[0], value: web3.utils.toWei("10", "ether")});
  }
  catch (error) {
    console.log(error);
  }

  // try {
  //   const bal = await web3.eth.getBalance(result.address);
  //   console.log("Contract Funds: ", web3.utils.fromWei(bal));
  // }
  // catch (error) {
  //   console.log(error);
  // }
}
