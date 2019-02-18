var username = loc.split("?")[1];
var follow_button = document.getElementById("follow-button");
var following = false;
socket.emit("get_profile", username);
get_feed("user_page");

socket.on("profile", profile => {
    document.getElementById("title-username").innerText = profile.username;
    if(!profile.suspended) document.getElementById("more-info").innerText = profile.notes + " notes, " + profile.followers + " followers, " + profile.stars + " stars"
    else document.getElementById("more-info").innerText = "User suspended"
    username = profile.username;
    if(me.following.indexOf(username) != -1) following = true;
    if(following){
        follow_button.style.color = theme;
        follow_button.style.background = "white";
        follow_button.innerText = "FOLLOWING"
    }   
    document.title = username + " | Flip Note";

    if(profile.online){
        document.getElementById("online-status").title = "User is online";
        document.getElementById("online-status").style.background = "#68f442";
    } 
    
    document.getElementById("rpc").innerText = profile.status;

    if(profile.username == me.username){
        document.getElementById("logged-in-status").innerText = "Logout";
        document.getElementById("logged-in-status").setAttribute("onclick", "logout()")
        follow_button.style.color = "rgba(255,255,255,.6)";
        follow_button.style.borderColor  = "rgba(255,255,255,.6)";
    }
})

function logout(){
    localStorage.setItem("token", "");
    redir("index");
}

function follow(){
    if(username == me.username) return;
    socket.emit("follow", {
        username: username,
        token: token
    });

    if(following){
        follow_button.style.color = "white";
        follow_button.style.background = "rgba(0,0,0,0)";
        follow_button.innerText = "FOLLOW"
    } else {
        follow_button.style.color = theme;
        follow_button.style.background = "white";
        follow_button.innerText = "FOLLOWING"
    }
    following = !following;
}