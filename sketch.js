//Name: LESTER LIM KAI BIN
//SIM ID: 10261499
let video;
let snapImage; //it stores the snapshot per click
let previousPixels; //to store the previous pixel for the ghosting filter

//image resolution
let imgW = 160;
let imgH = 120;

//snapImg/webcam coordinates
let snapImgX = 30;
let snapImgY = 180;
let webcamX = 32;
let webcamY = 30;

//grid labels and images coordinates
//label coordinates
let secondRow_Label = 185;
let thirdRow_Label = 335;
let fourthRow_Label = 485;
let fifthRow_Label = 635;
let firstColumn_Label = 329;
let secondColumn_Label = 509;
let thirdColumn_Label = 689;

//Grid Image coordinates
let secondtRow_Image = 200;
let thirdRow_Image = 350;
let fourthRow_Image = 500;
let fifthRow_Image = 650;
let firstColumn_Iamge = 320;
let secondColumn_Iamge = 500;
let thirdColumn_Iamge = 680;

//controls slider X-axis
let thresholdControlsX = 40;
let sliderX = 63;
let YCbCr_initialSliderValue = 127.5;

//grid list of titles and flags
let GridSliderIsVisible = false;
let gridTitles = [];

//stores last known slider
//rgb threshold
let redlast, greenlast, bluelast;
//color space #1 HSV
let Hlast, Slast, Vlast;
//color space #2 YCbCr
let Ylast, Cblast, Crlast;

//face detector
var detector;
var classifier = objectdetect.frontalface;
var faces = []; //to store all the detected faces

//dictionary containing all the filter flags
let filters = {
  //face filters (Task 13)
  greyFace: false,
  blurFace: false,
  colorSpaceFace: false,
  greyPixelFace:false,
  pixelFace: false,
  boundingBFace: false,
  //face filters (extensions)
  hatFace: false,
  heartFace: false,
  jawFace: false,
  dogFace: false,
  //webcam filters (extensions)
  stencil: false,
  neon: false,
  ghosting: false,
  pixel: false
};

//hand movement prediciton
let handpose;
let predictions = [];

//threshold for webcam image filters
const stencil_BrightnessThreshold = 128;
const ghosting_blendAlphaThreshold = 0.5;
const neon_BrightnessThreshold = 150;

//this function allows the images to be preloaded into the program before it starts. The images will be used for face filters like snapchat/tiktok.
function preload() {
  //loading image for the filters
  hatImage = loadImage("images/hat.png");
  heartImage = loadImage("images/hearts.png");
  jawImage = loadImage("images/jaw.png");
  dogImage = loadImage("images/dog.png");
}

