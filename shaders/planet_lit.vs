#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 a_tex_coord;
layout(location = 2) in vec3 aNormal;

uniform mat4 uMVP;    // Combined Model-View-Projection matrix
uniform mat4 uModel;  // Model matrix (for transforming normals)

out vec2 v_tex_coord;
out vec3 vNormal;
out vec3 vFragPos;

void main() {
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vFragPos = worldPos.xyz;
    vNormal = mat3(uModel) * aNormal;
    v_tex_coord = a_tex_coord;
    gl_Position = uMVP * vec4(aPosition, 1.0);
}
