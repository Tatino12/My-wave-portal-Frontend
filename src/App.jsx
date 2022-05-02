import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from './utils/WavePortal.json';

 
const App = () => {

  //Just a state variable we use to store our user's public wallet.
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);

   const [tweetValue, setTweetValue] = React.useState("");
  
  //Create a variable here that holds the contract address after you deploy
  const contractAddress = "0x95c6659413cb7D174A98937dF3a1aBD71842D89E";

  //Create a variable here that references the abi content
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });
  
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account) 
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  //Implement your connectWallet method here
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  //llamamos a la funcion waves desde nuestra web
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //You're using contractABI here
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

      //Execute the actual wave from your smart contract
        
         
        const waveTxn = await wavePortalContract.wave(tweetValue,{gasLimit:300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined --", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  //Create a method that gets all waves from your contract
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);//nos conectamos con el proveedor, 
        const signer = provider.getSigner();// obtenemos el firmante
         const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer); //y nos conectamos al contrato!
       
        //Call the getAllWaves method from your Smart Contract
        const waves = await wavePortalContract.getAllWaves();
        
        //We only need address, timestamp, and message in our UI so let's pick those out
       const wavesCleaned = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });
        
      //Store our data in React State
      setAllWaves(wavesCleaned);
      
      } else {
      console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    } 
  };
  //Listen in for emitter events!
  useEffect(() => {
  let wavePortalContract;

  const onNewWave = (from, timestamp, message) => { //Aquí, puedo "escuchar" cuando mi contrato lanza el NewWave evento. Como un webhook, También puedo acceder a esos datos en ese evento como message y from.
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [ //lo que significa que el mensaje del usuario se agregará automáticamente a mi allWaves matriz cuando recibamos el evento y nuestra interfaz de usuario se actualizará.

      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  };

  if (window.ethereum) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    wavePortalContract.on("NewWave", onNewWave);
  }

  return () => {
    if (wavePortalContract) {
      wavePortalContract.off("NewWave", onNewWave);
    }
  };
}, []);
  
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  
  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        👋 Hi everybody 🌎 !
        </div>

        <div className="bio">
        I am Mariano Huecke and I am a Full Stack Web Developer from Argentina 🇦🇷 !
        Connect your Ethereum wallet <img src="https://img.icons8.com/color/48/000000/metamask-logo.png" style={{maxWidth: "6%"}}/> and wave at me! 
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {!currentAccount && (
      <button className="waveButton" onClick={connectWallet}>
        Connect Wallet
      </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={index} className="allWaves">
              <div style={{color: "Pink"}}>Address: {wave.address}</div>
              <div style={{color: "White"}}>Time: {wave.timestamp.toString()}</div>
              <div style={{color: "Red"}}>Message: {wave.message}</div>
            </div>)
        })}

        {currentAccount ? (<textarea name="tweetArea" style={{ backgroundColor: "White", marginTop: "16px", padding: "8px", marginBottom: "10px", fontSize: "20px" }}
            placeholder="Type your tweet..."
            type="text"
            id="tweet"
            value={tweetValue}              
            onChange={e => setTweetValue(e.target.value)} />) : null
        }
      </div>
    </div>
  );
}

export default App