function setup() {
  createCanvas(900, 800); //create a canva with the size of 900 x 800
  background(33, 53, 85); //converts the background to dark cyan
  video = createCapture(VIDEO); //access live webcam
  video.size(imgW, imgH); //change the size to 160 x 120
  video.position(40, 40);
  video.hide();

  //Ghosting effect extension 
  previousPixels = createImage(video.width, video.height);
  
  //the codes below is the creation of the user interface. This includes texts (labels and titles) and buttons
  //creating title for snapshot image and webcam image
  createLabel("WEBCAM", 40, 20);
  createLabel("SNAPSHOT", 40, 165);

  //creating buttons for snapshots
  createButtonStyle("SNAP", 40, 750, takesnap);
  createButtonStyle("RESET", 100, 750, resetImage);

  //grid labels
  //first row of the grid
  createGridLabel("Grey + 20% Brightness", 509, 35);
  //second row of the grid
  createGridLabel("Red Channel", firstColumn_Label, secondRow_Label);
  createGridLabel("Green Channel", secondColumn_Label, secondRow_Label);
  createGridLabel("Blue Channel", thirdColumn_Label, secondRow_Label);
  //third row of the grid
  createGridLabel("Red Threshold", firstColumn_Label, thirdRow_Label);
  createGridLabel("Green Threshold", secondColumn_Label, thirdRow_Label);
  createGridLabel("Blue Threshold", thirdColumn_Label, thirdRow_Label);
  //fourth row of the grid
  createGridLabel("Raw Image", firstColumn_Label, fourthRow_Label);
  createGridLabel("CC #1 (HSV)", secondColumn_Label, fourthRow_Label);
  createGridLabel("CC #2 (YCbCr)", thirdColumn_Label, fourthRow_Label);
  //fifth row of the grid
  createGridLabel("Face Detection", firstColumn_Label, fifthRow_Label);
  createGridLabel("CC #1 (HSV) Threshold", secondColumn_Label, fifthRow_Label);
  createGridLabel("CC #2 (YCbCr) Threshold", thirdColumn_Label, fifthRow_Label);

  //Slider Title
  createGridLabel("RGB THRESHOLD", thresholdControlsX, 335);
  createGridLabel("HSV THRESHOLD", thresholdControlsX, 445);
  createGridLabel("YCbCr THRESHOLD", thresholdControlsX, 555);

  //RGB Threshold slider control title
  createGridLabel("R : ", thresholdControlsX, 355);
  createGridLabel("G : ", thresholdControlsX, 380);
  createGridLabel("B : ", thresholdControlsX, 405);

  //Color Space #1 Sliders control title (HSV)
  createGridLabel("H : ", thresholdControlsX, 465);
  createGridLabel("S : ", thresholdControlsX, 490);
  createGridLabel("V : ", thresholdControlsX, 515);

  //Color Space #2 Sliders control title (YCbCr)
  createGridLabel("Y : ", thresholdControlsX, 575);
  createGridLabel("Cb: ", thresholdControlsX, 600);
  createGridLabel("Cr:", thresholdControlsX, 625);

  //Filter (extension)
  //Face Filter
  createLabel("Face Filters", 40, 665);
  createButtonStyle("Hat", 40, 685, () => faceDetection_webcamFilter("hatFace"));
  createButtonStyle("Heart", 100, 685, () => faceDetection_webcamFilter("heartFace"));
  createButtonStyle("Jaw", 40, 705, () => faceDetection_webcamFilter("jawFace"));
  createButtonStyle("Dog", 100, 705, () => faceDetection_webcamFilter("dogFace"));

  //Webcam Filter
  createLabel("Webcam Filters", 160, 665);
  createButtonStyle("Stencil", 160, 685, () => faceDetection_webcamFilter("stencil"));
  createButtonStyle("Ghosting", 220, 685, () => faceDetection_webcamFilter("ghosting"));
  createButtonStyle("Neon", 160, 705, () => faceDetection_webcamFilter("neon"));
  createButtonStyle("Pixel", 220, 705, () => faceDetection_webcamFilter("pixel"));

  //Face detection controls
  createGridLabel("FACE DETECTION", 329, 20);
  createGridLabel("Key 1: Bounding Box", 329, 40);
  createGridLabel("Key 2: Grey", 329, 60);
  createGridLabel("Key 3: Blur", 329, 80);
  createGridLabel("Key 4: YCbCr", 329, 100);
  createGridLabel("Key 5: Grey Pixel", 329, 120);
  createGridLabel("Key 6: Pixel", 329, 140);

  //The creation of all the sliders neccessary in the program
  //red channel slider threshold
  gridRedThresholdslider = createSlider(0, 255, 127.5);
  gridRedThresholdslider.position(sliderX, 354);
  
  //green channel slider threshold
  gridGreenThresholdslider = createSlider(0, 255, 127.5);
  gridGreenThresholdslider.position(sliderX, 379);

  //blue channel slider threshold
  gridBlueThresholdslider = createSlider(0, 255, 127.5);
  gridBlueThresholdslider.position(sliderX, 404);

  //Color space 1 sliders
  //H filter
  HSlider = createSlider(0, 360, 360);
  HSlider.position(sliderX, 464);

  //S filter
  SSlider = createSlider(0, 100, 100);
  SSlider.position(sliderX, 489);

  //V filter
  VSlider = createSlider(0, 100, 100);
  VSlider.position(sliderX, 514);

  //Color space 2 sliders
  //Y Filter
  YSlider = createSlider(0, 255, YCbCr_initialSliderValue);
  YSlider.position(sliderX, 574);

  //Cb Filter
  CbSlider = createSlider(0, 255, YCbCr_initialSliderValue);
  CbSlider.position(sliderX, 599);
  
  //Cb Filter
  CrSlider = createSlider(0, 255, YCbCr_initialSliderValue);
  CrSlider.position(sliderX, 624);

  //initializing face detection
  var scaleFactor = 1.2;
  detector = new objectdetect.detector(imgW, imgH, scaleFactor, classifier);

  //load the Handpose model from ml5.js
  handpose = ml5.handpose(video);
  
  //listen to the 'predict' event and update the predictions
  handpose.on("predict", results => {
    predictions = results;
  });
}

//This functions helps with the creation and styling of buttons for the user interface. This prevents repetition of creating and styling buttons.
function createButtonStyle(label, x, y, callback) {
  let button = createButton(label);
  button.position(x, y);
  button.style("font-size", "10px"); 
  button.style("width", "60px");
  button.style("height", "20px");
  //color change when mouse hover over the button
  button.elt.onmouseover = function() {
    button.style("background-color", "#D8C4B6");
  };

  //color resets when mouse stops hovering over the button
  button.elt.onmouseout = function() {
    button.style("background-color", "#F5EFE7");
  };

  //even darker color when the button is clicked
  button.elt.onmousedown = function() {
    button.style("background-color", "#3E5879");
  };

  //calls the callback input when button is pressed
  button.mousePressed(callback);
}

//This function helps with the creation and styling of label/titles for the user interface. This prevents repetition of creating and styling labels/titles
function createLabel(label, x, y) {
  let title = createP(label);
  fill(157, 178, 191);
  title.position(x, y);
  title.style("font-size", "15px");
  title.style("font-weight", "bold");
  title.style("margin", "0");
  title.style("color", "#F5EFE7");
}

//This functions help with the creation and styling of labels for the grid interface. This prevents repetition of creating and styling labels/titles.
function createGridLabel(label, x, y) {
  let gridTitle = createP(label);
  gridTitle.position(x, y);
  gridTitle.style("font-size", "15px");
  gridTitle.style("font-weight", "bold");
  gridTitle.style("margin", "0");
  gridTitle.style("color", "#F5EFE7");
  gridTitle.hide();
  gridTitles.push(gridTitle);
}

