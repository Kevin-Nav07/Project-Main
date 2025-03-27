#version 300 es
precision mediump float;
out vec4 fragColor;

void main() {
  // The sun appears as a bright yellow/orange light.
  fragColor = vec4(1.0, 0.9, 0.3, 1.0);
}
