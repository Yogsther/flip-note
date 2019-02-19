var feed_progress = 0;
var end = false;
var feed = document.getElementById("feed");
var feed_type;
var username = "?";
var notes = [];
var sent_not_recived = false;

function goto_profile() {
    redir("profile?" + me.username);
}

var loading_more = document.createElement("div")
loading_more.innerText = "Loading more...";
loading_more.id = "loading-more";

function get_feed(type, el) {
    if (sent_not_recived) return;
    sent_not_recived = true;
    if (at("home")) {
        for (e of document.getElementsByClassName("extra-button")) {
            if (el == e) {
                e.style.background = "white";
                e.style.color = "black";
            } else {
                e.style.background = "none";
                e.style.color = "white";
            }
        }
    }
    end = false;
    feed_type = type;
    feed_progress = 0;
    document.getElementById("feed").innerHTML = "";
    socket.emit("get_notes", {
        token: token,
        type: type,
        progress: feed_progress,
        username: username
    });
}

socket.on("feed", content => {
    sent_not_recived = false;
    end = content.end;
    feed_progress = content.progress;
    loading_more.remove();
    for (note of content.notes) {
        if (notes[note.id]) clearInterval(notes[note.id].interval)
        notes[note.id] = note;
        feed.appendChild(generate_note_DOM(note));
    }
    feed.appendChild(loading_more);
    play_audio(feed.children[0].children[3].id)
});

function set_theme(el) {
    localStorage.setItem("theme", el.style.background);
    location.reload();
}

var playing_audio = false;
var audio_timed = false;
var audio = new Audio();
audio.loop = true;

function toggle_play(id){
    var note = notes[id];
    if(!note.audio) return;
    if(!note.play) note.play = true;
    else note.play = false; 

    if(note.play){
        play_audio(id);
        note.audio_symbol.style.visibility = "hidden"
    } else {
        audio.pause();
        note.audio_symbol.style.visibility = "visible"
        playing_audio = -1;
    }
}

function play_audio(id) {
    id = Number(id);
    var note = notes[id];

    if (playing_audio == id) return;
    audio.pause();
    if(note.play) playing_audio = id;
    else playing_audio = -1;
    if(!note.play) return;

    if (note.audio && note.play) {
        audio_timed = false;
        audio.src = note.audio;
        audio.play();
    }
}

var logo_index = 0;

setInterval(() => {
    //document.getElementById("logo").src = "img/icons/logo_" + logo_index % 2 + ".png";
    if (!end) {
        var dots = "";
        for (i = 0; i < logo_index % 4; i++) dots += ".";
        loading_more.innerText = "Loading more" + dots;
    } else if (feed.childElementCount > 1) {
        if (me.username == username) {
            var palette_arr = "";
            for (color of palette) palette_arr += "<span class='theme-button' onclick='set_theme(this)' style='background:" + color + ";'></span>";
            loading_more.innerHTML = palette_arr;
        } else loading_more.innerText = "Nothing more.";
    } else {
        loading_more.innerText = "Nothing here.";

    }
    logo_index++;
}, 250)



if (at("home") || at("profile")) document.getElementById("feed").onscroll = function (ev) {
    if (drop_down_el) drop_down_el.remove();

    play_audio(feed.children[Math.round(feed.scrollTop / 505)].id);

    if (feed.scrollHeight - feed.clientHeight - feed.scrollTop < 600) {
        if (!end) {
            if (sent_not_recived) return;
            sent_not_recived = true;
            socket.emit("get_notes", {
                token: token,
                type: feed_type,
                progress: feed_progress
            });
            console.log(feed_progress)
        }
    }
    
};

