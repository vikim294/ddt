const CANVAS_WIDTH = 1900
const CANVAS_HEIGHT = 900

const canvasEl = document.querySelector('canvas')
canvasEl.width = CANVAS_WIDTH
canvasEl.height = CANVAS_HEIGHT
const ctx = canvasEl.getContext('2d')

// console.time('t')
// for(let i = 0; i < 3000000000; i++) {
                    
// }

// console.timeEnd('t')


console.log(ctx.getImageData(0,0,1,1).data)