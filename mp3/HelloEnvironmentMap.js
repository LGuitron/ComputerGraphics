/**
 * @file A simple WebGL example for environment mapping onto a sphere
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 * @author Sidney Oderberg <sidney02@illinois.edu>
 * @author Ashwin Vijay <akvijay2@illinois.edu>
 */

var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var days=0;
var yAngle = 0.0;
var zAngle = 0.0;

// Create a place to store the textures
var cubeImage0;
var cubeImage1;
var cubeImage2;
var cubeImage3;
var cubeImage4;
var cubeImage5;
var cubeImages = [cubeImage0, cubeImage1, cubeImage2, cubeImage3, cubeImage4, cubeImage5]
var cubeMap;

// Used for storing keys pressed by the user
var map = {};

// Scaling factor for teapot after loading from obj file
var teapotScale = 1.5;

// Variable to count the number of textures loaded
var texturesLoaded = 0;

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// View parameters
// 40
var eyePt = vec3.fromValues(0.0,0.0,40.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

// ModelView matrix for the box
var mvMatrixBox = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

var mvMatrixStack = [];

// mv Matrix Stack for the boxes
var mvMatrixStackBox = [];

// Flag to determine if the textures for the skybox have been obtained
// (this has to occur before getting the teapot)
var obtainedTextures = 0;
var obtainedTeapot = 0;

//-------------------------------------------------------------------------
// Push vertices and normals into array
function pushVertex(vertexArray, normalArray, vertex, normal)
{
    for(var j=0;j<3;j++)
    {
        vertexArray.push(vertex[j]);
        normalArray.push(normal[j]);
    }
}

/**
 * Populates buffers with data for the cube
 */
function setupCubeBuffers() {

  var vertexArray=[];
  var vertexNormals=[];
  var limit_coord = 1;
  var numT = 12;
    
    /*
     *  Vertices
     */
    // Front vertices
    var v0 = [-1,-1,-1];
    var v1 = [1,-1,-1];
    var v2 = [1,1,-1];
    var v3 = [-1,1,-1];
    
    // Back vertices
    var v4 = [-1,-1,1];
    var v5 = [1,-1,1];
    var v6 = [1,1,1];
    var v7 = [-1,1,1];
    
    // Front vertices
    var n0 = [1/3, 1/3, -1/3];
    var n1 = [-1/3, 1/3, -1/3];
    var n2 = [-1/3, 1/3, -1/3];
    var n3 = [1/3, 1/3, -1/3];
    
    // Back vertices
    var n4 = [1/3, 1/3, -1/3];
    var n5 = [-1/3, 1/3, -1/3];
    var n6 = [-1/3, 1/3, -1/3];
    var n7 = [1/3, 1/3, -1/3];
    
    // Front face
    pushVertex(vertexArray, vertexNormals, v0, n0);
    pushVertex(vertexArray, vertexNormals, v1, n1);
    pushVertex(vertexArray, vertexNormals, v2, n2);
    
    pushVertex(vertexArray, vertexNormals, v0, n0);
    pushVertex(vertexArray, vertexNormals, v2, n2);
    pushVertex(vertexArray, vertexNormals, v3, n3);
    
    // Back Face
    pushVertex(vertexArray, vertexNormals, v4, n4);
    pushVertex(vertexArray, vertexNormals, v5, n5);
    pushVertex(vertexArray, vertexNormals, v6, n6);
    
    pushVertex(vertexArray, vertexNormals, v4, n4);
    pushVertex(vertexArray, vertexNormals, v6, n6);
    pushVertex(vertexArray, vertexNormals, v7, n7);
    
    // Right Face
    pushVertex(vertexArray, vertexNormals, v1, n1);
    pushVertex(vertexArray, vertexNormals, v5, n5);
    pushVertex(vertexArray, vertexNormals, v6, n6);
    
    pushVertex(vertexArray, vertexNormals, v1, n1);
    pushVertex(vertexArray, vertexNormals, v6, n6);
    pushVertex(vertexArray, vertexNormals, v2, n2);
    
    // Left Face
    pushVertex(vertexArray, vertexNormals, v0, n0);
    pushVertex(vertexArray, vertexNormals, v4, n4);
    pushVertex(vertexArray, vertexNormals, v7, n7);
    
    pushVertex(vertexArray, vertexNormals, v0, n0);
    pushVertex(vertexArray, vertexNormals, v3, n3);
    pushVertex(vertexArray, vertexNormals, v7, n7);
    
    // Top Face
    pushVertex(vertexArray, vertexNormals, v3, n3);
    pushVertex(vertexArray, vertexNormals, v2, n2);
    pushVertex(vertexArray, vertexNormals, v6, n6);
    
    pushVertex(vertexArray, vertexNormals, v3, n3);
    pushVertex(vertexArray, vertexNormals, v6, n6);
    pushVertex(vertexArray, vertexNormals, v7, n7);
    
    // Bottom Face
    pushVertex(vertexArray, vertexNormals, v0, n0);
    pushVertex(vertexArray, vertexNormals, v1, n1);
    pushVertex(vertexArray, vertexNormals, v5, n5);
    
    pushVertex(vertexArray, vertexNormals, v0, n0);
    pushVertex(vertexArray, vertexNormals, v4, n4);
    pushVertex(vertexArray, vertexNormals, v5, n5);
    
  // Specify vertices for the cube
  sphereVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexArray), gl.STATIC_DRAW);
  sphereVertexPositionBuffer.itemSize = 3;
  sphereVertexPositionBuffer.numItems = numT*3;
  
  // Specify normals to be able to do lighting calculations
  sphereVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  sphereVertexNormalBuffer.itemSize = 3;
  sphereVertexNormalBuffer.numItems = numT*3;
}





