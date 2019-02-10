var io = require('socket.io')(3939);
var md5 = require("md5");
var fs = require("file-system")


class User {
    constructor(username, password) {
        if (password === undefined) password = "";
        this.username = username;
        this.password = md5(password);
        this.date_created = Date.now()
        this.stars = 0;
        if (typeof users == Array) this.id = users.length;
        else this.id = 0;
        this.online = true;
    }
}

var users = load_users();

function load_users() {
    var dirs = fs.readdirSync("users");
    var arr = [];
    for (var dir of dirs) {
        var temp_user = fs.readFileSync("users/" + dir + "/" + dir + ".json");
        temp_user = JSON.parse(temp_user);

        var user = new User();
        for (var item in temp_user) {
            user[item] = temp_user[item];
        }
        user.online = false;
        arr.push(user);
    }
    console.log("Loaded users, " + arr.length);
    return arr;
}



function get_user(username) {
    for (user of users) {
        if (user.username.toLowerCase() === username.toLowerCase()) return user;
    }
    return false;
}

/**
 * Get a user safely, 
 * @param {*} token Token OR Username 
 * @param {*} password *OPTIONAL, Only if the token is the password! (Hashed or unhashed)
 */
function get_user_safe(token, password) {
    var username = token;
    if (!password) {
        username = token.split("_")[0]
        password = token.split("_")[1]
    }
    for (user of users) {
        if (user.username.toLowerCase() === username.toLowerCase()) {
            if (user.password === password || user.password === md5(password)) {
                return user;
            }
        }
    }
    return false;
}

function save_user(user) {
    // Update cache, most likley not needed!
    /* for(var i = 0; i < user.length; i++){
        if(users[i].username.toLowerCase() === user.username.toLowerCase()){
            users[i] = user;
        }
    } */
    // Save to storage
    fs.writeFileSync("users/" + user.username + "/" + user.username + ".json", JSON.stringify(user));
}

io.on("connection", socket => {

    socket.on("check", username => {
        if(get_user(username)) socket.emit("check", true);
            else socket.emit("check", false);
    })

    socket.on("disconnect", () => {
        for(user of users){
            if(user.socket_id === socket.id){
                user.online = false;
                user.socket_id = "offline";
            }
        }
    })

    socket.on("login", cred => {
        var success = false;
        var err = false;
        var user;
        if (cred.token_login) {
            user = get_user_safe(cred.token);
            if (user) {
                success = true;
            }
        } else {
            // Normal login
            if (!get_user(cred.username)) {
                if (cred.username.replace(/[^A-z0-9_]+/gi, "") !== cred.username) err = "Bad username.";
                else if (cred.username.length > 32) err = "Too long username.";
                else if (cred.username.length < 3) err = "Too short username (< 3)";
                else if(cred.password.length < 6) err = "Password is too short (< 6)";
                else {
                    user = new User(cred.username, cred.password);
                    users.push(user);
                    // Create user folder
                    console.log("Created user " + user.username);
                    fs.writeFileSync("users/" + user.username + "/" + user.username + ".json", JSON.stringify(user));
                    success = true;
                }
            } else {
                if (get_user_safe(cred.username, cred.password)) {
                    user = get_user_safe(cred.username, cred.password);
                    success = true;
                } else {
                    err = "Wrong password.";
                }
            }
        }

        if (err) {
            socket.emit("err", err);
        } else if (success) {
            user.online = true;
            user.socket_id = socket.id;
            socket.emit("logged_in", {
                user: user,
                token: user.username + "_" + user.password
            })
        }
    })




    // End of socket
});