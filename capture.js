var preprocessScript = document.createElement('script');
preprocessScript.src = './preprocess.js';
document.body.appendChild(preprocessScript);

var captureStart = document.querySelector('#captureBtn');
var overlay = document.createElement("div");
overlay.classList.add("overlay");
var isScreenBlocked = false;
var startX, startY, endX, endY;
var screenshotDataUrl;

var screenshotPreview = document.getElementById("screenshotPreview");

captureStart.addEventListener("click", () => {
  toggleScreenBlocking();
});

document.addEventListener("mousedown", (e) => {
  if (isScreenBlocked) {
    startX = e.clientX;
    startY = e.clientY;
  }
});

document.addEventListener("mousemove", (e) => {
  if (isScreenBlocked && startX !== undefined && startY !== undefined) {
    endX = e.clientX;
    endY = e.clientY;
    drawSelectionBox();
  }
});

document.addEventListener("mouseup", () => {
  if (isScreenBlocked && startX !== undefined && startY !== undefined) {
    clearSelectionBox();
    captureSelectedArea();
    startX = startY = endX = endY = undefined;
    toggleScreenBlocking();
  }
});

function toggleScreenBlocking() {
  isScreenBlocked = !isScreenBlocked;
  if (isScreenBlocked) {
    blockScreen();
  } else {
    unblockScreen();
  }
}

function blockScreen() {
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
}

function unblockScreen() {
  document.body.removeChild(overlay);
  document.body.style.overflow = "auto";
}

function drawSelectionBox() {
  clearSelectionBox();
  var selectionBox = document.createElement("div");
  selectionBox.id = "selectionBox";
  selectionBox.style.position = "fixed";
  selectionBox.style.border = "1px dashed red";
  selectionBox.style.background = "rgba(0, 0, 0, 0.3)";
  selectionBox.style.left = Math.min(startX, endX) + "px";
  selectionBox.style.top = Math.min(startY, endY) + "px";
  selectionBox.style.width = Math.abs(endX - startX) + "px";
  selectionBox.style.height = Math.abs(endY - startY) + "px";
  document.body.appendChild(selectionBox);

  screenshotPreview.style.clip = `rect(${Math.min(startY, endY)}px, ${Math.max(startX, endX)}px, ${Math.max(startY, endY)}px, ${Math.min(startX, endX)}px)`;
}

function clearSelectionBox() {
  var selectionBox = document.getElementById("selectionBox");
  if (selectionBox) {
    selectionBox.parentNode.removeChild(selectionBox);
  }
}

function captureSelectedArea() {
  var selectionX = Math.min(startX, endX);
  var selectionY = Math.min(startY, endY);
  var selectionWidth = Math.abs(endX - startX);
  var selectionHeight = Math.abs(endY - startY);

  var croppedCanvas = document.createElement("canvas");
  var context = croppedCanvas.getContext("2d");
  croppedCanvas.width = selectionWidth * 2;
  croppedCanvas.height = selectionHeight * 2;

  html2canvas(document.body, {
    x: selectionX,
    y: selectionY,
    width: selectionWidth,
    height: selectionHeight,
    canvas: croppedCanvas,
    ignoreElements: (element) => {
      return element.classList.contains("overlay");
    },
  }).then(function (canvas) {
    screenshotDataUrl = canvas.toDataURL("image/jpeg", 1.0);
    preprocessImage(screenshotDataUrl, function (preprocessedDataUrl) {
      screenshotPreview.src = screenshotDataUrl; // Update the screenshotPreview image with the original image
      screenshotAfter.src = preprocessedDataUrl; // Update the screenshotAfter image with the preprocessed and highlighted image
      processScreenshotOCR(preprocessedDataUrl);
    });
    // saveScreenshotImage(screenshotDataUrl); // Save the screenshot image
  });
}


function processScreenshotOCR(dataUrl) {
  Tesseract.recognize(dataUrl, 'eng+jpn', {
    // logger: m => console.log(m),
    // workerOptions: {
    //   tessedit_char_whitelist: '0123456789', // Add your desired whitelist characters here
    // },
  })
  .then(result => {
    displayResultText(result.data.text);
  })
  .catch(error => {
    console.error('OCR Error:', error);
  });
}

function displayResultText(text) {
  var resultTextarea = document.getElementById('resultTextarea');
  resultTextarea.value = text;
}

window.addEventListener("beforeunload", () => {
  if (isScreenBlocked) {
    toggleScreenBlocking();
  }
});
