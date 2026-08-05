const DEG_TO_RAD = Math.PI / 180

/** Undecorated shape of {@link Vec3} */
export type Vec3Shape = [x: number, y: number, z: number]

/** 3D cartesian vector. */
export type Vec3 = Vec3Shape & { readonly "": unique symbol }
export function Vec3(...data: Vec3Shape): Vec3 {
	return data as Vec3
}

export namespace Vec3 {
	export function zero(): Vec3 {
		return Vec3(0, 0, 0)
	}

	export function copy(v: Vec3, _: Vec3 = zero()): Vec3 {
		_[0] = v[0]
		_[1] = v[1]
		_[2] = v[2]
		return _
	}

	export function uniform(s: number): Vec3 {
		return Vec3(s, s, s)
	}

	export function translated(P: Vec3, u: Vec3, _ = Vec3.zero()): Vec3 {
		_[0] = P[0] + u[0]
		_[1] = P[1] + u[1]
		_[2] = P[2] + u[2]
		return _
	}

	export function scaled(u: Vec3, s: number, _ = Vec3.zero()): Vec3 {
		_[0] = u[0] * s
		_[1] = u[1] * s
		_[2] = u[2] * s
		return _
	}

	export function span(P: Vec3, Q: Vec3, _ = Vec3.zero()): Vec3 {
		_[0] = Q[0] - P[0]
		_[1] = Q[1] - P[1]
		_[2] = Q[2] - P[2]
		return _
	}

	export function min(u: Vec3, v: Vec3, _ = Vec3.zero()): Vec3 {
		_[0] = Math.min(u[0], v[0])
		_[1] = Math.min(u[1], v[1])
		_[2] = Math.min(u[2], v[2])
		return _
	}

	export function max(u: Vec3, v: Vec3, _ = Vec3.zero()): Vec3 {
		_[0] = Math.max(u[0], v[0])
		_[1] = Math.max(u[1], v[1])
		_[2] = Math.max(u[2], v[2])
		return _
	}

	export function mid(P: Vec3, Q: Vec3, _ = Vec3.zero()): Vec3 {
		_[0] = 0.5 * P[0] + 0.5 * Q[0]
		_[1] = 0.5 * P[1] + 0.5 * Q[1]
		_[2] = 0.5 * P[2] + 0.5 * Q[2]
		return _
	}
}

/** Undecorated shape of {@link MatA}. */
export type MatAShape = [
	number, number, number, number,
	number, number, number, number,
	number, number, number, number,
	     0,      0,      0,      1,
]

/**
 * Affine transformation matrix.
 *
 * Like {@link Mat4}, but the last row is always `[0, 0, 0, 1]`. Can express
 * all linear transformations, translations, and their compositions.
 **/
export type MatA = Mat4 & MatAShape
export function MatA(data: MatAShape): MatA {
	return data as MatA
}

export namespace MatA {
	/**
	 * Create or modify an affine transofrmation {@link MatA} with a chainable API.
	 * 
	 * @param A Initial matrix, defaults to a new identity matrix. The subsequent operations will be applied to this matrix in place.
	 */
	export function compose(A: MatA = eye()): MatAComposer {
		return new MatAComposer(A)
	}

	/** Creates a new identity affine transformation {@link MatA}. */
	export function eye(): MatA {
		return MatA([
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1,
    ])
	}

	/** Pre-applies a translation by vector.  */
	export function translate(A: MatA, u: Vec3): MatA {
		A[ 3] += u[0]
		A[ 7] += u[1]
		A[11] += u[2]
		return A
	}

	/** Creates a new transformation that represents translation by vector. */
	export function translation(u: Vec3): MatA {
		return translate(eye(), u)
	}

	/** Multiplies the first row by a scalar. */
	export function scaleX(A: MatA, s: number): void {
		A[ 0] *= s; A[ 1] *= s; A[ 2] *= s; A[ 3] *= s
	}

	/** Multiplies the second row by a scalar. */
	export function scaleY(A: MatA, s: number): void {
		A[ 4] *= s; A[ 5] *= s; A[ 6] *= s; A[ 7] *= s
	}

	/** Multiplies the second row by a scalar. */
	export function scaleZ(A: MatA, s: number): void {
		A[ 8] *= s; A[ 9] *= s; A[10] *= s; A[11] *= s
	}

	/** Multiplies the entire matrix by a scalar. */
	export function scale(A: MatA, s: number): void {
		A[ 0] *= s; A[ 1] *= s; A[ 2] *= s; A[ 3] *= s
		A[ 4] *= s; A[ 5] *= s; A[ 6] *= s; A[ 7] *= s
		A[ 8] *= s; A[ 9] *= s; A[10] *= s; A[11] *= s
	}

	/** Multiplies each row by the respective vector component scalars. */
	export function scaleVector(A: MatA, u: Vec3): void {
		const sx = u[0], sy = u[1], sz = u[2]
		A[ 0] *= sx; A[ 1] *= sx; A[ 2] *= sx; A[ 3] *= sx
		A[ 4] *= sy; A[ 5] *= sy; A[ 6] *= sy; A[ 7] *= sy
		A[ 8] *= sz; A[ 9] *= sz; A[10] *= sz; A[11] *= sz
	}

	/**
	 * Pre-applies a rotation around the X axis.
	 *
	 * Clockwise when X is pointing towards you (right-handed, Y right, Z up).
	 * 
	 * @param angle Angle in radians.
	 **/
	export function rotateX(A: MatA, angle: number): void {
		const c = Math.cos(angle), s = Math.sin(angle)
		const a00 = A[ 4], a01 = A[ 5], a02 = A[ 6], a03 = A[ 7]
		const a10 = A[ 8], a11 = A[ 9], a12 = A[10], a13 = A[11]
		A[ 4] = c * a00 - s * a10; A[ 5] = c * a01 - s * a11; A[ 6] = c * a02 - s * a12; A[ 7] = c * a03 - s * a13
		A[ 8] = c * a10 + s * a00; A[ 9] = c * a11 + s * a01; A[10] = c * a12 + s * a02; A[11] = c * a13 + s * a03
	}

