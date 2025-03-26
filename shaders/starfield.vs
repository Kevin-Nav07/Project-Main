#version 300 es
precision mediump float;

layout(location = 0) in vec3 aStarPosition;
uniform mat4 uMVP;
void main() {
  gl_Position = uMVP * vec4(aStarPosition, 1.0);
  gl_PointSize = 2.0;
}