function star(el) {
    var star = el;
    var nr_likes = document.getElementById("likes_" + star.id);
    if (star.getAttribute("starred") == "true") {
        nr_likes.innerText = Number(nr_likes.innerText) - 1;
        star.setAttribute("starred", "false")
        star.style.fill = "rgb(187, 187, 187)";
        star.innerHTML = '<svg style="fill: rgb(187, 187, 187);" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M19.65 9.04l-4.84-.42-1.89-4.45c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.73 3.67-3.18c.67-.58.32-1.68-.56-1.75zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';
    } else {
        nr_likes.innerText = Number(nr_likes.innerText) + 1;
        star.style.fill = theme;
        star.setAttribute("starred", "true")
        star.innerHTML = '<svg version="1.1" style="fill: ' + theme + ';" id="Layer_1" class="star" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-285 408.9 24 24" style="enable-background:new -285 408.9 24 24;" xml:space="preserve"> <style type="text/css"> .st0{display:none;} </style> <rect x="-285" y="408.9" class="st0" width="24" height="24"/> <path class="st0" d="M-264.8,419.7l-3.7,3.2l1.1,4.7c0.2,0.9-0.7,1.5-1.5,1.1l-4.2-2.5l-4.2,2.5c-0.8,0.5-1.7-0.2-1.5-1.1l1.1-4.7 l-3.7-3.2c-0.7-0.6-0.3-1.7,0.6-1.8l4.8-0.4l1.9-4.5c0.3-0.8,1.5-0.8,1.8,0l1.9,4.5l4.8,0.4C-264.5,418-264.1,419.1-264.8,419.7z"/> <path d="M-265.4,417.9l-4.8-0.4l-1.9-4.5c-0.3-0.8-1.5-0.8-1.8,0l-1.9,4.5l-4.8,0.4c-0.9,0.1-1.2,1.2-0.6,1.8l3.7,3.2l-1.1,4.7 c-0.2,0.9,0.7,1.5,1.5,1.1l4.2-2.5l4.2,2.5c0.8,0.5,1.7-0.2,1.5-1.1l-1.1-4.7l3.7-3.2C-264.1,419.1-264.5,418-265.4,417.9z"/> </svg>'

    }

    socket.emit("star", {
        token: token,
        id: Number(el.id)
    })
}


var current_drop_down_note;

function drop_down(el) {
    var pos = el.getBoundingClientRect();
    var options = [];
    var note = notes[el.id];
    current_drop_down_note = el.id;

    if (note.uploader.username == me.username) {
        options.push({
            text: "Pin to profile",
            run: () => {
                socket.emit("pin", {
                    id: current_drop_down_note,
                    token: token
                });
            },
            title: "Pin this note to your profile"
        })
    }

    if (note.uploader.username == me.username) {
        var text = "Make private";
        var title = "Make this note private, only you can see it (Not even STAFF)"
        if (note.private) {
            text = "Make public";
            title = "Make this note public, everyone can see it."
        }
        options.push({
            text: text,
            title: title,
            run: () => {
                socket.emit("private", {
                    id: current_drop_down_note,
                    token: token
                });
            }
        })
    }

    options.push({
        text: "Create flip note from",
        title: "Load this flip note into your editor",
        run: () => {
            if (confirm("Opening this in your editor will delete any non-uploaded content in your editor! Are you sure you want to proceed?")) {
                save_locally(notes[current_drop_down_note]);
                redir("create");
            }
        }
    })

    if (me.staff && note.uploader.username != me.username) {
        options.push({
            text: 'Pick for STAFF PICKS',
            title: "Apply STAFF PICK to this note.",
            color: "#f4bf42",
            run: () => {
                socket.emit("staff_pick", {
                    id: current_drop_down_note,
                    token: token
                })
            }
        })
    }

    if (me.staff || me.username == note.uploader.username) {
        var title = "Delete this note, this can only be restored by STAFF!"
        var text = "Delete note";
        if (note.deleted) {
            title = "Restore this note"
            text = "Restore note";
        }
        options.push({
            text: text,
            title: title,
            color: "#ff4444",
            run: () => {
                if (confirm("Are you sure you want to delete this note? This cannot be undone")) {
                    socket.emit("delete_note", {
                        id: current_drop_down_note,
                        token: token
                    })
                }
            }
        })
    }

    if (me.staff) {
        var title = "Suspend user, will hide all user posts."
        var text = "Suspend user";
        if (note.uploader.suspended) {
            title = "Pardon user, will reshow all user posts."
            text = "Pardon user";
        }
        options.push({
            text: text,
            title: title,
            color: "#ff4444",
            run: () => {
                if (confirm("Are you sure you sure?")) {
                    socket.emit("suspend", {
                        username: notes[current_drop_down_note].uploader.username,
                        token: token
                    })
                }
            }
        })
    }

    display_drop_down(pos.left + window.scrollX, pos.top + window.scrollY, note.id, options);
}

