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
      imageData = applyImagePreprocessing(imageData);
  
      // Draw the processed data on the canvas
      context.putImageData(imageData, 0, 0);
  
      // Get the preprocessed image as data URL
      var preprocessedDataUrl = canvas.toDataURL("image/jpeg", 1.0);
  
      // Invoke the callback with the preprocessed data URL
      callback(preprocessedDataUrl);
    };
    img.src = dataUrl;
  }
  
  function applyImagePreprocessing(imageData) {
    var processedData = imageData
    processedData = applyNoiseReduction(processedData);
    // processedData = applyEdgeEnhancement(processedData);
    processedData = applyBinarization(processedData);
    return processedData;
  }
  
  function applyNoiseReduction(imageData) {
    // Apply noise reduction techniques (e.g., Gaussian blur, median filter)
    // Here's an example using Gaussian blur
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    context.putImageData(imageData, 0, 0);
  
    var blurRadius = 1; // Adjust the blur radius as needed
    context.filter = `blur(${blurRadius}px)`;
    context.drawImage(canvas, 0, 0);
  
    // Get the blurred image data
    var blurredImageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
    // Remove the blur effect by applying the original image data again
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(imageData, 0, 0);
  
    // Copy the original image data onto the cleared canvas
    context.drawImage(canvas, 0, 0);
  
    // Get the noise-reduced image data
    var denoisedImageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
    return denoisedImageData;
  }
  
  
  function applyEdgeEnhancement(imageData) {
    var sobelData = performSobelOperator(imageData, 128); // 임계값 128을 사용하여 엣지를 선명하게 만듦
    return sobelData;
  }
  
  
  function applyBinarization(imageData) {
    var threshold = 128; // Adjust the threshold value as needed
    var data = imageData.data;
  
    for (var i = 0; i < data.length; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
  
      var grayscale = (r + g + b) / 3;
      var binary = grayscale > threshold ? 255 : 0;
  
      data[i] = binary; // Red channel
      data[i + 1] = binary; // Green channel
      data[i + 2] = binary; // Blue channel
    }
  
    return imageData;
  }
  

  function performSobelOperator(imageData) {
  var data = imageData.data;
  var width = imageData.width;
  var height = imageData.height;

  var sobelData = new Uint8ClampedArray(data.length);
  var sobelDataWidth = width - 2;
  var sobelDataHeight = height - 2;

  var sobelMatrixX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  var sobelMatrixY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  for (var y = 0; y < sobelDataHeight; y++) {
    for (var x = 0; x < sobelDataWidth; x++) {
      var pixelX = (
        sobelMatrixX[0][0] * getGrayscalePixel(imageData, x, y) +
        sobelMatrixX[0][1] * getGrayscalePixel(imageData, x + 1, y) +
        sobelMatrixX[0][2] * getGrayscalePixel(imageData, x + 2, y) +
        sobelMatrixX[1][0] * getGrayscalePixel(imageData, x, y + 1) +
        sobelMatrixX[1][1] * getGrayscalePixel(imageData, x + 1, y + 1) +
        sobelMatrixX[1][2] * getGrayscalePixel(imageData, x + 2, y + 1) +
        sobelMatrixX[2][0] * getGrayscalePixel(imageData, x, y + 2) +
        sobelMatrixX[2][1] * getGrayscalePixel(imageData, x + 1, y + 2) +
        sobelMatrixX[2][2] * getGrayscalePixel(imageData, x + 2, y + 2)
      );

      var pixelY = (
        sobelMatrixY[0][0] * getGrayscalePixel(imageData, x, y) +
        sobelMatrixY[0][1] * getGrayscalePixel(imageData, x + 1, y) +
        sobelMatrixY[0][2] * getGrayscalePixel(imageData, x + 2, y) +
        sobelMatrixY[1][0] * getGrayscalePixel(imageData, x, y + 1) +
        sobelMatrixY[1][1] * getGrayscalePixel(imageData, x + 1, y + 1) +
        sobelMatrixY[1][2] * getGrayscalePixel(imageData, x + 2, y + 1) +
        sobelMatrixY[2][0] * getGrayscalePixel(imageData, x, y + 2) +
        sobelMatrixY[2][1] * getGrayscalePixel(imageData, x + 1, y + 2) +
        sobelMatrixY[2][2] * getGrayscalePixel(imageData, x + 2, y + 2)
      );

      var magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);

      var index = (y + 1) * width + (x + 1);
      sobelData[index * 4] = magnitude; // Red channel
      sobelData[index * 4 + 1] = magnitude; // Green channel
      sobelData[index * 4 + 2] = magnitude; // Blue channel
      sobelData[index * 4 + 3] = 255; // Alpha channel
    }
  }

  return new ImageData(sobelData, sobelDataWidth, sobelDataHeight);
}

