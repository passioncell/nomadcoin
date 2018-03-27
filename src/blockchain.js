const CryptoJS = require("crypto-js"),
  hexToBinary = require("hex-to-binary");

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSMENT_INTERVAL = 10;

class Block {
  constructor(index, hash, previousHash, timestamp, data, difficulty, nonce) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const genesisBlock = new Block(
  0,
  'b9d40a0cfdb3a57fcf7ae8d521faedadde588ba31d7e428071a98fadd32ac81d', // index + previosHash + timestamp + data
  null,
  1522138741,
  "This is the genesis!!",
  0,
  0
);

let blockchain = [genesisBlock];

const getNewestBlock = () => blockchain[blockchain.length -1];

const getTimestamp = () => Math.round(new Date().getTime() / 1000);

const getBlockchain = () => blockchain;

const createHash = (index, previousHash, timestamp, data, difficulty, nonce) =>
  CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data) + difficulty + nonce).toString();

const createNewBlock = data => {
  const previousBlock = getNewestBlock();
  const newBlockIndex = previousBlock.index + 1;
  const newTimestamp = getTimestamp();
  const difficulty = findDifficulty();

  const newBlock = findBlock(
    newBlockIndex,
    previousBlock.hash,
    newTimestamp,
    data,
    difficulty
  );
  addBlockToChain(newBlock);
  require("./p2p").broadcastNewBlock();
  return newBlock;
};

const findDifficulty = () => {
  const newestBlock = getNewestBlock();
  if(newestBlock.index % DIFFICULTY_ADJUSMENT_INTERVAL === 0 && newestBlock.index !== 0){
    // calculate new difficulty
    return calculateNewDifficulty(newestBlock, getBlockchain());
  } else {
    return newestBlock.difficulty;
  }
};

const calculateNewDifficulty = (newestBlock, blockchain) => {
  const lastCalculatedBlock = blockchain[blockchain.length - DIFFICULTY_ADJUSMENT_INTERVAL];
  const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSMENT_INTERVAL;
  const timeTaken = newestBlock.timestamp - lastCalculatedBlock.timestamp;

  //  예상한 시간보다 블록을 채굴하는데 걸리는시간이 2배넘게 짧다면 난이도 증가.
  if(timeTaken < timeExpected/2){
    return lastCalculatedBlock.difficulty+1;
  }else if(timeTaken > timeExpected*2){ // 채굴이 예상시간보다 2배 더걸리면 난이도 감소.
    return lastCalculatedBlock.difficulty-1;
  }else{
    return lastCalculatedBlock.difficulty;
  }
};

const findBlock = (index, previousHash, timestamp, data, difficulty) => {
  let nonce = 0;
  while(true){
    console.log("Current nonce", nonce);
    const hash = createHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
      nonce
    );

    //to do: check amount of zeros (hashMatchesDifficulty)
    if(hashMatchesDifficulty(hash, difficulty)){
      return new Block(index, hash, previousHash, timestamp, data, difficulty, nonce);
    }
    nonce++;

  }
};

const hashMatchesDifficulty = (hash, difficulty) => {
  const hashInBinary = hexToBinary(hash);
  const requiredZeros = "0".repeat(difficulty);
  // console.log('Trying difficulty:', difficulty, ' with hashInBinary', hashInBinary);
  return hashInBinary.startsWith(requiredZeros);

};

const getBlocksHash = (block) => createHash(block.index, block.previousHash, block.timestamp, block.data, block.difficulty, block.nonce);

const isTimeStampValid = (newBlock, oldBlock) => {
  return (
    oldBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getTimestamp()
  );
};

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
  }else if(!isTimeStampValid(candidateBlock, latestBlock)){
    console.log('The timestamp of this block is dodgy');
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
