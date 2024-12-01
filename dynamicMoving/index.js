const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 800

const canvasEl = document.querySelector('canvas')
canvasEl.width = CANVAS_WIDTH
canvasEl.height = CANVAS_HEIGHT

const ctx = canvasEl.getContext('2d')
ctx.lineWidth = 1


let start = {
  x: 100,
  y: 100
}

let end = {
  x: 900,
  y: 100
}

let ball = {
  ...start,
  radius: 30,
}

let timer = null
const duration = 1000

// 把时间分成十份，？

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 本体
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#000'
  ctx.fill()
}

function anim(timestamp){
  if(!timer) timer = timestamp
  const progress = Math.min(1, (timestamp - timer) / duration)

  ball.x = start.x + (end.x - start.x) * progress
  draw()
  if(progress !== 1) {
    requestAnimationFrame(anim)
  }
  else {
    console.log('end')
  }
}

requestAnimationFrame(anim)