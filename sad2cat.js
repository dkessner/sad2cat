//
// sad2cat.js
//


let capture;
let tracker;
let classifier;

let w = 640; 
let h = 480;


function setup() 
{
    createCanvas(w, h*2);

    capture = createCapture(VIDEO);
    capture.elt.setAttribute('playsinline', '');
    capture.size(w, h);
    capture.hide();

    tracker = new clm.tracker();
    tracker.init();
    tracker.start(capture.elt);

    initializeEmotion();
}


function initializeEmotion()
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


function drawBoundingBox(positions)
{
    if (!positions) return;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let i=0; i<positions.length; i++)
    { 
        let x = positions[i][0];
        let y = positions[i][1];

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


function draw() 
{
    background(0);

    image(capture, 0, 0, w, h);

    let positions = tracker.getCurrentPosition();
    drawBoundingBox(positions);

    if (!classifier) return;
    let cp = tracker.getCurrentParameters();
    let emotionArray = classifier.meanPredict(cp);
    drawEmotionText(emotionArray);
}


function drawEmotionText(emotionArray)
{
    if (!emotionArray) return;

    noStroke();
    fill(0);
    rectMode(CORNER);
    rect(width-125, 0, 150, 150);
    fill(255);
    let x = width-100;
    let y = 0;

    let bestEmotion = "";
    let bestValue = 0;

    for (let i=0; i<4; i++)
    {
        let em = emotionArray[i];
        let valueFixed = em.value.toFixed(2);
        text(em.emotion + " " + valueFixed, x, y+=25);

        if (em.value > bestValue)
        {
            bestEmotion = em.emotion;
            bestValue = em.value;
        }
    }

    text(bestEmotion, x, y+=25);
}


