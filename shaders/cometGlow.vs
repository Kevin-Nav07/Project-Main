#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uMVP;
uniform float uPointSize;  // will be larger than the normal head

void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
    gl_PointSize = uPointSize;
}
