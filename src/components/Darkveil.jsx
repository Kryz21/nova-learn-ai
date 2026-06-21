import { useEffect, useRef } from 'react'

/**
 * DarkVeil — animated WebGL background
 * Props:
 *   hueShift         (0–360)  — rotates the colour palette
 *   noiseIntensity   (0–1)    — amount of grain/noise overlay
 *   scanlineIntensity(0–1)    — darkness of CRT scanlines
 *   scanlineFrequency(0–∞)    — lines per screen height (0 = off)
 *   speed            (0–2)    — animation playback rate
 *   warpAmount       (0–1)    — screen-space distortion / warp
 *   resolutionScale  (0.1–2)  — render resolution multiplier
 */
export default function DarkVeil({
  hueShift = 0,
  noiseIntensity = 0,
  scanlineIntensity = 0,
  speed = 0.5,
  scanlineFrequency = 0,
  warpAmount = 0,
  resolutionScale = 1,
}) {
  const canvasRef = useRef(null)
  const stateRef = useRef({})

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    // ── Shaders ────────────────────────────────────────────────────────────
    const vert = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `

    const frag = `
      precision highp float;
      varying vec2 v_uv;

      uniform float u_time;
      uniform vec2  u_res;
      uniform float u_hueShift;
      uniform float u_noise;
      uniform float u_scanInt;
      uniform float u_scanFreq;
      uniform float u_warp;

      // ── Helpers ────────────────────────────────────────────────────────

      vec3 hueRotate(vec3 col, float angle) {
        float c = cos(angle), s = sin(angle);
        mat3 m = mat3(
          0.213 + c*0.787 - s*0.213,  0.213 - c*0.213 + s*0.143,  0.213 - c*0.213 - s*0.787,
          0.715 - c*0.715 - s*0.715,  0.715 + c*0.285 + s*0.140,  0.715 - c*0.715 + s*0.715,
          0.072 - c*0.072 + s*0.928,  0.072 - c*0.072 - s*0.283,  0.072 + c*0.928 + s*0.072
        );
        return clamp(m * col, 0.0, 1.0);
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i),           hash(i + vec2(1,0)), u.x),
          mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 6; i++) {
          v += a * noise(p);
          p  = p * 2.1 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      // ── Main ───────────────────────────────────────────────────────────

      void main() {
        vec2 uv = v_uv;

        // Warp UV
        if (u_warp > 0.0) {
          float wx = fbm(uv * 2.5 + u_time * 0.07);
          float wy = fbm(uv * 2.5 + vec2(5.2, 1.3) + u_time * 0.07);
          uv += (vec2(wx, wy) - 0.5) * u_warp * 0.25;
          uv = clamp(uv, 0.0, 1.0);
        }

        // Base nebula / void
        vec2 p = uv * 3.0 - 1.5;
        float t = u_time * 0.18;

        float n1 = fbm(p + t);
        float n2 = fbm(p - t * 0.7 + vec2(3.1, 1.7));
        float n3 = fbm(p * 1.4 + vec2(n1, n2) + t * 0.4);

        // Dark base — deep space
        vec3 col = vec3(0.03, 0.02, 0.06);

        // Violet cloud layer
        col += vec3(0.08, 0.04, 0.22) * smoothstep(0.35, 0.75, n1);

        // Deep blue accent
        col += vec3(0.02, 0.05, 0.18) * smoothstep(0.4, 0.8, n2);

        // Subtle warm edge highlight
        col += vec3(0.12, 0.06, 0.28) * smoothstep(0.55, 0.85, n3) * 0.6;

        // Faint star points
        float star = pow(max(0.0, hash(floor(uv * 220.0)) - 0.97) * 33.0, 2.0);
        col += vec3(0.7, 0.75, 1.0) * star * 0.4;

        // Hue rotation
        if (u_hueShift != 0.0) {
          col = hueRotate(col, radians(u_hueShift));
        }

        // Scanlines
        if (u_scanInt > 0.0 && u_scanFreq > 0.0) {
          float line = abs(sin(uv.y * u_scanFreq * 3.14159));
          col *= 1.0 - u_scanInt * (1.0 - line * line);
        }

        // Grain noise
        if (u_noise > 0.0) {
          float grain = hash(uv + fract(u_time * 0.1));
          col += (grain - 0.5) * u_noise * 0.25;
        }

        col = clamp(col, 0.0, 1.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `

    // ── Compile ────────────────────────────────────────────────────────────
    function compile(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s))
      }
      return s
    }

    const prog = gl.createProgram()
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    // Full-screen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    // Uniform locations
    const U = {
      time:     gl.getUniformLocation(prog, 'u_time'),
      res:      gl.getUniformLocation(prog, 'u_res'),
      hueShift: gl.getUniformLocation(prog, 'u_hueShift'),
      noise:    gl.getUniformLocation(prog, 'u_noise'),
      scanInt:  gl.getUniformLocation(prog, 'u_scanInt'),
      scanFreq: gl.getUniformLocation(prog, 'u_scanFreq'),
      warp:     gl.getUniformLocation(prog, 'u_warp'),
    }

    // ── Resize ────────────────────────────────────────────────────────────
    function resize() {
      const scale = stateRef.current.resolutionScale ?? 1
      const w = Math.floor(window.innerWidth  * scale)
      const h = Math.floor(window.innerHeight * scale)
      canvas.width  = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(U.res, w, h)
    }

    window.addEventListener('resize', resize)

    // ── Render loop ───────────────────────────────────────────────────────
    let raf
    let startTime = performance.now()

    function draw() {
      const s = stateRef.current
      const elapsed = (performance.now() - startTime) / 1000
      gl.uniform1f(U.time,     elapsed * (s.speed ?? 0.5))
      gl.uniform1f(U.hueShift, s.hueShift ?? 0)
      gl.uniform1f(U.noise,    s.noiseIntensity ?? 0)
      gl.uniform1f(U.scanInt,  s.scanlineIntensity ?? 0)
      gl.uniform1f(U.scanFreq, s.scanlineFrequency ?? 0)
      gl.uniform1f(U.warp,     s.warpAmount ?? 0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    }
  }, []) // run once — props flow via stateRef

  // Keep stateRef in sync with latest props without restarting the loop
  useEffect(() => {
    stateRef.current = {
      hueShift,
      noiseIntensity,
      scanlineIntensity,
      scanlineFrequency,
      speed,
      warpAmount,
      resolutionScale,
    }
  }, [hueShift, noiseIntensity, scanlineIntensity, scanlineFrequency, speed, warpAmount, resolutionScale])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
      aria-hidden="true"
    />
  )
}