function suspend_user(username) {
    socket.emit("suspend", {
        username: username,
        token: token
    })
}


var drop_down_el;
/**
 * 
 * @param {*} x 
 * @param {*} y 
 * @param {Option} options array of options, ex. of Option: {text: "Text", run: function(){CODE TO RUN}], color: "#color", title:"title"} 
 */
function display_drop_down(x, y, note_id, options) {
    if (drop_down_el) {
        drop_down_el.remove();
    }

    drop_down_el = document.createElement("div");
    for (option of options) {
        var option_el = document.createElement("div");
        option_el.classList.add("option");
        option_el.innerText = option.text;
        option_el.title = option.title;
        option_el.onclick = option.run;
        if (option.color) option_el.style.color = option.color;
        drop_down_el.appendChild(option_el);
    }

    drop_down_el.setAttribute("id", "drop_down")
    drop_down_el.classList.add("drop-down-menu");
    document.body.appendChild(drop_down_el);
    drop_down_el.style.left = x + 25 + "px";
    drop_down_el.style.top = (y - drop_down_el.offsetHeight) + "px";
}

document.body.addEventListener("click", e => {
    if (!drop_down_el) return;
    var found = false;
    if (drop_down_el)
        for (el of e.path) {
            if (el.id) {
                if (el.id == "drop_down") found = true;
                //console.log(el.id) 
            }
            if (el.classList) {
                if (el.classList.value.indexOf("drop-down-button") != -1) found = true;
            }
        }
    if (!found) drop_down_el.remove();
})