//this function is responsible for the visibility of sliders and titles based on the value of the variable GridSliderIsVisible
function UIVisiibility() {
  if (GridSliderIsVisible) {
    //showing the slider for the rgb threshold sliders
    gridRedThresholdslider.show();
    gridBlueThresholdslider.show();
    gridGreenThresholdslider.show();

    //showing the slider for the ycbcr threshold sliders
    YSlider.show();
    CbSlider.show();
    CrSlider.show();

    //showing the slider for color space conversion #1
    HSlider.show();
    SSlider.show();
    VSlider.show();

    //showing the title for all the slider controls as well as the grid
    gridTitles.forEach(title => title.show());
  } else {
    //hiding the slider for the rgb threshold sliders
    gridRedThresholdslider.hide();
    gridBlueThresholdslider.hide();
    gridGreenThresholdslider.hide();
    
    //showing the slider for color space conversion #1 HSV
    HSlider.hide();
    SSlider.hide();
    VSlider.hide();

    //hiding the slider for color space conversion #2 YCbCr
    YSlider.hide();
    CbSlider.hide();
    CrSlider.hide();

    //showing the title for all the slider controls as well as the grid
    gridTitles.forEach(title => title.hide());
  }
}


function takesnap() {
  if (!snapImage) {
    //removing slider and color channel that was applied to the image previously
    rbgColor = null;
    rgbsliderIsVisible = false;

    snapImage = video.get();
    image(snapImage, snapImgX, snapImgY, imgW, imgH); //draw the image being captured on webcam onto the canvas at the position (0, 0) of the canvas

    //Grid images
    //add to the grid of images with the filters
    let greyImg = greyscaleFilter(snapImage);  
    let redImg = rgbFilter(snapImage, "red");
    let blueImg = rgbFilter(snapImage, "blue");
    let greenImg = rgbFilter(snapImage, "green");
    let HSVImg = hsvFalseColor(snapImage);
    let ycbcrImg = ycbcrFalseColor(snapImage);

    image(greyImg, secondColumn_Iamge, 50, imgW, imgH);

    image(redImg, firstColumn_Iamge, secondtRow_Image, imgW, imgH);

    image(greenImg, secondColumn_Iamge, secondtRow_Image, imgW, imgH);

    image(blueImg, thirdColumn_Iamge, secondtRow_Image, imgW, imgH);

    image(snapImage, firstColumn_Iamge, fourthRow_Image, imgW, imgH);

    image(HSVImg, secondColumn_Iamge, fourthRow_Image, imgW, imgH);

    image(ycbcrImg, thirdColumn_Iamge, fourthRow_Image, imgW, imgH);

    image(snapImage, firstColumn_Iamge, fifthRow_Image, imgW, imgH);

    GridSliderIsVisible = true;
  }
}

//This function is to reset the snapshot taken if the user wants to take another snapshot.
function resetImage() {
  background(33, 53, 85); //removes all the snapshot taken by applying grey to the entire canvas

  //resetting all the variables to null/0. This is to prevent any overlaps when the user takes another snapshot
  snapImage = null;
  rbgColor = null;
  rgbsliderIsVisible = false;
  GridSliderIsVisible = false;
  bluelast = 0;
  redlast = 0;
  greenlast = 0;
  Hlast = 0;
  Slast = 0;
  Vlast = 0;
  Ylast = 0;
  Cblast = 0;
  Crlast = 0;

  //resetting all face and webcam filters flag to false
  Object.keys(filters).forEach(key => {
    filters[key] = false;
  });
}

//This function is tied to the extrea features regarding the face filter. This function changes the variable from false to true according to the button the user pressed.
function faceDetection_webcamFilter(type) {
  const filtersWithoutSnapImage = ['stencil', 'neon', 'ghosting', 'pixel'];
  if (!snapImage && filtersWithoutSnapImage.includes(type)) {
    filters[type] = true;
    return;
  }

  if (filters.hasOwnProperty(type)) {
    filters[type] = true;
  }
}

//This function is used for Task 4. The function takes in the image which then will be processed into a grey scale image as well as increasing the brightness by 20% and return the final image after loading it into imgOut. 
function greyscaleFilter(img) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  for (let x = 0; x < img.width; x++) {
      for (let y = 0; y < img.height; y++) {
          let index = (x + y * img.width) * 4;

          //increase the brightness by 20% by multiplying by 1.2 and using the min function to prevent the number from exceeeding 255 (task 5).
          let red = min(img.pixels[index + 0] * 1.2, 255);
          let green = min(img.pixels[index + 1] * 1.2, 255);
          let blue = min(img.pixels[index + 2] * 1.2, 255);

          //using LUMA formular for better accuracy
          let gray = red * 0.299 + green * 0.587 + blue * 0.114;

          imgOut.pixels[index + 0] = gray;
          imgOut.pixels[index + 1] = gray;
          imgOut.pixels[index + 2] = gray;
          imgOut.pixels[index + 3] = 255; //keep alpha channel to keep it opaque
      }
  }

  //updates the imgOut pixels with the greyscale
  imgOut.updatePixels();
  return imgOut;
}

