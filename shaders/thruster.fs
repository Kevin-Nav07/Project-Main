#version 300 es
precision mediump float;

in float v_life;
out vec4 fragColor;

//we use a colour blend to show the thruster where it starts white and goes to a lighter orange to simulate thrusters

void main() {
    // As the particle ages, v_life goes from 1.0 to 0.0.
    // We'll also fade out alpha over time.
    vec3 colorStart = vec3(1.0, 1,1);
    vec3 colorEnd   = vec3(1.0, 0.5, 0.0);

    // Mix colors based on the fraction of life left
    vec3 color = mix(colorEnd, colorStart, v_life);

    // Fade alpha from 1.0 (fresh) to 0.0 (expired)
    float alpha = v_life;

    fragColor = vec4(color, alpha);
}
