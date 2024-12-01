import { map } from "./map.js"

const CANVAS_WIDTH = 1900
const CANVAS_HEIGHT = 900

const mapCanvasEl = document.querySelector('#map')
mapCanvasEl.width = CANVAS_WIDTH
mapCanvasEl.height = CANVAS_HEIGHT
const mapCtx = mapCanvasEl.getContext('2d')

mapCtx.strokeStyle = '#ff0000'

function setTerrainOutlinePath(canvasCtx) {
    map.forEach((item, index) => {
        const x = item.split(',')[0]
        const y = item.split(',')[1]
        if(index === 0) {
            canvasCtx.beginPath()
            canvasCtx.moveTo(x, y)
        }
        else {
            canvasCtx.lineTo(x, y)
        }
    })
    canvasCtx.closePath()
}

function drawTerrain() {
    // 创建一个fillCanvas 用于得到 内部填充
    const fillCanvas = document.createElement('canvas')
    fillCanvas.width = CANVAS_WIDTH
    fillCanvas.height = CANVAS_HEIGHT
    const fillCanvasCtx = fillCanvas.getContext('2d')

    setTerrainOutlinePath(fillCanvasCtx)
    fillCanvasCtx.fillStyle = '#fafafa'
    fillCanvasCtx.fill()

    fillCanvasCtx.globalCompositeOperation = 'destination-out'
    fillCanvasCtx.stroke()

    // 创建一个 imageCanvas -> drawImage -> 绘制fillCanvas(destination-in) 得到 内部填充背景图
    const imageCanvas = document.createElement('canvas')
    imageCanvas.width = CANVAS_WIDTH
    imageCanvas.height = CANVAS_HEIGHT
    const imageCanvasCtx = imageCanvas.getContext('2d')

    const img = document.createElement('img')
    img.src = './bi.png'
    img.onload = () => {
        imageCanvasCtx.drawImage(img, 0, 0)
        imageCanvasCtx.globalCompositeOperation = 'destination-in'
        imageCanvasCtx.drawImage(fillCanvas, 0, 0)

        // mapCanvas上 绘制imageCanvasCtx
        mapCtx.drawImage(imageCanvas, 0, 0)

        // mapCanvas -> stroke
        setTerrainOutlinePath(mapCtx)
        mapCtx.stroke()
    }
}

function registerListeners() {
    mapCanvasEl.addEventListener('click', (ev) => {
        const {
            offsetX,
            offsetY
        } = ev

        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = CANVAS_WIDTH
        offscreenCanvas.height = CANVAS_HEIGHT
        const offscreenCanvasCtx = offscreenCanvas.getContext('2d')

        // 先fill => 再stroke(destination-out) -> 得到 【内部填充】
        offscreenCanvasCtx.beginPath()
        offscreenCanvasCtx.arc(offsetX, offsetY, damageRadius, 0, Math.PI * 2)
        offscreenCanvasCtx.fill()

        offscreenCanvasCtx.beginPath()
        offscreenCanvasCtx.arc(offsetX, offsetY, damageRadius, 0, Math.PI * 2)
        offscreenCanvasCtx.globalCompositeOperation = 'destination-out'
        offscreenCanvasCtx.stroke()

        // 然后将offscreenCanvas 以destination-out的方式，绘制到 mapCanvas上
        mapCtx.globalCompositeOperation = 'destination-out'
        mapCtx.drawImage(offscreenCanvas, 0, 0)

        // 最后绘制描边
        mapCtx.beginPath()
        mapCtx.globalCompositeOperation = 'source-atop'
        mapCtx.arc(offsetX, offsetY, damageRadius, 0, Math.PI * 2)
        mapCtx.stroke()
    })
}

const damageRadius = 50
registerListeners()

drawTerrain()
