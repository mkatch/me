import { WebGLUtilities, declareProgram, declareVertexBufferSchema } from "./glu"
import { Mat4, MatA, Vec3 } from "./math"

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
		position: "in vec2",
	} as const)
	private readonly helloVertexBufferSchema = declareVertexBufferSchema({
		position: "vec2",
	})
	private helloVertexArray!: WebGLVertexArrayObject

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

		await glu.loadProgram(this.helloProgram)

		const helloVertices = []
		const n = 50
		for (let i = 0; i < n; ++i) {
			const y = -1 + (2 * (i + 1)) / (n + 1)
			for (let j = 0; j < n; ++j) {
				const x = -1 + (2 * (j + 1)) / (n + 1)
				helloVertices.push(x, y)
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

		const Model = MatA.eye()
		MatA.rotateZ(Model, time)
		MatA.rotateX(Model, 2 * time)
		MatA.translate(Model, Vec3(0, 0, -2))

		gl.useProgram(this.helloProgram.glid)
		gl.uniformMatrix4fv(this.helloProgram.Projection.location, true, this.Projection)
		gl.uniformMatrix4fv(this.helloProgram.Model.location, true, Model)
		gl.bindVertexArray(this.helloVertexArray)
		gl.drawArrays(gl.POINTS, 0, 50 * 50)
	}
}
