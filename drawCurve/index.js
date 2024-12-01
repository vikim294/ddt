const CANVAS_WIDTH = 1900
const CANVAS_HEIGHT = 900

const activeCanvasEl = document.querySelector('#active')
const mapCanvasEl = document.querySelector('#map')
activeCanvasEl.width = CANVAS_WIDTH
activeCanvasEl.height = CANVAS_HEIGHT
mapCanvasEl.width = CANVAS_WIDTH
mapCanvasEl.height = CANVAS_HEIGHT

const ctx = mapCanvasEl.getContext('2d')
ctx.lineWidth = 1

const points = []
let allowDraw = false

// --- 画布左上角为原点的坐标系 转换为左下角为原点
// ctx.translate(0, CANVAS_HEIGHT)
// ctx.scale(1, -1)

// ctx.fillText('Vikim294', 100, 100)

// ctx.beginPath()
// ctx.strokeRect(100, 20, 50, 50)
// ---

mapCanvasEl.addEventListener('mousedown', (e)=>{
  allowDraw = true
  const { offsetX, offsetY } = e
  ctx.moveTo(offsetX, offsetY)
})

mapCanvasEl.addEventListener('mousemove', (e)=>{
  if(!allowDraw) return
  const { offsetX, offsetY } = e
  const point = `${offsetX}, ${offsetY}`
  if(!points.includes(point)) {
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
    points.push(point)
  }
})

mapCanvasEl.addEventListener('mouseup', (e)=>{
  allowDraw = false
  console.log(points)
  console.log(JSON.stringify(points))
  ctx.closePath()
})