function generate_note_DOM(note) {

    var flip_note_dom = document.createElement("div");
    flip_note_dom.classList.add("flip-note");
    flip_note_dom.id = note.id;
    flip_note_dom.style.borderBottomColor = theme;

    /* if (note.pinned && at(note.uploader.username)) {
        flip_note_dom.style.border = theme + " solid 1px";
    } */


    var flip_image = document.createElement("img");
    flip_image.classList.add("flip-image");
    flip_image.setAttribute("width", "512");
    flip_image.setAttribute("height", "384");
    flip_image.src = note.content[0];

    var title = document.createElement("span")
    title.classList.add("flip-note-title");
    var pick = "";
    var pin = "";
    var staff = "";
    if (note.staff_pick) pick = get_tag("PICK", "#f4bf42").outerHTML;
    if (note.pinned && at(note.uploader.username)) pin = get_tag("PINNED").outerHTML;
    if (note.uploader.staff) staff = get_tag("STAFF").outerHTML;

    var deleted = "";
    if (note.deleted) deleted = "<span style='color:" + theme + ";'>[DELETED]</span> "
    var private = "";
    if (note.private) private = "<span style='color:#f4b241;'>[PRIVATE] </span>"
    title.innerHTML = private + deleted + sanitizeHTML(note.title) + "<span style='color:grey;cursor:pointer;' onclick='redir(" + '"' + "profile?" + note.uploader.username + '"' + ")'><br> by " + sanitizeHTML(note.uploader.username) + " <span style='color:#595959;'>" + Math.round((Date.now() - note.date) / 60 / 60 / 24 / 1000) + "d</span></span>" + pick + pin + staff;

    var drop_down_button = document.createElement("span");
    drop_down_button.id = note.id;
    drop_down_button.classList.add("drop-down-button")
    drop_down_button.setAttribute("onclick", "drop_down(this)");
    drop_down_button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';

    var star = document.createElement("span");
    star.id = note.id;
    star.setAttribute("onclick", "star(this)");
    if (me.stars.indexOf(note.id) != -1) {
        star.innerHTML = '<svg version="1.1" style="fill: ' + theme + ';" id="Layer_1" class="star" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-285 408.9 24 24" style="enable-background:new -285 408.9 24 24;" xml:space="preserve"> <style type="text/css"> .st0{display:none;} </style> <rect x="-285" y="408.9" class="st0" width="24" height="24"/> <path class="st0" d="M-264.8,419.7l-3.7,3.2l1.1,4.7c0.2,0.9-0.7,1.5-1.5,1.1l-4.2-2.5l-4.2,2.5c-0.8,0.5-1.7-0.2-1.5-1.1l1.1-4.7 l-3.7-3.2c-0.7-0.6-0.3-1.7,0.6-1.8l4.8-0.4l1.9-4.5c0.3-0.8,1.5-0.8,1.8,0l1.9,4.5l4.8,0.4C-264.5,418-264.1,419.1-264.8,419.7z"/> <path d="M-265.4,417.9l-4.8-0.4l-1.9-4.5c-0.3-0.8-1.5-0.8-1.8,0l-1.9,4.5l-4.8,0.4c-0.9,0.1-1.2,1.2-0.6,1.8l3.7,3.2l-1.1,4.7 c-0.2,0.9,0.7,1.5,1.5,1.1l4.2-2.5l4.2,2.5c0.8,0.5,1.7-0.2,1.5-1.1l-1.1-4.7l3.7-3.2C-264.1,419.1-264.5,418-265.4,417.9z"/> </svg>'
        star.setAttribute("starred", "true");
    } else {
        star.setAttribute("starred", "false")
        star.innerHTML = '<svg style="fill: rgb(187, 187, 187);" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M19.65 9.04l-4.84-.42-1.89-4.45c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.73 3.67-3.18c.67-.58.32-1.68-.56-1.75zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';
    }

    var x = document.createElement("span");
    x.classList.add("nr-likes-x");
    x.innerText = "x";

    var nr_likes = document.createElement("span");
    nr_likes.classList.add("nr-likes");
    nr_likes.id = "likes_" + note.id;
    nr_likes.innerText = " " + note.stars;

    if (note.audio) {
        note.audio_symbol = document.createElement("span");
        note.audio_symbol.classList.add("audio-symbol");
        note.audio_symbol.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="' + theme + '" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></svg>';
        flip_note_dom.appendChild(note.audio_symbol)
        flip_image.style.cursor = "pointer";
        note.audio_symbol.onclick = (e) => {
            toggle_play(note.id);
        }
    }

    flip_image.onclick = (e) => {
        toggle_play(note.id);
    }

    flip_note_dom.appendChild(flip_image);
    flip_note_dom.appendChild(title);

    flip_note_dom.appendChild(drop_down_button);
    flip_note_dom.appendChild(star);
    flip_note_dom.appendChild(x);
    flip_note_dom.appendChild(nr_likes);




    var index = 0;
    note.frame = index;
    note.interval = setInterval(() => {
        flip_image.src = note.content[index % note.content.length];
        note.frame = index % note.content.length

        if (note.audio && playing_audio == note.id) {
            if(audio.paused) audio.play();
            if (!audio_timed) {
                try {
                    audio.currentTime = (audio.duration / note.content.length) * note.frame;
                    audio_timed = true;
                } catch (e) {

                }
            } else if (note.frame == 0) audio.currentTime = 0;
        }
        index++;
    }, (1 / note.fps) * 1000)

    return flip_note_dom;

}

function sanitizeHTML(str) {
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};