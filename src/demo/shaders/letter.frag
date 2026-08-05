#version 300 es

out lowp vec4 color;

flat in highp vec3 frag_color;
in highp float frag_depth;

void main() {
  color = vec4(vec3(frag_depth), 1.0);
}