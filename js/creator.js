var canvas_bg = document.getElementById("canvas-background");
var ctx;
const WIDTH = 256;
const HEIGHT = 192;
const SCALE = 3;
var frame = -1;
var pen = 1;
var color = 0;
var pen_size = 0;
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
var dotted_brush_size = 2;
var audio;
var note_loaded = false;

var canvas_arr = []
var undo_history = [];

var note = {
    audio: false,
    content: [],
    palette: [
        "rgba(0, 0, 0, 255)",
        "rgba(155, 155, 155, 255)",
        "rgba(255, 255, 255, 255)",
        "rgba(252, 50, 50, 255)",
        "rgba(255, 93, 0, 255)",
        "rgba(244, 187, 65, 255)",
        "rgba(97, 244, 65, 255)",
        "rgba(60, 142, 15, 255)",
        "rgba(65, 190, 244, 255)",
        "rgba(47, 47, 216, 255)",
        "rgba(184, 65, 244, 255)",
        "rgba(244, 65, 127, 255)",
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
        if (audio) {
            audio.pause();
        }
    } else {
        if (audio) {
            try{
                audio.currentTime = (audio.duration / canvas_arr.length) * frame; // Set audio time to current frame
            } catch(e){
                shift_frame(-frame);
            }
            audio.play();
            audio.loop = true;
        }
        do_ghost = false;
        document.getElementById("play-image").src = "img/icons/pause.png";
        play_interval = setInterval(() => {
            shift_frame(1);
        }, speed);
        playing = true;
    }
}

var bucket = false;

function toggle_bucket() {
    bucket = !bucket;
    if (bucket) document.getElementById("paint_bucket").children[0].style.fill = theme;
    else document.getElementById("paint_bucket").children[0].style.fill = "white";
}

var dotted_brush = false;

function toggle_dotted_brush() {
    dotted_brush = !dotted_brush;
    if (dotted_brush) document.getElementById("dotted_brush").children[0].style.fill = theme;
    else document.getElementById("dotted_brush").children[0].style.fill = "white";
}

