
/**
 * @file WebGL example for drawing terraing with diamond square elevations
 * @author Eric Shaffer <shaffer1@illinois.edu>
 * @author Luis Guitron <leg4@illinois.edu>
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global The angle of rotation around the y axis */
var viewRot = 0;

/** @global A glmatrix vector to use for transformations */
var transformVec = vec3.create();    

// Initialize the vector....
vec3.set(transformVec,0.0,0.0,-2.0);

/** @global An object holding the geometry for a 3D terrain */
var myTerrain;


// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.2,0.0);

/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);

/** @global View direction as quaternion to ease operations */
var viewDirQuat = quat.create();

/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);

/** @global Up vector represented as a quaternion */
var upQuat = quat.create();


/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */
/**var lightPosition = [10,12,3];*/
var lightPosition = [0,10,0];


/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[0,0,0];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [0,0,0];
/** @global Shininess exponent for Phong reflection */
var shininess = 250;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];


var kTerrainDiffuseBuffer = []


/** @global initial model view rotation applied to all the geometry **/
var mv_rotation = quat.create();
quat.fromEuler(mv_rotation,0,-90.0,-90.0);

// Plane motion Parameters
/** @global initial move direction and initial up for the plane **/
var initial_view_dir = vec3.fromValues(0.0,0.0,-1.0);
var initial_up = vec3.fromValues(0.0,1.0,0.0);


/** @global current plane orientation stored as a quaternion **/
var orientation = quat.create();
quat.fromEuler(orientation, 0,0,0);

/** @global variables for current plane orientation and speed **/
var moveDirection = quat.create();
var speed = 0.003;
var maxSpeed = 0.01;
var speed_delta = 0.0005;

var test = false;
var y_rotation_speed = 0.02;
var x_rotation_speed = 0.02;
var orientation_delta = quat.create();

/** @global variables storing currently pressed keys **/
var map = {};

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


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
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
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
  
  // Uniform variable for setting colors depenging on vertex z coordinate
  shaderProgram.uniformCornerHeightLoc = gl.getUniformLocation(shaderProgram, "cornerHeight");  
  
  // Uniform variable for setting fog in the environment
  shaderProgram.uniformFogLoc = gl.getUniformLocation(shaderProgram, "fogDensity");  
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(alpha,a,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    myTerrain = new Terrain(512,-3,3,-3,3, 1.0, 0.63, 0.2);    //Added parameters for diamond square in constructor
    myTerrain.loadBuffers();
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    //console.log("function draw()")
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    // Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,-0.25,-2.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    
    // Manage Rotations
    sceneRotations();
    
    setMatrixUniforms();
    setLightUniforms(lightPosition,lAmbient,lDiffuse,lSpecular);
    setMaterialUniforms(shininess,kAmbient,kSpecular);
    
    //Value to determine color depending on height
    gl.uniform1f(shaderProgram.uniformCornerHeightLoc, myTerrain.init_rand_range * myTerrain.cornerHeight);
    
    if ((document.getElementById("fog").checked))
        gl.uniform1f(shaderProgram.uniformFogLoc, 0.35);
    else
        gl.uniform1f(shaderProgram.uniformFogLoc, 0.0);
    
    
    
    myTerrain.drawTriangles();
    mvPopMatrix();

  
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    handleSpeed();
    movePlane();
    handleRotation();
    draw();
}

/**
 *
 * Handle Modle view rotation, and forward direction rotation
 * with orientation quaternion
 * 
 */ 
