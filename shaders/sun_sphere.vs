#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;
out vec3 vPosition;

uniform mat4 uMVP;

void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
    vPosition = aPosition;
}
