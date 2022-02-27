//
// sad2cat.js
//


let capture;
let tracker;
let classifier;

let emojis = {};

let w = 640; 
let h = 480;


function setup() 
{
    createCanvas(windowWidth, windowHeight);

    setupCapture();
    setupTracker();
    setupEmotion();
    setupEmojis();
}


function setupCapture()
{
    capture = createCapture(VIDEO);
    capture.elt.setAttribute('playsinline', '');
    capture.size(w, h);
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

    imageMode(CENTER);
    image(capture, width/2, h/2, w, h);

    let positions = tracker.getCurrentPosition();
    drawBoundingBox(positions);

    if (!classifier) return;
    let cp = tracker.getCurrentParameters();
    let emotionArray = classifier.meanPredict(cp);
    if (!emotionArray) return;

    drawEmotionText(emotionArray);

    let emotion = getBestEmotion(emotionArray);

    imageMode(CENTER);
    image(emojis[emotion], width/2, height*.75);
}


function drawEmotionText(emotionArray)
{
    // black box

    noStroke();
    fill(0);
    rectMode(CORNER);
    rect(width-125, 0, 150, 150);

    // emotion values

    if (!emotionArray) return;

    fill(255);

    let x = width-100;
    let y = 0;

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


    // hack: set origin to upper left corner of video 
    // (positioned at top-center)
    push();
    translate(width/2-w/2, 0); 
    rectMode(CORNERS);
    rect(minX, minY, maxX, maxY);
    pop();
}

