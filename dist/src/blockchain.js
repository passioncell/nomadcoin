"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CryptoJS = require("crypto-js");

var Block = function Block(index, hash, previousHash, timestamp, data) {
  _classCallCheck(this, Block);

  this.index = index;
  this.hash = hash;
  this.previousHash = previousHash;
  this.timestamp = timestamp;
  this.data = data;
};

var genesisBlock = new Block(0, 'b9d40a0cfdb3a57fcf7ae8d521faedadde588ba31d7e428071a98fadd32ac81d', // index + previosHash + timestamp + data
null, 1520838250756, "This is the genesis!!");

var blockchain = [genesisBlock];

var getLastBlock = function getLastBlock() {
  return blockchain[blockchain.length - 1];
};

var getTimestamp = function getTimestamp() {
  return new Date().getTime() / 1000;
};

var getBlockChain = function getBlockChain() {
  return blockchain;
};

var createHash = function createHash(index, previousHash, timestamp, data) {
  return CryptoJS.SHA256(index + previousHash + timestamp + JSON.stringify(data)).toString();
};

var createNewBlock = function createNewBlock(data) {
  var previousBlock = getLastBlock();
  var newBlockIndex = previousBlock.index + 1;
  var newTimestamp = getTimestamp();
  var newHash = createHash(newBlockIndex, previousBlock.hash, newTimestamp, data);

  var newBlock = new Block(newBlockIndex, newHash, previousBlock.hash, newTimestamp, data);

  return newBlock;
};

var getBlocksHash = function getBlocksHash(block) {
  return createHash(block.index, block.previousHash, block.timestamp, block.data);
};

var isNewBlockValid = function isNewBlockValid(candidateBlock, latestBlock) {
  if (!isNewStructureValid(candidateBlock)) {
    console.log('The candidate block structure is not valid');
  } else if (latestBlock.index + 1 !== candidateBlock.index) {
    console.log('The candidate block doesnt have a valid index');
    return false;
  } else if (latestBlock.hash !== candidateBlock.previousHash) {
    console.log('The previousHash of the candidate block is not the hash of the latest block');
    return false;
  } else if (getBlocksHash(candidateBlock) !== candidateBlock.hash) {
    console.log('The hash of this block is invalid');
    return false;
  }

  return true;
};

var isNewStructureValid = function isNewStructureValid(block) {
  return typeof block.index === 'number' && typeof block.hash === 'string' && typeof block.previousHash === 'string' && typeof block.timestamp === 'number' && typeof block.data === 'string';
};

var isChainValid = function isChainValid(candidateChain) {
  var isGenesisValid = function isGenesisValid(block) {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
  };

  if (!isGenesisValid(candidateChain[0])) {
    console.log("The candidate's genesisBlock is not the same as our genesisBlock");
    return false;
  }

  for (var i = 1; i < candidateChain.length; i++) {
    if (!isNewBlockValid(candidateChain[i], candidateChain[i - 1])) {
      return false;
    }
  }

  return true;
};

var replaceChain = function replaceChain(candidateChain) {
  if (isChainValid(candidateChain) && candidateChain.length > getBlockChain().length) {
    blockchain = candidateChain;
    return true;
  } else {
    return false;
  }
};

var addBlockToChain = function addBlockToChain(candidateBlock) {
  if (isNewBlockValid(candidateBlock, getLastBlock())) {
    getBlockChain().push(candidateBlock);
    return true;
  } else {
    return false;
  }
};