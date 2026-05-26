// divides screen horizontally n times, detects which section your nose is in, sends that as a string to arduino
//uses ml5 / p5phone by nick puckett (https://github.com/npuckett/p5-phone/tree/6c8828d98528f9ed47a89827ccfa7c2d443e2b1c/examples/ml5/PHONE_FaceMesh_two_points)
//webserial adapted from aaryan pashine (https://github.com/caizoryan/hydra-interface)
/*
ML5 FaceMesh Detection - Multiple Points with Velocity (Phone Adapted)

This script uses ML5 FaceMesh with p5-phone for automatic coordinate mapping.
It tracks 5 face points: eyes, lips, and nose with velocity tracking.
Works on both phone and desktop with portrait orientation.

Key Variables:
- cam: PhoneCamera instance for video feed
- faceMesh: ML5 FaceMesh detection model
- faces: Array to store detected faces
- facePointIndex1-5: Indices of face points to track (two-variable method)
- facePointData1-5: Global variables storing face point data (two-variable method)
- distance1_2, angle1_2: Global measurement variables for eyes
- distance3_4, angle3_4: Global measurement variables for lips
- velocity5: Global velocity data for nose (x, y, speed)

Key Functions:
- setup(): Initializes canvas and PhoneCamera
- gotFaces(): Callback function when faces are detected
- showPoint(): Highlights a specific keypoint with given color and index
- getKeypoint(): Helper function to safely get keypoint data
- measureDistance(point1, point2): Calculates and shows distance between two points in pixels
- measureAngle(basePoint, endPoint): Calculates and shows angle from horizontal in degrees
- measureVelocity(current, previous): Calculates and shows velocity in x, y directions and speed

Common FaceMesh Keypoint Indices (468 points total):
Key landmarks:
1: Right eye inner corner
4: Nose tip
13: Upper lip center
14: Lower lip center
152: Chin
234: Left eye outer corner
454: Right eye outer corner

Example - Using the two-variable method with global measurements:
// Global variables are declared at top for indices, data, and measurements
// In draw(), data and measurements are automatically updated each frame:
facePointData1 = getKeypoint(facePointIndex1, 0);
distance1_2 = measureDistance(facePointData1, facePointData2);
angle1_2 = measureAngle(facePointData1, facePointData2);
velocity5 = measureVelocity(facePointData5, facePointData5Prev);

Controls:
- Touch screen: Toggle video visibility
- Change showData variable (true/false) to toggle measurement visualization
*/

// ==============================================
// GLOBAL VARIABLES
// ==============================================
let cam;                // PhoneCamera instance
let faceMesh;           // ML5 FaceMesh model
let faces = [];         // Detected faces
let showVideo = true;   // Toggle video display
let showData = true;    // Toggle measurement visualization (lines, arcs, text)
let serial; // variable to hold an instance of the serialport library


// Two-variable method: Define which points to track and store their data
let facePointIndex1 = 234;  // Left eye outer corner
let facePointData1 = null;  // Stores mapped left eye data

let facePointIndex2 = 454;  // Right eye outer corner
let facePointData2 = null;  // Stores mapped right eye data

let facePointIndex3 = 13;   // Upper lip center
let facePointData3 = null;  // Stores mapped upper lip data

let facePointIndex4 = 14;   // Lower lip center
let facePointData4 = null;  // Stores mapped lower lip data

let facePointIndex5 = 4;    // Nose tip
let facePointData5 = null;  // Stores mapped nose data
let facePointData5Prev = null; // Previous frame data for velocity

// Global measurement variables
let distance1_2 = 0;  // Distance between eyes
let angle1_2 = 0;     // Angle between eyes
let distance3_4 = 0;  // Distance between lips
let angle3_4 = 0;     // Angle between lips
let velocity5 = { x: 0, y: 0, speed: 0 }; // Nose velocity

//dividing the window into n parts

let n = 8;
let div_width = 1920;
let oled_index = 8;
 let val1 = 0;
        let val2 = 0;
let xindex1 = 0;
let xindex2 = 0;
let change_flag = 0;


let port = undefined;



let initialize_port = async () => {

  if(!port){
	 port = await navigator.serial.requestPort();
	console.log(port);
	await port.open({ baudRate: 9600 });

}
 
else {
if(change_flag == 1){
      console.log(oled_index);

//      const textEncoder = new TextEncoderStream();
// const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
// const writer = textEncoder.writable.getWriter();

		// await writer.write(toString(oled_index));
    // writer.releaseLock();


    const encoder = new TextEncoder();
const writer = port.writable.getWriter();
await writer.write(encoder.encode(String(oled_index).concat("\n")));
writer.releaseLock();

  }


}
}

