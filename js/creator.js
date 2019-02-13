var canvas_bg = document.getElementById("canvas-background");
var ctx;
const WIDTH = 256;
const HEIGHT = 192;
const SCALE = 3;
var frame = -1;
var pen = 1;
var color = 0;
var pen_size = 1;
var ghost = 1;
var do_ghost = true;
var playing = false;
var play_interval;
var speed;
var upload_open = false;
var uploading = false;
var copy_canvas = 0;
var loaded_note;
var load_index = 0;

var canvas_arr = []

var note = {
    content: [],
    palette: [
        "black",
        "white",
        /*         "#f44242", */
        "#fc3232",
        "#ff5d00",
        "#f4bb41",
        "#61f441",
        "#3c8e0f",
        "#41bef4",
        "#2f2fd8",
        "#b841f4",
        "#f4417f",
        "#9b9b9b"
    ]
}


var mouse = {
    down: false,
    x: 0,
    y: 0,
    last_pos: {
        x: 0,
        y: 0
    }
}

load_elements();
set_color(0);
toggle_brush();
new_frame(true);
update_speed(true);
load_locally_note();


function copy() {
    copy_canvas = canvas_arr[frame];
}

function paste() {
    new_frame();
    ctx.drawImage(copy_canvas, 0, 0);
}

function validate(el) {
    el.value = el.value.replace(/[^A-z0-9_]+/gi, "");
}

function toggle_brush() {
    pen_size = ((pen_size) % 5) + 1;
    document.getElementById("brush").style.transform = "scale(" + (1 / (6 - pen_size)) + ")";
}

function toggle_ghost() {
    ghost = (ghost + 1) % 4;
    shift_frame(0)
    document.getElementById("ghost-img").src = "img/icons/ghost_" + ghost + ".png";
}

function update_speed(dont_save) {
    speed = Math.round((1 / document.getElementById("fps").value) * 1000);
    if (!dont_save) save_note();
}

function play() {
    if (playing) {
        playing = false;
        document.getElementById("play-image").src = "img/icons/play.png";
        clearInterval(play_interval);
        do_ghost = true;
        shift_frame(0);
    } else {
        do_ghost = false;
        document.getElementById("play-image").src = "img/icons/pause.png";
        play_interval = setInterval(() => {
            shift_frame(1);
        }, speed);
        playing = true;
    }
}

function clear_note(ask) {
    if (ask || confirm("WAIT! Are you sure you want to delete this flip note? This will the entire animation!")) {
        while (canvas_arr.length > 1) delete_frame();
        delete_frame();
        document.getElementById("upload-input").value = "";
        document.getElementById("fps").value = 12;
        save_note();
    }
}

function delete_frame() {
    if (canvas_arr.length == 1) {
        new_frame();
        shift_frame(1);
        delete_frame();
        return;
    }
    note.content.splice(frame, 1);
    canvas_arr[frame].remove();
    canvas_arr.splice(frame, 1);
    shift_frame(-1);
    save_note();
}

function new_frame(dont_save) {
    note.content.splice(frame + 1, 0, new Array());
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", WIDTH);
    canvas.setAttribute("height", HEIGHT);

    canvas_arr.splice(frame + 1, 0, canvas);

    document.getElementById("canvas-hold").appendChild(canvas);
    shift_frame(1);
    if (!dont_save) save_note();
}

function shift_frame(direction) {
    for (c of canvas_arr) c.style.visibility = "hidden";
    frame += direction;
    frame = frame % note.content.length;
    if (frame < 0) frame = note.content.length - 1;
    document.getElementById("frame-status").innerHTML = (frame + 1) + " / " + note.content.length;
    canvas_arr[frame].style.visibility = "visible";
    canvas_arr[frame].style.opacity = "1";
    var frames_down = 1;
    while (frame - frames_down >= 0 && frames_down <= ghost && do_ghost) {
        canvas_arr[frame - frames_down].style.visibility = "visible"
        canvas_arr[frame - frames_down].style.opacity = ".5";
        frames_down++;
    }
    ctx = canvas_arr[frame].getContext("2d");
    ctx.imageSmoothingEnabled = false;
}


function set_color(index) {
    for (var i = 0; i < document.getElementsByClassName("color").length; i++) {
        if (i != index) document.getElementsByClassName("color")[i].style.outlineWidth = "0px";
        else document.getElementsByClassName("color")[i].style.outlineWidth = "5px";
    }
    color = index;
}

function load_elements() {
    for (i = 0; i < note.palette.length; i++) {
        document.getElementById("colors").innerHTML += '<div class="color" style="background:' + note.palette[i] + ';" id="' + i + '" onclick="set_color(this.id)"></div>';
    }
}

