import { SHELL_CRATER_50_ellipse } from "../../shellCraters.js"
import { map } from "./map.js"
const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 500

const mapCanvasEl = document.querySelector('#map')
mapCanvasEl.width = CANVAS_WIDTH
mapCanvasEl.height = CANVAS_HEIGHT
const mapCtx = mapCanvasEl.getContext('2d', {
    willReadFrequently: true
})
mapCtx.lineWidth = 2    

function drawMap() {
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
    mapCtx.closePath()

    mapCtx.fillStyle = '#ededed'
    mapCtx.fill()

    mapCtx.strokeStyle = '#ff0000'
    mapCtx.stroke()
}

let damageRadius = 50

function setCirclePath(ctx, x, y, r) {
    ctx.arc(x, y, r, 0, Math.PI * 2)
}

function angleToRadian(degree) {
    return degree * Math.PI / 180
}

function setShellCraterPath(ctx, shellCrater, offset) {
    shellCrater.forEach((item, index) => {
        const x = item.split(',')[0]
        const y = item.split(',')[1]
        if(index === 0) {
            ctx.beginPath()
            ctx.moveTo(x - offset, y - offset)
        }
        else {
            ctx.lineTo(x - offset, y - offset)
        }
    })
    ctx.closePath()
}

let angle = 0
const rotateAngleInput = document.querySelector('#rotateAngleInput')
function registerListeners() {
    // 1.circle弹坑
    // mapCanvasEl.addEventListener('click', (ev) => {
    //     const {
    //         offsetX,
    //         offsetY
    //     } = ev

    //     const offscreenCanvas = document.createElement('canvas')
    //     offscreenCanvas.width = CANVAS_WIDTH
    //     offscreenCanvas.height = CANVAS_HEIGHT
    //     const offscreenCanvasCtx = offscreenCanvas.getContext('2d')
    //     offscreenCanvasCtx.lineWidth = mapCtx.lineWidth

    //     // 先fill => 再stroke(destination-out) -> 得到 【内部填充】
    //     offscreenCanvasCtx.beginPath()
        
    //     setCirclePath(offscreenCanvasCtx, offsetX, offsetY, damageRadius)
    //     offscreenCanvasCtx.fill()
    //     offscreenCanvasCtx.globalCompositeOperation = 'destination-out'
    //     offscreenCanvasCtx.stroke()

    //     // 然后将offscreenCanvas 以destination-out的方式，绘制到 mapCanvas上
    //     mapCtx.globalCompositeOperation = 'destination-out'
    //     mapCtx.drawImage(offscreenCanvas, 0, 0)

    //     // 最后绘制描边
    //     mapCtx.save()

    //     mapCtx.beginPath()
    //     mapCtx.globalCompositeOperation = 'source-atop'
    //     setCirclePath(mapCtx, offsetX, offsetY, damageRadius)
    //     mapCtx.stroke()

    //     mapCtx.restore()
    // })

    // 2.ellipse弹坑
    mapCanvasEl.addEventListener('click', (ev) => {
        const {
            offsetX,
            offsetY
        } = ev

        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = CANVAS_WIDTH
        offscreenCanvas.height = CANVAS_HEIGHT
        const offscreenCanvasCtx = offscreenCanvas.getContext('2d')
        offscreenCanvasCtx.lineWidth = mapCtx.lineWidth

        // 先fill => 再stroke(destination-out) -> 得到 【内部填充】
        offscreenCanvasCtx.save()

        // 先移动画布原点到target位置
        offscreenCanvasCtx.translate(offsetX, offsetY)
        // 再旋转画布
        offscreenCanvasCtx.rotate(angleToRadian(angle))
        // 再将shell crater 【画在画布正中心】
        setShellCraterPath(offscreenCanvasCtx, SHELL_CRATER_50_ellipse, 50)
        offscreenCanvasCtx.fill()

        offscreenCanvasCtx.globalCompositeOperation = 'destination-out'
        offscreenCanvasCtx.stroke()

        offscreenCanvasCtx.restore()

        mapCtx.globalCompositeOperation = 'destination-out'
        mapCtx.drawImage(offscreenCanvas, 0, 0)

        // 最后绘制描边
        mapCtx.save()

        mapCtx.translate(offsetX, offsetY)
        mapCtx.rotate(angleToRadian(angle))
        mapCtx.globalCompositeOperation = 'source-atop'
        setShellCraterPath(mapCtx, SHELL_CRATER_50_ellipse, 50)
        mapCtx.stroke()

        mapCtx.restore()
    })

    rotateAngleInput.addEventListener('change', () => {
        angle = rotateAngleInput.value
    })
      
}

drawMap()
registerListeners()


