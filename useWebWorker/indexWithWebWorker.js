const CANVAS_WIDTH = 1900
const CANVAS_HEIGHT = 900

const canvasEl = document.querySelector('canvas')
canvasEl.width = CANVAS_WIDTH
canvasEl.height = CANVAS_HEIGHT
const ctx = canvasEl.getContext('2d')

let start = {
    x: 100,
    y: 100
}

let end = {
    x: 400,
    y: 100
}

let nextDes

let ball = {
    x: 100,
    y: 100,
    radius: 10
}

let startTime 
let duration = 10000

function anim(timestamp) {
    if(!startTime) {
        startTime = timestamp
    }

    const progress = Math.min(1, (timestamp - startTime) / duration)

    ball.x = start.x + (end.x - start.x) * progress
    ball.y = start.y + (end.y - start.y) * progress

    draw()

    if(progress !== 1) {
        requestAnimationFrame(anim)

    }
    else {
        console.log('arrived!')

        if(nextDes && nextDes.x !== end.x && nextDes.y !== end.y) {
            start = {
                ...end
            }
            end = {
                ...nextDes
            }
            startTime = null
            requestAnimationFrame(anim)
        }

    }
}

function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.stroke()
}

const getNextDesBtn = document.querySelector('#getNextDes')
getNextDesBtn.addEventListener('click', () => {
    const w = new Worker('./worker.js')
    w.onmessage = (res) => {
        console.log(res)
        nextDes = res.data
    }
})

// requestAnimationFrame(anim)

ctx.beginPath()
ctx.lineWidth = 2
// 会画出 [0,0], [1,0], [2,0], [3,0] 共四个像素点
ctx.moveTo(0,0)
ctx.lineTo(4,0)

ctx.stroke()
// 获取 [0,0] 到 [3, 3] 共 16个像素点的数据
console.log(ctx.getImageData(0, 0, 4, 4).data)