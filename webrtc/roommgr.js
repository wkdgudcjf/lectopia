#!/usr/bin/env node
 
require('./common.js');
 
// key=roomname, value=room object
var roomList = [];
roomList.map_init();
 
function Room(name, master) {
    this.m_name = name;
    this.m_users = new Array();
    this.m_users.push(master);
}
 
Room.prototype.addUser = function(userId) {
    this.m_users.push(userId);
}
 
Room.prototype.delUser = function(userId) {
    this.m_users.splice(this.m_users.indexOf(userId),1);
}
 
Room.prototype.getUserList = function() {
    return this.m_users;
}
 
// External API
module.exports = {
    createRoom: function(roomname, master) {
        var newRoom = new Room(roomname, master);
         
        console.log("user number: " + newRoom.getUserList().length);
         
        roomList.map_set(roomname, newRoom);
        console.log("New room [" + roomname + "] was created..roomnum: "+roomList.map_keys().length);
    },
     
    join: function(roomname, user) {
        if (roomList.map_get(roomname)) {
            roomList.map_get(roomname).addUser(user);
        }
    },
     
    leave: function(roomname, user) {
        var room = roomList.map_get(roomname);
        if (room) {
            room.delUser(user);
            if (room.getUserList().length == 0) {
                roomList.map_del(roomname);
                return true;
            }
        }
        return false;
    },
     
    getRoomNameList: function() {
        return roomList.map_keys();
    },
     
    getUserListByRoom: function(roomname) {
        if (roomList.map_get(roomname) != null) {
            return roomList.map_get(roomname).getUserList();
        } else {
            return null;
        }
    },
     
    getRoomNameByUser: function(user) {
        var keys = roomList.map_keys();
         
        for(var i = 0; i < keys.length; i++) {
            var list = roomList[keys[i]].getUserList();
            if (list.indexOf(user) != -1) {
                return keys[i];
            }
        }
        return null;
    },
};