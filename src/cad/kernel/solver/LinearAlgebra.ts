/**
 * CAD Kernel - Linear Algebra
 * 
 * Performance-critical matrix/vector operations.
 * Not using a heavy library to keep it lightweight and optimized for our specific needs (Jacobian inversion).
 */

export class Vector {
    data: Float64Array;

    constructor(size: number) {
        this.data = new Float64Array(size);
    }

    get(i: number): number {
        return this.data[i];
    }

    set(i: number, val: number): void {
        this.data[i] = val;
    }

    norm(): number {
        let sum = 0;
        for (let i = 0; i < this.data.length; i++) {
            sum += this.data[i] * this.data[i];
        }
        return Math.sqrt(sum);
    }

    static fromArray(arr: number[]): Vector {
        const v = new Vector(arr.length);
        v.data.set(arr);
        return v;
    }
}

export class Matrix {
    rows: number;
    cols: number;
    data: Float64Array; // Row-major

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.data = new Float64Array(rows * cols);
    }

    get(r: number, c: number): number {
        return this.data[r * this.cols + c];
    }

    set(r: number, c: number, val: number): void {
        this.data[r * this.cols + c] = val;
    }

    // Matrix Multiplication: C = A * B
    static multiply(A: Matrix, B: Matrix): Matrix {
        if (A.cols !== B.rows) throw new Error("Matrix dimensions mismatch");
        const C = new Matrix(A.rows, B.cols);
        for (let i = 0; i < A.rows; i++) {
            for (let j = 0; j < B.cols; j++) {
                let sum = 0;
                for (let k = 0; k < A.cols; k++) {
                    sum += A.get(i, k) * B.get(k, j);
                }
                C.set(i, j, sum);
            }
        }
        return C;
    }

    // Multiply Matrix by Vector: res = A * v
    static multiplyVector(A: Matrix, v: Vector): Vector {
        if (A.cols !== v.data.length) throw new Error("Matrix-Vector dimensions mismatch");
        const res = new Vector(A.rows);
        for (let i = 0; i < A.rows; i++) {
            let sum = 0;
            for (let j = 0; j < A.cols; j++) {
                sum += A.get(i, j) * v.get(j);
            }
            res.set(i, sum);
        }
        return res;
    }

    // Transpose: B = A^T
    static transpose(A: Matrix): Matrix {
        const B = new Matrix(A.cols, A.rows);
        for (let i = 0; i < A.rows; i++) {
            for (let j = 0; j < A.cols; j++) {
                B.set(j, i, A.get(i, j));
            }
        }
        return B;
    }

    // Gaussian Elimination for Linear System: Ax = b
    // Solves for x. A must be N x N.
    static solveLinearSystem(A: Matrix, b: Vector): Vector {
        const n = A.rows;
        if (A.cols !== n) throw new Error("Matrix must be square");

        // Clone to avoid modifying originals
        const M = new Matrix(n, n);
        M.data.set(A.data);
        const x = new Vector(n);
        x.data.set(b.data);

        // Forward Elimination
        for (let k = 0; k < n - 1; k++) {
            // Pivot
            // (Skipping partial pivoting for simplicity in V1, but critical for stability later)

            for (let i = k + 1; i < n; i++) {
                const factor = M.get(i, k) / M.get(k, k);
                for (let j = k; j < n; j++) {
                    M.set(i, j, M.get(i, j) - factor * M.get(k, j));
                }
                x.set(i, x.get(i) - factor * x.get(k));
            }
        }

        // Backward Substitution
        const res = new Vector(n);
        for (let i = n - 1; i >= 0; i--) {
            let sum = 0;
            for (let j = i + 1; j < n; j++) {
                sum += M.get(i, j) * res.get(j);
            }
            res.set(i, (x.get(i) - sum) / M.get(i, i));
        }

        return res;
    }

    // QR Decomposition (Gram-Schmidt - simple for our matrix sizes)
    static qr(A: Matrix): { Q: Matrix; R: Matrix } {
        const m = A.rows;
        const n = A.cols;
        const Q = new Matrix(m, n);
        const R = new Matrix(n, n);

        for (let j = 0; j < n; j++) {
            const v = new Vector(m);
            for (let i = 0; i < m; i++) v.set(i, A.get(i, j));

            for (let i = 0; i < j; i++) {
                let dot = 0;
                for (let k = 0; k < m; k++) dot += Q.get(k, i) * A.get(k, j);
                R.set(i, j, dot);
                for (let k = 0; k < m; k++) v.set(k, v.get(k) - dot * Q.get(k, i));
            }

            const norm = v.norm();
            R.set(j, j, norm);
            if (norm > 1e-10) {
                for (let i = 0; i < m; i++) Q.set(i, j, v.get(i) / norm);
            }
        }

        return { Q, R };
    }

    static getRank(A: Matrix): number {
        const { R } = Matrix.qr(A);
        let rank = 0;
        const tol = 1e-10;
        for (let i = 0; i < Math.min(R.rows, R.cols); i++) {
            if (Math.abs(R.get(i, i)) > tol) rank++;
        }
        return rank;
    }
}
