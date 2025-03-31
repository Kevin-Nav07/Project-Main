#version 300 es
precision mediump float;

in vec3 aStarPosition;
in float aStarSize;
in float aBrightnessPhase;
in vec3 aColor;

uniform mat4 uMVP;
uniform float uTime;

out float vBrightness;
out vec3 vColor;

void main() {
    gl_Position = uMVP * vec4(aStarPosition, 1.0);
    
    // Compute twinkling brightness factor (0.0 to 1.0) using sine and a per‑star phase.
    vBrightness = 0.5 + 0.5 * sin(uTime + aBrightnessPhase);
    vColor = aColor;
    
    // Set point size from attribute
    gl_PointSize = aStarSize;
}
