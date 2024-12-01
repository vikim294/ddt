const CANVAS_WIDTH = 100
const CANVAS_HEIGHT = 100

const canvasEl = document.querySelector('canvas')
// const mapCanvasEl = document.querySelector('#map')
canvasEl.width = CANVAS_WIDTH
canvasEl.height = CANVAS_HEIGHT
// mapCanvasEl.width = CANVAS_WIDTH
// mapCanvasEl.height = CANVAS_HEIGHT

const ctx = canvasEl.getContext('2d')
ctx.lineWidth = 1

const radiusInput = document.querySelector('#radiusInput')

const points = []
let allowDraw = false

radiusInput.addEventListener('change', () => {
  // console.log(radiusInput.value)
  canvasEl.width = radiusInput.value * 2
  canvasEl.height = radiusInput.value * 2
})

canvasEl.addEventListener('mousedown', (e)=>{
  allowDraw = true
  const { offsetX, offsetY } = e
  ctx.moveTo(offsetX, offsetY)
})

canvasEl.addEventListener('mousemove', (e)=>{
  if(!allowDraw) return
  const { offsetX, offsetY } = e
  const point = `${offsetX}, ${offsetY}`
  if(!points.includes(point)) {
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
    points.push(point)
  }
})

canvasEl.addEventListener('mouseup', (e)=>{
  allowDraw = false
  ctx.closePath()
  ctx.stroke()

  console.log(points)
  console.log(JSON.stringify(points))
})




