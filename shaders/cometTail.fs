#version 300 es
precision mediump float;

in float vT;
uniform float uGlowIntensity;  // New uniform controlling tail glow strength
out vec4 fragColor;

void main() {
    // Compute a radial coordinate from the center of the point sprite.
    vec2 coord = gl_PointCoord - vec2(0.5);
    // Stretch horizontally to yield an elliptical (streak-like) appearance.
    coord.x *= 1.5;
    float r = length(coord);
    // Compute the base alpha for the tail: bright near r=0, fading to 0 by r=0.5.
    float baseAlpha = 1.0 - smoothstep(0.4, 0.5, r);
    // Compute an additional glow term: a wider, softer halo.
    float glowAlpha = 1.0 - smoothstep(0.5, 0.7, r);
    // Combine the two effects. Also fade along the tail: brightest at the head (vT=0) and zero at the end (vT=1).
    float alpha = max(baseAlpha, glowAlpha * uGlowIntensity) * (1.0 - vT);
    vec3 tailColor = vec3(0.4, 0.95, 1.0);
    fragColor = vec4(tailColor, alpha);
}
