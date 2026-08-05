import { WebGLUtilities, declareProgram, declareVertexBufferSchema } from "./glu"
import { Box3, Mat4, MatA, Vec3 } from "./math"

export function startDemo(host: HTMLElement) {
	const demo = new Demo(host)
	demo.start()
}

class Demo {
	private readonly canvas: HTMLCanvasElement
	private readonly gl: WebGL2RenderingContext
	private readonly glu: WebGLUtilities
	private time = 0
	private Projection!: Mat4

	private readonly helloProgram = declareProgram({
		vertexShaderName: "hello",
		fragmentShaderName: "hello",
		Projection: "uniform mat4",
		Model: "uniform mat4",
		time: "uniform float",
		position: "in vec3",
	} as const)
	private readonly helloVertexBufferSchema = declareVertexBufferSchema({
		position: "vec3",
	})
	private helloVertexArray!: WebGLVertexArrayObject

	private readonly letterProgram = declareProgram({
		vertexShaderName: "letter",
		fragmentShaderName: "letter",
		Projection: "uniform mat4",
		Model: "uniform mat4",
		position: "in vec3",
		color: "in vec3",
	} as const)
	private readonly letterVertexBufferSchema = declareVertexBufferSchema({
		position: "vec3",
		color: "vec3",
	})
	private letterVertexArray!: WebGLVertexArrayObject
	private letterIndexCount = 0

	constructor(private readonly host: HTMLElement) {
		if (host.childNodes.length > 0) {
			throw new Error("Demo host element is not empty.")
		}

		host.innerHTML = `
			<div style="position: relative; width: 0; height: 0; overflow: visible;">
				<canvas style="display: block;"></canvas>
			</div>
		`
		this.canvas = host.querySelector("canvas") as HTMLCanvasElement

		const gl = this.canvas.getContext("webgl2")!
		if (!gl) {
			throw new Error("WebGL 2 is not available.")
		}
		this.gl = gl
		this.glu = new WebGLUtilities(gl)
	}

	async start(): Promise<void> {
		const { gl, glu } = this

		gl.clearColor(0, 0, 0, 1)
		gl.enable(gl.DEPTH_TEST)
		gl.enable(gl.CULL_FACE)

		await glu.loadProgram(this.helloProgram)

		const helloVertices = []
		const n = 50
		for (let i = 0; i < n; ++i) {
			const y = i / (n - 1)
			for (let j = 0; j < n; ++j) {
				const x = j / (n - 1)
				helloVertices.push(x, y, -1, x, y, +1)
			}
		}
		const helloVertexBuffer = glu.createVertexBuffer(this.helloVertexBufferSchema)
		gl.bindBuffer(gl.ARRAY_BUFFER, helloVertexBuffer.glid)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(helloVertices), gl.STATIC_DRAW)

		this.helloVertexArray = glu.createVertexArray(this.helloProgram, (program, $) => {
			$.bindBuffer(helloVertexBuffer, (schema, $) => {
				$.enableAttribute(program.position, schema.position)
			})
		})

		await glu.loadProgram(this.letterProgram)

