
var user, loading;

$(async () => {
  if(window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    [ user ] = await web3.eth.requestAccounts();
    const coinFlip = new web3.eth.Contract(ABI, Address);

    const currentBet = await coinFlip.methods.playerBet(user).call();
    $("#display").text(`Current Bet: ${web3.utils.fromWei(currentBet)}`);


    $("#bet").click(async () => {
      var amount = $("#amount").val();
      if(amount && amount > 0 && !loading) {
        try {
          loading = true;
          await coinFlip.methods.setBet().send({from: user, value: web3.utils.toWei(String(amount), "ether")});
          const bet = await coinFlip.methods.playerBet(user).call();
          $("#display").text(`Current Bet: ${web3.utils.fromWei(bet)}`);
          $("#amount").val("");
        }
        catch (error) {
          console.log(error);
        }

        loading = false;
      }
    });


    $("#withdraw").click(async () => {
      if(withdrawable && !loading) {

        coinFlip.once("Flipped", {filter: {player: user}}, (err, event) => {
          console.log("flipped event", event);
          if(event.returnValues.result) {
            $("#display").text(`You won ${web3.utils.fromWei(event.returnValues.amount)}!`);
            console.log("you won", web3.utils.fromWei(event.returnValues.amount));
          }
          else {
            $("#display").text(`You lost. Try again!`);
            console.log("you lost");
          }
          loading = false;
          withdrawable = false;
        });
        
        try {
          loading = true;
          $("#display").text("Loading result ...");
          await coinFlip.methods.withdraw().send({from: user});
        }
        catch (error) {
          console.log(error);
        }
      }
    });


    $("#flip").click(async () => {
      var bet = await coinFlip.methods.playerBet(user).call();
      console.log("bet: ", web3.utils.fromWei(bet));
      if(bet !== "0" && !loading) {
        $("#display").text("Flipping the coin ...");

        coinFlip.once("FulfilledRandom", {filter: {player: user}}, () => {
          $("#display").text("Withdraw to see if you won!");
          withdrawable = true;
          loading = false;
        });

        try {
          loading = true;
          await coinFlip.methods.flipCoin().send({from: user});
        }
        catch (error) {
          console.log(error.message);
        }
      }
    });
  }

  else console.log("You need to add Metamask!");
});
