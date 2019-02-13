var socket = io.connect("nut.livfor.it:2008");
//var socket = io.connect("localhost:2008");
var loc = window.location.href.split("/").pop();
var token = localStorage.getItem("token");
var theme = localStorage.getItem("theme");
var palette = [
    "#ef323e",
    "#f4bb41",
    "#41bef4",
    "#b841f4",
    "#f4417f",
    "#424242",
    "#dbdbdb",
    "#00aa16"
];

if (!theme) theme = palette[0];



function redir(to) {
    //to+=".html"/* DISABLE FOR RELEASE */
    window.location.href = to;
}

window.onload = () => {
    apply_theme();
}



function apply_theme() {


    if (at("home") || at("profile")) {
        document.getElementById("home-header").style.background = theme;
        if(at("home")) document.getElementById("extra-options").style.background = pSBC(-.4, theme);
        if (at("profile")) document.getElementById("profile-banner").style.background = theme;  
    }

    if (at("index")) {
        document.getElementsByClassName("login-title")[0].style.color = theme;
        document.getElementsByClassName("login-button")[0].style.color = theme;
    }

    function pSBC(p, from, to) {
        if (typeof (p) != "number" || p < -1 || p > 1 || typeof (from) != "string" || (from[0] != 'r' && from[0] != '#') || (to && typeof (to) != "string")) return null; //ErrorCheck
        if (!this.pSBCr) this.pSBCr = (d) => {
            let l = d.length,
                RGB = {};
            if (l > 9) {
                d = d.split(",");
                if (d.length < 3 || d.length > 4) return null; //ErrorCheck
                RGB[0] = i(d[0].split("(")[1]), RGB[1] = i(d[1]), RGB[2] = i(d[2]), RGB[3] = d[3] ? parseFloat(d[3]) : -1;
            } else {
                if (l == 8 || l == 6 || l < 4) return null; //ErrorCheck
                if (l < 6) d = "#" + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + "" + d[4] : ""); //3 or 4 digit
                d = i(d.slice(1), 16), RGB[0] = d >> 16 & 255, RGB[1] = d >> 8 & 255, RGB[2] = d & 255, RGB[3] = -1;
                if (l == 9 || l == 5) RGB[3] = r((RGB[2] / 255) * 10000) / 10000, RGB[2] = RGB[1], RGB[1] = RGB[0], RGB[0] = d >> 24 & 255;
            }
            return RGB;
        }
        var i = parseInt,
            r = Math.round,
            h = from.length > 9,
            h = typeof (to) == "string" ? to.length > 9 ? true : to == "c" ? !h : false : h,
            b = p < 0,
            p = b ? p * -1 : p,
            to = to && to != "c" ? to : b ? "#000000" : "#FFFFFF",
            f = this.pSBCr(from),
            t = this.pSBCr(to);
        if (!f || !t) return null; //ErrorCheck
        if (h) return "rgb" + (f[3] > -1 || t[3] > -1 ? "a(" : "(") + r((t[0] - f[0]) * p + f[0]) + "," + r((t[1] - f[1]) * p + f[1]) + "," + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? ")" : "," + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3]) + ")");
        else return "#" + (0x100000000 + r((t[0] - f[0]) * p + f[0]) * 0x1000000 + r((t[1] - f[1]) * p + f[1]) * 0x10000 + r((t[2] - f[2]) * p + f[2]) * 0x100 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255)).toString(16).slice(1, f[3] > -1 || t[3] > -1 ? undefined : -2);
    }
}

function at(name) {
    if (name == "index" && loc == "") return true;
    if (loc.indexOf(name) != -1) return true;
    return false;
}

function get_tag(title, color) {
    var tag = document.createElement("div");
    tag.classList.add("tag");
    tag.innerText = title;
    tag.style.background = theme;
    return tag;
}

if (localStorage.getItem("token")) {
    socket.emit("login", {
        token_login: true,
        token: localStorage.getItem("token")
    })
}

if (at("index")) {
    document.addEventListener("keypress", e => {
        if (e.keyCode == 13) login();
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
    if (at("home") || at("profile") || at("note")) {
        document.getElementById("logged-in-status").innerText = me.username;
    }
})

socket.on("err", err => {
    if (!at("index")) return;
    document.getElementById("status").innerText = err;
    document.getElementById("status").style.color = "#ff4f4f";
})