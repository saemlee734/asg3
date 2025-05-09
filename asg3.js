var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  varying vec2 v_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

var FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;
  uniform vec4 u_FragColor;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;
  uniform sampler2D u_Sampler6;

  uniform int u_textureOption;
  uniform float u_texColorWeight;

  void main() {
    if(u_textureOption == 0) {  
      gl_FragColor = u_FragColor;
    } else if(u_textureOption == 1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if(u_textureOption == 2) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if(u_textureOption == 3) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if(u_textureOption == 4) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if(u_textureOption == 5) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if(u_textureOption == 6) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else if(u_textureOption == 7) {
      gl_FragColor = texture2D(u_Sampler5, v_UV);
    } else if(u_textureOption == 8) {
      gl_FragColor = texture2D(u_Sampler6, v_UV);
    }
  }`

const SKY = 2;
const GRASS_BOTTOM = 3;
const GRASS_SIDE = 4;
const GRASS_TOP = 5;
const DIRT = 3;
const STONE = 6;
const SUNSET_TEXTURE = 7;
const NIGHT_TEXTURE = 8;

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_textureSegment;
let camera;
let world;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_Sampler5;
let u_Sampler6;

let u_textureOption;

let g_cameraAngleX = 0;
let g_cameraAngleY = 0;
let g_cameraAngleZ = 0;
let g_animationActive = true;

// Bunny position and movement variables
let g_bunnyX = 0;
let g_bunnyZ = 0;
let g_bunnyTargetX = 0;
let g_bunnyTargetZ = 0;
let g_bunnySpeed = 0.005;
let g_bunnyRotation = 0;
let g_lastBunnyMoveTime = 0;
const g_bunnyMoveInterval = 3000; // milliseconds between direction changes

let g_humanX = 5; // Start far away
let g_humanZ = 5;
let g_humanVisible = false;

let g_humanWalking = false;
let g_humanArmAngle = 0;
let g_humanLegAngle = 0;
let g_humanWalkSpeed = 0.007;

// Sky texture state
let g_blocksPlaced = 0;
let g_currentSkyTexture = 2; // Start with sky.jpg (texture option 2)

var g_headAngle = [0.0, 0.0, 0.0];
var g_flAngle = 10.0;
var g_frAngle = 10.0;
var g_flLowerAngle = 0.0;
var g_frLowerAngle = 0.0;
var g_blAngle = -20.0;
var g_brAngle = -20.0;
var g_blLowerAngle = 40.0;
var g_brLowerAngle = 40.0;
var g_tailAngle = 0.0;

function setUpWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if(!a_UV) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if(!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if(!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if(!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0) {
    console.log('Failed to create sampler0 object');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!u_Sampler1) {
    console.log('Failed to create sampler1 object');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if(!u_Sampler2) {
    console.log('Failed to create sampler2 object');
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3) {
    console.log('Failed to create sampler3 object');
    return false;
  }

  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if(!u_Sampler4) {
    console.log('Failed to create sampler4 object');
    return false;
  }

  u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
  if(!u_Sampler5) {
    console.log('Failed to create sampler5 object');
    return false;
  }

  u_Sampler6 = gl.getUniformLocation(gl.program, 'u_Sampler6');
  if(!u_Sampler6) {
    console.log('Failed to create sampler6 object');
    return false;
  }

  u_textureOption = gl.getUniformLocation(gl.program, 'u_textureOption');
  if(!u_textureOption) {
    console.log('Failed to create texture option object');
    return false;
  }

  let x = new Matrix4();
  camera = new Camera();
  camera.eye = new Vector3([1, 0.5, -4]);
  camera.at = new Vector3([-3, 0, 6]);
  camera.up = new Vector3([0, 1, 0]);

  world = new World();
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, x.elements);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, x.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, x.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, x.elements);

}

function initTextures() {
  let image0 = new Image();
  if(!image0) {
    console.log('Failed to create image object');
    return false;
  }

  image0.onload = function() { loadTexture0(image0); };
  image0.src = './../images/sky.jpg';

  let image1 = new Image();
  if(!image1) {
    console.log('Failed to create image object');
    return false;
  }

  image1.onload = function() { loadTexture1(image1); };
  image1.src = './../images/dirt.jpg';

  let image2 = new Image();
  if(!image2) {
    console.log('Failed to create image object');
  }

  image2.onload = function() { loadTexture2(image2); };
  image2.src = './../images/grass_side.jpg';

  let image3 = new Image();
  if(!image3) {
    console.log('Failed to create image object');
  }

  image3.onload = function() { loadTexture3(image3); };
  image3.src = './../images/grass_top.jpg';

  let image4 = new Image();
  if(!image4) {
    console.log('Failed to create image object');
  }

  image4.onload = function() { loadTexture4(image4); };
  image4.src = './../images/stone.jpg';

  // Load sunset texture
  let image5 = new Image();
  if(!image5) {
    console.log('Failed to create image object');
  }

  image5.onload = function() { loadTexture5(image5); };
  image5.src = './../images/sunset.jpg';

  // Load night texture
  let image6 = new Image();
  if(!image6) {
    console.log('Failed to create image object');
  }

  image6.onload = function() { loadTexture6(image6); };
  image6.src = './../images/night.jpg';

  return true;
}

function loadTexture0(image) {
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler0, 0);

  console.log("Texture0 loaded");
}

function loadTexture1(image) {
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler1, 1);

  console.log("Texture1 loaded");
}

function loadTexture2(image) {
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler2, 2);

  console.log("Texture2 loaded");
}

function loadTexture3(image) {
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler3, 3);

  console.log("Texture3 loaded");
}

function loadTexture4(image) {
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler4, 4);

  console.log("Texture4 loaded");
}

function loadTexture5(image) {
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler5, 5);

  console.log("Texture5 loaded");
}

function loadTexture6(image) {
  console.log("Loading night texture..."); // Debug log
  let texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE6);  // Make sure this matches the texture unit
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.uniform1i(u_Sampler6, 6);  // Make sure this matches the texture unit
  console.log("Night texture loaded to texture unit 6"); // Debug log
}

function rotateCamera(ev) {
  camera.panRight(ev.movementX*0.1);
  camera.panUp(ev.movementY*0.1);
}

function addActionListeners() {
  canvas.onclick = function(ev) {
    if(!document.pointerLockElement) {
      canvas.requestPointerLock();
    }
    console.log(ev.button);
    if(ev.button == 0) {
      world.placeBlock();
      g_blocksPlaced++;

      // Update sky texture based on blocks placed
      if (g_blocksPlaced === 4) {
        g_currentSkyTexture = SUNSET_TEXTURE;
      } else if (g_blocksPlaced >= 8) {  // Changed to >= to ensure it stays on night
        g_currentSkyTexture = NIGHT_TEXTURE;
      }
    } else if(ev.button == 2) {
      world.removeBlock();
    }
  }
  document.addEventListener('pointerlockchange', function(ev) {
    if(document.pointerLockElement === canvas) {
      canvas.onmousemove = (ev) => rotateCamera(ev);
    } else {
      canvas.onmousemove = null;
    }
  });
}

function keydown(ev) {
  if(ev.keyCode == 39 || ev.keyCode == 68) {
    camera.moveRight();
  }
  if(ev.keyCode == 37 || ev.keyCode == 65) {
    camera.moveLeft();
  }
  if(ev.keyCode == 38 || ev.keyCode == 87) {
    camera.moveForward();
  }
  if(ev.keyCode == 40 || ev.keyCode == 83) {
    camera.moveBackward();
  }
  if(ev.keyCode == 81) {
    camera.panLeft(5);
  }
  if(ev.keyCode == 69) {
    camera.panRight(5);
  }
  renderAllShapes();
}

function convertMouseToEventCoords(ev) {
  var x = ev.clientX;
  var y = ev.clientY; 
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}

function renderAllShapes() {
  var start_time = performance.now();
  let projMat = camera.projectionMatrix;
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  let viewMat = camera.viewMatrix;
  viewMat.setLookAt(
    camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
    camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
    camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]
);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  let globalRotMat = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  world.drawMap();
  world.drawBlocks();

  // Bunny body vars
  var body = new Cube();

  // Bunny legs
  let legFL_1 = new Cube();
  let legFL_2 = new Cube();
  let legFL_3 = new Cube();
  let legFR_1 = new Cube();
  let legFR_2 = new Cube();
  let legFR_3 = new Cube();
  let legBL_1 = new Cube();
  let legBL_2 = new Cube();
  let legBL_3 = new Cube();
  let legBR_1 = new Cube();
  let legBR_2 = new Cube();
  let legBR_3 = new Cube();

  // Bunny tail vars
  let tail = new Cube();

  // Bunny head vars
  let head = new Cube(); 
  let neck = new Cube();
  let snout = new Cube();
  let nose = new Cube();
  let eyeL = new Cube();
  let eyeR = new Cube();

  // Bunny ears
  let earL = new Cube();
  let earR = new Cube();
  let innerEarL = new Cube();
  let innerEarR = new Cube();

  var l_flAngle = g_flAngle;
  var l_frAngle = g_frAngle;
  var l_flLowerAngle = g_flLowerAngle;
  var l_frLowerAngle = g_frLowerAngle;
  var l_blAngle = g_blAngle;
  var l_brAngle = g_brAngle;
  var l_blLowerAngle = g_blLowerAngle;
  var l_brLowerAngle = g_brLowerAngle;
  var l_neckAngle = [g_headAngle[0], g_headAngle[1], g_headAngle[2]];
  var l_tailAngle = g_tailAngle;
  var speedMultiplier = 5;
  var distLowerMultiplier = 15;
  var distUpperMultiplier = 20;
  var neckMultiplier = 5;

  if(g_animationActive) {
    // front left leg animation
    l_flAngle = g_flAngle*1 + distUpperMultiplier * Math.sin(g_seconds*speedMultiplier);
    l_flLowerAngle = g_flLowerAngle*1 -10 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier);
    l_frAngle = g_frAngle*1 + distUpperMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);
    l_frLowerAngle = g_frLowerAngle*1 -10 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);

    l_blAngle = g_blAngle*1 + 0.75*distUpperMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);
    l_brAngle = g_brAngle*1 + 0.75*distUpperMultiplier * Math.sin(g_seconds*speedMultiplier);
    l_blLowerAngle = g_blLowerAngle*1 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier + Math.PI);
    l_brLowerAngle = g_brLowerAngle*1 + distLowerMultiplier * Math.sin(g_seconds*speedMultiplier);

    l_neckAngle[0] = g_headAngle[0]*1 + neckMultiplier * Math.cos(g_seconds*5);

    l_tailAngle = g_tailAngle*1 + 10 * Math.sin(g_seconds*5);
  }

  // Bunny main body
  {
    body.color = [0.7, 0.7, 0.7, 1.0];
    body.matrix.scale(0.4, 0.4, 0.7);
    body.matrix.translate(-0.5, -0.5, -0.5);
    body.render();
    
    tail.color = [1.0, 1.0, 1.0, 1.0];
    tail.matrix.translate(-0.07, 0.1, 0.3);
    tail.matrix.rotate(l_tailAngle, 0, 1, 0);
    tail.matrix.scale(0.15, 0.15, 0.15);
    tail.render();
  }

  {
    neck.color = [0.7, 0.7, 0.7, 1.0];
    neck.matrix.translate(0, -0.05, -0.3);
    neck.matrix.rotate(-30, 1, 0, 0);
    neck.matrix.rotate(l_neckAngle[0], 1, 0, 0);
    neck.matrix.rotate(l_neckAngle[1], 0, 1, 0);
    neck.matrix.rotate(l_neckAngle[2], 0, 0, 1);
    var n_mat = new Matrix4(neck.matrix);
    neck.matrix.scale(0.2, 0.2, 0.1);
    neck.matrix.translate(-0.5,0.7, 0);
    neck.render();

    head.color = [0.7, 0.7, 0.7, 1.0];
    head.matrix = n_mat;
    head.matrix.translate(-0.125, 0.35, -0.1);
    head.matrix.rotate(30, 1, 0, 0);
    var head_mat = new Matrix4(head.matrix);
    head.matrix.scale(0.25, 0.25, 0.25);
    head.render();

    earL.color = [0.6, 0.6, 0.6, 1.0];
    earL.matrix = new Matrix4(head_mat);
    earL.matrix.translate(0.15, 0.25, 0.2);
    earL.matrix.rotate(90, 0, 1, 0);
    earL.matrix.scale(0.05, 0.4, 0.1);
    earL.render();

    innerEarL.color = [1.0, 0.7, 0.8, 1.0];
    innerEarL.matrix = new Matrix4(head_mat);
    innerEarL.matrix.translate(0.17, 0.25, 0.18);
    innerEarL.matrix.rotate(90, 0, 1, 0);
    innerEarL.matrix.translate(0, 0, -0.01);
    innerEarL.matrix.scale(0.04, 0.35, 0.08);
    innerEarL.render();

    earR.color = [0.6, 0.6, 0.6, 1.0];
    earR.matrix = new Matrix4(head_mat);
    earR.matrix.translate(0.01, 0.25, 0.2);
    earR.matrix.rotate(90, 0, 1, 0);
    earR.matrix.scale(0.05, 0.4, 0.1);
    earR.render();

    innerEarR.color = [1.0, 0.7, 0.8, 1.0];
    innerEarR.matrix = new Matrix4(head_mat);
    innerEarR.matrix.translate(0.031, 0.25, 0.18);
    innerEarR.matrix.rotate(90, 0, 1, 0);
    innerEarR.matrix.translate(0, 0, -0.01);
    innerEarR.matrix.scale(0.04, 0.35, 0.08);
    innerEarR.render();

    eyeL.color = [1.0, 1.0, 1.0, 1.0];
    eyeL.matrix = new Matrix4(head_mat);
    eyeL.matrix.translate(0.21, 0.15, 0.05);
    eyeL.matrix.scale(0.07, 0.07, 0.07);
    eyeL.render();
    
    eyeR.color = [1.0, 1.0, 1.0, 1.0];
    eyeR.matrix = new Matrix4(head_mat);
    eyeR.matrix.translate(-0.03, 0.15, 0.05);
    eyeR.matrix.scale(0.07, 0.07, 0.07);
    eyeR.render();

    eyeL.color = [0.0, 0.0, 0.0, 1.0];
    eyeL.matrix = new Matrix4(head_mat);
    eyeL.matrix.translate(0.25, 0.155, 0.065);
    eyeL.matrix.scale(0.04, 0.04, 0.04);
    eyeL.render();

    eyeR.color = [0.0, 0.0, 0.0, 1.0];
    eyeR.matrix = new Matrix4(head_mat);
    eyeR.matrix.translate(-0.035, 0.155, 0.065);
    eyeR.matrix.scale(0.04, 0.04, 0.04);
    eyeR.render();
    
    snout.color = [0.6, 0.6, 0.6, 1.0];
    snout.matrix = head_mat;
    snout.matrix.translate(0.03, 0, -0.1);
    var snout_mat = new Matrix4(snout.matrix);
    snout.matrix.scale(0.2, 0.1, 0.1);
    snout.render();

    nose.color = [1.0, 0.7, 0.8, 1.0];
    nose.matrix = snout_mat;
    nose.matrix.translate(0.06, 0.05, -0.03);
    nose.matrix.scale(0.08, 0.06, 0.08);
    nose.render();
  }

  // Front left leg
  {
    legFL_1.color = [0.6, 0.6, 0.6, 1.0];
    legFL_1.matrix.setTranslate(0.12, -0.05, -0.25);
    legFL_1.matrix.rotate(l_flAngle, 1, 0, 0);
    var fl_matrix = new Matrix4(legFL_1.matrix);
    legFL_1.matrix.rotate(180, 1, 0, 0);
    legFL_1.matrix.scale(0.1, 0.17, 0.13);
    legFL_1.render();

    legFL_2.color = [0.6, 0.6, 0.6, 1.0];
    legFL_2.matrix = fl_matrix;
    legFL_2.matrix.translate(0.01, -0.01, -0.1);
    legFL_2.matrix.rotate(180, 1, 0, 0);
    legFL_2.matrix.rotate(l_flLowerAngle, 1, 0, 0);
    var fl2_matrix = new Matrix4(legFL_2.matrix);
    legFL_2.matrix.scale(0.08, 0.25, 0.08);
    legFL_2.render();

    legFL_3.color = [0.9, 0.9, 0.9, 1.0];
    legFL_3.matrix = fl2_matrix;
    legFL_3.matrix.translate(0, 0.15, 0.01);
    legFL_3.matrix.scale(0.1, 0.1, 0.1);
    legFL_3.render();
  }

  // Front right leg
  {
    legFR_1.color = [0.6, 0.6, 0.6, 1.0];
    legFR_1.matrix.setTranslate(-0.22, -0.05, -0.25);
    legFR_1.matrix.rotate(l_frAngle, 1, 0, 0);
    var fr_matrix = new Matrix4(legFR_1.matrix);
    legFR_1.matrix.rotate(180, 1, 0, 0);
    legFR_1.matrix.scale(0.1, 0.17, 0.13);
    legFR_1.render();

    legFR_2.color = [0.6, 0.6, 0.6, 1.0];
    legFR_2.matrix = fr_matrix;
    legFR_2.matrix.translate(0.01, -0.01, -0.1);
    legFR_2.matrix.rotate(180, 1, 0, 0);
    legFR_2.matrix.rotate(l_frLowerAngle, 1, 0, 0);
    var fr2_matrix = new Matrix4(legFR_2.matrix);
    legFR_2.matrix.scale(0.08, 0.18, 0.08);
    legFR_2.render();

    legFR_3.color = [0.9, 0.9, 0.9, 1.0];
    legFR_3.matrix = fr2_matrix;
    legFR_3.matrix.translate(0, 0.15, 0.01);
    legFR_3.matrix.scale(0.1, 0.1, 0.1);
    legFR_3.render();
  }

  // Back legs
  {
    legBL_1.color = [0.6, 0.6, 0.6, 1.0];
    legBL_1.matrix.translate(0.1, -0.01,0.35);
    legBL_1.matrix.rotate(180, 1, 0, 0);
    legBL_1.matrix.rotate(l_blAngle, 1, 0, 0);
    var bl_matrix = new Matrix4(legBL_1.matrix);
    legBL_1.matrix.scale(0.2, 0.2, 0.3);
    legBL_1.render();

    legBL_2.color = [0.6, 0.6, 0.6, 1.0];
    legBL_2.matrix = bl_matrix;
    legBL_2.matrix.translate(0.13, 0.1, 0.1);
    legBL_2.matrix.rotate(l_blLowerAngle, 1, 0, 0);
    var bl2_matrix = new Matrix4(legBL_2.matrix);
    legBL_2.matrix.scale(0.1, 0.25, 0.1);
    legBL_2.render();

    legBL_3.color = [0.9, 0.9, 0.9, 1.0];
    legBL_3.matrix = bl2_matrix;
    legBL_3.matrix.translate(0.05, 0.4, 0.05);
    legBL_3.matrix.scale(0.12, 0.12, 0.12);
    legBL_3.matrix.translate(-0.5, -2, -0.5);
    legBL_3.render();
  }
  // Back right leg
  {
    legBR_1.color = [0.6, 0.6, 0.6, 1.0];
    legBR_1.matrix.translate(-0.3, 0.01, 0.35);
    legBR_1.matrix.rotate(180, 1, 0, 0);
    legBR_1.matrix.rotate(l_brAngle, 1, 0, 0);
    var br_matrix = new Matrix4(legBR_1.matrix);
    legBR_1.matrix.scale(0.2, 0.2, 0.3);
    legBR_1.render();

    legBR_2.color = [0.6, 0.6, 0.6, 1.0];
    legBR_2.matrix = br_matrix;
    legBR_2.matrix.translate(-0.03, 0.1, 0.1);
    legBR_2.matrix.rotate(l_brLowerAngle, 1, 0, 0);
    var br2_matrix = new Matrix4(legBR_2.matrix);
    legBR_2.matrix.scale(0.1, 0.25, 0.1);
    legBR_2.render();

    legBR_3.color = [0.9, 0.9, 0.9, 1.0];
    legBR_3.matrix = br2_matrix;
    legBR_3.matrix.translate(0., 0.4, 0.05);
    legBR_3.matrix.scale(0.12, 0.12, 0.12);
    legBR_3.matrix.translate(-0.2, -2, -0.5);
    legBR_3.render();
  }

function drawHuman() {
  if (!g_humanVisible) return;

  const humanBaseY = -0.3; // Slightly above ground
  const skinColor = [0.4, 0.6, 0.4, 1.0];
  const shirtColor = [0.3, 0.2, 0.1, 1.0];
  const pantsColor = [0.4, 0.1, 0.1, 1.0];

  // Update human walking animation angles
  if (g_humanWalking) {
    g_humanArmAngle = 30 * Math.sin(g_seconds * 6);
    g_humanLegAngle = 30 * Math.sin(g_seconds * 6 + Math.PI);
    const dx = g_bunnyX - g_humanX;
    const dz = g_bunnyZ - g_humanZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 1) {
      g_humanX += dx / dist * g_humanWalkSpeed;
      g_humanZ += dz / dist * g_humanWalkSpeed;
    } else {
      g_humanWalking = false;
    }
  } else {
    g_humanArmAngle = 0;
    g_humanLegAngle = 0;
  }

  // Pants (base layer)
  let pants = new Cube();
  pants.color = pantsColor;
  pants.matrix.translate(g_humanX - 0.15, humanBaseY, g_humanZ - 0.075);
  pants.matrix.scale(0.3, 0.2, 0.15);
  pants.render();

  // Body (shirt)
  let body = new Cube();
  body.color = shirtColor;
  body.matrix.translate(g_humanX - 0.15, humanBaseY + 0.2, g_humanZ - 0.075);
  body.matrix.scale(0.3, 0.4, 0.15);
  body.render();

  // Head
  let head = new Cube();
  head.color = skinColor;
  head.matrix.translate(g_humanX - 0.1, humanBaseY + 0.6, g_humanZ - 0.1);
  head.matrix.scale(0.2, 0.2, 0.2);
  head.render();

  // Left Arm - raised to align with top of shirt
  let armL = new Cube();
  armL.color = skinColor;
  armL.matrix.translate(g_humanX + 0.15, humanBaseY + 0.5, g_humanZ - 0.05);
  armL.matrix.rotate(-g_humanArmAngle, 1, 0, 0);
  armL.matrix.translate(0, -0.15, 0); // pivot at shoulder
  armL.matrix.scale(0.1, 0.3, 0.1);
  armL.render();

  // Right Arm
  let armR = new Cube();
  armR.color = skinColor;
  armR.matrix.translate(g_humanX - 0.25, humanBaseY + 0.5, g_humanZ - 0.05);
  armR.matrix.rotate(g_humanArmAngle, 1, 0, 0);
  armR.matrix.translate(0, -0.15, 0);
  armR.matrix.scale(0.1, 0.3, 0.1);
  armR.render();

  // Left Leg - Fixed animation
  let legL = new Cube();
  legL.color = pantsColor;
  legL.matrix.translate(g_humanX - 0.1, humanBaseY, g_humanZ - 0.05); // Start at waist
  legL.matrix.rotate(-g_humanLegAngle, 1, 0, 0); // Rotate at hip
  legL.matrix.translate(0, -0.2, 0); // Move down to create leg
  legL.matrix.scale(0.1, 0.4, 0.1);
  legL.render();

  // Right Leg - Fixed animation
  let legR = new Cube();
  legR.color = pantsColor;
  legR.matrix.translate(g_humanX - 0.0, humanBaseY, g_humanZ - 0.05); // Start at waist
  legR.matrix.rotate(g_humanLegAngle, 1, 0, 0); // Rotate at hip
  legR.matrix.translate(0, -0.2, 0); // Move down to create leg
  legR.matrix.scale(0.1, 0.4, 0.1);
  legR.render();
}
  
  // Modify the click handler to update human position
canvas.onclick = function(ev) {
  if(!document.pointerLockElement) {
    canvas.requestPointerLock();
  }
  console.log(ev.button);
  if(ev.button == 0) {
    world.placeBlock();
    g_blocksPlaced++;

    // Calculate distance to bunny
    const dx = g_bunnyX - g_humanX;
    const dz = g_bunnyZ - g_humanZ;
    const distance = Math.sqrt(dx*dx + dz*dz);

    // Update human position if not too close
    if (distance > 1) {
      g_humanVisible = true;
      // Move human one block closer to bunny
      if (dx !== 0 || dz !== 0) {
        const moveX = dx/Math.abs(dx) * 0.1; // Move 1 block in x direction
        const moveZ = dz/Math.abs(dz) * 0.1; // Move 1 block in z direction
        g_humanX += moveX;
        g_humanZ += moveZ;
      }
      g_humanWalking = true;
    }

    // Update sky texture based on blocks placed
    if (g_blocksPlaced === 4) {
      g_currentSkyTexture = SUNSET_TEXTURE;
    } else if (g_blocksPlaced >= 8) {
      g_currentSkyTexture = NIGHT_TEXTURE;
    }
  } else if(ev.button == 2) {
    world.removeBlock();
  }
}
  drawHuman();

  let sky = new Cube();
  console.log("Current sky texture option:", g_currentSkyTexture); // Debug log
  sky.textureOption = [g_currentSkyTexture,g_currentSkyTexture,g_currentSkyTexture,g_currentSkyTexture,g_currentSkyTexture,0];
  sky.color = [1, 1, 1, 1];
  sky.matrix.translate(0, -1.2, 0);
  sky.matrix.scale(8, 8, 8);
  sky.matrix.translate(-0.5, 0, -0.5);
  sky.renderSkybox();

  let floor = new Cube();
  floor.textureOption = [DIRT, DIRT, DIRT, DIRT, DIRT, DIRT];
  floor.color = [.5, .5, .5, 1];
  floor.matrix.translate(0, -1.1, 0.0);
  floor.matrix.scale(8, 0, 4);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  let random_cube = new Cube();
  random_cube.color = [1, 0, 0, 1];
  random_cube.textureOption = [GRASS_SIDE, GRASS_SIDE, GRASS_SIDE, GRASS_SIDE, GRASS_TOP, GRASS_BOTTOM];
  random_cube.matrix.translate(-0.75, -1, -1.25);
  random_cube.matrix.scale(0.25, 0.25, 0.25);

  let random_cube2 = new Cube();
  random_cube2.color = [1, 0, 0, 1];
  random_cube2.textureOption = 0;
  random_cube2.matrix.translate(-1, -1, -1);
  random_cube2.matrix.scale(0.25, 0.25, 0.25);

  var duration = performance.now() - start_time;
  let x_coord = Math.floor((camera.at.elements[0] + 4) * 4);
  let y_coord = Math.floor((camera.at.elements[1] + 1) * 4 - 3);
  let z_coord = Math.floor((camera.at.elements[2] + 4) * 4);

  let x_eye = Math.floor((camera.eye.elements[0] + 4) * 4);
  let y_eye = Math.floor((camera.eye.elements[1] + 1) * 4 - 3);
  let z_eye = Math.floor((camera.eye.elements[2] + 4) * 4);


  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), 'performance-display');
}

function sendTextToHTML(txt, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlID) {
    console.log("Failed to get " + htmlID + " from HTML.");
    return;
  }
  htmlElm.innerHTML = txt;
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderAllShapes();
  requestAnimationFrame(tick);
}

function main() {
  setUpWebGL();
  connectVariablesToGLSL();
  addActionListeners();
  initTextures();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  document.onkeydown = keydown;
  
  renderAllShapes();
  requestAnimationFrame(tick);
}