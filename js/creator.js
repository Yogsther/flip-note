var canvas_bg = document.getElementById("canvas-background");
var ctx;
const WIDTH = 256;
const HEIGHT = 192;
const SCALE = 3;
var frame = -1;
var pen = 0;
var color = 0;
var pen_size = 3;
var ghost = true;
var playing = false;
var play_interval;
var speed;

var canvas_arr = []

var note = {
    content: [],
    palette: [
        "#f44242",
        "#f4bb41",
        "#61f441",
        "#41bef4",
        "#b841f4",
        "#f4417f",
        "white",
        "black"
    ]
}

var mouse = {
    down: false,
    x: 0,
    y: 0
}

load_elements();
update_speed();
set_color(0);
new_frame();

function toggle_ghost(){
    ghost = !ghost;
}

function update_speed(){
    speed = Math.round((1 / document.getElementById("fps").value)*1000);
}

function play(){
    if(playing){
        playing = false;
        clearInterval(play_interval);
        ghost = true;
    } else {
        ghost = false;
        play_interval = setInterval(() => {
            shift_frame(1);
        }, speed);
        playing = true;
    }
}

function delete_frame() {
    if (note.content.length == 1) return;
    note.content.splice(frame, 1);
    canvas_arr[frame].remove();
    canvas_arr.splice(frame, 1);
    shift_frame(-1);
}

function new_frame() {
    note.content.splice(frame + 1, 0, new Array());
    document.getElementById("frame-status").innerHTML = "Frame: " + (frame + 1) + " / " + note.content.length;
    var canvas = document.createElement("canvas");
        canvas.setAttribute("width", WIDTH*SCALE);
        canvas.setAttribute("height", HEIGHT*SCALE);
    
    canvas_arr.splice(frame + 1, 0, canvas);

    document.getElementById("canvas-hold").appendChild(canvas);
    shift_frame(1);
}

function shift_frame(direction) {
    for(c of canvas_arr) c.style.visibility = "hidden";
    frame += direction;
    frame = frame % note.content.length;
    if (frame < 0) frame = note.content.length - 1;
    document.getElementById("frame-status").innerHTML = "Frame: " + (frame + 1) + " / " + note.content.length;
    canvas_arr[frame].style.visibility = "visible";
    canvas_arr[frame].style.opacity = "1";
    if(frame > 0 && ghost){
        canvas_arr[frame-1].style.visibility = "visible"
        canvas_arr[frame-1].style.opacity = ".5";
    }
    ctx = canvas_arr[frame].getContext("2d");
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
    mouse.x = Math.round((e.clientX - rect.left) / 3);
    mouse.y = Math.round((e.clientY - rect.top) / 3);
    if (mouse.down) draw();
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


function draw() {
    for (i = 0; i < WIDTH * HEIGHT; i++) {
        var x = i % WIDTH;
        var y = (i - x) / WIDTH;
        if (get_distance(x, mouse.x, y, mouse.y) < pen_size) {
            draw_to(x, y);
        }
    }

}

/* function render_ghost() {
    g_ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (frame > 0) {
        var content = note.content[frame-1];
        for (var i = 0; i < content.length; i++) {
            if (content[i]) {
                g_ctx.fillStyle = note.palette[content[i].color];
                g_ctx.fillRect(content[i].x * SCALE, content[i].y * SCALE, SCALE, SCALE);
            }
        }
    }
} */

function get_distance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

function draw_to(x, y) {
    note.content[frame].push({
        x: x,
        y: y,
        color: color
    });
    render_over(x, y);
}

function render_over(x, y) {
    ctx.fillStyle = note.palette[color];
    ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
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