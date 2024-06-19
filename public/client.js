let schedule = "";
function DateandTime() {
    const sche = document.getElementById('schedule');
    const date = document.getElementById('date');
    const time = document.getElementById('time');
    const list = document.getElementById('list');

    if (sche.checked) {
        date.style.display = 'block';
        time.style.display = 'block';
        list.style.display = 'block';
        schedule = true;
    } else {
        date.style.display = 'none';
        time.style.display = 'none';
        list.style.display = 'none';
        schedule = false;
    }
}

function RemoveFile(){
    const fileInput = document.getElementById('media');
    fileInput.value = "";
}

function PostData(event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const fileInput = document.getElementById('media');
    const file = fileInput.files[0]; // Get the selected file

    if (file && file.size > 5242880) {
        alert('ERROR: File size exceeds the limit of 5MB.');
        return;
    }

    const form = document.getElementById('grid');
    const list = document.getElementById('list');

    const data = new FormData(form); // Create FormData object from form data

    // Convert schedule checkbox state to boolean
    const scheduleCheckbox = document.getElementById('schedule');
    schedule = scheduleCheckbox.checked;

    // Append schedule as a boolean to FormData
    data.append('schedule', schedule);

    const options = {
        method: 'POST',
        body: data
    };

    fetch('http://localhost:3000/data', options).then(res => res.text())
    .then(data => {
        if (data.startsWith("ERROR")){
            alert(data);
        } else if (data == "Tweet Posted"){
            alert(data);
        } else {
            list.innerHTML += "<option>" + data + "</option>";
        } 
    })
    .catch(error => {
    alert("ERROR: cannot connect to server", error);
    });
}


document.addEventListener('DOMContentLoaded', function() {
    const schedule = document.getElementById('schedule');
    const date = document.getElementById('date');
    const time = document.getElementById('time');

    schedule.checked = false;
});