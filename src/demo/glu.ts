export class WebGLUtilities {
	readonly shaders: Map<string, Promise<WebGLShader>> = new Map()

	constructor(private readonly gl: WebGL2RenderingContext) {}

	compileShader(type: number, source: string): WebGLShader {
		const gl = this.gl
		const shader = gl.createShader(type)
		if (!shader) {
			throw new Error("Failed to create shader")
		}
		gl.shaderSource(shader, source)
		gl.compileShader(shader)
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const info = gl.getShaderInfoLog(shader)
			gl.deleteShader(shader)
			throw new Error("Failed to compile shader: " + info)
		}
		return shader
	}

	linkProgram(params: { vertex: WebGLShader; fragment: WebGLShader }): WebGLProgram {
		const gl = this.gl
		const program = gl.createProgram()
		if (!program) {
			throw new Error("Failed to create program")
		}
		gl.attachShader(program, params.vertex)
		gl.attachShader(program, params.fragment)
		gl.linkProgram(program)
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(program)
			gl.deleteProgram(program)
			throw new Error("Failed to link program: " + info)
		}
		return program
	}

	async loadShader(type: number, url: string): Promise<WebGLShader> {
		const cached = this.shaders.get(url)
		if (cached) {
			return cached
		}

		const promise = (async () => {
			const response = await fetch(url)
			const source = await response.text()
			return this.compileShader(type, source)
		})()
		this.shaders.set(url, promise)

		return await promise
	}

	async loadProgram(program: Program): Promise<void> {
		const gl = this.gl

		// prettier-ignore
		const [vertex, fragment] = await Promise.all([
			this.loadShader(gl.VERTEX_SHADER, program.vertexShader.url),
			this.loadShader(gl.FRAGMENT_SHADER, program.fragmentShader.url),
		])
		const glid = this.linkProgram({ vertex, fragment })

		program.glid = glid
		program.vertexShader.glid = vertex
		program.fragmentShader.glid = fragment

		for (const value of Object.values(program as any)) {
			if (value instanceof _Uniform) {
				value.location = gl.getUniformLocation(glid, value.name)
			} else if (value instanceof _Attribute) {
				value.location = gl.getAttribLocation(glid, value.name)
			}
		}
	}

	createVertexBuffer<S extends VertexBufferSchema>(schema: S): VertexBuffer<S> {
		const gl = this.gl
		const glid = gl.createBuffer()
		if (!glid) {
			throw new Error("Failed to create buffer")
		}
		return { schema, glid }
	}

	createVertexArray<P extends Program>(program: P, build: (program: P, $: VertexArrayBuilder) => void): WebGLVertexArrayObject {
		const gl = this.gl
		const vertexArray = gl.createVertexArray()
		if (!vertexArray) {
			throw new Error("Failed to create vertex array")
		}
		gl.bindVertexArray(vertexArray)
		build(program, {
			bindBuffer(buffer, bind) {
				gl.bindBuffer(gl.ARRAY_BUFFER, buffer.glid)
				bind(buffer.schema, {
					enableAttribute(attribute, pointer) {
						gl.enableVertexAttribArray(attribute.location)
						gl.vertexAttribPointer(attribute.location, pointer.type.componentCount, pointer.type.componentType, false, buffer.schema.stride, pointer.offset)
					},
				})
			},
		})
		return vertexArray
	}
}

const GL_FLOAT: WebGL2RenderingContext["FLOAT"] = 0x1406
const GL_INT: WebGL2RenderingContext["INT"] = 0x1404
type GLComponentType = typeof GL_FLOAT | typeof GL_INT

export type BufferUsage = WebGL2RenderingContext["STATIC_DRAW"] | WebGL2RenderingContext["DYNAMIC_DRAW"] | WebGL2RenderingContext["STREAM_DRAW"]

export const UNIFORM_TYPE_NAMES = ["int", "float", "vec2", "vec3", "vec4", "mat2", "mat3", "mat4"] as const
export type UniformTypeName = (typeof UNIFORM_TYPE_NAMES)[number]
export function isUniformTypeName(type: string): type is UniformTypeName {
	return UNIFORM_TYPE_NAMES.includes(type as any)
}

export const ATTRIBUTE_TYPES = ["float", "vec2", "vec3", "vec4"] as const
export type AttributeTypeName = (typeof ATTRIBUTE_TYPES)[number]
export function isAttributeTypeName(type: string): type is AttributeTypeName {
	return ATTRIBUTE_TYPES.includes(type as any)
}

export type ShaderParameterTypeName = UniformTypeName | AttributeTypeName
export type ShaderParameterType<T extends ShaderParameterTypeName> = {
	name: T
	componentType: GLComponentType
	componentCount: number
	stride: number
}
export type UniformType<T extends UniformTypeName> = ShaderParameterType<T>
export type AttributeType<T extends AttributeTypeName> = ShaderParameterType<T>
const SHADER_PARAMETER_TYPES: { [key in ShaderParameterTypeName]: ShaderParameterType<key> } = (() => {
	function $<T extends ShaderParameterTypeName>(name: T, componentType: GLComponentType, componentCount: number): ShaderParameterType<T> {
		return {
			name,
			componentType,
			componentCount,
			stride: componentCount * 4,
		}
	}
	return {
		int: $("int", GL_INT, 1),
		float: $("float", GL_FLOAT, 1),
		vec2: $("vec2", GL_FLOAT, 2),
		vec3: $("vec3", GL_FLOAT, 3),
		vec4: $("vec4", GL_FLOAT, 4),
		mat2: $("mat2", GL_FLOAT, 4),
		mat3: $("mat3", GL_FLOAT, 9),
		mat4: $("mat4", GL_FLOAT, 16),
	} as const
})()
const COMPATIBLE_SHADER_PARAMETER_INPUT_TYPES = {
	int: ["int"],
	float: ["float"],
	vec2: ["vec2", "float"],
	vec3: ["vec3", "vec2", "float"],
	vec4: ["vec4", "vec3", "vec2", "float"],
	mat2: ["mat2"],
	mat3: ["mat3"],
	mat4: ["mat4"],
} as const
type CompatibleShaderParameterInputType<T extends ShaderParameterTypeName> = (typeof COMPATIBLE_SHADER_PARAMETER_INPUT_TYPES)[T][number]