function clear_note(ask) {
    if (ask || confirm("WAIT! Are you sure you want to delete this flip note? This will delete the entire animation!")) {
        
        note.content = [];
        for(i = 0; i < canvas_arr.length; i++){
            canvas_arr[i].remove();
        }
        canvas_arr = [];
        frame = 0;
        new_frame();
        document.getElementById("upload-input").value = "";
        document.getElementById("fps").value = 12;
        audio = false;
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

function shift_frame(direction, play_sound) {
    frame += direction;
    frame = frame % note.content.length;

    if (play_sound && audio) {
        audio.currentTime = (audio.duration / canvas_arr.length) * (frame); // Play from current frame
        audio.play();
        setTimeout(() => {
            audio.pause();
        }, (audio.duration / canvas_arr.length) * 1000);
    }
    
    if(frame == 0 && audio){
        audio.currentTime = 0;
    }

    undo_history = [];
    for (c of canvas_arr) c.style.visibility = "hidden";
    
    
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





var undo_img_load;

function undo() {
    if (undo_history.length > 0) {
        undo_img_load = new Image();
        undo_img_load.src = undo_history[undo_history.length - 1];
        undo_img_load.onload = () => {
            ctx.clearRect(0, 0, WIDTH, HEIGHT);
            ctx.drawImage(undo_img_load, 0, 0);
            undo_history.splice(undo_history.length - 1, 1);
        }
    }
    save_note();
}

function remove_transparent_parts() {
    var data = ctx.getImageData(0, 0, canvas_arr[0].width, canvas_arr[0].height);
    for (i = 3; i < data.data.length; i += 4) {
        if (data.data[i] !== 0 && data.data[i] < 255) data.data[i] = 0;
    }
    ctx.putImageData(data, 0, 0);
    save_note();
}

function remove_white_pixels() {
    var data = ctx.getImageData(0, 0, WIDTH, HEIGHT);
    for (i = 0; i < data.data.length; i += 4) {
        if (data.data[i] == 255 && data.data[i + 1] == 255 && data.data[i + 2] == 255 /*  && data.data[i+3] == 255 */ ) data.data[i + 3] = 0;
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.putImageData(data, 0, 0);
}


function frame_to_data() {
    note_loaded = true;
    var data = ctx.getImageData(0, 0, canvas_arr[0].width, canvas_arr[0].height).data;
    var rgb_data = [];
    for (i = 0; i < data.length; i += 4) {
        rgb_data.push("rgba(" + data[i] + ", " + data[i + 1] + ", " + data[i + 2] + ", " + data[i + 3] + ")");
    }
    return rgb_data;
}

function coordinates_to_index(x, y) {
    return x + (canvas_arr[0].width * y);
}


/**
 * Fill function
 * Colors the neightbouring area of the same color.
 * Right-click action.
 */
function fill() {

    if (dotted_brush) {
        for (i = 0; i < WIDTH * HEIGHT; i++) {
            var coords = index_to_coordinates(i);
            if (coords.x % dotted_brush_size == 0 && coords.y % dotted_brush_size == 0) {

                ctx.fillStyle = note.palette[color];
                ctx.fillRect(coords.x, coords.y, 1, 1);

            }

        }
        return;
    }


    // Get origin variables
    var origin = {
        x: Math.floor(mouse.x),
        y: Math.floor(mouse.y)
    };
    var painting = frame_to_data();
    var replace_color = note.palette[color]; // Color to replace all connecting origin colors with
    var origin_color = painting[coordinates_to_index(origin.x, origin.y)] // Origin color clicked on

    ctx.fillStyle = replace_color;
    ctx.fillRect(origin.x, origin.y, 1, 1);

    // Don't fill if the two colors are the same, no reason to do so. Possibly a missclick from the user that would create an endless loop.
    if (origin_color == replace_color) return;
    // Set the origin block to the replacement color.
    painting[coordinates_to_index(origin.x, origin.y)] = replace_color;

    // Create a worker array with all blocks who could possibly neighbour a replacement block.
    var workers = new Array();
    // Push the initial origin block to check all neighbours.
    workers.push({
        x: origin.x,
        y: origin.y
    }); // Push the first block

    // Loop through until the fill action is completed, aka all the workers are done.
    while (workers.length > 0) {

        // Check the first worker in line
        checkWorker(workers[0]);
    }

    save_note();

    /* setInterval((e) => {
        if(workers.length > 0) checkWorker(workers[0]);
    }, 0) */

    function checkWorker(worker) {
        var items = [];
        // Check all neighbouring blocks to the item (worker).
        items.push({
            x: worker.x + 1,
            y: worker.y
        }); // Left 
        items.push({
            x: worker.x - 1,
            y: worker.y
        }); // Right
        items.push({
            x: worker.x,
            y: worker.y + 1
        }); // Bottom
        items.push({
            x: worker.x,
            y: worker.y - 1
        }); // Top
        items.forEach(item => {
            // Go through each item and check if it has the matching origin color, if that's the case - change it's color and put it into the worker array to check all it's neightbouring blocks. 
            if (item.x <= canvas_arr[0].width - 1 && item.y <= canvas_arr[0].height - 1) {

                var color = painting[coordinates_to_index(item.x, item.y)]
                if (color == origin_color) {
                    //painting[coordinatesToIndex(item.x, item.y)] = replace_color; // Replaced a block
                    ctx.fillStyle = replace_color;
                    ctx.fillRect(item.x, item.y, 1, 1);
                    painting[coordinates_to_index(item.x, item.y)] = replace_color;
                    workers.push(item); // Push that block to see if it has any neighbours for replacement.
                }
            }
        })
        workers.splice(0, 1); // Remove the first worker.
    }
}



function upload() {
    if (uploading) return;
    if (document.getElementById("save-popup").style.transform == "scale(1)") document.getElementById("save-popup").style.transform = "scale(0)";
    else document.getElementById("save-popup").style.transform = "scale(1)";
    document.getElementsByClassName("upload-button")[0].style.background = theme;
}

function save_note() {
    if(!note_loaded) return;
    var flipnote = {
        title: document.getElementById("upload-input").value,
        fps: Number(document.getElementById("fps").value),
        content: [],
        audio: note.audio
    }
    for (c of canvas_arr) {
        flipnote.content.push(c.toDataURL());
    }
    save_locally(flipnote);

    /* Make sure hours or minutes that are < 10 are displayed with an extra zero infront! */
    function check_zeros(str) {
        if (str < 10) str = "0" + str;
        return str;
    }

    var date = new Date();
    var hours = check_zeros(date.getHours());
    var minutes = check_zeros(date.getMinutes());
    document.getElementById("save-satus").innerHTML = "Last save " + hours + ":" + minutes;

}



function load_next() {
    var temp_img = document.createElement("img");
    temp_img.src = loaded_note.content[load_index];
    temp_img.onload = () => {
        if (load_index > 0) new_frame(true);
        canvas_arr[load_index].getContext("2d").drawImage(temp_img, 0, 0);
        load_index++;
        if (load_index < loaded_note.content.length) load_next();
        else frame_to_data();
    }
}


function load_locally_note() {
    loaded_note = localStorage.getItem("note");
    if (loaded_note) {
        loaded_note = JSON.parse(loaded_note)
        note.audio = loaded_note.audio;
        audio = new Audio(loaded_note.audio);
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
            content: [],
            private: document.getElementById("check-private").checked,
            audio: note.audio
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
        redir("profile?" + me.username);
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


function save_history() {
    undo_history.push(canvas_arr[frame].toDataURL());
}

function mouse_down(e) {
    mouse.down = true;
    save_history();
    draw();
    var rect = canvas_bg.getBoundingClientRect();
    mouse.last_pos = {
        x: mouse.x,
        y: mouse.y
    };
    mouse.x = Math.round((e.clientX - rect.left) / 3);
    mouse.y = Math.round((e.clientY - rect.top) / 3);
}

function draw_move(e) {
    var rect = canvas_bg.getBoundingClientRect();
    mouse.last_pos = {
        x: mouse.x,
        y: mouse.y
    };
    if (e.touches) {
        mouse.x = Math.round((e.touches[0].clientX - rect.left) / 3);
        mouse.y = Math.round((e.touches[0].clientY - rect.top) / 3);
    } else {
        mouse.x = Math.round((e.clientX - rect.left) / 3);
        mouse.y = Math.round((e.clientY - rect.top) / 3);
    }

    if (mouse.down && mouse.last_pos.x) {
        draw();
    }
}

function mouse_up() {
    mouse.down = false;
    mouse.last_pos = {
        x: undefined,
        y: undefined
    }
    remove_white_pixels();
    save_note();
}

canvas_bg.addEventListener("mousemove", e => {
    draw_move(e)
})
canvas_bg.addEventListener("touchmove", e => {
    event.preventDefault();
    mouse.down = true;
    draw_move(e)
})
canvas_bg.addEventListener("touchstart", e => {
    mouse_down(e);
})
canvas_bg.addEventListener("mousedown", e => {
    mouse_down(e);
})
canvas_bg.addEventListener("mouseup", e => {
    mouse_up(e)
})
canvas_bg.addEventListener("touchend", e => {
    mouse_up(e);
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

function record() {

    if (canvas_arr.length < 3) alert("You need at least 3 frames to record audio");
    navigator.mediaDevices.getUserMedia({
            audio: true
        })
        .then(stream => {
            const media_recorder = new MediaRecorder(stream);
            audio_chunks = [];
            media_recorder.addEventListener("dataavailable", event => {
                audio_chunks.push(event.data);
            });

            do_ghost = false; // Turn of ghost
            shift_frame(-frame); // Go to the beginning of the flip

            media_recorder.start(); // Start recording
            document.getElementById("record").children[0].style.fill = theme;

            media_recorder.addEventListener("stop", () => {
                const audio_blob = new Blob(audio_chunks);

                var reader = new FileReader();
                reader.readAsDataURL(audio_blob);
                reader.onloadend = () => {
                    base64data = reader.result.split(",")[1];
                    note.audio = "data:audio/wav;base64," + base64data; // Saved data.
                    save_note();
                    audio = new Audio(note.audio);
                    document.getElementById("record").children[0].style.fill = "white";
                }
            });

            play_interval = setInterval(() => {
                if (frame == canvas_arr.length - 1) {
                    media_recorder.stop();
                    clearInterval(play_interval);
                    do_ghost = true;
                } else shift_frame(1);
            }, speed);
        });
}

window.onkeydown = function () {
    if (dont_shortcut()) return;
    var key = event.keyCode || event.charCode;
    //console.log(key)
    if (key == 8 || key == 46) {
        delete_frame();
    } else if (key == 37) {
        shift_frame(-1, true);
    } else if (key == 39) {
        shift_frame(1, true);
    } else if (key == 70) {
        save_history();
        fill();
    } else if (key == 90) {
        undo();
    } else if (key == 82) {
        save_history();
        remove_transparent_parts();
    }
};

function index_to_coordinates(index) {
    let x = index % WIDTH;
    let y = (index - x) / WIDTH;
    return {
        x: x,
        y: y
    };
}

function change_doted_size(el) {
    dotted_brush_size = el.value;
}

function draw() {
    if (!mouse.last_pos.x || !mouse.last_pos.y) return;
    if (bucket) {
        fill();
        toggle_bucket();
        return;
    }

    if (dotted_brush) {
        for (i = 0; i < WIDTH * HEIGHT; i++) {
            var coords = index_to_coordinates(i);
            if (coords.x % dotted_brush_size == 0 && coords.y % dotted_brush_size == 0) {
                if (get_distance(coords.x, mouse.x, coords.y, mouse.y) < pen_size + 4) {
                    ctx.fillStyle = note.palette[color];
                    ctx.fillRect(coords.x, coords.y, 1, 1);
                }
            }

        }

        return;
    }
    for (i = 0; i < pen_size - 1 || i == 0; i++) {
        ctx.beginPath();
        ctx.strokeStyle = note.palette[color];
        ctx.lineWidth = pen_size;
        ctx.moveTo(mouse.last_pos.x + i, mouse.last_pos.y + i);
        ctx.lineTo(mouse.x + i, mouse.y + i);
        ctx.stroke();

        ctx.moveTo(mouse.last_pos.x - i, mouse.last_pos.y - i);
        ctx.lineTo(mouse.x - i, mouse.y - i);
        ctx.stroke();

        ctx.moveTo(mouse.last_pos.x - i, mouse.last_pos.y + i);
        ctx.lineTo(mouse.x - i, mouse.y - i);
        ctx.stroke();

        ctx.moveTo(mouse.last_pos.x + i, mouse.last_pos.y - i);
        ctx.lineTo(mouse.x - i, mouse.y - i);
        ctx.stroke();
    }
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