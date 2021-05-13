pragma solidity >= 0.5.0 < 0.6.0;

import "./usingProvable.sol";


contract CoinFlip is usingProvable {
    
    event Flipped(address indexed player, bool success, uint256 amount);

    uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
    uint256 public betFunds;
    
    // Current bet from the player
    mapping(address => uint256) public playerBet;
    
    // The sender of the query.
    mapping(bytes32 => address payable) public querySender;
    
    // The last request from the player.
    mapping(address => bytes32) public playerId;
    
    // Set to true when the query is made, set to false when result is returned.
    mapping(address => bool) public inProgress;
    
    // Random true or false.
    mapping(address => bool) public randomResult;


    function setBet() public payable {
        require(msg.value != 0, "Cannot bet zero.");
        playerBet[msg.sender] += msg.value;
    }


    // Player "flips the coin" and makes a random number query.
    function update() payable public {
        require(msg.value >= 0.5 ether, "Not enough gas.");
        uint256 QUERY_EXECUTION_DELAY = 0;
        uint256 GAS_FOR_CALLBACK = 200000;
        bytes32 queryId = provable_newRandomDSQuery(
            QUERY_EXECUTION_DELAY,
            NUM_RANDOM_BYTES_REQUESTED,
            GAS_FOR_CALLBACK
        );
        playerId[msg.sender] = queryId;
        querySender[queryId] = msg.sender;
        inProgress[msg.sender] = true;
    }

    
    // Called by the frontend until it returns false when the query is resolved.
    function checkStatus() public view returns(bool status) {
        return inProgress[msg.sender];
    }
    
    
    // Random number gets set, calls sendWin.
    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
        require(msg.sender == provable_cbAddress());

        uint256 randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;
        bool result = randomNumber == 1;
        
        address payable player = querySender[_queryId];
        randomResult[player] = result;
        _sendWin(player);
    }
    
    
    // Check the random boolean and either sends the prize, or doesn't.
    function _sendWin(address payable player) private {
        require(playerBet[player] != 0, "No bet placed.");
        uint256 maxWin = betFunds > playerBet[player] * 2 ? playerBet[player] * 2 : betFunds;

        if(randomResult[player]) {
            player.transfer(maxWin);
            betFunds -= maxWin;
            emit Flipped(player, true, maxWin);
        }
        else {
            emit Flipped(player, false, 0);
        }

        inProgress[player] = false;
        playerBet[player] = 0;
    }
    
    
    // Deployer can send funds that can be won.
    function fundPool() public payable {
        require(msg.value != 0, "Cannot send zero.");
        betFunds += msg.value;
    }
}