document.onkeydown = async (e) => {
	if (e.key == "Q" || "q") {
		if (!port) initialize_port();
	}
}
// ==============================================
// SETUP - Runs once when page loads
// ==============================================
function setup() {
  // Create portrait canvas (typical phone proportions: 9:16)
  createCanvas(windowWidth, windowHeight);
  lockGestures();  // Prevent phone gestures (zoom, refresh)
  
  // Create camera: front camera, mirrored, fit to canvas height
  cam = createPhoneCamera('user', true, 'fitWidth');
  // Enable camera tap to toggle video
  enableCameraTap();

  // initialize_port();

   div_width = windowWidth/n;
  
  // Wait for camera to initialize, then create model and start detection
  cam.onReady(() => {a
    // Configure ML5 FaceMesh AFTER camera is ready
    let options = {
      maxFaces: 1,           // Only detect 1 face
      refineLandmarks: false,// Skip detailed landmarks (faster)
      runtime: 'mediapipe',  // Use MediaPipe runtime
      flipHorizontal: false  // Don't flip in ML5 - cam.mapKeypoint() handles mirroring
    };
    
    // Create FaceMesh model and start detection when ready
    faceMesh = ml5.faceMesh(options, () => {
      faceMesh.detectStart(cam.videoElement, gotFaces);
    });
  });
  
//   division_setup();

}



// ==============================================
// DRAW - Runs continuously
// ==============================================
function draw() {
  background(255);
  change_flag = 0;
  // Display the video feed
  if (showVideo && cam.ready) {
    image(cam, 0, 0);  // PhoneCamera handles positioning and mirroring
  }
  
  // Update global point data and measure between the specified points
  if (faces.length > 0) {
    // Update global variables with current point data (index, face number)
    facePointData1 = getKeypoint(facePointIndex1, 0);
    facePointData2 = getKeypoint(facePointIndex2, 0);
    facePointData3 = getKeypoint(facePointIndex3, 0);
    facePointData4 = getKeypoint(facePointIndex4, 0);
    
    // Store previous nose position for velocity calculation
    facePointData5Prev = facePointData5;
    facePointData5 = getKeypoint(facePointIndex5, 0);

    
    // Calculate global measurements
    distance1_2 = measureDistance(facePointData1, facePointData2);
    angle1_2 = measureAngle(facePointData1, facePointData2);
    distance3_4 = measureDistance(facePointData3, facePointData4);
    angle3_4 = measureAngle(facePointData3, facePointData4);
    velocity5 = measureVelocity(facePointData5, facePointData5Prev);
    
    // Eyes: Check if both points are valid and display
    if (facePointData1 && facePointData2) {
      // Show the points in different colors
      //showPoint(facePointData1, color(255, 0, 0));  // Red
      //showPoint(facePointData2, color(0, 0, 255));  // Blue
    }
    
    // Lips: Check if both points are valid and display
    if (facePointData3 && facePointData4) {
      // Show the points in different colors
      showPoint(facePointData3, color(0, 255, 0));  // Green
      showPoint(facePointData4, color(255, 0, 255));  // Magenta
    }
    
    
    // Nose: Check if point is valid and display
    if (facePointData5) {
      // Show the nose point in yellow
      showPoint(facePointData5, color(255, 255, 0));  // Yellow
        division_check(facePointData5.x);
        // if (facePointData5Prev){      
        // division_check(facePointData5.x, facePointData5Prev.x);
  
        if (change_flag == 1){
          // console.log(oled_index);
          initialize_port();
          change_flag = 0;
        }
        else{

        }
      
      
    }
  }


  
  // Draw UI
  drawUI();
}

// ==============================================
// CALLBACK - When faces are detected
// ==============================================
function gotFaces(results) {
  faces = results || [];
}

// ==============================================
// HELPER - Get keypoint with mapped coordinates
// ==============================================
// Function to get a specific keypoint with coordinate mapping
function getKeypoint(index, faceNumber = 0) {
  if (!faces || faces.length <= faceNumber) return null;
  
  const face = faces[faceNumber];
  if (!face || !face.keypoints) return null;
  
  const point = face.keypoints[index];
  if (!point) return null;
  
  // Map the keypoint using PhoneCamera for coordinate transformation
//   console.log(cam.mapKeypoint(point));
  return cam.mapKeypoint(point);
}



// ==============================================
// DISPLAY - Show a point with its coordinates
// ==============================================
function showPoint(point, pointColor) {
  if (!isValidPoint(point)) return;

  // Draw point circle at screen coordinates
  fill(pointColor);
  noStroke();
  circle(point.x, point.y, 20);
  
  // Draw point index number
  if (point.index != null) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(10);
    text(point.index, point.x, point.y);
  }
  
  // Draw point coordinates only if showData is true
  if (showData) {
    fill(255, 255, 0);
    textAlign(CENTER, TOP);
    textSize(8);
    let displayText = `(${Math.round(point.x)}, ${Math.round(point.y)})`;
    text(displayText, point.x, point.y + 15);
  }
}

