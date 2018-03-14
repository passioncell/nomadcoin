const WebSockets = require("ws"),
  Blockchain = require('./blockchain');

const { getLastBlock, isBlockStructureValid } = Blockchain;

/*
  P2P 네트워크 이기때문에 각 소켓이 서버이자 클라이언트.
  따라서 코딩을할때 서버와 클라이언트가 둘다 지원되야한다.
 */

const sockets = [];

// Message Types
const GET_LATEST = "GET_LATEST";
const GET_ALL = "GET_ALL";
const BLOCKCHAIN_RESPONSE = "BLOCKCHAIN_RESPONSE";

// Message Creators
const getLatest = () => {
  return {
    type: GET_LATEST,
    data: null
  }
};

const getAll = () => {
  return {
    type: GET_ALL,
    data: null
  }
};

const blockchainResponse = data => {
  return {
    type: BLOCKCHAIN_RESPONSE,
    data: data
  }
};

const getSockets = () => sockets;

const startP2PServer = (server) => {
  // server is HTTP Server
  const wsServer = new WebSockets.Server({server});

  // 새로운 소켓이 소켓서버에 연결됬을시 실행.
  wsServer.on("connection", (ws) => {
    console.log(`new socket connected. - ${ws}`);
    //소켓 초기화 및 소켓리스트에 추가
    initSocketConnection(ws);
  });

  console.log('Nomadcoin P2P Server Running!');
};

const initSocketConnection = (ws) => {
  sockets.push(ws);
  handleSocketMessage(ws);
  handleSocketError(ws);

  sendMessage(ws, getLatest());
};

// 메세지 관리법
const parseData = data => {
  try{
    return JSON.parse(data);
  }catch(e){
    console.error(e);
    return null;
  }
};

const handleSocketMessage = ws => {
  // onmessage -> 서버로부터 데이터 수신하기
  ws.on("message", data => {
    const message = parseData(data);
    if(message === null){
      return;
    }
    console.log(message);
    switch (message.type){
      case GET_LATEST:
        // 모든 소켓에게 메세지를 보낸다.
        sendMessage(ws, responseLatest());
        break;
      case BLOCKCHAIN_RESPONSE:
        const receivedBlocks = message.data;
        if(receivedBlocks === null){
          break;
        }
        handleBlockchainResponse(receivedBlocks);
        break;

    }
  });
};

const handleBlockchainResponse = receivedBlocks => {
  if(receivedBlocks.length === 0){
    console.log("Received blocks have a length of 0");
    return;
  }
  const latestBlockReceived = receivedBlocks[receivedBlocks.length-1];
  if(!isBlockStructureValid(latestBlockReceived)){
    console.log("The block structure of the block received is not valid");
    return;
  }
};

// socket.send() -> 서버에 데이터 전송하기
const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

const responseLatest = () => blockchainResponse([getLastBlock()]);

// 에러 관리법
const handleSocketError = ws => {
  const closeSocketConnection = ws => {
    ws.close();
    sockets.splice(sockets.indexOf(ws), 1);
  };
  ws.on("close", () => closeSocketConnection(ws));
  ws.on("error", () => closeSocketConnection(ws));
};

const connectToPeers = (newPeer) => {
  const ws = new WebSockets(newPeer);
  ws.on("open", () => {
    initSocketConnection(ws);
  });
};


module.exports = {
  startP2PServer,
  connectToPeers
};
