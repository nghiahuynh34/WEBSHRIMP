$(document).ready(function () {
    var progressBar = $('#progress-bar');
    progressBar.width('0%');

    $('#uploadFile').change(function (event) {
        $('#inferenceJson').empty().append('');
        if ($('#uploadFile').val()) {
            $('#uploadImage').submit(function (e) {
                e.preventDefault();
                console.log(event.target.files);
                $('#displayedImage').show();
                $('#targetLayer').hide();
                handleFiles(event.target.files);
            });
        }
        return false;
    });
});

var myButton = document.getElementById('btn-run');

// Thêm sự kiện click vào button
myButton.addEventListener('click', function () {
    alert('Bạn đã click vào nút!');
    move();
});

var i = 0;
function move() {
    if (i == 0) {
        i = 1;
        var elem = document.getElementById('myBar');
        var width = 10;
        var id = setInterval(frame, 10);
        function frame() {
            if (width >= 100) {
                clearInterval(id);
                i = 0;
            } else {
                width++;
                elem.style.width = width + '%';
                elem.innerHTML = width + '%';
            }
        }
    }
}
function downloadImage() {
    var imageURL = document.getElementById('imageURL').value;
    document.getElementById('inferenceJson').innerHTML = '';
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: imageURL }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                console.log(data);
                document.getElementById('displayedImage').style.display =
                    'none';
                document.getElementById('targetLayer').style.display = 'block';
                document.getElementById('targetLayer').innerHTML =
                    data.htmlresponse;
                document.getElementById(
                    'inferenceJson'
                ).innerHTML = `<pre class='jsonOutput'>${JSON.stringify(
                    { Image1: data.Info },
                    null,
                    2
                )}</pre>`;
            } else {
                alert('Error downloading image. Please check the URL.');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
        });
}

function dropHandler(event) {
    event.preventDefault();
    document.getElementById('drop-area').style.border = '2px dashed #ccc';
    const files = event.dataTransfer.files;
    handleFiles(files);
}
// Drag over handler
function dragOverHandler(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    document.getElementById('drop-area').style.border = '2px dashed #007bff';
}

//
// Handle file select
function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

// Handle files
function handleFiles(files) {
    //  const dropArea = document.getElementById("drop-area");
    //  const output = [];
    console.log(files);
    const formData = new FormData();
    for (var i = 0; i < files.length; i++) {
        formData.append('uploadFile[]', files[i]);
    }
    fetch('/classify', {
        method: 'POST',
        body: formData,
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('ok nè');
            console.log(data);
            if (data.success) {
                document.getElementById('displayedImage').style.display =
                    'none';
                document.getElementById('targetLayer').style.display = 'block';
                if (data.video) {
                    console.log(
                        "<img src='/video_feed/" +
                            data.file +
                            "' id='webcam' autoplay style='margin-top: 40px' />'"
                    );

                    $('#targetLayer').append(
                        "<img src='/video_feed/" +
                            data.file +
                            "' id='webcam' autoplay style='margin-top: 40px' />'"
                    );
                } else {
                    document.getElementById('targetLayer').innerHTML =
                        data.htmlresponse;
                    var InfoOfResult = data.Info.map(
                        (val, index) =>
                            "<pre class='jsonOutput'>" +
                            JSON.stringify(
                                { ['Image' + (index + 1)]: val },
                                null,
                                2
                            ) +
                            '</pre>'
                    );
                    console.log(InfoOfResult);
                    document.getElementById('inferenceJson').innerHTML =
                        InfoOfResult;
                }
            } else {
                alert('Error downloading image. Please check the URL.');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('An unexpected error occurred.');
        });
}

function toggleWebcam() {
    console.log('Toggle Webcam Clicked');
    document.getElementById('displayedImage').style.display = 'none';
    document.getElementById('targetLayer').style.display = 'block';
    //if($("#webcam").show()){
    //$("#webcam").src = "{{ url_for('video_feed') }}"
    //}
    var isWebcamVisible = $('#webcam').is(':visible');
    console.log('Webcam is visible:', isWebcamVisible);
    if (isWebcamVisible) {
        $('#webcam').attr('src', '');
    } else {
        $('#webcam').attr(
            'src',
            '/video_feed/https://www.facebook.com/100011446841179/videos/pcb.941243397229645/3068464763289472'
        );
    }
    // Sử dụng jQuery để thay đổi thuộc tính display của video từ webcam
    $('#webcam').toggle();
}

function toggleHiddenDiv() {
    var hiddenDiv = document.getElementById('hiddenDiv');
    if (hiddenDiv.style.display === 'none' || hiddenDiv.style.display === '') {
        hiddenDiv.style.display = 'block';
    } else {
        hiddenDiv.style.display = 'none';
    }
}
// Xử lý sự kiện khi click vào hộp người dùng
document.getElementById('userBox').addEventListener('click', function () {
    var dropdownContent = document.getElementById('dropdownContent');
    if (dropdownContent.style.display === 'block') {
        dropdownContent.style.display = 'none';
    } else {
        dropdownContent.style.display = 'block';
    }
});

// Đóng hộp thả xuống khi click ra ngoài
window.onclick = function (event) {
    if (!event.target.matches('.user-box')) {
        var dropdowns = document.getElementsByClassName('dropdown-content');
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.style.display === 'block') {
                openDropdown.style.display = 'none';
            }
        }
    }
};

/*-------------------------------------------*/
// Xử lý sự kiện khi click vào hộp người dùng
document.getElementById('userBox').addEventListener('click', function () {
    var dropdownContent = document.getElementById('dropdownContent');
    if (dropdownContent.style.display === 'none') {
        console.log('noit ok');
        dropdownContent.style.display = 'none';
    } else {
        console.log('ok');
        dropdownContent.style.display = 'block';
    }
});

// Đóng hộp thả xuống khi click ra ngoài
window.onclick = function (event) {
    if (!event.target.matches('.user-box')) {
        var dropdowns = document.getElementsByClassName('dropdown-content');
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.style.display === 'block') {
                openDropdown.style.display = 'none';
            }
        }
    }
};
