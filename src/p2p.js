const WebSockets = require("ws"),
  Blockchain = require('./blockchain');

const { getLastBlock } = Blockchain;

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

  // 소켓이 서버에게(ALL?) 자신의 가장최신의 블록 데이터를 전송
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
  ws.on("message", data => {
    const message = parseData(data);
    if(message === null){
      return;
    }
    console.log(message);
    switch (message.type){
      case GET_LATEST:
        sendMessage(ws, getLastBlock());
        break;
    }
  });
};

const sendMessage = (ws, message) => ws.send(JSON.stringify(message));

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
