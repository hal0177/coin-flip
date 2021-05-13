// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBase.sol";


contract CoinFlip is VRFConsumerBase {

    event Flipped(address indexed player, bool result, uint256 amount);
    event FulfilledRandom(address indexed player);

    modifier notInProgress(address _player) {
        require(!inProgress[_player], "You already have an ongoing bet.");
        _;
    }

    modifier notZero(uint256 _bet) {
        require(_bet != 0, "Bet amount canno be zero.");
        _;
    }
    
    mapping(address => uint256) public playerBet;
    mapping(bytes32 => address) querySender;
    mapping(address => bool) public inProgress;
    mapping(address => bool) withdrawable;
    mapping(address => uint256) private winAmount;
    uint256 contractBal;

    bytes32 internal keyHash;
    uint256 internal fee;
    
    
    constructor() 
        VRFConsumerBase(
            0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9,
            0xa36085F69e2889c224210F603D836748e7dC0088
        )
    {
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10 ** 18;
    }
    
    function getRandomNumber(uint256 userProvidedSeed)
        public
        returns (bytes32 requestId)
    {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness)
        internal
        override
    {
        address player = querySender[requestId];
        if(randomness % 2 == 1) {
            uint256 maxWin = contractBal > playerBet[player] * 2 ? playerBet[player] * 2 : contractBal;
            winAmount[player] = maxWin;
        }
        else {
            winAmount[player] = 0;
        }
        inProgress[player] = false;
        withdrawable[player] = true;
        emit FulfilledRandom(player);
    }

    function setBet()
        public
        payable
        notInProgress(msg.sender)
        notZero(msg.value)
    {
        playerBet[msg.sender] = msg.value;
        contractBal += msg.value;
    }

    function flipCoin()
        public
        notInProgress(msg.sender)
        notZero(playerBet[msg.sender])
    {
        bytes32 id = getRandomNumber(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))));
        querySender[id] = msg.sender;
        inProgress[msg.sender] = true;
    }

    function withdraw()
        public
        notInProgress(msg.sender)
    {
        require(withdrawable[msg.sender], "Prize not yet ready to withdraw.");
        if(winAmount[msg.sender] != 0) {
            uint256 win = winAmount[msg.sender];
            address payable player = payable(msg.sender);
            player.transfer(win);

            contractBal -= win;
            emit Flipped(msg.sender, true, win);
        }
        else {
            emit Flipped(msg.sender, false, 0);
        }

        withdrawable[msg.sender] = false;
        playerBet[msg.sender] = 0;
        winAmount[msg.sender] = 0;
    }
}