		const letter = await loadModel("letter.obj")
		const letterVertexBufferData = new Float32Array(letter.vertices.length * 6)
		for (const [i, vertex] of letter.vertices.entries()) {
			letterVertexBufferData[i * 6 + 0] = vertex[0]
			letterVertexBufferData[i * 6 + 1] = vertex[1]
			letterVertexBufferData[i * 6 + 2] = vertex[2]
			letterVertexBufferData[i * 6 + 3] = Math.random()
			letterVertexBufferData[i * 6 + 4] = Math.random()
			letterVertexBufferData[i * 6 + 5] = Math.random()
		}
		const letterVertexBuffer = glu.createVertexBuffer(this.letterVertexBufferSchema)
		gl.bindBuffer(gl.ARRAY_BUFFER, letterVertexBuffer.glid)
		gl.bufferData(gl.ARRAY_BUFFER, letterVertexBufferData, gl.STATIC_DRAW)
		const letterIndexBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, letterIndexBuffer)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(letter.indices), gl.STATIC_DRAW)
		this.letterIndexCount = letter.indices.length

		this.letterVertexArray = glu.createVertexArray(this.letterProgram, (program, $) => {
			$.bindBuffer(letterVertexBuffer, (schema, $) => {
				$.enableAttribute(program.position, schema.position)
				$.enableAttribute(program.color, schema.color)
			})
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, letterIndexBuffer)
		})

		new ResizeObserver((entries) => {
			if (entries.some((entry) => entry.target === this.host)) {
				this.onResize()
			}
		}).observe(this.host)
		this.onResize()
		requestAnimationFrame(this.onAnimationFrame.bind(this))
	}

	private onResize() {
		const { gl, canvas, host } = this

		const width = host.clientWidth
		const height = host.clientHeight
		if (canvas.width === width && canvas.height === height) {
			return
		}

		canvas.width = width
		canvas.height = height

		this.Projection = Mat4.perspective({
			fovy: 15,
			width,
			height,
			near: 0.1,
			far: 10,
		})
		gl.viewport(0, 0, width, height)

		this.draw()
	}

	private onAnimationFrame(timestamp: DOMHighResTimeStamp) {
		this.time = timestamp / 1000
		this.draw()
		requestAnimationFrame(this.onAnimationFrame.bind(this))
	}

	private draw() {
		const { gl, time } = this

		gl.clear(gl.COLOR_BUFFER_BIT)

		let Model = MatA.compose() //
			.translate(Vec3(-0.5, -0.5, 0))
			.scaleVector(Vec3(5, 5, 0.01))
			.rotateZ(0.24 * Math.PI)
			.rotateX(0.7 * Math.PI)
			//.rotateY(-0.3 * Math.PI)
			.translate(Vec3(0, -0.5, -3))
			.get()

		gl.useProgram(this.helloProgram.glid)
		gl.uniformMatrix4fv(this.helloProgram.Projection.location, true, this.Projection)
		gl.uniformMatrix4fv(this.helloProgram.Model.location, true, Model)
		gl.uniform1f(this.helloProgram.time.location, time)
		gl.bindVertexArray(this.helloVertexArray)
		gl.drawArrays(gl.LINES, 0, 2 * 50 * 50)

		Model = MatA.compose() //
			.rotateX(time)
			.rotateZ(time)
			.translate(Vec3(0, 0, -1))
			.get()
		gl.useProgram(this.letterProgram.glid)
		gl.uniformMatrix4fv(this.letterProgram.Projection.location, true, this.Projection)
		gl.uniformMatrix4fv(this.letterProgram.Model.location, true, Model)
		gl.bindVertexArray(this.letterVertexArray)
		gl.drawElements(gl.TRIANGLES, this.letterIndexCount, gl.UNSIGNED_SHORT, 0)
	}
}

async function loadModel(fileName: `${string}.obj`): Promise<{
	vertices: Vec3[]
	indices: number[]
}> {
	const THICKNESS = 0.2

	const response = await fetch(`/src/demo/assets/${fileName}`)
	const text = await response.text()

	const vertices = [] as Vec3[]
	const faces = [] as [number, number, number][]

	for (const line of text.split("\n")) {
		const t = line.split(" ")
		switch (t[0]) {
			case "v":
				vertices.push(Vec3(parseFloat(t[1]), parseFloat(t[2]), parseFloat(t[3])))
				break
			case "f":
				faces.push([parseInt(t[1]) - 1, parseInt(t[2]) - 1, parseInt(t[3]) - 1])
				break
		}
	}

	const bounds = Box3.fromPoints(vertices)
	const frontTranslation = Vec3.span(Box3.center(bounds), Vec3(0, 0, -THICKNESS))
	const scale = 1 / Math.max(...Box3.span(bounds))
	console.log("span", Box3.span(bounds))
	console.log(bounds, frontTranslation, scale)

	const sideVertexCount = vertices.length
	for (let i = 0; i < sideVertexCount; ++i) {
		const front = vertices[i]
		Vec3.translated(front, frontTranslation, front)
		Vec3.scaled(front, scale, front)
		const back = Vec3.copy(front)
		back[2] += THICKNESS
		vertices.push(back)
	}

	const edges = new Set<number>()
	const indices = [] as number[]
	const dside = sideVertexCount
	for (const [a, b, c] of faces) {
		indices.push(a, b, c, c + dside, b + dside, a + dside)
		const a_ = a * dside, b_ = b * dside, c_ = c * dside // prettier-ignore
		edges.delete(a + b_) || edges.add(a_ + b)
		edges.delete(b + c_) || edges.add(b_ + c)
		edges.delete(c + a_) || edges.add(c_ + a)
	}

	for (const edge of edges) {
		const j = edge % dside, j_ = j + dside // prettier-ignore
		const i = (edge - j) / dside, i_ = i + dside // prettier-ignore
		indices.push(i, i_, j, j, i_, j_)
	}

	return { vertices, indices }
}
