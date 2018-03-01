/**
 * @file Animation Illinois Victory Badge
 * @author Luis Guitron <leg4@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global WebGL buffer for holding letters vertices */
var vertexPositionBufferLetter;

/** @global The WebGL buffer holding the vertex colors for the letter */
var vertexColorBufferLetter;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global Time stamp of previous frame in ms */
var lastTime = 0;

/*
 * 
 * Letter Vertex Data
 * 
 */

//Blue ractangles in the backgrund
var triangleVertices = [

        //Top blue rectangle
        -0.95,  0.95,  0.0,
        -0.95,  0.60,  0.0,
        0.95,  0.95,  0.0,
        -0.95,  0.60,  0.0,
        0.95,  0.95,  0.0,
        0.95, 0.60, 0.0,
        
        //Mid blue rectangle
    
        -0.75,  0.60,  0.0,
        -0.75,  -0.20,  0.0,
        0.75,  0.60,  0.0,
        -0.75,  -0.20,  0.0,
        0.75,  0.60,  0.0,
        0.75, -0.20, 0.0
];
    

//Letter I

var verticesI = [
        -0.3, 0.6,  0.0,
        0.3, 0.6,  0.0,
        -0.3, 0.4,  0.0,
        -0.3, 0.4,  0.0,
        0.3, 0.6,  0.0,
        0.3, 0.4,  0.0,

        0.15,  0.40,  0.0,
        -0.15,  0.40,  0.0,
        -0.15,  0.0,  0.0,
        -0.15,  0.0,  0.0,
        0.15,  0.0,   0.0,
        0.15,  0.40,  0.0,
        
        -0.3, -0.2,  0.0,
        0.3, -0.2,  0.0,
        -0.3,  0.0,  0.0,
        -0.3,  0.0,  0.0,
        0.3, -0.2,  0.0,
        0.3,  0.0,  0.0
];

//Letter U
var verticesU = [
        -0.8, 0.6,  0.0,
        0.3, 0.6,  0.0,
        -0.3, 0.4,  0.0,
        -0.3, 0.4,  0.0,
        0.3, 0.6,  0.0,
        0.3, 0.4,  0.0,

        0.15,  0.40,  0.0,
        -0.15,  0.40,  0.0,
        -0.15,  0.0,  0.0,
        -0.15,  0.0,  0.0,
        0.15,  0.0,   0.0,
        0.15,  0.40,  0.0,
        
        -0.3, -0.2,  0.0,
        0.3, -0.2,  0.0,
        -0.3,  0.0,  0.0,
        -0.3,  0.0,  0.0,
        0.3, -0.2,  0.0,
        0.3,  0.0,  0.0
];


/*
 * Vertices for edges in the Letters (3 edges total)
 */


var verticesLR1 = [
        -0.3, 0.6,  0.0,
        0.3, 0.6,  0.0,
        -0.3, 0.4,  0.0,
        -0.3, 0.4,  0.0,
        0.3, 0.6,  0.0,
        0.3, 0.4,  0.0
];


var verticesLR2 = [
        0.15,  0.40,  0.0,
        -0.15,  0.40,  0.0,
        -0.15,  0.0,  0.0,
        -0.15,  0.0,  0.0,
        0.15,  0.0,   0.0,
        0.15,  0.40,  0.0
];


var verticesLR3 = [
        -0.3, -0.2,  0.0,
        0.3, -0.2,  0.0,
        -0.3,  0.0,  0.0,
        -0.3,  0.0,  0.0,
        0.3, -0.2,  0.0,
        0.3,  0.0,  0.0
];