//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPushMatrixBox() {
    var copy = mat4.clone(mvMatrixBox);
    mvMatrixStackBox.push(copy);
}

//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    /*if (mvMatrixStack.length == 0) {
      throw "Invalid pop!";
    }*/
    if(mvMatrixStack.length>0)
        mvMatrix = mvMatrixStack.pop();
}

function mvPopMatrixBox() {
    /*if (mvMatrixStackBox.length == 0) {
      throw "Invalid popMatrix!";
    }*/
    if(mvMatrixStackBox.length>0)
        mvMatrixBox = mvMatrixStackBox.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}
//---------------------------------------------------------------------------------
/**
 * @param {number} value Value to determine whether it is a power of 2
 * @return {boolean} Boolean of whether value is a power of 2
 */
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

//----------------------------------------------------------------------------------
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    setupCubeBuffers();     
}

//-------------------------------------------------------------------------
/**
 * Draws a sphere from the sphere buffer
 */
function drawSphere(){
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

  // CODE GOES HERE
  // Set the texture for the cube map
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uCubeSampler"), 0);
  
  gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);
}


//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() 
{ 
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uCubeSampler"), 0);
    if(obtainedTeapot==1 && obtainedTextures==6)
    {
        /**
        *  Draw Cube
        */

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var transformVec = vec3.create();
        
        // We'll use perspective 
        mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

        // We want to look down -z, so create a lookat point in that direction    
        vec3.add(viewPt, eyePt, viewDir);
        // Then generate the lookat matrix and initialize the MV matrix to that view
        mat4.lookAt(mvMatrixBox,eyePt,viewPt,up);    

        //  What IF Condition should go here?
        mvPushMatrixBox();
        
        mat4.rotateY(mvMatrixBox, mvMatrixBox, yAngle);
        
        // New line
        mat4.rotateX(mvMatrixBox, mvMatrixBox, zAngle);
        vec3.set(transformVec,40,40,40);
        mat4.scale(mvMatrixBox, mvMatrixBox,transformVec);
        
        //setMatrixUniforms();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "uCubeSampler"), 0);
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "mapEnvironment"), 1);

        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrixBox);
        uploadNormalMatrixToShader();
        uploadProjectionMatrixToShader();

        drawSphere();
        mvPopMatrixBox();
        
        /**
        *  Draw teapot
        **/

        gl.uniform1i(gl.getUniformLocation(shaderProgram, "mapEnvironment"), 0);
        
        // We'll use perspective 
        mat4.perspective(pMatrix,degToRad(45), 
                        gl.viewportWidth / gl.viewportHeight,
                        0.1, 200.0);

        // We want to look down -z, so create a lookat point in that direction    
        vec3.add(viewPt, eyePt, viewDir);
        
        // Then generate the lookat matrix and initialize the view matrix to that view
        mat4.lookAt(vMatrix,eyePt,viewPt,up);
        
        //Draw Mesh
        //ADD an if statement to prevent early drawing of myMesh
        mvPushMatrix();
        
        /*var teapot_translate = [-0.5*(myMesh.maxXYZ[0]+myMesh.minXYZ[0]) , -0.5*(myMesh.maxXYZ[1]+myMesh.minXYZ[1]), -0.5*(myMesh.maxXYZ[2]+myMesh.minXYZ[2])];
        mat4.translate(mvMatrix, mvMatrix, [teapot_translate[0],teapot_translate[1],teapot_translate[2]+84.5]);
        mat4.scale(mvMatrix, mvMatrix, [teapotScale,teapotScale,teapotScale]);
        mat4.rotateY(mvMatrix, mvMatrix, yAngle);
        mat4.multiply(mvMatrix,vMatrix,mvMatrix);*/
        
        var teapot_translate = [-0.5*(myMesh.maxXYZ[0]+myMesh.minXYZ[0]) , -0.5*(myMesh.maxXYZ[1]+myMesh.minXYZ[1]), -0.5*(myMesh.maxXYZ[2]+myMesh.minXYZ[2])];
        mat4.translate(mvMatrix, mvMatrix, [teapot_translate[0],teapot_translate[1],teapot_translate[2]]);
        mat4.scale(mvMatrix, mvMatrix, [teapotScale,teapotScale,teapotScale]);
        mat4.rotateY(mvMatrix, mvMatrix, yAngle);
        mat4.multiply(mvMatrix,vMatrix,mvMatrix);
        
        
        setMatrixUniforms();
        myMesh.bindBuffers();
        
        //console.log("mvMatrix: " , mvMatrix);
        //console.log("nMatrix: ", nMatrix );
        
        gl.drawElements(gl.TRIANGLES, myMesh.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
        mvPopMatrix();
    }
}

