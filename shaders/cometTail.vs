#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aT;

uniform mat4 uMVP;
uniform float uPointSize;

out float vT;

void main() {
    gl_Position = uMVP * vec4(aPosition, 1.0);
    gl_PointSize = uPointSize;
    vT = aT;
}
