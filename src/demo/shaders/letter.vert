#version 300 es

uniform mat4 Projection;
uniform mat4 Model;

in vec3 position;
in vec3 color;

flat out vec3 frag_color;
out float frag_depth;

void main() {
  gl_Position = Projection * Model * vec4(position, 1.0);
  frag_depth = 1.0 - ((gl_Position.z / gl_Position.w - 0.5) / (1.0 - 0.5));
  frag_depth = frag_depth * frag_depth * frag_depth;
  frag_color = color;
}