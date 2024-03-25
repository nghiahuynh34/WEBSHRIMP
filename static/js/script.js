// Drop handler
$(document).ready(function () {
        $('#uploadImage').submit(function (event) {
            $('#inferenceJson').empty().append('');
            if ($('#uploadFile').val()) {
            console.log($('#uploadFile').val())
                event.preventDefault();
                $('#displayedImage').show();
                $('#targetLayer').hide();
//$('#displayedImage').hide();
//                        $('#targetLayer').show();
//                 $('#webcam').attr('src', '/classify');
                $(this).ajaxSubmit({
                    target: '#targetLayer',
                    beforeSubmit: function () {
                        $('.progress-bar').width('50%');
                    },
                    uploadProgress: function (
                        event,
                        position,
                        total,
                        percentageComplete
                    ) {
                        $('.progress-bar').animate(
                            {
                                width: percentageComplete + '%',
                            },
                            {
                                duration: 1000,
                            }
                        );
                    },
                    success: function (data) {
                    console.log(data)
                        $('#displayedImage').hide();
                        $('#targetLayer').show();
                        if(data.video){
                        console.log("<img src='/video_feed/"+data.file+"' id='webcam' autoplay style='margin-top: 40px' />'")

                         $('#targetLayer').append("<img src='/video_feed/"+data.file+"' id='webcam' autoplay style='margin-top: 40px' />'" );
                        }else{
                        $('#targetLayer').append(data.htmlresponse);

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

                        $('#inferenceJson').append(InfoOfResult.join(''));
                        }
                    },
                    resetForm: true,
                });
            }
            return false;
        });
    });

/* ***********----------------------******************* */
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
            console.log(data);
            if (data.success) {
                document.getElementById('displayedImage').style.display =
                    'none';
                document.getElementById('targetLayer').style.display = 'block';
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
                console.log(InfoOfResult)
                document.getElementById('inferenceJson').innerHTML =InfoOfResult;
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
        $('#webcam').attr('src', '/video_feed/https://www.facebook.com/100011446841179/videos/pcb.941243397229645/3068464763289472');
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