var verticesStrips = [
    
        //Orange trapezes
        //1st
        -0.7500,  -0.25,  0.0,
        -0.7500,  -0.35,  0.0,
        -0.6136,  -0.25,  0.0,
        
        -0.6136,  -0.25,  0.0,
        -0.7500,  -0.35,  0.0,
        -0.6136,  -0.35, 0.0,

        -0.7500,  -0.35,  0.0,
        -0.6136,  -0.35, 0.0,
        -0.6136,  -0.45,  0.0,
        
        //2nd
        -0.4773,  -0.25,  0.0,
        -0.4773,  -0.35,  0.0,
        -0.3409,  -0.25,  0.0,
        
        -0.3409,  -0.25,  0.0,
        -0.4773,  -0.35,  0.0,
        -0.3409,  -0.35, 0.0,
        
        -0.4773,  -0.35,  0.0,
        -0.3409,  -0.35, 0.0,
        -0.3409,  -0.45,  0.0,
        
        -0.4773,  -0.35,  0.0,
        -0.4773,  -0.45,  0.0,
        -0.3409,  -0.45,  0.0,
        
        -0.4773,  -0.45,  0.0,
        -0.4773,  -0.55,  0.0,
        -0.3409,  -0.45,  0.0,
        
        -0.3409,  -0.45,  0.0,
        -0.4773,  -0.55,  0.0,
        -0.3409,  -0.55, 0.0,
        
        -0.4773,  -0.55,  0.0,
        -0.3409,  -0.55, 0.0,
        -0.3409,  -0.65,  0.0,
        
        
        //3rd
        -0.2045,  -0.25,  0.0,
        -0.2045,  -0.35,  0.0,
        -0.0682,  -0.25,  0.0,
        
        -0.0682,  -0.25,  0.0,
        -0.2045,  -0.35,  0.0,
        -0.0682,  -0.35, 0.0,
        
        -0.2045,  -0.35,  0.0,
        -0.0682,  -0.35, 0.0,
        -0.0682,  -0.45,  0.0,
        
        -0.2045,  -0.35,  0.0,
        -0.2045,  -0.45,  0.0,
        -0.0682,  -0.45,  0.0,
        
        -0.2045,  -0.45,  0.0,
        -0.2045,  -0.55,  0.0,
        -0.0682,  -0.45,  0.0,
        
        -0.0682,  -0.45,  0.0,
        -0.2045,  -0.55,  0.0,
        -0.0682,  -0.55, 0.0,
        
        -0.2045,  -0.55,  0.0,
        -0.0682,  -0.55, 0.0,
        -0.0682,  -0.65,  0.0,
        
        -0.2045,  -0.55,  0.0,
        -0.2045,  -0.65,  0.0,
        -0.0682,  -0.55,  0.0,
        
        -0.0682,  -0.55,  0.0,
        -0.2045,  -0.65,  0.0,
        -0.0682,  -0.65, 0.0,
        
        -0.2045,  -0.65,  0.0,
        -0.0682,  -0.65, 0.0,
        -0.0682,  -0.75,  0.0,
        
        -0.2045,  -0.75,  0.0,
        -0.2045,  -0.65,  0.0,
        -0.0682,  -0.75,  0.0,
        
        -0.2045,  -0.75,  0.0,
        -0.0682,  -0.75, 0.0,
        -0.0682,  -0.85,  0.0,
        
        //4th
        0.2045,  -0.25,  0.0,
        0.2045,  -0.35,  0.0,
        0.0682,  -0.25,  0.0,
        
        0.0682,  -0.25,  0.0,
        0.2045,  -0.35,  0.0,
        0.0682,  -0.35, 0.0,
        
        0.2045,  -0.35,  0.0,
        0.0682,  -0.35, 0.0,
        0.0682,  -0.45,  0.0,
        
        0.2045,  -0.35,  0.0,
        0.2045,  -0.45,  0.0,
        0.0682,  -0.45,  0.0,
        
        0.2045,  -0.45,  0.0,
        0.2045,  -0.55,  0.0,
        0.0682,  -0.45,  0.0,
        
        0.0682,  -0.45,  0.0,
        0.2045,  -0.55,  0.0,
        0.0682,  -0.55, 0.0,
        
        0.2045,  -0.55,  0.0,
        0.0682,  -0.55, 0.0,
        0.0682,  -0.65,  0.0,
        
        0.2045,  -0.55,  0.0,
        0.2045,  -0.65,  0.0,
        0.0682,  -0.55,  0.0,
        
        0.0682,  -0.55,  0.0,
        0.2045,  -0.65,  0.0,
        0.0682,  -0.65, 0.0,
        
        0.2045,  -0.65,  0.0,
        0.0682,  -0.65, 0.0,
        0.0682,  -0.75,  0.0,
        
        0.2045,  -0.75,  0.0,
        0.2045,  -0.65,  0.0,
        0.0682,  -0.75,  0.0,
        
        0.2045,  -0.75,  0.0,
        0.0682,  -0.75, 0.0,
        0.0682,  -0.85,  0.0,
        
        //5th
        0.4773,  -0.25,  0.0,
        0.4773,  -0.35,  0.0,
        0.3409,  -0.25,  0.0,
        
        0.3409,  -0.25,  0.0,
        0.4773,  -0.35,  0.0,
        0.3409,  -0.35, 0.0,
        
        0.4773,  -0.35,  0.0,
        0.3409,  -0.35, 0.0,
        0.3409,  -0.45,  0.0,
        
        0.4773,  -0.35,  0.0,
        0.4773,  -0.45,  0.0,
        0.3409,  -0.45,  0.0,
        
        0.4773,  -0.45,  0.0,
        0.4773,  -0.55,  0.0,
        0.3409,  -0.45,  0.0,
        
        0.3409,  -0.45,  0.0,
        0.4773,  -0.55,  0.0,
        0.3409,  -0.55, 0.0,
        
        0.4773,  -0.55,  0.0,
        0.3409,  -0.55, 0.0,
        0.3409,  -0.65,  0.0,
        
        //6th
        0.7500,  -0.25,  0.0,
        0.7500,  -0.35,  0.0,
        0.6136,  -0.25,  0.0,
        
        0.6136,  -0.25,  0.0,
        0.7500,  -0.35,  0.0,
        0.6136,  -0.35, 0.0,

        0.7500,  -0.35,  0.0,
        0.6136,  -0.35, 0.0,
        0.6136,  -0.45,  0.0,
];

