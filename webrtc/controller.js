// controller(=controller + view in here.)
// - receive action from user, request to model, control display.
 
var controller = {
    //-------------------------------------------
    // PROPERTIES
    //-------------------------------------------
    m_video_num: 0,
    m_video_pos: [],
    MAX_VIDEO: 8,
         
    init: function() {  
         
        controller.m_video_num = 0;
        controller.m_video_pos.clear();
                 
        var half = controller.MAX_VIDEO/2;
         
        for(var i = 0; i < controller.MAX_VIDEO; i++) {
            var pos = {top:0, left:0};
             
            if (i < half) {
                pos.top = 0;
                pos.left = 240*i;
            } else {
                pos.top = 180;
                pos.left = 240*(i-4);
            }   
            controller.m_video_pos.push(pos);
        }
         
        $('join-button').disabled = true;
        $('create-button').disabled = true;
    },
     
    //-------------------------------------------
    // METHODS for user action.
    //-------------------------------------------   
    action_login_out: function() {
        var state = $('login-button').value;
        var name = $('login_name').value;
         
        if (state == "Login") 
        {
            if (name == "") {
                alert("Please input your name.");
                return ;
            }
             
            var online_users = $('online-user-list').childNodes;
         
            for(var i = 0; i < online_users.length; i++) {
                var id = online_users[i].getAttribute('id');
                if (('li-'+name) == id) {
                    alert("Name " + name + " aleady exsit.");
                    return ;
                }
            }
            model.req_login(name);
        } 
        else
        {
            model.req_logout(name);
        }
    },
     
    result_login: function(result, roomlist) {
        if (result == "OK") {
            for(var i = 0; i < roomlist.length; i++) {
                controller.ctrl_add_room(roomlist[i]);
            }
        } else {
            alert("error: " + result);
        }
         
        var name = $('login_name').value;
        controller.ctrl_add_online_user(name);
         
        $('login-button').value = "Logout";
        $('login_name').disabled = true;
         
        $('join-button').disabled = false;
        $('join_room').disabled = false;
         
        $('create-button').disabled = false;
    },
     
    result_logout: function(user) {
        // remove room list.
        var element = $('join_room');
         
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
     
        $('login-button').value = "Login";
        $('login_name').disabled = false;
         
        $('join-button').value = "Join";
         
        $('create-button').disabled = false;
        $('create_room').value = "";
         
        controller.clear_conf();
        controller.ctrl_del_online_user(user);
        controller.on_select_tab("join");
         
        // init again.
        controller.init();
    },
                     
    action_create_room: function() {
        var roomname = $('create_room').value;
         
        if (roomname == "") {
            alert("Please input conference name.");
            return ;
        }
         
        var list = $('join_room').childNodes;
         
        for(var i = 0; i < list.length; i++) {
            if (list[i].value == roomname) {
                alert("room " + roomname + " is aleady exist.");
                return ;
            }
        }
         
        model.req_create_room(roomname);
    },
     
    result_create_room: function(roomname, user) {
        controller.ctrl_add_room(roomname);
         
        $('join-button').disabled = false;
        $('join-button').value = "Leave";
         
        $('create-button').disabled = true;
        $('join_room').disabled = true;
         
        controller.on_select_tab("conference");
    },
     
    // chatting: only has action and event.
    action_send_chatmsg: function(text) {
        model.req_chat(text);
    },  
     
    action_join_or_leave: function() {
        if ($("join-button").value == "Join") 
        {
            var room_name = $('join_room').value;
            if (room_name == "") {
                alert("Please select roomname.");
                return ;
            }
            model.req_join(room_name);
        } 
        else if ($('join-button').value == "Leave") 
        {
            model.req_leave();
        }
    },
     
    result_join: function(userlist) {
        $('join-button').value = "Leave";
        $('create-button').disabled = true;
        $('join_room').disabled = true;
         
        controller.on_select_tab("conference");
    },
     
    result_leave: function(roomname) {
        var party_num = $('participants').childNodes.length;
         
        console.log("roomname: " + roomname + " will be removed.");
        if (party_num == 1) {
            controller.ctrl_del_room(roomname);
        }
        controller.clear_conf();
        controller.on_select_tab('join');
        // init again.
        controller.init();
         
        $('join_room').disabled = false;
        $('join-button').value = "Join";
        $('join-button').disabled = false;
         
        $('create_room').disabled = false;
        $('create-button').disabled = false;
    },
     
    on_select_tab: function(name) {
        var selected = $('li-' + name);
        var children = $('ol-tabs').childNodes;
         
        for (var i in children) {
            var child = children[i];
            child.className = (selected == child ? "current" : null);
        }
        // show selected tap.
        var selected = $('div-' + name);
        var children = $('div-main').childNodes;
         
        for (var i=0; i<children.length; ++i) {
            var child = children[i];
            if (child.nodeType == 1 && child.nodeName.toLowerCase() == "div") {
                child.style.visibility = (selected == child ? "visible": "hidden");
            }
        }
    },
     
    //-------------------------------------------
    // METHODS for event.
    //-------------------------------------------
    event_online_user: function(userlist) {
        for(var i = 0; i < userlist.length; i++) {
            controller.ctrl_add_online_user(userlist[i]);
        }
    },
     
    event_login: function(user) {
        controller.ctrl_add_online_user(user);
    },
     
    event_logout: function(user) {
        controller.ctrl_del_room_user(user);
        controller.ctrl_del_video(user);
        controller.ctrl_del_online_user(user);
    },
     
    event_room_created: function(roomname) {
        controller.ctrl_add_room(roomname);
    },
     
    event_room_removed: function(roomname) {
        controller.ctrl_del_room(roomname);
    },
     
    event_chatmsg: function(sender, text) {
        controller.ctrl_add_chatmsg(sender + ": " + text);
    },
     
    event_add_room_user: function(user, url) {
         
        controller.ctrl_add_room_user(user);
        controller.ctrl_add_video_frame(user);
         
        var video = $('video-webrtc-' + user);
        video.setAttribute('src', url);
    },
     
    event_leave_room: function(user) {
        controller.del_room_user(user);
    },
     
    event_close: function(user) {
        controller.del_room_user(user);
        controller.ctrl_del_online_user(user);
    },
     
    //-------------------------------------------
    // METHODS to use internal.
    //-------------------------------------------
     
    // clear confrence room. remove all videos and participants.
    clear_conf: function() {
         
        var element = $('participants');
         
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
         
        element = $('videos-box');
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        controller.m_video_num = 0;
         
        element = $('chat-history');
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },
     
    del_room_user: function(user) {
        // remove from user-list
        controller.ctrl_del_room_user(user);
        // remove video
        controller.ctrl_del_video(user);
    },
     
    //-------------------------------------------
    // METHODS for each control.
    //-------------------------------------------
     
    // add to online-user list
    ctrl_add_online_user: function(username) {
        var child = document.createElement('li');
         
        child.appendChild(document.createTextNode(username));
        child.setAttribute('id', 'li-'+username);
         
        $('online-user-list').appendChild(child);
    },
     
    // delete from online-user list
    ctrl_del_online_user: function(username) {
        var elem = $('li-' + username);
        if (elem) {
            $('online-user-list').removeChild(elem);
        }
    },
     
    // add to conference room list
    ctrl_add_room: function(roomname) {
        var new_child = document.createElement('option');
        new_child.innerHTML = roomname;
        $('join_room').appendChild(new_child);
    },
     
    // delete from conference room list
    ctrl_del_room: function(roomname) {
        var root = $('join_room');
        var children = $('join_room').childNodes;
             
        for(var i = 0; i < children.length; i++) {
            if (children[i].value == roomname) {
                root.removeChild(children[i]);
                return ;
            }
        }
    },
     
    // add to confrenece chatting list
    ctrl_add_room_user: function(username) {
        var child = document.createElement('li');
         
        child.appendChild(document.createTextNode(username));
        child.setAttribute('id', 'li-'+username);
         
        $('participants').appendChild(child);
    },
     
    // delete from conference chatting list
    ctrl_del_room_user: function(user) {
        var child = $('participants').childNodes;
        var userid = 'li-'+user;
         
        for(var i = 0; i < child.length; i++) {
            if (child[i].getAttribute('id') == userid) {
                $('participants').removeChild(child[i]);
                break;
            }
        }
    },
     
    // add to conference videos-box
    ctrl_add_video_frame: function(user) {
        var id = "user-video-" + user;
         
        if ($(id)) {
            console.log(user + " is aleady added.");
            return; // already added
        }
         
        var child = document.createElement('div');
         
        child.id = id;
        child.style.width = "240px";
        child.style.height = "180px";
        child.style.minWidth = "215px";
        child.style.minHeight = "138px";
        child.style.position = "absolute";
         
        var videoIdx = controller.m_video_num++;
         
        child.style.top = controller.m_video_pos[videoIdx].top+"px";
        child.style.left = controller.m_video_pos[videoIdx].left+"px";
         
        child.style.backgroundColor = "#000000";
        child.style.overflow = "hidden";
         
        $('videos-box').appendChild(child);
         
        var video = document.createElement('video');
          
        video.id = "video-webrtc-" + user;
        video.style.width = "100%";
        video.style.height = "100%";
        video.autoplay = "autoplay";
         
        child.appendChild(video);
    },
     
    // delete from conference video-box
    ctrl_del_video: function(user) {
 
        var elem = $('user-video-' + user);
         
        if (elem) {
            $('videos-box').removeChild(elem);
            controller.m_video_num--;
             
            var children = $('videos-box').childNodes;
            // rearrangement.
            for(var i = 0; i < controller.m_video_num; i++) {
                children[i].style.top = controller.m_video_pos[i].top+"px";
                children[i].style.left = controller.m_video_pos[i].left+"px";
            }
        }
    },
     
    ctrl_add_chatmsg: function(text) {
        var child = document.createElement('li');
        child.appendChild(document.createTextNode(text));
         
        $('chat-history').appendChild(child);
    },
};