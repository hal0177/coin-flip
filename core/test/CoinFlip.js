
const CoinFlip = artifacts.require("CoinFlip");


contract("CoinFlip", async accounts => {

  const player = accounts[1];

  it("accepts a bet of 1 ETH", async () => {
    const coinFlip = await CoinFlip.new();
    await coinFlip.setBet({from: player, value: web3.utils.toWei("1", "ether")});
    const bet = web3.utils.fromWei(await coinFlip.bet(player));
    assert.equal(bet, "1");
  });

  it("flipping the coin results in a random outcome", async () => {
    const coinFlip = await CoinFlip.new();
    await coinFlip.setBet({from: player, value: web3.utils.toWei("1", "ether")});
    const result = await coinFlip.flipCoin.call();
    assert.equal(typeof result, "boolean");
  });
});
    
