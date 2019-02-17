socket.emit("user_list");

socket.on("user_list", list => {
    list_str = "";
    for (user of list) {
        var color = 'rgb(56, 56, 56)';
        var status = "Offline";
        if (user.online) {
            color = "rgb(33, 250, 33)";
            status = user.status;
        }
        var user_str = '<div class="user-tag" onclick="redir(' + "'profile?" + user.username + "'" + ')"><div class="online-status" style="background:' + color + ';"></div> <span class="username">' + sanitizeHTML(user.username) + '</span> <span class="rpc">' + user.status + '</span>  </div>';
        if (user.online) list_str = user_str + list_str
        else list_str += user_str;
    }
    document.getElementById("info-board").innerHTML = list_str;
})