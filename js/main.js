var socket = io.connect("nut.livfor.it:2008");
//var socket = io.connect("localhost:2008");
var loc = window.location.href.split("/").pop();
var token = localStorage.getItem("token");

function redir(to) {
    //to+=".html"/* DISABLE FOR RELEASE */
    window.location.href = to;
}

function at(name) {
    if (name == "index" && loc == "") return true;
    if (loc.indexOf(name) != -1) return true;
    return false;
}

function get_tag(title, color){
    var tag = document.createElement("div");
        tag.classList.add("tag");
        tag.innerText = title;
        tag.style.background = color;
    return tag;
}

if (localStorage.getItem("token")) {
    socket.emit("login", {
        token_login: true,
        token: localStorage.getItem("token")
    })
}

if(at("index")){
    document.addEventListener("keypress", e => {
        if(e.keyCode == 13) login();
    })
}

socket.on("connect", () => {
    if (at("index")) {
        document.getElementById("status").innerText = "Connected.";
        document.getElementById("status").style.color = "#60ff4f";
    }
})

function login() {
    var cred = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
        token_login: false
    }
    socket.emit("login", cred);
}

function check() {
    var username_el = document.getElementById("username");
    username_el.value = username_el.value.replace(/[^A-z0-9_]+/gi, "");

    socket.emit("check", username_el.value);
}



socket.on("check", taken => {
    if (taken) document.getElementsByClassName("login-button")[0].innerHTML = "Login <span style='color:rgba(20, 20, 20, 0.411) !important'>/ Signup</span>";
    else document.getElementsByClassName("login-button")[0].innerHTML = "<span style='color:rgba(20, 20, 20, 0.411) !important'>Login</span> / Signup";
})

socket.on("logged_in", info => {
    localStorage.setItem("token", info.token);
    me = info.user;
    if (at("index")) {
        redir("home")
    }
    if(at("home") || at("profile") || at("note")){
        document.getElementById("logged-in-status").innerText = me.username;
    }
})

socket.on("err", err => {
    if(!at("index")) return;
    document.getElementById("status").innerText = err;
    document.getElementById("status").style.color = "#ff4f4f";
})