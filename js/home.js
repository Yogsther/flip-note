if(at("home")){
    socket.emit("get_feed", token);
}

socket.on("feed", content => {
    var feed = document.getElementById("feed");
    for(note of content){
        feed.appendChild(generate_note_DOM(note));            
    }
});


function generate_note_DOM(note){
    /*  <div class="flip-note">
                <img id="image" width="512" height="384" class="flip-canvas">
                <span class="flip-note-title">This is the title of this flipnote!</span>
                <svg onclick="star(this)" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M19.65 9.04l-4.84-.42-1.89-4.45c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.73 3.67-3.18c.67-.58.32-1.68-.56-1.75zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>
                <span class="nr-likes-x">x</span><span class="nr-likes">20 </span> 
            </div> */
    var flip_note_dom = document.createElement("div");
        flip_note_dom.classList.add("flip-note");

    var flip_image = document.createElement("img");
        flip_image.classList.add("flip-image");
        flip_image.setAttribute("width", "512");
        flip_image.setAttribute("height", "384");
        flip_image.src = note.content[0];


    
    var title = document.createElement("span")
        title.classList.add("flip-note-title");
        title.innerText = sanitizeHTML(note.title);

    var star = document.createElement("span");
        star.innerHTML += '<svg onclick="star(this)" id="' + note.id + '" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M19.65 9.04l-4.84-.42-1.89-4.45c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08l4.15-2.5 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.73 3.67-3.18c.67-.58.32-1.68-.56-1.75zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/></svg>';

        var x = document.createElement("span");
        x.classList.add("nr-likes-x");
        x.innerText = "x";
    
    var nr_likes = document.createElement("span");
        nr_likes.classList.add("nr-likes");
        nr_likes.innerText = " " + note.stars;

    flip_note_dom.appendChild(flip_image);
    flip_note_dom.appendChild(title);
    
    flip_note_dom.appendChild(star);
    flip_note_dom.appendChild(x);
    flip_note_dom.appendChild(nr_likes);

    var index = 0;
    setInterval(() => {
        flip_image.src = note.content[index%note.content.length];
        index++;
    }, (1 / note.fps)*1000)

    return flip_note_dom;

}

function sanitizeHTML (str) {
	var temp = document.createElement('div');
	temp.textContent = str;
	return temp.innerHTML;
};