canvas_bg.addEventListener("mousemove", e => {
    var rect = canvas_bg.getBoundingClientRect();
    mouse.last_pos = {
        x: mouse.x,
        y: mouse.y
    };
    mouse.x = Math.round((e.clientX - rect.left) / 3);
    mouse.y = Math.round((e.clientY - rect.top) / 3);
    if (mouse.down) draw();
})



function upload() {
    if (uploading) return;
    if (document.getElementById("save-popup").style.transform == "scale(1)") document.getElementById("save-popup").style.transform = "scale(0)";
    else document.getElementById("save-popup").style.transform = "scale(1)";
}

function save_note() {
    var flipnote = {
        title: document.getElementById("upload-input").value,
        fps: Number(document.getElementById("fps").value),
        content: []
    }
    for (c of canvas_arr) {
        flipnote.content.push(c.toDataURL());
    }
    save_locally(flipnote);
}

function save_locally(n) {
    localStorage.setItem("note", JSON.stringify(n));
}

function load_next() {
    var temp_img = document.createElement("img");
    temp_img.src = loaded_note.content[load_index];
    temp_img.onload = () => {
        if (load_index > 0) new_frame(true);
        canvas_arr[load_index].getContext("2d").drawImage(temp_img, 0, 0);
        load_index++;
        if (load_index < loaded_note.content.length) load_next();
    }
}


function load_locally_note() {
    loaded_note = localStorage.getItem("note");
    if (loaded_note) {
        loaded_note = JSON.parse(loaded_note)
        document.getElementById("fps").value = loaded_note.fps;
        update_speed(true);
        document.getElementById("upload-input").value = loaded_note.title;

        load_next();
    }
}

function upload_to_server() {
    if (!socket.connected) upload_message("error.Can't connect to server, please try again.");
    else {
        var flipnote = {
            title: document.getElementById("upload-input").value,
            fps: Number(document.getElementById("fps").value),
            content: []
        }

        for (c of canvas_arr) {
            flipnote.content.push(c.toDataURL());
        }

        socket.emit("upload", {
            token: token,
            flipnote: flipnote
        })
    }
}

socket.on("err", e => upload_message(e));


/** Display message inside the upload box.
 * @param {String} message - Should be formated as: type.message (ex. "warn.This is a warning!"") 
 */
function upload_message(message) {
    var type = message.substr(0, message.indexOf("."));
    var message = message.substr(message.indexOf(".") + 1);

    var color = "#69ff5b";
    var uploaded = false;
    if (type == "warn") color = "#ffc85b";
    else if (type == "error") color = "#fc4655";
    else {
        clear_note(true);
        redir("profile?"+me.username);
    }

    var el = document.getElementById("status");
    el.style.color = color;
    el.innerHTML = message;
}

document.addEventListener("click", e => {
    if (uploading) return;
    var found = false;
    for (el of e.path) {
        if (el.id == "save-popup" || el.id == "upload") {
            found = true;
        }
    }
    if (!found) document.getElementById("save-popup").style.transform = "scale(0)";

})


canvas_bg.addEventListener("mousedown", e => {
    mouse.down = true;
    draw();
})

canvas_bg.addEventListener("mouseup", e => {
    mouse.down = false;
})
canvas_bg.addEventListener("mouseleave", e => {
    mouse.down = false;
})

document.addEventListener("keyup", e => {
    // Prevents spacebar from triggering selected buttons
    if (e.keyCode == 32) e.preventDefault();
})

function dont_shortcut() {
    if (document.activeElement.nodeName == "INPUT") return true;
    return false;
}


document.addEventListener("keypress", e => {
    if (dont_shortcut()) return;
    switch (e.keyCode) {
        case 32:
            play()
            break;
        case 110:
            new_frame();
            break;
        case 99:
            copy();
            break;
        case 118:
            paste();
            break;
    }
})

window.onkeydown = function () {
    if (dont_shortcut()) return;
    var key = event.keyCode || event.charCode;
    if (key == 8 || key == 46) {
        delete_frame();
    } else if (key == 37) {
        shift_frame(-1);
    } else if (key == 39) {
        shift_frame(1);
    }
};

function draw() {
    for (i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.strokeStyle = note.palette[color];
        ctx.lineWidth = pen_size;
        ctx.moveTo(mouse.last_pos.x, mouse.last_pos.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
    }
    save_note()
}

function get_distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}


function render() {
    //render_ghost();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var content = note.content[frame];
    for (var i = 0; i < content.length; i++) {
        if (content[i]) {
            ctx.fillStyle = note.palette[content[i].color];
            ctx.fillRect(content[i].x * SCALE, content[i].y * SCALE, SCALE, SCALE);
        }
    }
}