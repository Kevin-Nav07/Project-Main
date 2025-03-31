#version 300 es
precision mediump float;

in vec2 v_tex_coord;
in vec3 vNormal;
in vec3 vFragPos;

uniform sampler2D uSatTex;
uniform vec3 uLightDir;      // Direction of the incoming light (normalized)
uniform vec3 uLightColor;    // Light color/brightness from the sun
uniform vec3 uAmbientColor;  // Ambient light

out vec4 fragColor;

void main(){
    vec3 baseColor = texture(uSatTex, v_tex_coord).rgb;
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    float diff = max(dot(N, L), 0.0);
    vec3 lighting = uAmbientColor + uLightColor * diff;
    vec3 finalColor = baseColor * lighting;
    fragColor = vec4(finalColor, 1.0);
}
