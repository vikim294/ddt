import { SHELL_CRATER_50_ellipse } from "../../shellCraters.js"

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 800

const canvasEl = document.querySelector('canvas')
// const mapCanvasEl = document.querySelector('#map')
canvasEl.width = CANVAS_WIDTH
canvasEl.height = CANVAS_HEIGHT
// mapCanvasEl.width = CANVAS_WIDTH
// mapCanvasEl.height = CANVAS_HEIGHT

const ctx = canvasEl.getContext('2d')
ctx.lineWidth = 1

const rotateAngleInput = document.querySelector('#rotateAngleInput')

function draw(crater = [], craterRadius, angle) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.save()
  ctx.translate(500, 400)
  ctx.rotate(angle * Math.PI / 180)
  
  crater.forEach((item, index) => {
      const x = item.split(',')[0]
      const y = item.split(',')[1]
      if(index === 0) {
          ctx.beginPath()
          ctx.moveTo(x - craterRadius, y - craterRadius)
      }
      else {
          ctx.lineTo(x - craterRadius, y - craterRadius)
      }
  })
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

draw(SHELL_CRATER_50_ellipse, 50,rotateAngleInput.value)

rotateAngleInput.addEventListener('change', () => {
  draw(SHELL_CRATER_50_ellipse, 50, rotateAngleInput.value)
})

function roll() {
  requestAnimationFrame(roll)
  angle += 1
  // draw(SHELL_CRATER_50_ellipse, 50, angle)
}
let angle = 0
requestAnimationFrame(roll) 
