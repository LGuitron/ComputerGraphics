/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 * @param {number} init_rand_range 'roughness' value for diamond square
 * @param {number} rend_range_decay factor for roughness exponential decay
 * @param {number} cornerHeightmaxY Fixed cornern heights (tr = 1*ch, tl = 0.5*ch, br = -0.5*ch, br = -1*ch)
 */
    constructor(div,minX,maxX,minY,maxY, init_rand_range, rand_range_decay, cornerHeight){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        //Parameters used for diamond square terrain generation
        this.init_rand_range = init_rand_range
        this.rand_range_decay = rand_range_decay
        this.cornerHeight = cornerHeight
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.diamondSquare();
        console.log("Terrain: Random elevations with diamond-square")
        
        this.calculateNormals();
        console.log("Terrain: Calculated normals for each vertex")
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1)+j);
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid+1] = v[1];
        this.vBuffer[vid+2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vid = 3*(i*(this.div+1) + j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid+1];
        v[2] = this.vBuffer[vid+2];
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
        
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexDiffuseColor);
        /*gl.vertexAttribPointer(shaderProgram.vertexDiffuseColor, 
                           this.vertexDiffuseColor.itemSize,
                           gl.FLOAT, false, 0, 0);   
        */
        
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
        //printBuffers()
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexDiffuseColor);
        gl.vertexAttribPointer(shaderProgram.vertexDiffuseColor, 
                           this.vertexDiffuseColor.itemSize,
                           gl.FLOAT, false, 0, 0);  
        
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
{
    //Your code here
    var deltaX = (this.maxX - this.minX)/this.div;
    var deltaY = (this.maxY - this.minY)/this.div;
    
    for(var i=0;i<=this.div;i++)
    {
        for(var j=0;j<=this.div;j++)
        {
            this.vBuffer.push(this.minX+deltaX*j);
            this.vBuffer.push(this.minY+deltaY*i);
            this.vBuffer.push(0);
            
            this.nBuffer.push(0);
            this.nBuffer.push(0);
            this.nBuffer.push(0);
        }
    }
    
    for (var i=0;i<this.div;i++)
    {
        for(var j=0;j<this.div;j++)
        {
            var vid = i*(this.div+1) + j;
            this.fBuffer.push(vid);
            this.fBuffer.push(vid+1);
            this.fBuffer.push(vid+this.div+1);
            
            this.fBuffer.push(vid+1);
            this.fBuffer.push(vid+1+this.div+1);
            this.fBuffer.push(vid+this.div+1);
        }
    }
    
    //
    this.numVertices = this.vBuffer.length/3;
    this.numFaces = this.fBuffer.length/3;
}

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
    
/**
 * 
 * Diamond-square algorithm for terrain elevations
 * 
 */