/**
 * 
 * Transform Variables
 * 
 */

//Global letter transform//
var scale = 1;                          /** @global Scale factor for white I  */
var minScale = 0.2;                     /** @global minScale to reach for white I before growing back to original scale*/
var scaleSpeed = 0.02;                  /** @global Change in the scale of the letter per frame of animation */
var gettingSmaller = true;              /** @global Boolean to determine wheter to scale the I bigger or smaller */
var letterRotation = Math.PI/2          /** @global Letter Rotation for changing into different letters*/
var letterTransitionPoint = 0.6;        /** @global Scale factor for the letter at which letter transitions will start and stop

//Letter rectangle transform
/*
 * The letter is made up of 3 rectangles,
 * different transformations are applied to each of them
 */
var scaleXr1 = 1.33;                  /** @global Rectangles 1 and 3 x Scale factor */
var scaleXr2 = 0.58;                  /** @global Ractangle 2 x scale */
var transXr2 = -0.313131;             /** @global Rectangle 2 x translation */
var cycleCount = 0;

//Orange strips transform
var amplitude = 0.05;            /** @global Amplitude of orange strips sine movement*/
var radians = 0;                /** @global Variable for moving orange strips according to a sine function (argument of sine function)*/
var angularSpeed = 0.2;         /** @global Angular speed for orange strips motion */
var movedVerticesStrips = [];   /** @global Array for storing current vertices' positions for orange strips*/

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */

function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

/**
 * Populate buffers with data
 */
