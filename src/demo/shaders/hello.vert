#version 300 es

uniform mat4 Projection;
uniform mat4 Model;

in vec3 position;

void main() {
  gl_PointSize = 3.0;
  gl_Position = Projection * Model * vec4(position, 1.0);
}
