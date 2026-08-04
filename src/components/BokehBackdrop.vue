<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
let ctx = null
let particles = []
let animationId = null
let resizeObserver = null

function posMod(n, m) {
  return ((n % m) + m) % m
}

function createParticles(width, height) {
  const count = Math.min(Math.max(Math.round((width * height) / 26000), 18), 46)
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 14 + Math.random() * 46,
    baseOpacity: 0.08 + Math.random() * 0.28,
    speedY: 6 + Math.random() * 14,
    driftAmp: 10 + Math.random() * 30,
    driftSpeed: 0.2 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
    warm: Math.random() < 0.7,
  }))
}

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  particles = createParticles(width, height)
}

function draw(time) {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const t = time / 1000
  ctx.clearRect(0, 0, width, height)

  particles.forEach((p) => {
    // 위로 천천히 떠오르다가 화면 밖으로 나가면 아래에서 다시 등장 (루프)
    const range = height + p.r * 2
    const y = posMod(p.y - t * p.speedY, range) - p.r
    const x = p.x + Math.sin(t * p.driftSpeed + p.phase) * p.driftAmp
    const flicker = 0.7 + Math.sin(t * 1.4 + p.phase) * 0.3
    const opacity = p.baseOpacity * flicker
    const color = p.warm ? '255, 214, 140' : '255, 244, 214'

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.r)
    gradient.addColorStop(0, `rgba(${color}, ${opacity})`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, p.r, 0, Math.PI * 2)
    ctx.fill()
  })

  animationId = requestAnimationFrame(draw)
}

onMounted(() => {
  setupCanvas()
  animationId = requestAnimationFrame(draw)
  resizeObserver = new ResizeObserver(setupCanvas)
  resizeObserver.observe(canvasRef.value)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<template>
  <canvas ref="canvasRef" class="bokeh-canvas"></canvas>
</template>

<style scoped>
.bokeh-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