//This function is used for task 6. The function will take in the snapshot image and the desire color (red, green or blue) and change the color of the image based on the input color. It will then be loaded into imgOut and returned
function rgbFilter(img, color) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  for (let x = 0; x < img.width; x++) {
      for (let y = 0; y < img.height; y++) {
          let index = (x + y * img.width) * 4;

          //putting the pixels into the variables
          let red = img.pixels[index + 0];
          let green = img.pixels[index + 1];
          let blue = img.pixels[index + 2];

          //add the +255 according to the color chosen and putting a threshold so it does not exceed 255.
          if (color == "red") {
            red = min(red + 255, 255);
          } else if (color == "blue") {
            blue = min(blue + 255, 255);
          } else if (color == "green") {
            green = min(green + 255, 255);
          } else {
            return img;
          }

          imgOut.pixels[index + 0] = red;
          imgOut.pixels[index + 1] = green;
          imgOut.pixels[index + 2] = blue;
          imgOut.pixels[index + 3] = 255; //keep alpha channel so its opaque
      }
  }

  //updates the imgOut pixels with the greyscale
  imgOut.updatePixels();
  return imgOut;
}

//This function is for Task 7. the fucntion is similar to the function above but it takes in threshold too. This threshold will contain the slider values which will change the color of the image according to that value.
function rgbThresholdFilter(img, color, threshold) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  //get the pixels and convert it to the color after filtering it
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];     //red value
    let g = img.pixels[i + 1]; //green value
    let b = img.pixels[i + 2]; //blue value

    //it apply threshold to Red channel based on the slider value
    if (color == "red") {
      imgOut.pixels[i] = (r > threshold) ? 255 : 0;
    } else {
      imgOut.pixels[i] = 0;
    }

    //it apply threshold to Green channel based on the slider value
    if (color == "green") {
      imgOut.pixels[i + 1] = (g > threshold) ? 255 : 0;
    } else {
      imgOut.pixels[i + 1] = 0;
    }

    //it apply threshold to Blue channel based on the slider value
    if (color == "blue") {
      imgOut.pixels[i + 2] = (b > threshold) ? 255 : 0;
    }else {
      imgOut.pixels[i + 2] = 0;
    }

    imgOut.pixels[i + 3] = 255; //ensure full opacity
  }
  
  //updates the imgOut pixels with the greyscale
  imgOut.updatePixels();
  return imgOut;
}

//Color Space Conversion #1 HSV filter
//converting image to HSV
//the function is for task 9. This function converts the image using the HSV color convertion algorithm
function imgToHSV(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  let d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; //no hue
  } else {
    if (max == r) {
      h = (g - b) / d + (g < b ? 6 : 0);
    } else if (max == g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return [h * 360, s * 100, v * 100]; //it convert Hue to degrees, S/V to %
}

//this function takes in the image and converts the image to HSV using the imgtoHSV() function. For task 9
function hsvFalseColor(img) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  //get the pixels and covert it to the color conversion
  for (let i = 0; i < img.pixels.length; i += 4) {
    //get the current pixel from image
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    let [h, s, v] = imgToHSV(r, g, b);

    imgOut.pixels[i] = map(h, 0, 360, 0, 255); //red from Hue
    imgOut.pixels[i + 1] = map(s, 0, 100, 0, 255);//green from Saturation
    imgOut.pixels[i + 2] = map(v, 0, 100, 0, 255);//blue from Value
    imgOut.pixels[i + 3] = 255; //ensure full opacity
  }

  imgOut.updatePixels();
  return imgOut;
}

//This function is for task 10. It is the threshold for the HSV algorithm. It takes in the slider values for H, S and V and it changes the image based on the slider values.
function hsvThresholdFilter(img, hMax, sMax, vMax) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  //blend the color into HSV color
  for (let i = 0; i < img.pixels.length; i += 4) {
    //get the current pixel from image
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    let [h, s, v] = imgToHSV(r, g, b); //returns the r, g, b from the image and returning it to h, s, v after applying the color space

    //it define min values relative to max sliders
    let hMin = 0;
    let sMin = 0;
    let vMin = 0;

    //it apply HSV thresholding
    if (h >= hMin && h <= hMax && s >= sMin && s <= sMax && v >= vMin && v <= vMax) {
      imgOut.pixels[i] = map(h, hMin, hMax, 0, 255);
      imgOut.pixels[i + 1] = map(s, sMin, sMax, 50, 255);
      imgOut.pixels[i + 2] = map(v, vMin, vMax, 100, 255);
    } else {
      //make the background dark
      imgOut.pixels[i] = 0;
      imgOut.pixels[i + 1] = 0;
      imgOut.pixels[i + 2] = 0;
    }
    
    imgOut.pixels[i + 3] = 255; //it ensure full opacity
  }

  imgOut.updatePixels();
  return imgOut;
}

//Color space conversion #2 YCbCr filter
//The function is for task 9. This function converts the color channel to YCbCr and returns the value after the algorithm
function imgToYcbcr(r, g, b) {
  let y = 0.299 * r + 0.587 * g + 0.114 * b; //calculate the luminance (Y)
  let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b; //calculate the chrominance (Cb)
  let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b; //calculate the chrominance (Cr)

  return [y, cb, cr]; //returns the converted r, g, b to y, cb, cr
}

//This function is for task 9. the function applies the YCbCr onto the snapshot image.
function ycbcrFalseColor(img) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  //get pixels and convert it to the color space
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    let [y, cb, cr] = imgToYcbcr(r, g, b); //applies the YCbCr algorithm to the r, g, b and returning it.

    imgOut.pixels[i] = y;
    imgOut.pixels[i + 1] = cb;
    imgOut.pixels[i + 2] = cr;
    imgOut.pixels[i + 3] = 255; // Full opacity
  }

  imgOut.updatePixels();
  return imgOut;
}