function setupBuffers() {
  
  /*
   * Letter Rectangle 1
   */ 
  
  vertexPositionBufferLetterR1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLetterR1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLR1), gl.DYNAMIC_DRAW);
  vertexPositionBufferLetterR1.itemSize = 3;
  vertexPositionBufferLetterR1.numberOfItems = 6;
    
  vertexColorBufferLetterR1 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLetterR1);
  
  
  var colorsLetter = setColorVector(vertexPositionBufferLetterR1.numberOfItems, 1.0, 1.0, 1.0, 1.0)

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsLetter), gl.DYNAMIC_DRAW);
  vertexColorBufferLetterR1.itemSize = 4;
  vertexColorBufferLetterR1.numItems = 6;  
  
    /*
     * Letter Rectangle 2
     */
  vertexPositionBufferLetterR2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLetterR2);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLR2), gl.DYNAMIC_DRAW);
  vertexPositionBufferLetterR2.itemSize = 3;
  vertexPositionBufferLetterR2.numberOfItems = 6;
    
  vertexColorBufferLetterR2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLetterR2);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsLetter), gl.DYNAMIC_DRAW);
  vertexColorBufferLetterR2.itemSize = 4;
  vertexColorBufferLetterR2.numItems = 6;  
  
    /*
     * Letter Rectangle 3
     */
  vertexPositionBufferLetterR3 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLetterR3);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLR3), gl.DYNAMIC_DRAW);
  vertexPositionBufferLetterR3.itemSize = 3;
  vertexPositionBufferLetterR3.numberOfItems = 6;
    
  vertexColorBufferLetterR3 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLetterR3);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsLetter), gl.DYNAMIC_DRAW);
  vertexColorBufferLetterR3.itemSize = 4;
  vertexColorBufferLetterR3.numItems = 6;  
  
  /*
  
    Fixed Drawn Elements (Blue Rectangles)
  
  */
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 12;
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var colors = setColorVector(vertexPositionBuffer.numberOfItems, 0.0745, 0.1216, 0.2, 1.0)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 12;  
  
  /*
  
    Orange Strips
  
  */
  
  vertexPositionBufferS = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferS);
  moveStrips()
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(movedVerticesStrips), gl.STATIC_DRAW);
  vertexPositionBufferS.itemSize = 3;
  vertexPositionBufferS.numberOfItems = verticesStrips.length/3;
    
  vertexColorBufferS = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferS);
  
  //Set color for all orange strip vertices to orange//
  var colorsStrips = setColorVector(vertexPositionBufferS.numberOfItems, 0.9804, 0.3882, 0.0, 1.0)

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsStrips), gl.DYNAMIC_DRAW);
  vertexColorBufferS.itemSize = 4;
  vertexColorBufferS.numItems = verticesStrips.length/3;

}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  
  /*
   * Draw Fixed elements
   */
  mat4.identity(mvMatrix);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
  
  var identity = mat4.create()
  mat4.identity(identity)
  
  //Transformations to be applied to all letter rectangles//
  mat4.translate(mvMatrix, mvMatrix,[0.0,0.20,-1]);          //Translate letter to origin (0,0,0) to perform scale in place//    
  mat4.scale(mvMatrix, mvMatrix,[scale,scale,1]);            //Scale Letter according to current scale value//
  mat4.rotate(mvMatrix, mvMatrix,letterRotation,[0.0,0.0,1.0]);          //Letter rotation to change into new letters//
  mat4.translate(mvMatrix, mvMatrix,[0.0,-0.20,0]);          //Translate letter back to original position//
  
  
  /*
   * R1 vertices for letter
   */ 
  
  //Transformations only for Letter rectangle 1//
  var tr1 = mat4.create()
  mat4.copy(tr1, mvMatrix)
  mat4.scale(tr1, tr1, [scaleXr1,1,1])
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLetterR1);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLR1), gl.DYNAMIC_DRAW);
  
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttributeD, 
                         vertexPositionBufferLetterR1.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLetterR1);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBufferLetterR1.itemSize, gl.FLOAT, false, 0, 0);
  
  //Set matrices for transformation
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, tr1);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, identity);
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferLetterR1.numberOfItems);
  
  
  /*
   * R2 vertices for letter
   */
  
  //Transformations only for Letter rectangle 2//
  var tr2 = mat4.create()
  mat4.copy(tr2, mvMatrix)
  mat4.translate(tr2, tr2, [transXr2,0,0])
  mat4.scale(tr2, tr2, [scaleXr2,1,1])
  //mat4.translate(tr2, tr2, [0.52,0,0])
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLetterR2);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLR2), gl.DYNAMIC_DRAW);
  
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttributeD, 
                         vertexPositionBufferLetterR2.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLetterR2);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBufferLetterR2.itemSize, gl.FLOAT, false, 0, 0);
  
  
  //Set matrices for transformation
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, tr2);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, identity);
    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferLetterR2.numberOfItems);
  
   /*
   * R3 vertices for letter
   */
   
   
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferLetterR3);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesLR3), gl.DYNAMIC_DRAW);
  
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttributeD, 
                         vertexPositionBufferLetterR3.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLetterR3);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBufferLetterR2.itemSize, gl.FLOAT, false, 0, 0);
  
  
  //Set matrices for transformation
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, tr1);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, identity);
    
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferLetterR3.numberOfItems);

   /*
   * Draw Vertices for orange Strips
   */
  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBufferS);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(movedVerticesStrips), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBufferS.itemSize, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferS);
  
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBufferS.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, identity);
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBufferS.numberOfItems);
}

  function tick()
  {
    requestAnimFrame(tick);
    draw();
    animate();
  }

  function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;    
        
        //Set scale value for the letter
        if(gettingSmaller)
        {
            scale -= scaleSpeed
            if(scale<=minScale)
            {
                scale = minScale
                gettingSmaller = false
            }
        }
        else
        {
            scale+=scaleSpeed
            if(scale>letterTransitionPoint)
            {
                //Synchronize transform variables at cycle Ending
                if(cycleCount%4==0)
                {
                    scaleXr1 = 1
                    scaleXr2 = 1
                    transXr2 = 0
                }
                
                else if(cycleCount%4==1)
                {
                    scaleXr1 = 1.333
                    scaleXr2 = 0.58
                    transXr2 = 0.31313
                }
                
                else if(cycleCount%4==2)
                {
                    scaleXr1 = 0.97
                    scaleXr2 = 0.58
                    transXr2 = 0.20202
                }
                
                else if(cycleCount%4==3)
                {
                    scaleXr1 = 1.333
                    scaleXr2 = 0.58
                    transXr2 = -0.31313
                }
            }
            
            if(scale>=1.0)
            {
                scale = 1.0
                gettingSmaller = true
                cycleCount += 1;
            }
        }

        //Amount of scale changes per cycle = 2*(1-minScale)/scaleSpeed
        //Rotation of PI/2 radians per scale up and down
        //So the radian rotation per frame should be (PI*scaleSpeed)/4*(1-minScale)
        letterRotation -= (Math.PI*scaleSpeed)/(4*(1-minScale))
        
        
        //Rectangles 1 and 3 will move up in one scaling cycle (letter becomes small and big)
        //Changing from I to U requires scaling from 1 to 1.33 in x
        
        if(scale<letterTransitionPoint)
        {
            //Changing from U to I
            if(cycleCount%4==0)
            {
                scaleXr1 -= (0.333*scaleSpeed)/(2*(letterTransitionPoint-minScale))
                scaleXr2 += (0.48*scaleSpeed)/(2*(letterTransitionPoint-minScale))
                transXr2 += (0.31313*scaleSpeed)/(2*(letterTransitionPoint-minScale))
            }
            
            //Changing from I to U
            else if(cycleCount%4==1)
            {
                scaleXr1 += (0.333*scaleSpeed)/(2*(letterTransitionPoint-minScale))
                scaleXr2 -= (0.48*scaleSpeed)/(2*(letterTransitionPoint-minScale))
                transXr2 += (0.31313*scaleSpeed)/(2*(letterTransitionPoint-minScale))
            }
            
            //Changing from U to C
            else if(cycleCount%4==2)
            {
                scaleXr1 -= (0.36*scaleSpeed)/(2*(letterTransitionPoint-minScale))
                transXr2 -= (0.1111*scaleSpeed)/(2*(letterTransitionPoint-minScale))
            }
            
            
            //Changing from C to U
            else if(cycleCount%4==3)
            {
                scaleXr1 += (0.36*scaleSpeed)/(2*(letterTransitionPoint-minScale))
                transXr2 -= (0.50505*scaleSpeed)/(2*(letterTransitionPoint-minScale))
            }
        }
        //Set vertices values for strips
        radians += angularSpeed
        moveStrips()
        
    }
    lastTime = timeNow;
}

/*
 * Return a vector containing n values of the color passed as parameter
 */
function setColorVector(n,r,g,b,a)
{
  var colors = [];
  for (i = 0; i < n; i++) 
  {
    colors[4*i] =  r;
    colors[4*i+1] =  g;
    colors[4*i+2] =  b;
    colors[4*i+3] =  a;
  }
  return colors;
}

/*
 * Change vertex positions for orange strips
 */
function moveStrips()
{
    for (i = 0; i < verticesStrips.length; i++) { 
        //Only modify x Vertices that are not at the top of the orange strip (-0.25 y coord)//
        if(i%3==0 && verticesStrips[i+1]!=-0.25)
        {
            
            //Move even vertices On one direction
            if(10*(verticesStrips[i+1]+0.25)%2==0)
                movedVerticesStrips[i] = verticesStrips[i]+amplitude*Math.sin(radians);
            
            //Move even vertices On one direction
            else
                movedVerticesStrips[i] = verticesStrips[i]-amplitude*Math.sin(radians);
        }
        else
            movedVerticesStrips[i] = verticesStrips[i];
    }
}

 /**
 * Startup function called from html code to start program.
 */ 
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  //gl.enable(gl.DEPTH_TEST);
  tick();
}


// 
