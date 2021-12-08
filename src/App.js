import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import  MyEpicNFT  from "./utils/MyEpicNFT.json";
import { ethers } from "ethers";
import LoadingOverlay from 'react-loading-overlay';

// Constants
const TWITTER_HANDLE = 'targetconfirmd';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/collection/dessert-nft-v4';
const TOTAL_MINT_COUNT = 100;
const RINKEBY_CHAIN_ID = "0x4";   
const CONTRACT_ADDRESS = "0xf482d1e4ef91a00cEe82177CEA0A2eF58280840C";

const App = () => {


  /* variables. */
  const [currentAccount, setCurrentAccount ] = useState("");
  const [loaderActive, setLoaderActive] = useState(false);
  const [userMessage, setUserMessage ] = useState(null);
  const [supplyMessage, setSupplyMessage] = useState(null);

  const checkTotalMinted = async () => { 
    try { 
      /* get ethereum object. */
      const { ethereum } = window; 

      /* check if ethereum is available. */
      if(!ethereum) {
        console.log(`Error: ethereum not available.`);
        return;
      }

      /* setup provider and connection to contract. */
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, MyEpicNFT.abi, signer);

      /* check how many NFTs minted. */
      let totalSupply = await connectedContract.totalSupply(); 
      setSupplyMessage(`There has been ${totalSupply.toNumber()} of ${TOTAL_MINT_COUNT} NFTs minted so far.`);

    } catch (err) {
      console.log(err);
    }
  }

  /* function to check if wallet is connected. */
  const checkIfWalletIsConnected = async () => {

    try{
      /* get ethereum object. */
      const { ethereum } = window; 

      /* check if ethereum is available. */
      if(!ethereum) {
        console.log(`Error: ethereum not available.`);
        return;
      }

      /* get accounts. */
      let accounts = await ethereum.request({ "method": "eth_accounts"});

      if(accounts.length !== 0) {
        console.log(`Info: List of authorized accounts ${accounts}`);
        setCurrentAccount(accounts[0]);
        setupEventListener();
      }
      else { 
        console.log(`Info: no authorized accounts.`);
      }

      checkTotalMinted(); 

    } catch (err) {
      console.log(err);
    }


  }

  /* function to connect to wallet. */
  const connectWallet = async() => {

    try{

      /* get ethereum object. */
      const { ethereum } = window; 

      /* check if ethereum is available. */
      if(!ethereum) {
        console.log(`Error: ethereum not available.`);
        return;
      }
      /* request ethereum accounts. */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      /* console log the first account. */
      console.log(`The first authorized account is ${accounts[0]}`);
      /* set authorized account. */
      setCurrentAccount(accounts[0]);

      /* setup event listener. */
      setupEventListener();

      checkTotalMinted();

    } catch (err) {
      console.log(err);
    }
  }

  /* mint NFT function. */
  const askContractToMintNft = async() => {

    try{
      /* get ethereum object. */
      const { ethereum } = window; 

      /* set loader. */
      setLoaderActive(true);

      /* reset messages. */
      setUserMessage("");

      /* if ethereum is not available. */
      if(!ethereum) {
        console.log(`Error: ethereum not available.`);
        return;
      } else {

      /* only allow connection on rinkeby chain. */
      let chainId = await ethereum.request({ method: 'eth_chainId' });

      if (chainId !== RINKEBY_CHAIN_ID) {
        setUserMessage(`You are not connected to the Rinkeby Test Network.`);
        return;
      }

      /* setup provider and connection to contract. */
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, MyEpicNFT.abi, signer);

      console.log(`Info: Pop wallet to confirm transaction.`);
      let txn = await connectedContract.makeAnEpicNFT();

      console.log(`Info: Mining transaction.`);
      await txn.wait();

      console.log(`Info: Mined transaction: https://rinkeby.etherscan.io/tx/${txn.hash}`);

      }
    } catch(err) {
      console.log(err);
    } finally {
      setLoaderActive(false);
    }
      
  }

  /* event listener funciton. */
  const setupEventListener = async() => {

    /* get ethereum object. */
    const { ethereum } = window;

    try{
      /* if ethereum object exists. */
      if(ethereum) {
        /* get connection to signed contract.  */
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, MyEpicNFT.abi, signer);
        
        /* listen for mint event. */
        connectedContract.on('NewEpicNFTMinted', (sender, tokenId) => {
          checkTotalMinted();
          console.log(`Info: Event NewEpicNFTMinted ${sender}, ${tokenId}`);
          setUserMessage(`Minted on OpenSea Successfully: <a target="_blank" href="https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}">Click Here</a>`);
        });

      } else { 
        console.log(`ethereum not found.`);
      }
    } catch(err) {
      console.log(err);
    }
  }

  /* view collection btn function. */
  const viewCollection = () => {
    window.open(OPENSEA_LINK, "_blank");
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  return (
    <div className="App">
      <LoadingOverlay
        active={loaderActive}
        spinner
        text='Minting NFT...'
        className="loader-overlay">
        <div className="container">
          <div className="header-container">
            <p className="header gradient-text">My NFT Collection</p>
            <p className="sub-text">
              Each unique. Each beautiful. Discover your NFT today.
            </p>
            {currentAccount === "" 
              ? renderNotConnectedContainer()
              : (
                /** Add askContractToMintNft Action for the onClick event **/
                <div>
                  <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
                    Mint NFT
                  </button>

                  <button onClick={viewCollection} className="cta-button collection-btn connect-wallet-button">
                    View Collection
                  </button>
                </div>
              )
            }

            <p className="sub-text" dangerouslySetInnerHTML={{__html: userMessage}}></p>
            <p className="sub-text" dangerouslySetInnerHTML={{__html: supplyMessage}}></p>
          </div>
      

          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built by @${TWITTER_HANDLE}`}</a>
          </div>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default App;