//This function is for task 10. ths function takes in the snapshot as well as the slider values for Y, Cb and Cr. It will then calculate based on the slider values and return the image after applying YCbCr algorithm
function ycbcrThresholdFilter(img, yThresh, cbThresh, crThresh) {
  let imgOut = createImage(img.width, img.height);
  imgOut.loadPixels();
  img.loadPixels();

  //get pixels and convert it to the color space based on the slider values
  for (let i = 0; i < img.pixels.length; i += 4) {
    let r = img.pixels[i];
    let g = img.pixels[i + 1];
    let b = img.pixels[i + 2];

    let [y, cb, cr] = imgToYcbcr(r, g, b); //apply the YCbCr algorithm to r, g and b

    //map the thresholded values to the original range
    y = map(y, 0, 255, 100, 255);
    cb = map(cb, 0, 255, 100, 255);
    cr = map(cr, 0, 255, 100, 255);

    //it apply thresholding
    y = (y > yThresh) ? y : 0;   //if mapped value is greater than threshold, keep it, else set to 0
    cb = (cb > cbThresh) ? cb : 0;
    cr = (cr > crThresh) ? cr : 0;
    
    imgOut.pixels[i] = y;
    imgOut.pixels[i + 1] = cb;
    imgOut.pixels[i + 2] = cr;
    imgOut.pixels[i + 3] = 255; //it ensure full opacity
  }

  imgOut.updatePixels();
  return imgOut;
}

//This function is for task 13d. This function is to apply the pixelate face filter onto the detected face image. 
function greyPixelateFaceFilter(snapImage, x, y, faceWidth, faceHeight) {
  let numBlocksX = 5; //number of blocks on x-axis
  let numBlocksY = 5; //number of blocks on y-axis

  //For task 13dii) It is used to split the detected face image into 5 by 5
  let pixelationLevelX = faceWidth / numBlocksX; //block width
  let pixelationLevelY = faceHeight / numBlocksY; //block height
  
  //used to loop through every pixel.
  for (let j = 0; j < numBlocksY; j++) {
    for (let i = 0; i < numBlocksX; i++) {
      let sumGray = 0, count = 0;
      
      for (let dy = 0; dy < pixelationLevelY; dy++) {
        for (let dx = 0; dx < pixelationLevelX; dx++) {
          let px = x + i * pixelationLevelX + dx;
          let py = y + j * pixelationLevelY + dy;
          
          if (px < x + faceWidth && py < y + faceHeight) {
            let col = snapImage.get(px, py); //get pixel color
            let r = red(col);
            let g = green(col);
            let b = blue(col);
            
            //for task 13di) It is used to convert the pixelated filter into a greyscale image
            let gray = 0.3 * r + 0.59 * g + 0.11 * b;
            
            sumGray += gray;
            count++;
          }
        }
      }
      
      let avgGray = sumGray / count; //calculates the average grayscale value
      
      //calculate position of each rectangle that is drawn
      let drawX = 320 + (x) + (i * pixelationLevelX);
      let drawY = 650 + (y) + (j * pixelationLevelY);
      let blockW = pixelationLevelX;
      let blockH = pixelationLevelY;
      
      //fills with the average color with added grey scale
      fill(avgGray);
      noStroke();
      rect(drawX, drawY, blockW, blockH); //draws the pixelated block.
    }
  }
}

//extension
//This function is the pixelated face without the grey features
function pixelateFaceFilter(snapImage, x, y, faceWidth, faceHeight) {
  //it define the number of rectangular blocks for the pixelation
  let numBlocksX = 5; //number of blocks on x
  let numBlocksY = 5; //number of blocks on y
  
  // Calculate the size of each block
  let pixelationLevelX = faceWidth / numBlocksX; // Width of each block
  let pixelationLevelY = faceHeight / numBlocksY; // Height of each block
  
  // Loop through the face region by block size
  for (let j = 0; j < numBlocksY; j++) {
    for (let i = 0; i < numBlocksX; i++) {
      
      // Calculate the average color of the block
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      
      for (let dy = 0; dy < pixelationLevelY; dy++) {
        for (let dx = 0; dx < pixelationLevelX; dx++) {
          let px = x + i * pixelationLevelX + dx;
          let py = y + j * pixelationLevelY + dy;
          
          // Make sure we're within the face bounds
          if (px < x + faceWidth && py < y + faceHeight) {
            let col = snapImage.get(px, py); // Get color of each pixel in the block
            sumR += red(col);
            sumG += green(col);
            sumB += blue(col);
            count++;
          }
        }
      }
      
      // Calculate the average color
      let avgR = sumR / count;
      let avgG = sumG / count;
      let avgB = sumB / count;
      
      // Calculate the position with scaling and offsets
      let drawX = 320 + (x) + (i * pixelationLevelX);
      let drawY = 650 + (y) + (j * pixelationLevelY);
      let blockW = pixelationLevelX;
      let blockH = pixelationLevelY;
      
      // Draw a rectangle with the average color at the calculated position
      fill(avgR, avgG, avgB); 
      noStroke();
      rect(drawX, drawY, blockW, blockH);
    }
  }
}

