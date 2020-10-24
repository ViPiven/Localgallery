let openRequest = indexedDB.open('photos', 1);
let db;
let slideIndex = 1;
let scope = [];
openRequest.onupgradeneeded = function() {
    db = openRequest.result;
    db.createObjectStore('photos', {keyPath: 'id', autoIncrement: true});
};

openRequest.onerror = function() {
    console.error("Error", openRequest.error);
};

openRequest.onsuccess = function() {
    db = openRequest.result;
    db.onversionchange = function() {
        db.close();
        alert("База данных устарела, пожалуста, перезагрузите страницу.")
    };
    let load = document.getElementById('load');
    let put = document.getElementById('put');
    load.addEventListener('change', function() {
        let loadedFile = load.files[0];
        let blob = new Blob([load.files[0]]);
        addPhoto(blob, loadedFile);
    }, false);
    put.addEventListener('change', function () {
        let loadedFile = put.files[0];
        let blob = new Blob([put.files[0]]);
        putPhoto(blob, loadedFile);
    }, false);
};
openRequest.onblocked = () => {
    // есть другое соединение к той же базе
    // и оно не было закрыто после срабатывания на нём db.onversionchange
};
///////////////////////////////////API////////////////////////////////////////////
addPhoto = (blob, loadedFile) => {
    let transaction = db.transaction('photos', 'readwrite');
    // Put the blob into the dabase
    let photo1 = {
        id: loadedFile.name,
        value: blob,
        size: loadedFile.size,
        lastModifiedDate: loadedFile.lastModifiedDate,
        name: loadedFile.name,
        mimeType: loadedFile.type
    };
    scope.push(photo1);
    let put = transaction.objectStore("photos").put(photo1);
    // Retrieve the file that was just stored
    transaction.objectStore("photos").get(loadedFile.name).onsuccess = (event) => {
        let imgFile = event.target.result;

        let reader = new FileReader();
        reader.readAsDataURL(imgFile.value);
        reader.onload = () => {
            // var photo = document.getElementById("photo");
            // photo.setAttribute("src", reader.result); // url с данными
            generateSlideHTML(reader.result, imgFile.id);
            generateThumbnailHTML(reader.result, imgFile.id);
        };
    };
};
deletePhoto = () => {
    let transaction = db.transaction('photos', 'readwrite');
    let slides = document.getElementsByClassName("mySlides");
    let slide = slides[slideIndex-1];
    let thumbnail = document.getElementById(slide.getAttribute("id") + "_");
    let id = slide.getAttribute("id");
    console.log(id);
    for (let i = 0; i < scope.length; i++) {
        if (scope[i].id === id) {
            scope.splice(i, 1);
        }
    }
    let remove = transaction.objectStore("photos").delete(id);
    remove.onsuccess = (event) => {
        slide.remove();
        thumbnail.remove();
    };
};
putPhoto = (blob, loadedFile) => {
    deletePhoto();
    addPhoto(blob, loadedFile);
};
uploadPhoto = () => {
    let file = scope[slideIndex - 1];
    let upload = document.getElementById('upload');
    upload.href = window.URL.createObjectURL(file.value);
    upload.target = '_blank';
    upload.download = file.name;
};
//////////////////////////////////////////////
let generateSlideHTML = (src, id) => {
    let gallery = document.getElementById("gallery");
    let slide = document.createElement("div");
    slide.setAttribute("id", id);
    slide.setAttribute("class", "mySlides");
    let slideImage = document.createElement("img");
    slideImage.setAttribute("src", src);
    slideImage.setAttribute("width", '720');
    slideImage.setAttribute("height", '480');
    slide.appendChild(slideImage);
    gallery.appendChild(slide);
};
let onClickSlide = 1;
let generateThumbnailHTML = (src, id) => {
    let thumbnails = document.getElementById("thumbnails");
    let div = document.createElement("div");
    div.setAttribute("class", "column");
    let thumbnail = document.createElement("img");
    thumbnail.setAttribute("class", "demo cursor");
    thumbnail.setAttribute("onclick", "currentSlide(" + onClickSlide + ")");
    thumbnail.setAttribute("id", id + "_");
    onClickSlide ++;
    slideIndex++;
    thumbnail.setAttribute("src", src);
    thumbnail.setAttribute("width", '360');
    thumbnail.setAttribute("height", '240');
    div.appendChild(thumbnail);
    thumbnails.appendChild(thumbnail);
    showInfo(id);
    showSlides(slideIndex);
};
let showInfo = (id) => {
    let thumbnail = document.getElementById(id);
    let div = document.createElement("div");
    div.setAttribute("class", "info");
    let info;
    for (let i = 0; i < scope.length; i++){
        if (scope[i].id === id){
            info = scope[i];
            break;
        }
    }
    div.innerHTML = 'name: ' + info.name + '<br/>'  +  ' size:' + (info.size / 1024 / 1024).toFixed(2) + ' MB' + '<br/>' + ' lastModifiedDate: ' + info.lastModifiedDate.getDate() + ' ' + info.lastModifiedDate.getMonth() + ' ' + info.lastModifiedDate.getFullYear() + '<br/>' + ' mimeType: ' + info.mimeType;
    thumbnail.append(div);
};
////////////////////////////////////////////////////////////////////

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);

}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("demo");
    let captionText = document.getElementById("caption");
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex-1].style.display = "block";
    dots[slideIndex-1].className += " active";
    captionText.innerHTML = dots[slideIndex-1].alt;
}
