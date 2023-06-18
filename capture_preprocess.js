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
      screenshotPreview.src = preprocessedDataUrl; // Update the screenshot image with the preprocessed image
      processScreenshotOCR(preprocessedDataUrl);
    });
    // saveScreenshotImage(screenshotDataUrl); // Save the screenshot image
  });
}


function preprocessImage(dataUrl, callback) {
  var img = new Image();
  img.onload = function() {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image on the canvas
    context.drawImage(img, 0, 0);

    // Apply image preprocessing
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    applyContrastEnhancement(imageData);
    applyNoiseReduction(imageData);
    context.putImageData(imageData, 0, 0);

    // Get the preprocessed image as data URL
    var preprocessedDataUrl = canvas.toDataURL("image/jpeg", 1.0);

    // Invoke the callback with the preprocessed data URL
    callback(preprocessedDataUrl);
  };
  img.src = dataUrl;
}

function applyContrastEnhancement(imageData) {
  var preprocessedData = applyThresholding(imageData);
  return preprocessedData;
}

function applyThresholding(imageData) {
  var data = imageData.data;
  var threshold = 128; // Adjust the threshold value as needed

  var thresholdedData = new ImageData(imageData.width, imageData.height);

  for (var i = 0; i < data.length; i += 4) {
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];

    var grayscale = (r + g + b) / 3;
    var binary = grayscale > threshold ? 255 : 0;

    thresholdedData.data[i] = binary; // Red channel
    thresholdedData.data[i + 1] = binary; // Green channel
    thresholdedData.data[i + 2] = binary; // Blue channel
    thresholdedData.data[i + 3] = data[i + 3]; // Alpha channel
  }

  return thresholdedData;
}


function applyNoiseReduction(imageData) {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  context.putImageData(imageData, 0, 0);

  // Apply Gaussian blur
  var blurRadius = 2; // Adjust the blur radius as needed
  context.filter = `blur(${blurRadius}px)`;
  context.drawImage(canvas, 0, 0);

  // Get the filtered image data
  var filteredImageData = context.getImageData(0, 0, canvas.width, canvas.height);

  return filteredImageData;
}


function processScreenshotOCR(dataUrl) {
  Tesseract.recognize(dataUrl, 'eng+kor+jpn', {
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