//this function is for task 7 and 10. It is responsible for processing the threshold images when the user interacts with the respective slider
function processThresholdImages() {
  //grab value from the slider for red, blue, green values
  let redThreshold = gridRedThresholdslider.value();
  let greenThreshold = gridGreenThresholdslider.value();
  let blueThreshold = gridBlueThresholdslider.value();

  //grab value from the slider for hMax, sMax, vMax values
  let hMax = HSlider.value();
  let sMax = SSlider.value();
  let vMax = VSlider.value();

  //grab value from the slider for Ythreshold, CbThreshold, CrThreshold values
  let Ythreshold = YSlider.value();
  let Cbthreshold = CbSlider.value();
  let Crthreshold = CrSlider.value();

  if (snapImage) {
    //This if loop helps prevent multiple images from rendering, causing lag and computer overload. It will only run if the slider value changes
    if (redlast != redThreshold || greenlast != greenThreshold || bluelast != blueThreshold) {
      //red channel threshold
      redThresholdImg = rgbThresholdFilter(snapImage, "red", redThreshold);
      image(redThresholdImg, firstColumn_Iamge, thirdRow_Image, imgW, imgH);

      //green channel threshold
      greenThresholdImg = rgbThresholdFilter(snapImage, "green", greenThreshold);
      image(greenThresholdImg, secondColumn_Iamge, thirdRow_Image, imgW, imgH);

      //blue channel threshold
      blueThresholdImg = rgbThresholdFilter(snapImage, "blue", blueThreshold);
      image(blueThresholdImg, thirdColumn_Iamge, thirdRow_Image, imgW, imgH);


      //set the latest slider value to a value that stores the latest slider value changes
      redlast = redThreshold;
      greenlast = greenThreshold;
      bluelast = blueThreshold;
    }

    if (Hlast != hMax || Slast != sMax || Vlast != vMax) {
      //color space conversion #1
      HSVThresholdImg = hsvThresholdFilter(snapImage, hMax, sMax, vMax);
      image(HSVThresholdImg, secondColumn_Iamge, fifthRow_Image, imgW, imgH);

      //set the latest slider value to a value that stores the latest slider value changes
      Hlast = hMax;
      Slast = sMax;
      Vlast = vMax;
    }
    
    if (Ylast != Ythreshold || Cblast != Cbthreshold || Crlast != Crthreshold) {
      //color space conversion #2
      YcbCrThresholdImg = ycbcrThresholdFilter(snapImage, Ythreshold, Cbthreshold, Crthreshold);
      image(YcbCrThresholdImg, thirdColumn_Iamge, fifthRow_Image, imgW, imgH);

      //set the latest slider value to a value that stores the latest slider value changes
      Ylast = Ythreshold;
      Cblast = Cbthreshold;
      Crlast = Crthreshold;
    }
  }
}

