const DEG_TO_RAD = Math.PI / 180

export type Vec3Data = [x: number, y: number, z: number]
export type Vec3 = Vec3Data & { readonly "": unique symbol }
export function Vec3(...data: Vec3Data): Vec3 {
	return data as Vec3
}

export type MatAData = [
	number, number, number, number,
	number, number, number, number,
	number, number, number, number,
	     0,      0,      0,      1,
]
export type MatA = Mat4 & MatAData
export function MatA(data: MatAData): MatA {
	return data as MatA
}

export namespace MatA {
	export function compose(A: MatA = eye()): MatAComposer {
		return new MatAComposer(A)
	}

	export function eye(): MatA {
		return MatA([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
    ])
	}

	export function translate(A: MatA, u: Vec3): MatA {
		A[ 3] += u[0]
		A[ 7] += u[1]
		A[11] += u[2]
		return A
	}

	export function translation(u: Vec3): MatA {
		return translate(eye(), u)
	}

	
	export function scaleX(A: MatA, s: number): void {
		A[ 0] *= s; A[ 1] *= s; A[ 2] *= s; A[ 3] *= s
	}


	export function scaleY(A: MatA, s: number): void {
		A[ 4] *= s; A[ 5] *= s; A[ 6] *= s; A[ 7] *= s
	}

	
	export function scaleZ(A: MatA, s: number): void {
		A[ 8] *= s; A[ 9] *= s; A[10] *= s; A[11] *= s
	}

	export function scale(A: MatA, s: number): void {
		A[ 0] *= s; A[ 1] *= s; A[ 2] *= s; A[ 3] *= s
		A[ 4] *= s; A[ 5] *= s; A[ 6] *= s; A[ 7] *= s
		A[ 8] *= s; A[ 9] *= s; A[10] *= s; A[11] *= s
	}

	export function rotateX(A: MatA, angle: number): void {
		const c = Math.cos(angle), s = Math.sin(angle)
		const a00 = A[ 4], a01 = A[ 5], a02 = A[ 6], a03 = A[ 7]
		const a10 = A[ 8], a11 = A[ 9], a12 = A[10], a13 = A[11]
		A[ 4] = c * a00 - s * a10; A[ 5] = c * a01 - s * a11; A[ 6] = c * a02 - s * a12; A[ 7] = c * a03 - s * a13
		A[ 8] = c * a10 + s * a00; A[ 9] = c * a11 + s * a01; A[10] = c * a12 + s * a02; A[11] = c * a13 + s * a03
	}

	export function rotateY(A: MatA, angle: number): void {
		const c = Math.cos(angle), s = Math.sin(angle)
		const a00 = A[ 8], a01 = A[ 9], a02 = A[10], a03 = A[11]
		const a10 = A[ 0], a11 = A[ 1], a12 = A[ 2], a13 = A[ 3]
		A[ 8] = c * a00 - s * a10; A[ 9] = c * a01 - s * a11; A[10] = c * a02 - s * a12; A[11] = c * a03 - s * a13
		A[ 0] = c * a10 + s * a00; A[ 1] = c * a11 + s * a01; A[ 2] = c * a12 + s * a02; A[ 3] = c * a13 + s * a03
	}

	export function rotateZ(A: MatA, angle: number): void {
		const c = Math.cos(angle), s = Math.sin(angle)
		const a00 = A[ 0], a01 = A[ 1], a02 = A[ 2], a03 = A[ 3]
		const a10 = A[ 4], a11 = A[ 5], a12 = A[ 6], a13 = A[ 7]
		A[ 0] = c * a00 - s * a10; A[ 1] = c * a01 - s * a11; A[ 2] = c * a02 - s * a12; A[ 3] = c * a03 - s * a13
		A[ 4] = c * a10 + s * a00; A[ 5] = c * a11 + s * a01; A[ 6] = c * a12 + s * a02; A[ 7] = c * a13 + s * a03
	}
}

export class MatAComposer {
	constructor(private readonly A: MatA) {}
	/** See {@link MatA.translate}. */
	translate(u: Vec3): this { MatA.translate(this.A, u); return this }
	/** See {@link MatA.scaleX}. */
	scaleX(s: number): this { MatA.scaleX(this.A, s); return this }
	/** See {@link MatA.scaleY}. */
	scaleY(s: number): this { MatA.scaleY(this.A, s); return this }
	/** See {@link MatA.scaleZ}. */
	scaleZ(s: number): this { MatA.scaleZ(this.A, s); return this }
	/** See {@link MatA.scale}. */
	scale(s: number): this { MatA.scale(this.A, s); return this }
	/** See {@link MatA.rotateX}. */
	rotateX(angle: number): this { MatA.rotateX(this.A, angle); return this }
	/** See {@link MatA.rotateY}. */
	rotateY(angle: number): this { MatA.rotateY(this.A, angle); return this }
	/** See {@link MatA.rotateZ}. */
	rotateZ(angle: number): this { MatA.rotateZ(this.A, angle); return this }
}

export type Mat4Data = [
	a00: number, a01: number, a02: number, a03: number,
	a10: number, a11: number, a12: number, a13: number,
	a20: number, a21: number, a22: number, a23: number,
	a30: number, a31: number, a32: number, a33: number,
]
export type Mat4 = Mat4Data & { readonly Mat4: unique symbol }
export function Mat4(data: Mat4Data): Mat4 {
	return data as Mat4
}

export namespace Mat4 {
	export function perspective(params: {
		fovy: number
		width: number
		height: number
		near: number
		far: number //
	}): Mat4 {
		const { fovy, width, height, near, far } = params

		const depth = far - near
		const c0 = near / Math.tan(0.5 * fovy * DEG_TO_RAD)
		const c1 = (c0 * height) / width

		return Mat4([
			c1,  0,                     0,                       0,
			 0, c0,                     0,                       0,
			 0,  0, -(near + far) / depth, -2 * near * far / depth,
			 0,  0,                    -1,                       0,
		])
	}
}