//----------------------------------------------------------------------------------
/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
    days=days+0.5;
}
//----------------------------------------------------------------------------------
/**
 * Update the rotation variable when a key is pressed.
 * @param {Event} event Specifies which key is being pressed
 */
function handleKeyDown(event) {
    event.preventDefault();
    
    //Rotations in euler angles
    var xRot = 0;
    var zRot = 0;
   
    //Tilt right
    if(map['d'] || map['D'] || map['ArrowRight'])
        yAngle -= 0.1;
    
    //Tilt left
    if(map['a'] || map['A'] || map['ArrowLeft'])
        yAngle += 0.1;
}

//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url, face) {
  console.log("Getting image");
  return new Promise((resolve, reject) => {
    cubeImages[face] = new Image();
    cubeImages[face].onload = () => resolve({url, status: 'ok'});
    cubeImages[face].onerror = () => reject({url, status: 'error'});
    cubeImages[face].src = url
    console.log("Made promise");  
  });
}

/**
 * Asynchronously read a server-side text file
 */
function asyncGetFileT(url) {
  //Your code here
  console.log("Getting text file");
  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url);
      xhr.onload = () => resolve(xhr.responseText);
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send();
      console.log("Made Promise");
  });
}


//----------------------------------------------------------------------------------
/**
 * Setup a promise to load a texture
 */
function setupPromise(filename, face) {
    myPromise = asyncGetFile(filename, face);
    // We define what to do when the promise is resolved with the then() call,
    // and what to do when the promise is rejected with the catch() call
    myPromise.then((status) => {
        handleTextureLoaded(cubeImages[face], face)
        console.log("Yay! got the file");
        obtainedTextures += 1;
    })
    .catch(
        // Log the rejection reason
       (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

//----------------------------------------------------------------------------------
/**
 * Creates textures for application to cube.
 */
function setupTextures() {

  cubeMap = gl.createTexture();
  setupPromise("pos-z.png", 0);
  setupPromise("neg-z.png", 1);
  setupPromise("pos-y.png", 2);
  setupPromise("neg-y.png", 3);
  setupPromise("pos-x.png", 4);
  setupPromise("neg-x.png", 5);
}

/**
 *  Generate mesh for teapot
 */
function setupMesh(filename) {
   //Your code here
    myMesh = new TriMesh();
    myPromise = asyncGetFileT(filename);
    myPromise.then((retrievedText) => {
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay, got the teapot");
        obtainedTeapot = 1;
    })
    .catch(
        (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}


//----------------------------------------------------------------------------------
/**
 * Texture handling. Generates mipmap and sets texture parameters.
 * @param {Object} image Image for cube application
 * @param {Number} face Which face of the cubeMap to add texture to
 */
function handleTextureLoaded(image, face) {

  // CODE GOES HERE
  if (face==0){
   gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);    
  }
  else if (face==1){
   gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);    
  }
  else if (face==2){
   gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);    
  }
  else if (face==3){
   gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);    
  } 
  else if (face==4){
   gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);    
  }
  else if (face==5){
   gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);    
  }

  // Clamping
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,    gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T,  gl.CLAMP_TO_EDGE);
    
  // Filtering
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

/*
 * Update map when user presses or releases any key
 */
onkeydown = onkeyup = function(e){
    e = e || event; // to deal with IE
    map[e.key] = e.type == 'keydown';
}




//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  document.addEventListener("keydown", handleKeyDown);
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  setupTextures();
  setupMesh("teapot_0.obj");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

