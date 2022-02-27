//
// sad2cat.js
//


let capture;
let tracker;
let classifier;

let emojis = {};

let captureWidth = 640;
let captureHeight = 480;

let videoFullWidth = (deviceType() === "mobile");

let emotion = "";
let button = {};


function setup() 
{
    createMetaTag();

    createCanvas(windowWidth, windowHeight);

    setupCapture();
    setupTracker();
    setupEmotion();
    setupEmojis();
    setupButton();
}


function windowResized()
{
    resizeCanvas(windowWidth, windowHeight);
    setupButton();
}


function createMetaTag() 
{
    let meta = createElement('meta');
    meta.attribute('name', 'viewport');
    meta.attribute('content', 'user-scalable=no,initial-scale=1,maximum-scale=1,minimum-scale=1,width=device-width,height=device-height');

    let head = select('head');
    meta.parent(head);
}


function setupCapture()
{
    capture = createCapture(VIDEO);
    capture.elt.setAttribute('playsinline', '');
    capture.size(captureWidth, captureHeight);
    capture.hide();
}


function setupTracker()
{
    tracker = new clm.tracker();
    tracker.init();
    tracker.start(capture.elt);
}


function setupEmotion()
{
    // from clmtracker example clm_emotiondetection.html

    /*
    // set eigenvector 9 and 11 to not be regularized. This is to better detect motion of the eyebrows
    pModel.shapeModel.nonRegularizedVectors.push(9);
    pModel.shapeModel.nonRegularizedVectors.push(11);
    */

    delete emotionModel['disgusted'];
    delete emotionModel['fear'];

    classifier = new emotionClassifier();
    classifier.init(emotionModel);
}


function setupEmojis()
{
    emojis.happy = loadImage("pix/emoji_happy.png");
    emojis.sad = loadImage("pix/emoji_sad.png");
    emojis.surprised = loadImage("pix/emoji_surprised.png");
    emojis.angry = loadImage("pix/emoji_angry.png");
}


function draw() 
{
    background(0);

    drawVideo();
    drawEmotion();
    drawButton();
}


function mousePressed()
{
    if (button.mouseOver())
    {
        const caturl = "https://api.thecatapi.com/v1/images/search";
        loadJSON(caturl, getRandomCatPic);
    }
}


function getRandomCatPic(data)
{
    let catdata = data[0];
    console.log(catdata);
    window.open(catdata.url);
}


function drawEmotion()
{
    if (!classifier) return;
    let cp = tracker.getCurrentParameters();
    let emotionArray = classifier.meanPredict(cp);
    if (!emotionArray) return;

    emotion = getBestEmotion(emotionArray);

    //drawDebugText(emotionArray);

    imageMode(CENTER);
    image(emojis[emotion], width/2, height*.65);

    fill(255);
    textAlign(CENTER);
    textFont("monospace");
    textSize(20);
    text(emotion, width/2, height*.78);
}


function setupButton()
{
    button.x = width/2;
    button.y = height*.85;
    button.w = 200;
    button.h = 50;

    button.mouseOver = function() { 
        return this.x-this.w/2 < mouseX && mouseX < this.x+this.w/2 &&
               this.y-this.h/2 < mouseY && mouseY < this.y+this.h/2;
    }
}


function drawButton()
{
    if (emotion === "sad")
    {
        fill(0, 255, 0);

        if (button.mouseOver())
        {
            strokeWeight(5);
            stroke(255);
        }
        else
            noStroke();
    }
    else
    {
        fill(128);
    }

    rectMode(CENTER);
    rect(button.x, button.y, button.w, button.h, 20);

    if (emotion === "sad")
    {
        textAlign(CENTER, CENTER);
        textSize(20);
        fill(0);
        stroke(0);
        strokeWeight(1);
        text("I need a cat!", button.x, button.y);
    }
}


function drawVideo()
{
    // mobile: scale video to full width 
    // desktop: translate video to center of canvas 
    //
    // In both cases, transformation applies to both image() and
    // drawBoundingBox()

    push();

    if (videoFullWidth === true)
    {
        let s = width/captureWidth;
        scale(s, s);
    }
    else
    {
        translate(width/2 - captureWidth/2, 0);
    }

    imageMode(CORNER);

    image(capture, 0, 0, captureWidth, captureHeight);

    let positions = tracker.getCurrentPosition();
    drawBoundingBox(positions);

    pop();
}

 
function drawDebugText(emotionArray)
{
    let x = width-150;
    let y = height-300;

    // device

    fill(255);
    textAlign(LEFT);
    textSize(12);
    text(deviceType(), x, y+=25);

    // emotion values

    if (!emotionArray) return;

    for (let em of emotionArray)
        text(em.emotion + " " + em.value.toFixed(2), x, y+=25);

    // best emotion

    let bestEmotion = getBestEmotion(emotionArray);

    fill(255, 255, 0);
    text(bestEmotion, x, y+=25);
}


function getBestEmotion(emotionArray)
{
    let best = {emotion: "", value: 0};

    for (let em of emotionArray)
        if (em.value > best.value)
            best = em;

    return best.emotion; 
}


function drawBoundingBox(positions)
{
    if (!positions) return;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let position of positions)
    { 
        let x = position[0];
        let y = position[1];

        if (x<minX) minX = x;
        if (x>maxX) maxX = x;
        if (y<minY) minY = y;
        if (y>maxY) maxY = y;
    }

    stroke(0, 255, 0);
    noFill();

    rectMode(CORNERS);
    rect(minX, minY, maxX, maxY);
}


// from https://attacomsian.com/blog/javascript-detect-mobile-device

function deviceType() 
{
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return "tablet";
    }
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return "mobile";
    }
    return "desktop";
}