function getGrayscalePixel(imageData, x, y) {
  var data = imageData.data;
  var width = imageData.width;

  var index = (y * width + x) * 4;
  var r = data[index];
  var g = data[index + 1];
  var b = data[index + 2];

  return (r + g + b) / 3;
}


function performSobelOperator(imageData, threshold) {
    var data = imageData.data;
    var width = imageData.width;
    var height = imageData.height;
  
    var sobelDataWidth = width - 2;
    var sobelDataHeight = height - 2;
    var sobelData = new Uint8ClampedArray(sobelDataWidth * sobelDataHeight * 4);
  
    var sobelMatrixX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
  
    var sobelMatrixY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];
  
    for (var y = 0; y < sobelDataHeight; y++) {
      for (var x = 0; x < sobelDataWidth; x++) {
        var pixelX = (
          sobelMatrixX[0][0] * getGrayscalePixel(imageData, x, y) +
          sobelMatrixX[0][1] * getGrayscalePixel(imageData, x + 1, y) +
          sobelMatrixX[0][2] * getGrayscalePixel(imageData, x + 2, y) +
          sobelMatrixX[1][0] * getGrayscalePixel(imageData, x, y + 1) +
          sobelMatrixX[1][1] * getGrayscalePixel(imageData, x + 1, y + 1) +
          sobelMatrixX[1][2] * getGrayscalePixel(imageData, x + 2, y + 1) +
          sobelMatrixX[2][0] * getGrayscalePixel(imageData, x, y + 2) +
          sobelMatrixX[2][1] * getGrayscalePixel(imageData, x + 1, y + 2) +
          sobelMatrixX[2][2] * getGrayscalePixel(imageData, x + 2, y + 2)
        );
  
        var pixelY = (
          sobelMatrixY[0][0] * getGrayscalePixel(imageData, x, y) +
          sobelMatrixY[0][1] * getGrayscalePixel(imageData, x + 1, y) +
          sobelMatrixY[0][2] * getGrayscalePixel(imageData, x + 2, y) +
          sobelMatrixY[1][0] * getGrayscalePixel(imageData, x, y + 1) +
          sobelMatrixY[1][1] * getGrayscalePixel(imageData, x + 1, y + 1) +
          sobelMatrixY[1][2] * getGrayscalePixel(imageData, x + 2, y + 1) +
          sobelMatrixY[2][0] * getGrayscalePixel(imageData, x, y + 2) +
          sobelMatrixY[2][1] * getGrayscalePixel(imageData, x + 1, y + 2) +
          sobelMatrixY[2][2] * getGrayscalePixel(imageData, x + 2, y + 2)
        );
  
        var magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY);
        var binary = magnitude > threshold ? 255 : 0;
  
        var index = (y * sobelDataWidth + x) * 4;
        sobelData[index] = binary; // Red channel
        sobelData[index + 1] = binary; // Green channel
        sobelData[index + 2] = binary; // Blue channel
        sobelData[index + 3] = 255; // Alpha channel
      }
    }
  
    return new ImageData(sobelData, sobelDataWidth, sobelDataHeight);
  }
  