//This function is for Task 12. It detects the face from the snapshot and it will apply the filter based on the selected filter.
//This function contains the extra feature as well. It is for the face filter like tiktok/snapchat.
function faceDetection() {
  //This if condition is to prevent this function from running every second. It will only run if the snapImage is present and the filter variable is true. This is to prevent the computer from overloading and lagging.
  if (snapImage) {
    //this flag filters the keys that contains "face" and checks if any of the keys value = true
    const isAnyFaceFilterEnabled = Object.keys(filters)
    .filter(key => key.includes('Face'))  // Filter only keys that contain 'face'
    .some(key => filters[key] === true);  // Check if any of these keys have a value of true

    //use the flag variable above to run the codes if it returns true
    if (isAnyFaceFilterEnabled) {
      faces = detector.detect(snapImage.canvas);
      //loop through all the detected faces
      if (faces) {
        faces.forEach(function (face) {
          var x = face[0];
          var y = face[1];
          var faceW = face[2];
          var faceH = face[3];
          var count = face[4];
          //only overlay for confident detections (The higher the count, the more accurate it is)
          if (count > 4) {
            //apply the scale to the face coordinates
            let faceX = firstColumn_Iamge + x;  //apply the X offset the X coordinate
            let faceY = fifthRow_Image + y;  //apply the Y offset the Y coordinate

            //get the facce region using the calculated coordinates
            faceRegion = snapImage.get(x, y, faceW, faceH);

            //if loop to apply the grey filter if greyFace = true in filters
            if (filters.greyFace) {
              faceRegion.filter(GRAY);
              image(faceRegion, faceX, faceY, faceW, faceH);
              filters.greyFace = false; //change the value to false to prevent this loop from looping continuously
            }

            //if loop to apply the blur filter if blurFace = true in filters
            if(filters.blurFace) {
              faceRegion.filter(BLUR, 10);
              image(faceRegion, faceX, faceY, faceW, faceH);
              filters.blurFace = false; //change the value to false to prevent this loop from looping continuously
            } 

            //if loop to apply the color space filter if colorSpaceFace = true in filters
            if (filters.colorSpaceFace) {
              //Apply YCbCr false color filter using the function used in Task 9
              let filteredColorSpaceFace = ycbcrFalseColor(faceRegion);
              //Overlay the filtered face on the resized snapshot
              image(filteredColorSpaceFace, faceX, faceY, faceW, faceH);
              filters.colorSpaceFace = false; //change the value to false to prevent this loop from looping continuously
            } 

            //if loop to apply the pixelated face filter if greyPixelFace = true in filters
            if (filters.greyPixelFace) {
              greyPixelateFaceFilter(snapImage, x, y, faceW, faceH); 
              filters.greyPixelFace = false; //change the value to false to prevent this loop from looping continuously
            } 

            //if loop to apply the boundingbox around the face if boundingBFace = true in filters
            if (filters.boundingBFace) {
              image(snapImage, firstColumn_Iamge, fifthRow_Image, imgW, imgH);
              noFill();
              stroke(255, 0, 0); //red color for the rectangle
              rect(faceX, faceY, faceW, faceH);
            }

            //Extra Features
            if (filters.pixelFace) {
              pixelateFaceFilter(snapImage, x, y, faceW, faceH); 
              filters.pixelFace = false; //change the value to false to prevent this loop from looping continuously
            } 

            //getting the x and y coordinates to apply the filter
            let filterX = snapImgX + x;
            let filterY = snapImgY + y;

            //if loop to apply the hat filter on the head if hatFace = true in filters
            if (filters.hatFace) {
              //refreshes the image
              image(snapImage, 30, 180, imgW, imgH);
              //position the hat above the face
              let hatWidth = faceW * 1.8; //adjust size of the hat
              let hatHeight = hatWidth * (hatImage.height / hatImage.width); //maintain aspect ratio of the hat
              let hat_xOffset = 1.4;
              let hat_yOffset = 1.5;
              let hatX = filterX - (hatWidth - faceW * hat_xOffset);
              let hatY = filterY - hatHeight / hat_yOffset;

              //create the hat
              image(hatImage, hatX, hatY, hatWidth, hatHeight);
              filters.hatFace = false; //change the value to false to prevent this loop from looping continuously
            }

            //if loop to apply the hovering heart filter if heartFace = true in filters
            if (filters.heartFace) {
              //refreshes the image
              image(snapImage, 30, 180, imgW, imgH);
              //position the hat above the face
              let heartWidth = faceW * 2; //adjust size of the hat
              let heartHeight = heartWidth * (heartImage.height / heartImage.width); //maintain aspect ratio of the hat
              let heart_xOffset = 1.6;
              let heart_yOffset = 1.8;
              let heartX = filterX - (heartWidth - faceW * heart_xOffset);
              let heartY = filterY - heartHeight / heart_yOffset;

              //create the hovering hears
              image(heartImage, heartX, heartY, heartWidth, heartHeight);
              filters.heartFace = false; //change the value to false to prevent this loop from looping continuously
            }

            //if loop to apply the jawfilter if jawFace = true in filters
            if (filters.jawFace) {
              //refreshes the image
              image(snapImage, 30, 180, imgW, imgH);
              //position the hat above the face
              let jawWidth = faceW; //adjust size of the hat
              let jawHeight = jawWidth * (jawImage.height / jawImage.width); //maintain aspect ratio of the hat

              image(jawImage, filterX, filterY, jawWidth, jawHeight);
              filters.jawFace = false;
            }

            //if loop to apply the dog filter if dogFace = true in filters
            if (filters.dogFace) {
              //refreshes the image
              image(snapImage, 30, 180, imgW, imgH);
              //position the dog filter on the face
              let dogWidth = faceW * 2; //adjust size of the filter
              let dogHeight = dogWidth * (dogImage.height / dogImage.width) + 30; //maintain aspect ratio of the filter
              let dog_xOffset = 1.45;
              let dog_yOffset = 2.8;
              let dogX = filterX - (dogWidth - faceW * dog_xOffset);
              let dogY = filterY - dogHeight / dog_yOffset;
              image(dogImage, dogX, dogY, dogWidth, dogHeight);
              filters.dogFace = false;
            }
          }
        });
      }
    }
  }
}

//function to detect a peace sign (if the index and middle fingers are extended)
function isPeaceSign(hand) {
  //get the coordinates of the index and middle fingers
  let indexFinger = hand.landmarks[16]; //index finger tip
  let middleFinger = hand.landmarks[12]; //middle finger tip
  let indexBase = hand.landmarks[14]; //base of the index finger
  let middleBase = hand.landmarks[10]; //base of the middle finger

  //get the distance between the tips of the index and middle fingers
  let distance = dist(indexFinger[0], indexFinger[1], middleFinger[0], middleFinger[1]);

  //check if the distance is greater than a threshold
  let distanceThreshold = 80;  //threshold is at 80 for less sensitivity
  if (distance < distanceThreshold) {
    return false;  //returns if fingers are too close together
  }

  //check to ensure the rest of the fingers are not extended creating a fist shape
  let indexFingerCurl = dist(indexFinger[0], indexFinger[1], indexBase[0], indexBase[1]);
  let middleFingerCurl = dist(middleFinger[0], middleFinger[1], middleBase[0], middleBase[1]);

  //ensure that the rest of the fingers are curled or not extended
  let curlThreshold = 50; //threshold for determining curled fingers
  if (indexFingerCurl > curlThreshold && middleFingerCurl > curlThreshold) {
    return false; //returns if fingers are too straight or not in a peace sign position
  }

  return true; //returns if a peace sign is detected
}

//this function checks for peace sign and capture a snapshot if exist
function detectPeaceSignAndCapture(prediciton) {
  // If a hand is detected, draw keypoints
  if (prediciton.length > 0) {
    // Check for a specific hand sign (e.g., Peace Sign)
    if (isPeaceSign(prediciton[0])) {
      if (!snapImage) {
        takesnap();  // Take snapshot if peace sign is detected
      }
    }
  }
}