export interface Uniform<T extends UniformTypeName> {
	readonly type: UniformType<T>
	readonly name: string
	readonly location: WebGLUniformLocation | null
}
class _Uniform implements Uniform<UniformTypeName> {
	readonly type: ShaderParameterType<UniformTypeName>
	location: WebGLUniformLocation | null = null

	constructor(typeName: UniformTypeName, public readonly name: string) {
		this.type = SHADER_PARAMETER_TYPES[typeName]
	}
}

export interface Attribute<T extends AttributeTypeName> {
	readonly type: AttributeType<T>
	readonly name: string
	readonly location: number
}
class _Attribute implements Attribute<AttributeTypeName> {
	readonly type: ShaderParameterType<AttributeTypeName>
	location: number = -1

	constructor(typeName: AttributeTypeName, public readonly name: string) {
		this.type = SHADER_PARAMETER_TYPES[typeName]
	}
}

export type ProgramDeclaration = {
	vertexShaderName: string
	fragmentShaderName: string
}
export type Program = {
	glid: WebGLProgram
	vertexShader: {
		url: string
		glid: WebGLShader
	}
	fragmentShader: {
		url: string
		glid: WebGLShader
	}
}
// prettier-ignore
const PROGRAM_RESERVED_KEYS = [
	"vertexShaderName",
	"fragmentShaderName",
	"glid",
	"vertexShader",
	"fragmentShader",
] as const
type ProgramReservedKeys = (typeof PROGRAM_RESERVED_KEYS)[number]

export type ProgramFromDeclaration<D extends ProgramDeclaration> = Program & {
	// prettier-ignore
	[key in keyof D as key extends ProgramReservedKeys ? never : key]:
		D[key] extends `uniform ${infer T extends UniformTypeName}` ? Uniform<T> :
		D[key] extends `in ${infer T extends AttributeTypeName}` ? Attribute<T> :
		never
}

export function declareProgram<D extends ProgramDeclaration>(decl: D): ProgramFromDeclaration<D> {
	const program: Program = {
		glid: undefined as any as WebGLProgram,
		vertexShader: {
			url: `/src/demo/shaders/${decl.vertexShaderName}.vert`,
			glid: undefined as any as WebGLShader,
		},
		fragmentShader: {
			url: `/src/demo/shaders/${decl.fragmentShaderName}.frag`,
			glid: undefined as any as WebGLShader,
		},
	}

	const dynamicProgram = program as any

	for (const key in decl) {
		if (PROGRAM_RESERVED_KEYS.includes(key as any)) {
			continue
		}

		const value = decl[key]
		if (typeof value !== "string") {
			continue
		}

		if (value.startsWith("uniform ")) {
			const typeName = value.substring(8)
			if (!isUniformTypeName(typeName)) {
				continue
			}
			dynamicProgram[key] = new _Uniform(typeName, key)
		} else if (value.startsWith("in ")) {
			const typeName = value.substring(3)
			if (!isAttributeTypeName(typeName)) {
				continue
			}
			dynamicProgram[key] = new _Attribute(typeName, key)
		}
	}

	return dynamicProgram
}

export type VertexBufferSchema<D extends VertexBufferSchemaDeclaration = {}> = {
	stride: number
} & {
	[key in keyof D as key extends VertexBufferSchemaReservedKeys ? never : key]: VertexBufferAttribute<D[key]>
}
export type VertexBufferAttribute<T extends AttributeTypeName> = {
	name: string
	type: AttributeType<T>
	offset: number
}
export type VertexBufferSchemaDeclaration = {
	[key: string]: AttributeTypeName
}
// prettier-ignore
const VERTEX_BUFFER_SCHEMA_RESERVED_KEYS = [
	"stride",
] as const
type VertexBufferSchemaReservedKeys = (typeof VERTEX_BUFFER_SCHEMA_RESERVED_KEYS)[number]

export function declareVertexBufferSchema<D extends VertexBufferSchemaDeclaration>(decl: D): VertexBufferSchema<D> {
	const schema = {} as any
	let offset = 0
	for (const key in decl) {
		const value = decl[key]
		if (VERTEX_BUFFER_SCHEMA_RESERVED_KEYS.includes(value as any)) {
			continue
		}
		if (!isAttributeTypeName(value)) {
			continue
		}
		const type = SHADER_PARAMETER_TYPES[value]
		schema[key] = { name: key, type, offset }
		offset += type.stride
	}
	schema.stride = offset
	return schema
}

export interface VertexBuffer<S extends VertexBufferSchema = VertexBufferSchema> {
	readonly schema: S
	readonly glid: WebGLBuffer
}

export interface VertexArrayBuilder {
	bindBuffer<S extends VertexBufferSchema>(buffer: VertexBuffer<S>, bind: (schema: S, binder: VertexArrayBuilderBufferBinder) => void): void
}

export interface VertexArrayBuilderBufferBinder {
	enableAttribute<T extends AttributeTypeName, S extends CompatibleShaderParameterInputType<T>>(attribute: Attribute<T>, pointer: VertexBufferAttribute<S>): void
}