	/**
	 * Applies a rotation around the Y axis.
	 *
	 * Clockwise when Y is pointing towards you (right-handed, Z right, X up).
	 * 
	 * @param angle Angle in radians.
	 **/
	export function rotateY(A: MatA, angle: number): void {
		const c = Math.cos(angle), s = Math.sin(angle)
		const a00 = A[ 8], a01 = A[ 9], a02 = A[10], a03 = A[11]
		const a10 = A[ 0], a11 = A[ 1], a12 = A[ 2], a13 = A[ 3]
		A[ 8] = c * a00 - s * a10; A[ 9] = c * a01 - s * a11; A[10] = c * a02 - s * a12; A[11] = c * a03 - s * a13
		A[ 0] = c * a10 + s * a00; A[ 1] = c * a11 + s * a01; A[ 2] = c * a12 + s * a02; A[ 3] = c * a13 + s * a03
	}

	/**
	 * Applies a rotation around the Z axis.
	 *
	 * Clockwise when Z is pointing towards you (right-handed, X right, Y up).
	 * 
	 * @param angle Angle in radians.
	 **/
	export function rotateZ(A: MatA, angle: number): void {
		const c = Math.cos(angle), s = Math.sin(angle)
		const a00 = A[ 0], a01 = A[ 1], a02 = A[ 2], a03 = A[ 3]
		const a10 = A[ 4], a11 = A[ 5], a12 = A[ 6], a13 = A[ 7]
		A[ 0] = c * a00 - s * a10; A[ 1] = c * a01 - s * a11; A[ 2] = c * a02 - s * a12; A[ 3] = c * a03 - s * a13
		A[ 4] = c * a10 + s * a00; A[ 5] = c * a11 + s * a01; A[ 6] = c * a12 + s * a02; A[ 7] = c * a13 + s * a03
	}
}

/** Helper for chaining operations on a {@link MatA}. Construct with {@link MatA.compose} */
export class MatAComposer {
	constructor(private readonly A: MatA) {}
	/** Gets the underlying {@link MatA}. WARNING: Not a copy! Supsequent operations still affect it. */
	get(): MatA { return this.A }
	/** See {@link MatA.translate}. */
	translate(u: Vec3): this { MatA.translate(this.A, u); return this }
	/** See {@link MatA.scaleX}. */
	scaleX(s: number): this { 
		MatA.scaleX(this.A, s); return this }
	/** See {@link MatA.scaleY}. */
	scaleY(s: number): this { MatA.scaleY(this.A, s); return this }
	/** See {@link MatA.scaleZ}. */
	scaleZ(s: number): this { MatA.scaleZ(this.A, s); return this }
	/** See {@link MatA.scale}. */
	scale(s: number): this { MatA.scale(this.A, s); return this }
	/** See {@link MatA.scaleVector}. */
	scaleVector(u: Vec3): this { MatA.scaleVector(this.A, u); return this }
	/** See {@link MatA.rotateX}. */
	rotateX(angle: number): this { MatA.rotateX(this.A, angle); return this }
	/** See {@link MatA.rotateY}. */
	rotateY(angle: number): this { MatA.rotateY(this.A, angle); return this }
	/** See {@link MatA.rotateZ}. */
	rotateZ(angle: number): this { MatA.rotateZ(this.A, angle); return this }
}

/** Undecorated shape of {@link Mat4} */
export type Mat4Shape = [
	a00: number, a01: number, a02: number, a03: number,
	a10: number, a11: number, a12: number, a13: number,
	a20: number, a21: number, a22: number, a23: number,
	a30: number, a31: number, a32: number, a33: number,
]

/**
 * 4x4 matrix.
 * 
 * Row-major order. Needs to be transposed for WebGL.
 */
export type Mat4 = Mat4Shape & { readonly Mat4: unique symbol }
export function Mat4(data: Mat4Shape): Mat4 {
	return data as Mat4
}

export namespace Mat4 {
	/**
	 * Creates a perspective projection matrix.
	 *
	 * @param fovy Vertical field of view in degrees. The angle between the top and bottom planes of the frustum.
	 * @param width Width of the viewport (only aspect ratio matters).
	 * @param height Height of the viewport (only aspect ratio matters).
	 * @param near Distance to the near clipping plane.
	 * @param far Distance to the far clipping plane.
	 **/
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

export type Box3 = {
	P0: Vec3,
	P1: Vec3,
}

export namespace Box3 {
	export function empty(): Box3 {
		return {
			P0: Vec3.uniform(Infinity),
			P1: Vec3.uniform(-Infinity),
		}
	}
	
	export function expandAll(B: Box3, Ps: readonly Vec3[]): void {
		const { P0, P1 } = B
		for (const P of Ps) {
			Vec3.min(P0, P, P0)
			Vec3.max(P1, P, P1)
		}
	}

	export function fromPoints(Ps: readonly Vec3[], _ = Box3.empty()): Box3 {
		expandAll(_, Ps)
		return _
	}

	export function span(B: Box3, _ = Vec3.zero()): Vec3 {
		return Vec3.span(B.P0, B.P1, _)
	}

	export function center(B: Box3, _ = Vec3.zero()): Vec3 {
		return Vec3.mid(B.P0, B.P1, _)
	}
}