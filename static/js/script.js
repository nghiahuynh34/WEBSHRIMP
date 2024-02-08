

// Drop handler
function dropHandler(event) {
  event.preventDefault();
  document.getElementById("drop-area").style.border = "2px dashed #ccc";
  const files = event.dataTransfer.files;
  handleFiles(files);
}
// Drag over handler
function dragOverHandler(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  document.getElementById("drop-area").style.border = "2px dashed #007bff";
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
console.log(files )
const formData = new FormData();
for(var i=0;i<files.length;i++){
    formData.append("uploadFile[]",files[i])
}
fetch("/classify", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
    console.log(data)
      if (data.success) {
document.getElementById('displayedImage').style.display="none";
document.getElementById('targetLayer').style.display="block";
     document.getElementById("targetLayer").innerHTML = data.htmlresponse;
      var InfoOfResult = data.Info.map((val, index) =>
    "<pre class='jsonOutput'>" + JSON.stringify({ ["Image"+(index+1)]: val }, null, 2) + "</pre>"
);
       document.getElementById('inferenceJson').innerHTML = InfoOfResult
      } else {
        alert("Error downloading image. Please check the URL.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("An unexpected error occurred.");
    });
    }

function toggleWebcam() {
  console.log("Toggle Webcam Clicked");
document.getElementById('displayedImage').style.display="none";
document.getElementById('targetLayer').style.display="block";
//if($("#webcam").show()){
//$("#webcam").src = "{{ url_for('video_feed') }}"
//}
 var isWebcamVisible = $("#webcam").is(":visible");
  console.log("Webcam is visible:", isWebcamVisible);
  if(isWebcamVisible){
 $("#webcam").attr("src","")
  }else{
  $("#webcam").attr("src","/video_feed",)
  }
  // Sử dụng jQuery để thay đổi thuộc tính display của video từ webcam
  $("#webcam").toggle();
}

function toggleHiddenDiv() {
  var hiddenDiv = document.getElementById("hiddenDiv");
  if (hiddenDiv.style.display === "none" || hiddenDiv.style.display === "") {
    hiddenDiv.style.display = "block";
  } else {
    hiddenDiv.style.display = "none";
  }
}