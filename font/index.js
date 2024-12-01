
const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 800

const canvasEl = document.querySelector('canvas')
canvasEl.width = CANVAS_WIDTH
canvasEl.height = CANVAS_HEIGHT

const ctx = canvasEl.getContext('2d')
ctx.lineWidth = 1

let f = new FontFace("", "url(./SHOWG.TTF)");

function drawText({text, fontSize, leftPadding, topPadding, x, y, backgroundColor, color}) {
  ctx.font = `${fontSize}px Showcard Gothic`;
  ctx.beginPath()
  ctx.fillStyle = backgroundColor
  ctx.fillRect(x - leftPadding, y - fontSize, ctx.measureText(text).width + leftPadding * 2, fontSize + topPadding * 2)

  ctx.fillStyle = color
  ctx.fillText(text, x, y)
}

f.load().then(() => {
  drawText({
    text:'294',
    fontSize:40,
    leftPadding:10,
    topPadding:5,
    x:100,
    y:100,
    backgroundColor: 'red',
    color: '#000'
  })

  drawText({
    text:'923',
    fontSize:40,
    leftPadding:10,
    topPadding:5,
    x:100,
    y:200,
    backgroundColor: 'transparent',
    color: 'red'
  })

  drawText({
    text:'520',
    fontSize:40,
    leftPadding:10,
    topPadding:5,
    x:100,
    y:300,
    backgroundColor: 'transparent',
    color: '#e9da0b'
  })
});