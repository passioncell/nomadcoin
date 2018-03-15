const CryptoJS = require("crypto-js");

class Block {
  constructor(index, hash, previousHash, timestamp, data) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

const genesisBlock = new Block(
  0,
  'b9d40a0cfdb3a57fcf7ae8d521faedadde588ba31d7e428071a98fadd32ac81d', // index + previosHash + timestamp + data
  null,
  1520838250756,
  "This is the genesis!!"
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length -1];

const getTimestamp = () => new Date().getTime() / 1000;

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();

const createNewBlock = data => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const newHash = createHash(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data);

  const newBlock = new Block(
    newBlockIndex,
    newHash,
    previousBlock.hash,
    newTimestamp,
    data
  );
  addBlockToChain(newBlock);
  require("./p2p").broadcastNewBlock();
  return newBlock;
};

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isBlockValid = (candidateBlock, latestBlock) => {
  if(!isBlockStructureValid(candidateBlock)){
    console.log('The candidate block structure is not valid');
  }else if(latestBlock.index + 1 !== candidateBlock.index){
    console.log('The candidate block doesnt have a valid index');
    return false;
  }else if(latestBlock.hash !== candidateBlock.previousHash){
    console.log('The previousHash of the candidate block is not the hash of the latest block');
    return false;
  }else if(getBlocksHash(candidateBlock) !== candidateBlock.hash){
    console.log('The hash of this block is invalid');
    return false;
  }

  return true;
};

const isBlockStructureValid = (block) => {
  return (
    typeof block.index === 'number' && typeof block.hash === 'string'
    && typeof block.previousHash === 'string' && typeof block.timestamp ==='number'
    && typeof block.data === 'string'
  );
};


const isChainValid = (candidateChain) => {
  const isGenesisValid = (block) => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock)
  };

  if(!isGenesisValid(candidateChain[0])){
    console.log("The candidate's genesisBlock is not the same as our genesisBlock");
    return false;
  }

  for(let i=1; i<candidateChain.length; i++){
    if(!isBlockValid(candidateChain[i], candidateChain[i-1])){
      return false;
    }
  }

  return true;
};

const replaceChain = (candidateChain) => {
  if(isChainValid(candidateChain) && candidateChain.length > getBlockchain().length){
    blockchain = candidateChain;
    return true;
  }else {
    return false;
  }
};

const addBlockToChain = (candidateBlock) => {
  if(isBlockValid(candidateBlock, getNewestBlock())){
    getBlockchain().push(candidateBlock);
    return true;
  } else {
    return false;
  }
};

module.exports = {
  getNewestBlock,
  getBlockchain,
  createNewBlock,
  isBlockStructureValid,
  addBlockToChain,
  replaceChain,
};
