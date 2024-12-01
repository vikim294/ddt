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

requestAnimationFrame(anim)

const getNextDesBtn = document.querySelector('#getNextDes')
getNextDesBtn.addEventListener('click', () => {
    // --- 计算得到下一个目标点
    console.time('getNextDes')
    // 下面在主线程中进行耗时的计算 会阻塞主线程
    for(let i = 0; i < 3000000000; i++) {
                        
    }

    nextDes = {
        x: Math.floor(100 + Math.random() * 1700),
        y: Math.floor(100 + Math.random() * 700)
    }

    console.timeEnd('getNextDes')
    console.log('nextDes', nextDes.x, nextDes.y)
})