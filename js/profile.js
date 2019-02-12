var username = loc.split("?")[1];
var follow_button = document.getElementById("follow-button");
var following = false;
socket.emit("get_profile", username);
get_feed("user_page");

socket.on("profile", profile => {
    document.getElementById("title-username").innerText = profile.username;
    document.getElementById("more-info").innerText = profile.notes + " notes, " + profile.followers + " followers, " + profile.stars + " stars"
    username = profile.username;
    if(me.following.indexOf(username) != -1) following = true;
    if(following){
        follow_button.style.color = "rgb(218, 30, 71)";
        follow_button.style.background = "white";
        follow_button.innerText = "FOLLOWING"
    }   
    if(profile.username == me.username){
        document.getElementById("logged-in-status").innerText = "Logout";
        document.getElementById("logged-in-status").setAttribute("onclick", "logout()")
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
        follow_button.style.color = "rgb(218, 30, 71)";
        follow_button.style.background = "white";
        follow_button.innerText = "FOLLOWING"
    }
    following = !following;
}