//Additional features
//this function creates a high-contrast black-and-white effect based on pixel brightness.
function applyStencilFilter() {
  //load current video frame pixels
  video.loadPixels();

  //set the pixels to black or white based on the brightness
  for (let i = 0; i < video.pixels.length; i += 4) {
    let r = video.pixels[i];
    let g = video.pixels[i + 1];
    let b = video.pixels[i + 2];
    let brightness = (r + g + b) / 3;
    if (brightness > stencil_BrightnessThreshold) {
      video.pixels[i] = 255;
      video.pixels[i + 1] = 255;
      video.pixels[i + 2] = 255;
    } else {
      video.pixels[i] = 0;
      video.pixels[i + 1] = 0;
      video.pixels[i + 2] = 0;
    }
  }
  //update the pixels of the video
  video.updatePixels();
}

//this function creates a blend between the current video frame and the previous one, giving the effect of ghostly images trailing behind moving objects
function applyGhostingFilter() {
  //load current video frame pixels
  video.loadPixels();
  
  //blend the current frame with the previous frame to create ghosting effect
  if (previousPixels.width > 0) {
    previousPixels.loadPixels();
    
    //blend the pixels with some transparency
    for (let i = 0; i < video.pixels.length; i += 4) {
      //get the current pixel from the video
      let r = video.pixels[i];
      let g = video.pixels[i + 1];
      let b = video.pixels[i + 2];

      //get the previous frame pixel
      let pr = previousPixels.pixels[i];
      let pg = previousPixels.pixels[i + 1];
      let pb = previousPixels.pixels[i + 2];
      
      //set the current pixel to a blend of the current frame and the previous frame
      let blendAlpha = ghosting_blendAlphaThreshold; // threshold to control how strong the ghosting effect is
      video.pixels[i] = lerp(r, pr, blendAlpha); 
      video.pixels[i + 1] = lerp(g, pg, blendAlpha);
      video.pixels[i + 2] = lerp(b, pb, blendAlpha);
    }
  }
  //update the pixels of the video
  video.updatePixels();
  
  //store the current frame to be used in the next loop
  previousPixels.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
}

//this function modifies the video to highlight bright pixels, turning them into neon blue
function applyNeonFilter() {
  //load current video frame pixels
  video.loadPixels();
  
  //blend the pixels with neon blue based on brightness
  for (let i = 0; i < video.pixels.length; i += 4) {
    //get the current pixel from video
    let r = video.pixels[i];
    let g = video.pixels[i + 1];
    let b = video.pixels[i + 2];
    let brightness = (r + g + b) / 3;
    
    if (brightness > neon_BrightnessThreshold) {
      video.pixels[i] = 0;
      video.pixels[i + 1] = 255;
      video.pixels[i + 2] = 255;
    }
  }
  //update the pixels of the video
  video.updatePixels();
}

//This function a pixelated effect on a video feed by sampling pixels from the video and drawing rectangles at their positions
function applyPixelFilter() {
  //load current video frame pixels
  video.loadPixels();

  //get the at (x,y) 
  for (let y = 0; y < height; y += 10) {
    for (let x = 0; x < width; x += 10) {
      let c = video.get(x, y);
      fill(c);
      noStroke();
      rect(x + webcamX, y + webcamY, 10, 10); //draws the pixelated rectangle
    }
  }
}

//function to process live webcam feed with different filters applied to the video in real-time
function LiveWebcam() {
  if (filters.stencil) {
    applyStencilFilter();
  }
  if (filters.ghosting) {
    applyGhostingFilter();
  }
  if (filters.neon) {
    applyNeonFilter();
  }
}

//keyPressed function for task 13. This allows an action to happen when a specific key is pressed. If it is pressed, a variable will be set to true, setting off an the if loop applying the filter
function keyPressed() {
  if (key === '2') { //check if the key pressed is 1
    for (let filter in filters) {
      // Check if the key contains the string "Face"
      if (filter.includes("Face")) {
        filters[filter] = false;  // Set value to false
      }
    }

    filters.greyFace = true;
  }

  if (key === '3') { //check if the key pressed is 2
    for (let filter in filters) {
      // Check if the key contains the string "Face"
      if (filter.includes("Face")) {
        filters[filter] = false;  // Set value to false
      }
    }

    filters.blurFace = true;
  }

  if (key === '4') {
    for (let filter in filters) {
      // Check if the key contains the string "Face"
      if (filter.includes("Face")) {
        filters[filter] = false;  // Set value to false
      }
    }

    filters.colorSpaceFace = true;
  }

  if (key === '5') {
    for (let filter in filters) {
      // Check if the key contains the string "Face"
      if (filter.includes("Face")) {
        filters[filter] = false;  // Set value to false
      }
    }

    filters.greyPixelFace = true;
  }

  if (key === '6') {
    for (let filter in filters) {
      // Check if the key contains the string "Face"
      if (filter.includes("Face")) {
        filters[filter] = false;  // Set value to false
      }
    }

    filters.pixelFace = true;
  }

  if (key === '1') {
    for (let filter in filters) {
      // Check if the key contains the string "Face"
      if (filter.includes("Face")) {
        filters[filter] = false;  // Set value to false
      }
    }

    filters.boundingBFace = true;
  }
}

function draw() {
  LiveWebcam();

  image(video, webcamX, webcamY, imgW, imgH);

  if (filters.pixel) {
    applyPixelFilter();
  }

  detectPeaceSignAndCapture(predictions);

  processThresholdImages();

  faceDetection();

  UIVisiibility();
}