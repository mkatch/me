#version 300 es

uniform mat4 Projection;
uniform mat4 Model;
uniform float time;

in vec3 position;

void main() {
  gl_PointSize = 3.0;
  gl_Position = Projection * Model * vec4(
    position.xy,
    position.z + 6.0 * (
      sin(20.0 * position.x + 5.0 * time) * sin(20.0 * position.y + 5.0 * time) +
      sin(10.0 * -position.x + 5.0 * time) * sin(10.0 * -position.y + 5.0 * time)
    ),
    1.0
  );
}
