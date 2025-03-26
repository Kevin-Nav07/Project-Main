#version 300 es
precision mediump float;

in vec2 v_tex_coord;
uniform sampler2D uPlanetTex;
out vec4 fragColor;

void main() {
  fragColor = texture(uPlanetTex, v_tex_coord);
}
