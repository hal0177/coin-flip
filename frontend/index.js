
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

    const displayWin = async () => {
      const checkEvent = await coinFlip.getPastEvents("Flipped", {filter: {player: user}});
      console.log("e", checkEvent);
      const winStatus = checkEvent[0].returnValues.success;
      console.log(winStatus)
      const winAmount = checkEvent[0].returnValues.amount;

      if(winStatus) {
        $("#display").text(`You won ${web3.utils.fromWei(winAmount)}`);
        console.log("you won", web3.utils.fromWei(winAmount));
      } else {
        $("#display").text(`You lost. Try again!`);
        console.log("you lost");
      }

      loading = false;
    }

    $("#flip").click(async () => {
      var bet = await coinFlip.methods.playerBet(user).call();
      console.log("bet: ", web3.utils.fromWei(bet));
      if(bet !== "0" && !loading) {
        try {
          loading = true;
          await coinFlip.methods.update().send({from: user, value: web3.utils.toWei("0.5", "ether")});
          $("#display").text("Flipping the coin ...");

          const checking = setInterval(async () => {
            console.log("check");
            var inProgress = await coinFlip.methods.checkStatus().call({from: user});
            if(!inProgress) {
              console.log("ready");
              displayWin();
              clearInterval(checking);
            }
          }, 1000);

          
        }
        catch (error) {
          console.log(error.message);
        }
      }
    });
  }

  else console.log("You need to add Metamask!");
});
