#version 300 es
precision mediump float;

in vec3 vPosition;
out vec4 fragColor;

// Flicker/time uniform
uniform float uTime;
// Overall glow factor
uniform float uGlowFactor;

void main() {
    // The sphere radius is 1.0. If we want a bigger aura, we can push beyond 1.0
    float r = length(vPosition);
    if (r > 1.0) {
        discard;
    }

    // Flicker range: [1.1..1.15]
    float flicker = 1.1 + 0.05 * sin(uTime * 5.0 + r * 10.0);

    // Main body region: up to r=0.7
    float body = 1.0 - smoothstep(0.6, 0.7, r);
    // Glow region: r=0.7..1.0
    float glow = 1.0 - smoothstep(0.9, 1.0, r);

    float intensity = max(body, glow) * flicker * uGlowFactor;

    // Color from orange at edge to near-white at center
    vec3 color = mix(vec3(1.0, 0.6, 0.0), vec3(1.0, 1.0, 0.8), intensity);

    // Alpha: 1.0 in main body, fade out in glow region
    float alpha = 1.0;
    if (r > 0.7) {
        alpha = 1.0 - smoothstep(0.7, 1.0, r);
    }

    fragColor = vec4(color, alpha);
}
