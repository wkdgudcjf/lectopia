// model: do background job.
 
var model = {
    //-------------------------------------------
    // PROPERTIES
    //-------------------------------------------
     
    // my name.
    m_myid: null,
    // my room
    m_my_room: null,
    // peer connection
    m_peers: [],
    // stream object
    m_local_stream: null,
    // STUN server address.
    STUN_CONF: "NONE",
     
    init: function() {
        model.m_peers.map_init();
        wsock.init(model.__wsock_open, model.__wsock_close, model.__wsock_notify);
    },
     
    //-----------------------------------------------------------------------
    // WebSocket
    //-----------------------------------------------------------------------
 
    __wsock_open: function() {
        console.log("websocket opened.");
        model.req_online_user();
    },
     
    __wsock_close: function() {
        console.log("websocket closed.");
        controller.event_close();
    },
     
    __wsock_notify: function(message) {
        console.log("msg type: " + message.type);
        switch(message.type)
        {
        case ("RSP"):
            break;
        case ("SDP"):
            model.recv_sdp_msg(message);
            break;
        case ("CHAT"):
            model.recv_chat_msg(message);
            break;
        case ("EVENT"):
            model.recv_event(message);
            break;
        }
    },
    //--------------------------------------------------------------------------------------------------------
     
    recv_sdp_msg: function(message) {
        var pc = model.m_peers.map_get(message.sender);
         
        if (pc == undefined) {
            model.create_peer_conn(message.sender);
            pc = model.m_peers.map_get(message.sender);
            pc.addStream(model.m_local_stream);
        }
         
        pc.processSignalingMessage(message.sdp);
    },
     
    recv_chat_msg: function(response) {
        console.log("model] recv chat message: sender[" + response.sender + "] msg[" + response.msg + "]");
        controller.event_chatmsg(response.sender, response.msg);
    },
     
    recv_event: function(message) {
        switch(message.event)
        {
            case("LOGIN"):
                controller.event_login(message.user);
                break;
            case("LOGOUT"):
                controller.event_logout(message.user);
                break;
            case("LEAVE"):
                controller.event_leave_room(message.user);
                model.delete_peer(message.user);
                break;
            case("ROOM_CREATED"):
                if (model.m_myid) { controller.event_room_created(message.roomname); }
                break;
            case("ROOM_REMOVED"):
                controller.event_room_removed(message.roomname);
                break;
            case("CLOSED"):
                model.delete_peer(message.user);
                controller.event_close(message.user);
                break;  
            default:
                console.log("invalid message event: " + message.event);
                break;
        } 
    },
         
    delete_peer: function(user) {
        var pc = model.m_peers.map_get(user);
        if (pc) {
            // WARN: canary를 사용할 경우 close()를 호출하면 다른 peer connection까지 멈춘다.
            // 그렇다고 종료를 안할수도 없고.. 일단 주석처리 하고 시험하면 모두 멈추는 문제는 없음.
            pc.close();
        }
        model.m_peers.map_del(user);
    },
     
    //-------------------------------------------------------------------------
    // request and result.
    //-------------------------------------------------------------------------
    req_online_user: function() {
        var json = {};
             
        json.type = "REQ";
        json.req = "ONLINE_USER";
        wsock.send(json, model.result_online_user);
    },
     
    result_online_user: function(response) {
        controller.event_online_user(response.userlist);
    },
 
    req_login: function(name) {
        var json = {};
                 
        json.type = "REQ";
        json.req = "LOGIN";
        json.user = name;
        wsock.send(json, model.result_login);
         
        model.m_myid = name;
    },
     
    result_login: function(response) {
        controller.result_login(response.code, response.roomlist);
    },
     
    req_logout: function(name) {
        var json = {};
         
        json.type = "REQ";
        json.req = "LOGOUT";
        if (model.m_my_room) json.roomname = model.m_my_room;
        json.user = name;
        wsock.send(json, model.result_logout);
    },
     
    result_logout: function(response) {
        if (response.code == "OK") {
            // close peer connection
            var keys = model.m_peers.map_keys();
             
            for(var i = 0; i < keys.length; i++) {
                model.delete_peer(keys[i]);
            }
        }
         
        if (model.m_local_stream) {
            model.m_local_stream.stop();
        }
        controller.result_logout(model.m_myid);
    },
     
    req_create_room: function(roomname) {
                 
        // send request
        var json = {};
         
        json.type = "REQ";
        json.req = "MAKE_ROOM";
        json.roomname = roomname;
        json.master = model.m_myid;
         
        model.m_my_room = roomname;
         
        wsock.send(json, model.result_create_room);
    },
     
    result_create_room: function(response) {
        model.get_user_media();
        controller.result_create_room(model.m_my_room, model.m_myid);
    },
 
    req_join: function(room) {
        var json = {};
         
        json.type = "REQ";
        json.req = "JOIN";
        json.roomname = room;
        json.user = model.m_myid;
         
        model.m_my_room = room;
         
        wsock.send(json, model.result_join);
    },
     
    result_join: function(response) {
        if (response.code == "OK") {
            controller.result_join(response.userlist);
             
            model.get_user_media();
            model.start_rtc(response.userlist);
        }
    },
     
    req_leave: function() {
        var json = {};
         
        json.type = "REQ";
        json.req = "LEAVE";
        json.roomname = model.m_my_room;
        json.user = model.m_myid;
             
        wsock.send(json, model.result_leave);
    },
     
    result_leave: function(response) {
        if (response.code == "OK") {
            // close peer connection
            var keys = model.m_peers.map_keys();
             
            for(var i = 0; i < keys.length; i++) {
                model.delete_peer(keys[i]);
            }
        }
         
        controller.result_leave(model.m_my_room);
         
        model.m_my_room = null;
        if (model.m_local_stream) {
            model.m_local_stream.stop();
        }
    },
     
    req_chat: function(text) {
        var json = {};
         
        json.type = "CHAT";
        json.sender = model.m_myid;
        json.roomname = model.m_my_room;
        json.msg = text;
         
        wsock.send(json);
    },  
     
    //-----------------------------------------------------------------------
    // peer connection
    //-----------------------------------------------------------------------
     
    start_rtc: function(userlist) {
         
        for(var i = 0; i < userlist.length; i++) {
            var user = userlist[i];
             
            console.log("user["+i+"]="+user);
            if (user != model.m_myid) {
                model.create_peer_conn(user);
            }   
        }   
    },
     
    create_peer_conn: function(userId) {
        var newpc = null;
         
        try {
            newpc = new webkitDeprecatedPeerConnection(model.STUN_CONF,
                                              function(message) { model.on_signal_msg(userId, message); });
            console.log("Created webkitDeprecatedPeerConnnection with config");
        } catch (e) {
            console.log("Failed to create webkitDeprecatedPeerConnection, exception: " + e.message);
            try {
                newpc = new webkitPeerConnection(model.STUN_CONF,
                                      function(message) { model.on_signal_msg(userId, message); });
                console.log("Created webkitPeerConnnection with config.");
            } catch (e) {
                console.log("Failed to create webkitPeerConnection, exception: " + e.message);
                alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
                return null;
            }
        }
         
        model.m_peers.map_set(userId, newpc);
 
        newpc.onconnecting = function(message) { model.on_session_connecting(userId, message); };
        newpc.onopen = function(message) { model.on_session_opened(userId, message); };
        newpc.onaddstream = function(event) { model.on_remote_stream_added(userId, event.stream); };
        newpc.onremovestream = function(event) { model.on_remote_stream_removed(userId); };
    },
     
    on_signal_msg: function(userId, sdp) {
        var json = {};
         
        json.type = "SDP";
        json.sender = model.m_myid;
        json.receiver = userId;
        json.sdp = sdp;
         
        wsock.send(json);
    },
         
    on_session_connecting: function(userId, message) {
        console.log("sssion connecting... userid: " + userId);
    },
     
    on_session_opened: function(userId, message) {
        console.log("session opend. userid: " + userId);
    },
     
    on_remote_stream_added: function(userId, stream) {
        console.log("webrtc - onaddstream(" + userId + ",...)");
             
        var url = webkitURL.createObjectURL(stream);
  
        controller.event_add_room_user(userId, url);
         
        if (model.m_local_stream != null) {
            model.m_peers.map_get(userId).addStream(model.m_local_stream);
        }
    },
     
    on_remote_stream_removed: function(userId) {
        console.log(userId + " steram is removed.");
    },
     
    //-----------------------------------------------------------------------
    // user media
    //-----------------------------------------------------------------------
     
    get_user_media: function() {
        try {
            navigator.webkitGetUserMedia({video:true, audio:true}, model.on_user_media_success,
                                   model.on_user_media_error);
            console.log("Requested access to local media with new syntax.");
        } catch (e) {
            try {
                navigator.webkitGetUserMedia("video,audio", model.on_user_media_success,
                                             model.on_user_media_error);
                console.log("Requested access to local media with old syntax.");
            } catch (e) {
                console.log("webkitGetUserMedia failed with exception: " + e.message);
            }
        }
    },
     
    on_user_media_success: function(stream) {
        console.log("User has granted access to local media.");
         
        var url = webkitURL.createObjectURL(stream);
         
        model.m_local_stream = stream;
        controller.event_add_room_user(model.m_myid, url);
    },
 
    on_user_media_error: function(error) {
        console.log("Failed to get access to local media. Error code was " + error.code);
    },
};