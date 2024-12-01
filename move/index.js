import { map, map2, climb, fall, multiple } from "./map.js"
const map3 = ["0, 800","1900, 800"]
const map4 = ["0, 800","1900, 800","1900, 900","0, 900"]

const CANVAS_WIDTH = 1900
const CANVAS_HEIGHT = 900

const mapCanvasEl = document.querySelector('#map')
const playerCanvasEl = document.querySelector('#player')
mapCanvasEl.width = CANVAS_WIDTH
mapCanvasEl.height = CANVAS_HEIGHT
playerCanvasEl.width = CANVAS_WIDTH
playerCanvasEl.height = CANVAS_HEIGHT

const mapCtx = mapCanvasEl.getContext('2d', {
    willReadFrequently: true
})
const playerCtx = playerCanvasEl.getContext('2d')

mapCtx.lineWidth = 2
playerCtx.lineWidth = 1

mapCtx.strokeStyle = '#ff0000'
mapCtx.fillStyle = '#f1f1f1'

function drawMap(map) {
    console.log(map)
    map.forEach((item, index) => {
        const x = item.split(',')[0]
        const y = item.split(',')[1]
        if(index === 0) {
            mapCtx.beginPath()
            mapCtx.moveTo(x, y)
        }
        else {
            mapCtx.lineTo(x, y)
        }
    })
    
    // mapCtx.closePath()
    // mapCtx.fill()
    mapCtx.stroke()

}

function drawPlayer() {
    playerCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    playerCtx.beginPath()
    playerCtx.strokeRect(player.centerPoint.x - player.length / 2, player.centerPoint.y - player.length / 2, player.length, player.length)
}

function getSurfacePoints(x, y) {
    const res = []
    const { data } = mapCtx.getImageData(x - player.length / 2, y - player.length / 2, player.length, player.length)
    for(let col = 0; col < player.length; col++) {
        for(let row = 0; row < player.length; row++) {
            const index = (row * player.length + col) * 4
            // console.log(data[index])
            if(data[index] === 255) {
                res.push({
                    x: col + x - player.length / 2 + 1,
                    y: row + y - player.length / 2 + 1,
                })
                // 如果碰到了一个红像素，则该列结束
                break
            } 
            // 如果碰到了地形内部像素 则该列结束
            else if(g === 255) {
                break
            }
        }
    }
    // console.log(res)
    return res
}

function isSame(pointA, pointB) {
    return (pointA.x === pointB.x && pointA.y === pointB.y) 
}

drawMap(map)
const player = {
    centerPoint: {
        x: 228,
        y: 246,
    },
    length: 50,
    leftPoint: {
        x: null,
        y: null,
    },
    rightPoint: {
        x: null,
        y: null,
    }
}
drawPlayer()
const surfacePoints = getSurfacePoints(player.centerPoint.x, player.centerPoint.y)
player.leftPoint = surfacePoints[0]
player.rightPoint = surfacePoints[surfacePoints.length - 1]

document.addEventListener('keydown', e => {
    if(e.code === 'ArrowRight') {
        if(isSame(player.centerPoint, player.rightPoint)) {
            console.log('is same')
            return
        }
        player.centerPoint.x = player.rightPoint.x
        player.centerPoint.y = player.rightPoint.y
        drawPlayer()
        const surfacePoints = getSurfacePoints(player.centerPoint.x, player.centerPoint.y)
        player.leftPoint = surfacePoints[0]
        player.rightPoint = surfacePoints[surfacePoints.length - 1]
    }
})