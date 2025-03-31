#version 300 es
precision mediump float;

uniform float uEmissiveIntensity;
out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord);
    if (r > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.4, 0.5, r);
    vec3 headColor = vec3(0.9, 0.95, 1.0) * uEmissiveIntensity;
    fragColor = vec4(headColor, alpha);
}
