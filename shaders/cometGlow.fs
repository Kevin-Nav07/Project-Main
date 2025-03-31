#version 300 es
precision mediump float;

uniform float uGlowIntensity;  // controls overall glow brightness
out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float r = length(coord);
    // Discard fragments outside a circle to ensure a round glow.
    if (r > 0.5) discard;
    // Create a smooth radial fade: fully bright at the center, fading out at the edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
    // Glow color multiplied by the intensity
    vec3 glowColor = vec3(0.4, 0.95, 1.0) * uGlowIntensity;
    fragColor = vec4(glowColor, alpha);
}
