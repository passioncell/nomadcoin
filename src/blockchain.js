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

const getLastBlock = () => blockchain[blockchain.length -1];

const getTimestamp = () => new Date().getTime() / 1000;

const getBlockChain = () => blockchain;

const createHash = (index, previousHash, timestamp, data) =>
  CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();

const createNewBlock = data => {
  const previousBlock = getLastBlock();
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
  return newBlock;
};

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data);

const isNewBlockValid = (candidateBlock, latestBlock) => {
  if(!isNewStructureValid(candidateBlock)){
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

const isNewStructureValid = (block) => {
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
    if(!isNewBlockValid(candidateChain[i], candidateChain[i-1])){
      return false;
    }
  }

  return true;
};

const replaceChain = (candidateChain) => {
  if(isChainValid(candidateChain) && candidateChain.length > getBlockChain().length){
    blockchain = candidateChain;
    return true;
  }else {
    return false;
  }
};

const addBlockToChain = (candidateBlock) => {
  if(isNewBlockValid(candidateBlock, getLastBlock())){
    getBlockChain().push(candidateBlock);
    return true;
  } else {
    return false;
  }
};

module.exports = {
  getLastBlock,
  getBlockChain,
  createNewBlock
};