diamondSquare()
{
    //Set range of random value for current iteration
    var rand_range = this.init_rand_range
        
    //Id of values corresponding to Z coordinates of corner vertices
    var c_bl = 2
    var c_br = 3*this.div + 2
    var c_tl = 3*this.div*(this.div+1) + 2
    var c_tr = 3*this.div*(this.div+1)+3*this.div + 2
    
    //Set fixed corner locations in order to have more control on map generation
    //Bottom left
    this.vBuffer[c_bl] = rand_range*-1*this.cornerHeight
    //Bottom right
    this.vBuffer[c_br] = rand_range*-0.5*this.cornerHeight
    //Top left
    this.vBuffer[c_tl] = rand_range*0.5*this.cornerHeight
    //Top right
    this.vBuffer[c_tr] = rand_range*1*this.cornerHeight

    
    //Looping from side lengths of exponentially decreasing size (divided by 2)
    for(var sideLength = this.div; sideLength>=2; sideLength = sideLength = sideLength/2) 
    {
        rand_range = this.rand_range_decay*rand_range
        var halfSide = sideLength/2 
        
        //Diamond Steps
        for(var x=halfSide;x<this.div;x+=sideLength)
        {
            for(var y=halfSide;y<=this.div;y+=sideLength)
            {
                
                c_bl = 3*x - 3*halfSide  + 3*y*(this.div+1) - 3*halfSide*(this.div+1)  + 2 
                c_br = 3*x + 3*halfSide  + 3*y*(this.div+1) - 3*halfSide*(this.div+1)  + 2 
                c_tl = 3*x - 3*halfSide  + 3*y*(this.div+1) + 3*halfSide*(this.div+1)  + 2 
                c_tr = 3*x + 3*halfSide  + 3*y*(this.div+1) + 3*halfSide*(this.div+1)  + 2 
                
                var c_center = 3*x + 3*y*(this.div+1) + 2
                //Set center of terrain to fixed location (for better terrain generation control)
                if(sideLength == this.div)
                    var v_center = (this.vBuffer[c_bl]+this.vBuffer[c_br]+this.vBuffer[c_tl]+this.vBuffer[c_tr])/4;
                else
                    var v_center = (this.vBuffer[c_bl]+this.vBuffer[c_br]+this.vBuffer[c_tl]+this.vBuffer[c_tr])/4 + rand_range*Math.random()-0.5*rand_range;
                this.vBuffer[c_center] = v_center
            }
        }
        
        //Square steps
        for(var x=0;x<=this.div;x+=halfSide)
        {
            for(var y=(x+halfSide)%sideLength;y<=this.div;y+=sideLength)
            {
                var c_up = 3*x + 3*y*(this.div+1) + 3*halfSide*(this.div+1)  + 2 
                var c_down = 3*x + 3*y*(this.div+1) - 3*halfSide*(this.div+1)  + 2  
                var c_left = 3*x - 3*halfSide + 3*y*(this.div+1) + 2 
                var c_right = 3*x + 3*halfSide + 3*y*(this.div+1) + 2 
                
                var c_center = 3*x + 3*y*(this.div+1) + 2
                
                //Left edge
                if(x==0)
                    var v_center = (this.vBuffer[c_up]+this.vBuffer[c_down]+this.vBuffer[c_right])/3 + rand_range*Math.random()-0.5*rand_range
                
                //Right Edge
                else if(x==this.div)
                    var v_center = (this.vBuffer[c_up]+this.vBuffer[c_down]+this.vBuffer[c_left])/3 + rand_range*Math.random()-0.5*rand_range
                
                //Down edge
                else if(y==0)
                    var v_center = (this.vBuffer[c_up]+this.vBuffer[c_left]+this.vBuffer[c_right])/3 + rand_range*Math.random()-0.5*rand_range
                
                //Up Edge
                else if(y==this.div)
                    var v_center = (this.vBuffer[c_down]+this.vBuffer[c_left]+this.vBuffer[c_right])/3 + rand_range*Math.random()-0.5*rand_range
                
                //Center edge
                else
                    var v_center = (this.vBuffer[c_up]+this.vBuffer[c_down]+this.vBuffer[c_left]+this.vBuffer[c_right])/4 + rand_range*Math.random()-0.5*rand_range
                this.vBuffer[c_center] = v_center
            }
        }
    }
}

//Function for recalculating triangle normals after diamond square
calculateNormals()
{
    for (var i=0;i<this.fBuffer.length/3;i+=1)
    {
        var v1= this.fBuffer[3*i];
        var v2= this.fBuffer[3*i+1];
        var v3= this.fBuffer[3*i+2];
        
        var norm = vec3.create();
        //V1 - V2
        var vect1 = vec3.fromValues(this.vBuffer[3*v2] - this.vBuffer[3*v1], this.vBuffer[3*v2+1] - this.vBuffer[3*v1+1], this.vBuffer[3*v2+2] - this.vBuffer[3*v1+2]);
        //V3 - V1
        var vect2 = vec3.fromValues(this.vBuffer[3*v3] - this.vBuffer[3*v1], this.vBuffer[3*v3+1] - this.vBuffer[3*v1+1], this.vBuffer[3*v3+2] - this.vBuffer[3*v1+2]);
        
        vec3.cross(norm, vect1, vect2);
        
        //Update value of normals for each vertes
        this.nBuffer[3*v1] += norm[0]
        this.nBuffer[3*v1+1] += norm[1]
        this.nBuffer[3*v1+2] += norm[2]
        
        this.nBuffer[3*v2] += norm[0]
        this.nBuffer[3*v2+1] += norm[1]
        this.nBuffer[3*v2+2] += norm[2]
        
        this.nBuffer[3*v3] += norm[0]
        this.nBuffer[3*v3+1] += norm[1]
        this.nBuffer[3*v3+2] += norm[2]
    }
}

}