// ==============================================
// MEASURE - Distance between two points
// ==============================================
function measureDistance(point1, point2) {
  if (!point1 || !point2) return null;
  
  // Calculate distance
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Draw visualization only if showData is true
  if (showData) {
    // Draw line between points
    stroke(255, 165, 0); // Orange
    strokeWeight(2);
    line(point1.x, point1.y, point2.x, point2.y);
    
    // Show distance text at midpoint
    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;
    noStroke();
    fill(255, 165, 0);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(`${Math.round(distance)}px`, midX, midY);
  }

  return distance;
}

// ==============================================
// MEASURE - Angle from horizontal
// ==============================================
function measureAngle(basePoint, endPoint) {
  if (!basePoint || !endPoint) return null;
  
  // Calculate angle
  const dx = endPoint.x - basePoint.x;
  const dy = endPoint.y - basePoint.y;
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  
  // Draw visualization only if showData is true
  if (showData) {
    // Draw angle arc
    noFill();
    stroke(255, 165, 0);
    strokeWeight(2);
    const arcRadius = 30;
    arc(basePoint.x, basePoint.y, arcRadius*2, arcRadius*2, 0, angle * PI/180);
    
    // Draw small line at 0 degrees for reference
    stroke(255, 165, 0, 127); // Semi-transparent orange
    line(basePoint.x, basePoint.y, basePoint.x + arcRadius, basePoint.y);
    
    // Show angle text near base point
    noStroke();
    fill(255, 165, 0);
    textAlign(LEFT, CENTER);
    textSize(12);
    text(`${Math.round(angle)}°`, basePoint.x + arcRadius + 5, basePoint.y);
  }

  return angle;
}

// ==============================================
// MEASURE - Velocity in x and y directions
// ==============================================
function measureVelocity(currentPoint, previousPoint) {
  // Return zero velocity if either point is missing
  if (!currentPoint || !previousPoint) {
    return { x: 0, y: 0, speed: 0 };
  }
  
  // Calculate velocity components
  const vx = currentPoint.x - previousPoint.x;
  const vy = currentPoint.y - previousPoint.y;
  const speed = Math.sqrt(vx * vx + vy * vy);
  
  // Draw visualization only if showData is true
  if (showData) {
    // Draw velocity vector from current point
    if (speed > 1) { // Only draw if there's noticeable movement
      stroke(255, 255, 0);
      strokeWeight(3);
      
      // Draw velocity arrow (scaled for visibility)
      const scale = 2;
      const endX = currentPoint.x + vx * scale;
      const endY = currentPoint.y + vy * scale;
      
      // Arrow line
      line(currentPoint.x, currentPoint.y, endX, endY);
      
      // Arrow head
      push();
      translate(endX, endY);
      rotate(atan2(vy, vx));
      fill(255, 255, 0);
      noStroke();
      triangle(-10, -5, -10, 5, 0, 0);
      pop();
    }
    
    // Show velocity text
    noStroke();
    fill(255, 255, 0);
    textAlign(CENTER, BOTTOM);
    textSize(12);
    text(`vx: ${vx.toFixed(1)} vy: ${vy.toFixed(1)} speed: ${speed.toFixed(1)}`, 
         currentPoint.x, currentPoint.y - 20);
  }
  
  return { x: vx, y: vy, speed: speed };
}

// ==============================================
// HELPER - Check if point has valid coordinates
// ==============================================
function isValidPoint(point) {
  return point && 
         typeof point.x === 'number' && 
         typeof point.y === 'number';
}

// ==============================================
// UI - Display status and instructions
// ==============================================
function drawUI() {
  push();
  fill(255);
  stroke(0);
  strokeWeight(3);
  textAlign(CENTER, TOP);
  textSize(16);
  
  // Show status at top of screen
  if (!cam.ready) {
    text('Starting camera...', width/2, 20);
  } else if (faces.length === 0) {
    text('Show your face to start tracking', width/2, 20);
  } else {
    text('Tracking 5 face points', width/2, 20);
  }
  
  // Instructions at bottom
  textSize(14);
  text('Tap screen to toggle video', width/2, height - 40);
  pop();
}

// ==============================================
// INTERACTION - Toggle video on touch
// ==============================================
function mousePressed() {
  showVideo = !showVideo;
}

function division_check(pointx) {
    for (let i = 0; i < n; i++){
        let section_width = ((i+1)*div_width)-(i*div_width);
  let int_index = oled_index;

        if (pointx < (i+1)*div_width && pointx > (i*div_width)){
            oled_index = i;
            if (oled_index != int_index){
              change_flag = 1;
            }
            else change_flag = 0;
            // console.log(oled_index);
            break;
        }
    }
};




