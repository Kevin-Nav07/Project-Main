#version 300 es
precision mediump float;

in vec2 v_tex_coord;
in vec3 vNormal;
in vec3 vFragPos;

uniform sampler2D uSatTex;
uniform vec3 uLightDir;      // Directional light (normalized)
uniform vec3 uLightColor;    // Diffuse light brightness 
uniform vec3 uAmbientColor;  // Ambient light 
uniform vec3 uPlanetCenter;  // World position of the planet's center

out vec4 fragColor;

void main() {
    vec3 baseColor = texture(uSatTex, v_tex_coord).rgb;
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightDir);
    float diff = max(dot(N, L), 0.0);
    
    // Occlusion factor: compute vector from planet center to fragment.
    // When the fragment is "behind" the planet (relative to L), dot(toFrag, L) will be low.
    vec3 toFrag = normalize(vFragPos - uPlanetCenter);
    float occlusion = clamp(dot(toFrag, L), 0.0, 1.0);
    // sharpen the effect.
    occlusion = pow(occlusion, 2.0);
    
    vec3 lighting = uAmbientColor + uLightColor * diff * occlusion;
    fragColor = vec4(baseColor * lighting, 1.0);
}
