#version 300 es
precision mediump float;

in vec2 v_tex_coord;
in vec3 vNormal;
in vec3 vFragPos;

uniform sampler2D uPlanetTex;
uniform vec3 uLightDir;      // Direction of incoming light (normalized)
uniform vec3 uLightColor;    // Light (sun) color/brightness
uniform vec3 uAmbientColor;  // Ambient light

out vec4 fragColor;

// Simple pseudo-random function.
float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth interpolation noise.
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

void main() {
    // Sample base texture.
    vec3 baseColor = texture(uPlanetTex, v_tex_coord).rgb;
    // Compute noise for color blending.
    float n = noise(v_tex_coord * 10.0);
    vec3 noiseColor = mix(vec3(0.0, 0.3, 0.2), vec3(0.5, 1.0, 0.4), n);
    vec3 textureColor = mix(baseColor, noiseColor, 0.5);
    
    // Compute diffuse lighting.
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    float diff = max(dot(N, L), 0.0);
    vec3 lighting = uAmbientColor + uLightColor * diff;
    
    vec3 finalColor = textureColor * lighting;
    fragColor = vec4(finalColor, 1.0);
}
