const CANVAS_WIDTH = 500
const CANVAS_HEIGHT = 400

const sceneEl = document.querySelector('#scene') 

sceneEl.width = CANVAS_WIDTH
sceneEl.height = CANVAS_HEIGHT

const sceneCtx = sceneEl.getContext('2d')

function initClip() {
    sceneCtx.beginPath()
    sceneCtx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    sceneCtx.clip()
}

function drawMap() {
    sceneCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    sceneCtx.save()

    // viewport的中心为point
    sceneCtx.translate(-(cameraCenterPoint.x - CANVAS_WIDTH / 2), -(cameraCenterPoint.y - CANVAS_HEIGHT / 2))
    sceneCtx.drawImage(img, 0, 0)

    sceneCtx.restore()
}

function updateCamera(x, y) {
    cameraCenterPoint.x = x
    cameraCenterPoint.y = y
    drawMap()
}

function easeOut(t) {
    return t * (2 - t)
}

function cameraMove(timestamp) {
    if(!startTime) startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easeOut(progress)

    const x = start.x + (target.x - start.x) * easedProgress
    const y = start.y + (target.y - start.y) * easedProgress
    updateCamera(x, y)

    if(progress < 1) {
        requestAnimationFrame(cameraMove)
    }
    else {
        updateCamera(target.x, target.y)
        start.x = target.x
        start.y = target.y
        checkPoints()
    }
}   

function moveCameraToTarget(x, y) {
    startTime = null
    target.x = x
    target.y = y
    requestAnimationFrame(cameraMove)
}

function checkPoints() {
    if(points.length > 0) {
        const point = points.shift()
        moveCameraToTarget(point.x, point.y)
    }
}

let cameraCenterPoint = {
    x: 0,
    y: 0
}

let start = {
    x: 0,
    y: 0
}

let target = {
    x: 0,
    y: 0
}

let duration = 1000
let startTime = null
let points = [
    {
        x: 400,
        y: 120
    },
    {
        x: 1200,
        y: 900
    },
    {
        x: 200,
        y: 400
    },
    {
        x: 1900,
        y: 100
    }
]

const img = document.createElement('img')
img.src = './bi.png'
img.onload = () => {
    // 初始化
    initClip()
    updateCamera(start.x, start.y)

    // 
    checkPoints()
}
