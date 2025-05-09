class Triangle {
    constructor() {
        this.type = "triangle";
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 5.0;
        this.buffer = null;
        this.vertices = null;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var size = this.size;
    
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    
        gl.uniform1f(u_Size, size);
        let delta = this.size/200.0;
        drawTriangle([xy[0], xy[1], xy[0] - delta/2, xy[1] - delta*Math.sqrt(3)/2, xy[0] + delta/2, xy[1] - delta*Math.sqrt(3)/2]);
    }

    render3D() {
      var n = 3;
      var xy = this.position;
      var rgba = this.color;
      var size = this.size;

      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      if(this.vertices === null) {
        console.log("Failed to find vertices for triangle");
        return -1;
      }

      if(this.buffer === null) {
        this.buffer = gl.createBuffer();
        if (!this.buffer) {
          console.log("Failed to create the buffer object");
          return -1;
        }
      }
      drawTriangle3D(this.vertices, this.buffer);
    }
}

function drawTriangle3D(vertices) {
  var n = vertices.length/3;

  let vbuffer = gl.createBuffer();
  if (!vbuffer) {
    console.log("Failed to create the vbuffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(vbuffer, uvbuffer, vertices, uv) {
  var n = 3; 

  gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
  
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}