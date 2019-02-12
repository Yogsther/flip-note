var feed_progress = 0;
var end = false;
var feed = document.getElementById("feed");
var feed_type;
var username = "?"
var sent_not_recived = false;

if (at("home")) {
    get_feed("user_feed", document.getElementsByClassName("extra-button")[0]);
}

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
        feed.appendChild(generate_note_DOM(note));
    }
    feed.appendChild(loading_more);
});

function set_theme(el){
    localStorage.setItem("theme", el.style.background);
    location.reload();
}

var logo_index = 0;

setInterval(() => {
    document.getElementById("logo").src = "img/icons/logo_" + logo_index % 2 + ".png";
    if (!end) {
        var dots = "";
        for (i = 0; i < logo_index % 4; i++) dots += ".";
        loading_more.innerText = "Loading more" + dots;
    } else if (feed.childElementCount > 1) {
        if (me.username == username) {
            var palette_arr = "";
            for(color of palette) palette_arr+="<span class='theme-button' onclick='set_theme(this)' style='background:" + color + ";'></span>";
            loading_more.innerHTML = palette_arr;
        } else loading_more.innerText = "Nothing more.";
    } else {
        loading_more.innerText = "Nothing here.";

    }
    logo_index++;
}, 250)

window.onscroll = function (ev) {
    let scrollHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
    let currentScrollHeight = window.innerHeight + window.scrollY;

    if ((scrollHeight - currentScrollHeight) < 200) {
        if (!end) {
            if (sent_not_recived) return;
            sent_not_recived = true;
            socket.emit("get_notes", {
                token: token,
                type: feed_type,
                progress: feed_progress
            });
        }
    }
};

function star(el) {
    var star = el;
    var nr_likes = document.getElementById("likes_" + star.id);
    console.log("likes_" + el.id)
    if (star.getAttribute("starred") == "true") {
        nr_likes.innerText = Number(nr_likes.innerText) - 1;
        star.setAttribute("starred", "false")
        star.style.fill = "rgb(187, 187, 187)";
        star.innerHTML = '<svg style="fill: rgb(187, 187, 187);" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M19.65 9.04l-4.84-.42-1.89-4.45c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.73 3.67-3.18c.67-.58.32-1.68-.56-1.75zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';
    } else {
        nr_likes.innerText = Number(nr_likes.innerText) + 1;
        star.style.fill = theme;
        star.setAttribute("starred", "true")
        star.innerHTML = '<svg version="1.1" style="fill: '+theme+';" id="Layer_1" class="star" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-285 408.9 24 24" style="enable-background:new -285 408.9 24 24;" xml:space="preserve"> <style type="text/css"> .st0{display:none;} </style> <rect x="-285" y="408.9" class="st0" width="24" height="24"/> <path class="st0" d="M-264.8,419.7l-3.7,3.2l1.1,4.7c0.2,0.9-0.7,1.5-1.5,1.1l-4.2-2.5l-4.2,2.5c-0.8,0.5-1.7-0.2-1.5-1.1l1.1-4.7 l-3.7-3.2c-0.7-0.6-0.3-1.7,0.6-1.8l4.8-0.4l1.9-4.5c0.3-0.8,1.5-0.8,1.8,0l1.9,4.5l4.8,0.4C-264.5,418-264.1,419.1-264.8,419.7z"/> <path d="M-265.4,417.9l-4.8-0.4l-1.9-4.5c-0.3-0.8-1.5-0.8-1.8,0l-1.9,4.5l-4.8,0.4c-0.9,0.1-1.2,1.2-0.6,1.8l3.7,3.2l-1.1,4.7 c-0.2,0.9,0.7,1.5,1.5,1.1l4.2-2.5l4.2,2.5c0.8,0.5,1.7-0.2,1.5-1.1l-1.1-4.7l3.7-3.2C-264.1,419.1-264.5,418-265.4,417.9z"/> </svg>'

    }

    socket.emit("star", {
        token: token,
        id: Number(el.id)
    })
}




function generate_note_DOM(note) {

    var flip_note_dom = document.createElement("div");
        flip_note_dom.classList.add("flip-note");
        flip_note_dom.style.borderBottomColor = theme;

    var flip_image = document.createElement("img");
    flip_image.classList.add("flip-image");
    flip_image.setAttribute("width", "512");
    flip_image.setAttribute("height", "384");
    flip_image.src = note.content[0];

    var title = document.createElement("span")
    title.classList.add("flip-note-title");
    var staff = "";
    if (note.uploader.staff) staff = get_tag("STAFF", "rgb(218, 30, 71)").outerHTML;
    title.innerHTML = sanitizeHTML(note.title) + "<span style='color:grey'><br> by " + sanitizeHTML(note.uploader.username) + "</span>" + staff;

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

    flip_note_dom.appendChild(flip_image);
    flip_note_dom.appendChild(title);

    flip_note_dom.appendChild(star);
    flip_note_dom.appendChild(x);
    flip_note_dom.appendChild(nr_likes);

    var index = 0;
    setInterval(() => {
        flip_image.src = note.content[index % note.content.length];
        index++;
    }, (1 / note.fps) * 1000)

    return flip_note_dom;

}

function sanitizeHTML(str) {
    var temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};