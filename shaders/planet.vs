#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 a_tex_coord;

uniform mat4 uMVP;

out vec2 v_tex_coord;

void main() {
  gl_Position = uMVP * vec4(aPosition, 1.0);
  v_tex_coord = a_tex_coord;
}