function sceneRotations()
{
    // Model view Matrix with initial rotations, and with rotations from user input
    // using the orientation quaternion//
    rotMatrix = mat4.create();
    //mat4.fromQuat(rotMatrix,orientation);
    //mat4.multiply(mvMatrix, mvMatrix, rotMatrix);
    mat4.fromQuat(rotMatrix,mv_rotation);
    mat4.multiply(mvMatrix, mvMatrix, rotMatrix);
    
    
    // Calculate new move direction by using the quaternion for the current
    // orientation, as well as its conjugate
    /*quat.set(moveDirection, initial_move_direction[0], initial_move_direction[1], initial_move_direction[2],0);
    quat.multiply(moveDirection, orientation, moveDirection);        //Multiply by orientation
    var orientConjugate = quat.create();
    quat.conjugate(orientConjugate, orientation)
    quat.multiply(moveDirection, orientConjugate, moveDirection);*/    //Multiply by conjugate of orientation (components x,y,z are the new view direction)
    //console.log("V: " , viewDir);
    //Set quaternion for view direction according to initial view directio
    
    var orientConjugate = quat.create();
    quat.conjugate(orientConjugate, orientation)
    
    
    //quat.set(viewDirQuat, view_dir_0[0], view_dir_0[1], view_dir_0[2],0);
    quat.set(viewDirQuat, initial_view_dir[0],initial_view_dir[1],initial_view_dir[2],0);
    quat.multiply(viewDirQuat, orientation, viewDirQuat);        //Multiply by orientation
    quat.multiply(viewDirQuat, viewDirQuat, orientConjugate);    //Multiply by conjugate of orientation (components x,y,z are the new view direction)
    
    
    
    /*quat.set(viewDirQuat, viewDir[0],viewDir[1],viewDir[2],0);
    var orientConjugate = quat.create();
    quat.conjugate(orientConjugate, orientation_delta)
    quat.multiply(viewDirQuat, orientation_delta, viewDirQuat);        //Multiply by orientation
    quat.multiply(viewDirQuat, viewDirQuat, orientConjugate);   */ //Multiply by conjugate of orientation (components x,y,z are the new view direction)
    
    quat.set(upQuat, 0,1,0,0);
    quat.multiply(upQuat, orientation, upQuat);        //Multiply by orientation
    quat.multiply(upQuat, upQuat, orientConjugate);    //Multiply by conjugate of orientation (components x,y,z are the new view direction)
    
    viewDir[0] = viewDirQuat[0];
    viewDir[1] = viewDirQuat[1];
    viewDir[2] = viewDirQuat[2];
    
    up[0] = upQuat[0];
    up[1] = upQuat[1];
    up[2] = upQuat[2];
}

/*
 * Function for moving the plane to the current forward direction
 */
function movePlane()
{
    eyePt[0] += viewDir[0]*speed;
    eyePt[1] += viewDir[1]*speed;
    eyePt[2] += viewDir[2]*speed;
}


/*
 * Handle plane rotations according to map of currently pressed keys
 */
function handleRotation()
{
    //Rotations in euler angles
    var xRot = 0;
    var zRot = 0;
    
    //Tilt up
    if(map['w'] || map['W'] || map['ArrowUp'])
        zRot = y_rotation_speed
   
    //Tilt down
    if(map['s'] || map['S'] || map['ArrowDown'])
        zRot = -1*y_rotation_speed
   
    //Tilt right
    if(map['d'] || map['D'] || map['ArrowRight'])
        xRot = x_rotation_speed
    
    //Tilt left
    if(map['a'] || map['A'] || map['ArrowLeft'])
        xRot = -1*x_rotation_speed
    
    quat.setAxisAngle(orientation_delta, initial_view_dir, xRot);
    quat.multiply(orientation, orientation, orientation_delta);
    
    var y_rotation_axis = vec3.create();
    vec3.cross(y_rotation_axis,initial_view_dir,initial_up);
    quat.setAxisAngle(orientation_delta, y_rotation_axis, zRot);
    quat.multiply(orientation, orientation, orientation_delta);
    

    
}


/*
 * Function for handling plane speed
 */
function handleSpeed()
{
    //Speed Up
    if(map['+'] && speed < maxSpeed)
        speed += speed_delta;
    if(map['-'])
        speed -= speed_delta;
        if(speed<0.0)
            speed = 0.0;
}   


/*
 * Update map when user presses or releases any key
 */
onkeydown = onkeyup = function(e){
    e = e || event; // to deal with IE
    map[e.key] = e.type == 'keydown';
    console.log(map);
}


