#!/usr/bin/env node
 
var WebSocketServer = require('websocket').server;
var http = require('http');
var roomMgr = require('./roommgr.js');
 
require('./common.js');
 
var connArr = [];
var userArr = [];
var keyUserArr = [];
 
// connection이 생성되면서 값이 추가된다.
// {key:request_key, value:conn object}
connArr.map_init();
// {key:user_id, value:conn object}
userArr.map_init();
// {key:reuqest.key, value:userId}
keyUserArr.map_init();
 
var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
 
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});
 
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}
 
//----------------------------------------------------------------------
// functions for request.
//----------------------------------------------------------------------
 
function procReqOnlineUser(key, recvMsg) {
    var sendMsg = {};
     
    if (recvMsg.msg_id) {
        sendMsg.msg_id = recvMsg.msg_id;
    }
    sendMsg.type = "RSP";               
    sendMsg.code = "OK";
    sendMsg.userlist = userArr.map_keys();
    sendResponse(key, sendMsg);
}
     
function procReqLogin(key, recvMsg) {
    var sendMsg = {};
     
    if (recvMsg.msg_id) {
        sendMsg.msg_id = recvMsg.msg_id;
    }
    // to sender
    sendMsg.type = "RSP";
    sendMsg.code = "OK";
    sendMsg.roomlist = roomMgr.getRoomNameList();
    sendResponse(key, sendMsg);
     
    // to others..
    sendMsg = {};
    sendMsg.type = "EVENT";
    sendMsg.event = "LOGIN";
    sendMsg.user = recvMsg.user;
                         
    broadcastToOthers(key, sendMsg);
                 
    userArr.map_set(recvMsg.user, connArr.map_get(key));
    keyUserArr.map_set(key, recvMsg.user);
}   
 
function procReqLogout(key, recvMsg) {
    var sendMsg = {};
     
    if (recvMsg.msg_id) {
        sendMsg.msg_id = recvMsg.msg_id;
    }
    // to sender
    sendMsg.type = "RSP";
    sendMsg.code = "OK";
    sendResponse(key, sendMsg);
     
    var isRoomRemoved = false;
    // remove from room
     
    if ("roomanme" in recvMsg) {
        isRoomRemoved = roomMgr.leave(recvMsg.roomname, recvMsg.user);
    }
     
    // to others..
    sendMsg = {};
    sendMsg.type = "EVENT";
    sendMsg.event = "LOGOUT";
    sendMsg.user = recvMsg.user;
     
    broadcastToOthers(key, sendMsg);
     
    if (isRoomRemoved) {
        sendMsg = {};
        sendMsg.type = "EVENT";
        sendMsg.event = "ROOM_REMOVED";
        sendMsg.roomname = recvMsg.roomname;
         
        broadcastToOthers(key, sendMsg);
    }
     
    userArr.map_del(recvMsg.user);
    keyUserArr.map_del(key);
}
 
function procReqMakeRoom(key, recvMsg) {
    var sendMsg = {};
     
    if (recvMsg.msg_id) {
        sendMsg.msg_id = recvMsg.msg_id;
    }
    // to room maker
    sendMsg.type = "RSP";
    sendMsg.code = "OK";
    sendResponse(key, sendMsg);
    // make a room.
    roomMgr.createRoom(recvMsg.roomname, recvMsg.master);
     
    // to others..
    sendMsg = {};
                         
    sendMsg.type = "EVENT";
    sendMsg.event = "ROOM_CREATED";
    sendMsg.roomname = recvMsg.roomname;
                         
    broadcastToOthers(key, sendMsg);
}
 
function procReqJoin(key, recvMsg) {
    var sendMsg= {};
     
    if (recvMsg.msg_id) {
        sendMsg.msg_id = recvMsg.msg_id;
    }
    sendMsg.type = "RSP";
    sendMsg.code = "OK";
     
    roomMgr.join(recvMsg.roomname, recvMsg.user);
    sendMsg.userlist = roomMgr.getUserListByRoom(recvMsg.roomname);
    // client간 peer connection을 맺으면서 서로 대화상대로 추가할 것이므로
    // broadcasting할 필요는 없다.
    sendResponse(key, sendMsg);
}
 
