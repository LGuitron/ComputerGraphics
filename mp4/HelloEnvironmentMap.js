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

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,150.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

/*
 * 
 * Variables used for particle simulations
 * 
 */
// Arrays with information for each sphere
var spheres_positions = [];
var spheres_colors = [];
var spheres_velocities  = [];
var sphere_vertices = [];
var sphere_normals = [];
var numT = 0;                               // Number of triangles to draw for each sphere

var speed_range = 20.0;                       // Max speed in any given axis (coordinates traveled per second) 
var box_boundary_coord =  40;               // Boundary coordinate of the box
var last_time = Date.now()                  // Store real time for shpere position updates
var sphere_amount = 0

var subdivisionLevel = 3                    // Subdivision level for sphere geometry
var gravity = 10.0;
var drag = 0.9990;                          // Velocity reduction after each second

var max_time_delta = 50;                    // Max time delta per frame for calculating changes in velocity

//-------------------------------------------------------------------------

function resetEnvironment()
{
    console.log("RESET")
    sphere_amount = 0;
    spheres_positions = [];
    spheres_colors = [];
    spheres_velocities  = [];
    document.getElementById("sphereCount").innerHTML = sphere_amount;
}



/**
 * Populates buffers with data for spheres
 */
function createSphere(n) 
{
    for (var i=0; i < n; i++)
    {
        var sphere_velocity = [2*speed_range*(Math.random() - 0.5) , 2*speed_range*(Math.random() - 0.5),2*speed_range*(Math.random() - 0.5)];
        var sphere_position = [2*box_boundary_coord*(Math.random() - 0.5) , 2*box_boundary_coord*(Math.random() - 0.5),2*box_boundary_coord*(Math.random() - 0.5)];
        var sphere_color = vec3.fromValues(Math.random() ,Math.random(),Math.random());
        spheres_positions.push(sphere_position);
        spheres_velocities.push(sphere_velocity);
        spheres_colors.push(sphere_color);
    }
    sphere_amount += n
    document.getElementById("sphereCount").innerHTML = sphere_amount;
}

/*
 *  Function for iterating and drawing the spheres after updating their positions
 */
function drawSpheres()
{
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere_vertices), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere_normals), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gravity = document.getElementById("gravity").value;
    document.getElementById("gravityText").innerHTML= gravity;
    
    drag = document.getElementById("drag").value;
    document.getElementById("dragText").innerHTML= drag;
    updatePositions();
    
    //Pass the eye point to the shader
    gl.uniform3fv(shaderProgram.eyePt, eyePt);
    
    for(var i=0;i < spheres_positions.length;i++)
    {    
        gl.uniform3fv(shaderProgram.sphere_diffuse_color, spheres_colors[i]);
        draw(spheres_positions[i]);
    }
    last_time = Date.now();
}

/*
 *  Function for updating spheres' positions according to their current velocity
 */
function updatePositions()
{
    var time_delta = Date.now() - last_time;
    
    // Cap time delta up to a max of 100 ms
    if(time_delta > max_time_delta)
        time_delta = max_time_delta;
    
    
    for(var i=0;i < spheres_positions.length;i++)
    {    
        for (var j=0; j <3; j++)
        {
            spheres_positions[i][j] += spheres_velocities[i][j] * time_delta * 0.001;
            
            if(spheres_positions[i][j] > box_boundary_coord)
            {
                spheres_positions[i][j] = box_boundary_coord
                spheres_velocities[i][j] = -1*spheres_velocities[i][j]
            }
            else if(spheres_positions[i][j] < -1* box_boundary_coord)
            {
                spheres_positions[i][j] = -1*box_boundary_coord
                spheres_velocities[i][j] = -1*spheres_velocities[i][j]
            }
            spheres_velocities[i][j] = spheres_velocities[i][j]*Math.pow(drag,time_delta*0.001);
        }
        
        // Change velovity in y due to gravity
        spheres_velocities[i][1] -= gravity*time_delta*0.001;
    }
    console.log("time_delta: " , time_delta);
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
  
  //Variables for spheres
  shaderProgram.sphere_diffuse_color = gl.getUniformLocation(shaderProgram, "sphere_diffuse_color");
  shaderProgram.eyePt = gl.getUniformLocation(shaderProgram, "eyePt");
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
  
  gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);
}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw(translate_vector) { 

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction  lñ  
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    

    //  What IF Condition should go here?
    mvPushMatrix();
    mat4.translate(mvMatrix, mvMatrix, translate_vector);       // Place sphere in corresponding position
    
    setMatrixUniforms();
    drawSphere();
    mvPopMatrix();

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

    console.log(event["key"])
    
    if (event["key"] == "ArrowLeft") {
        createSphere(1);
    } else if (event["key"] == "ArrowDown") {
        createSphere(3);
    }
    else if (event["key"] == "ArrowUp") {
        createSphere(10);
    }
    else if (event["key"] == "ArrowRight") {
        createSphere(30);
    }
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  document.addEventListener("keydown", handleKeyDown);
  document.getElementById("sphereCount").innerHTML = sphere_amount;
  gl = createGLContext(canvas);
  
  // Create generic mesh to be used in all the spheres
  numT=sphereFromSubdivision(subdivisionLevel,sphere_vertices,sphere_normals);
  
  
  setupShaders();
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    drawSpheres();
    animate();
}