function procReqLeave(key, recvMsg) {
    var sendMsg = {};
     
    if (recvMsg.msg_id) {
        sendMsg.msg_id = recvMsg.msg_id;
    }
    // to sender
    sendMsg.type = "RSP";
    sendMsg.code = "OK";
    sendResponse(key, sendMsg);
                         
    // remove from a room
    var isRoomRemoved = roomMgr.leave(recvMsg.roomname, recvMsg.user);
                         
    // to others..
    sendMsg = {};
    sendMsg.type = "EVENT";
    sendMsg.event = "LEAVE";
    sendMsg.user = recvMsg.user;
                     
    broadcastToRoom(recvMsg.roomname, sendMsg);
     
    if (isRoomRemoved) {
        sendMsg = {};
        sendMsg.type = "EVENT";
        sendMsg.event = "ROOM_REMOVED";
        sendMsg.roomname = recvMsg.roomname;
         
        broadcastToOthers(key, sendMsg);
    }
}
 
//----------------------------------------------------------------------
// functions for sending message.
//----------------------------------------------------------------------
 
// send a message to users in the room.
function broadcastToRoom(roomname, jsonObj) {
    var userlist = roomMgr.getUserListByRoom(roomname);
     
    if (userlist == null) {
        console.log("Nobody in " + roomname);
        return ;
    }
     
    var msg = JSON.stringify(jsonObj);
     
    for(var i = 0; i < userlist.length; i++) {
        var user = userlist[i];
        var conn = userArr[user];
         
        console.log("sending message: " + msg);
        conn.sendUTF(msg);
    }
}
// send a message to everybody except sender.
function broadcastToOthers(senderKey, jsonObj) {
    var keys = connArr.map_keys();
    var msg = JSON.stringify(jsonObj);
     
    for(var i = 0; i < keys.length; i++) {
        if (keys[i] != senderKey) {
            var conn = connArr.map_get(keys[i]);
            conn.sendUTF(msg);
        }
    }
}
// send a message only to sender
function sendResponse(key, jsonObj) {
    var conn = connArr[key];
    var msg = JSON.stringify(jsonObj);
    console.log("sending message: " + msg);
    conn.sendUTF(msg);
}
// send a message to specific user.
function sendToPeer(peerId, jsonObj) {
    var msg = JSON.stringify(jsonObj);
    console.log("sending message: " + msg);
    var conn = userArr[peerId];
    conn.sendUTF(msg);
}
 
//----------------------------------------------------------------------
// MAIN procedure
//----------------------------------------------------------------------
 
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
 
    var connection = request.accept(null, request.origin);
 
    console.log((new Date()) + ' Connection accepted.');
    // save client connection
    connArr.map_set(request.key, connection);
     
    // receive a message
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
 
            var recvMsg = JSON.parse(message.utf8Data);
            var type = recvMsg.type;
             
            if (type != "SDP") {
                console.log('Received Message: ' + message.utf8Data);
            }
             
            switch(type)
            {
                case ("REQ"):           
                    var req = recvMsg.req;
                    switch(req) 
                    {
                        case("ONLINE_USER"):
                            procReqOnlineUser(request.key, recvMsg);
                            break;
                        case("LOGIN"):
                            procReqLogin(request.key, recvMsg);
                            break;
                        case("LOGOUT"):
                            procReqLogout(request.key, recvMsg);
                            break;
                        case("MAKE_ROOM"):
                            procReqMakeRoom(request.key, recvMsg);
                            break;
                        case("JOIN"):
                            procReqJoin(request.key, recvMsg);
                            break;
                        case("LEAVE"):
                            procReqLeave(request.key, recvMsg);
                            break;
                        default:
                            console.log("Unknown request [" + req + "]");
                            break;
                    }
                    break;
                     
                case ("CHAT"):
                    broadcastToRoom(recvMsg.roomname, recvMsg);
                    break;
                 
                case ("SDP"):
                    sendToPeer(recvMsg.receiver, recvMsg);
                    break;
                     
                default:
                    console.log("invalid type: " + type);
                    break;
            }   
        }
        else if (message.type === 'binary') 
        {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
 
    // connection closed
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
         
        var user = keyUserArr.map_get(request.key);
         
        if (user == null) {
            console.log("aleady removed.");
        } else {
         
            var roomname = roomMgr.getRoomNameByUser(user);
         
            var sendMsg = {};
            sendMsg.type = "EVENT";
            sendMsg.event = "CLOSED";
            sendMsg.user = user;
         
            roomMgr.leave(roomname, user);
            broadcastToOthers(request.key, sendMsg);
        }
         
        userArr.map_del(user);
        connArr.map_del(request.key);
        keyUserArr.map_del(request.key);
    });
});