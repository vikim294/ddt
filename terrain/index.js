import { DAMAGE_VALUE_FONTSIZE, MAP_BOUNDARY_GAP, PLAYER_BOUNDING_BOX_LENGTH, PLAYER_MOVING_DURATION, TRIDENT_ANGLE_DIFFERENCE } from "../../constants.js"
import { SHELL_CRATER_50_ellipse, SHELL_CRATER_50_round } from "../../shellCraters.js"
import { getDistanceBetweenTwoPoints } from "../../utils/index.js"
import { map, map2, climb, fall, multiple } from "./map.js"
import { DamageCanvas } from "./module/damageCanvas/damageCanvas.js"
const map3 = ["0, 800","1900, 800"]
const map4 = ["0, 800","1900, 800","1900, 900","0, 900"]

const CANVAS_WIDTH = 1900
const CANVAS_HEIGHT = 900
const G = -500

const backgroundCanvasEl = document.querySelector('#background')
const mapCanvasEl = document.querySelector('#map')
const staticCanvasEl = document.querySelector('#static')
const playerCanvasEl = document.querySelector('#player')
const weaponCanvasEl = document.querySelector('#weapon')
const damageCanvasEl = document.querySelector('#damage')
backgroundCanvasEl.width = CANVAS_WIDTH
backgroundCanvasEl.height = CANVAS_HEIGHT
mapCanvasEl.width = CANVAS_WIDTH
mapCanvasEl.height = CANVAS_HEIGHT
staticCanvasEl.width = CANVAS_WIDTH
staticCanvasEl.height = CANVAS_HEIGHT
playerCanvasEl.width = CANVAS_WIDTH
playerCanvasEl.height = CANVAS_HEIGHT
weaponCanvasEl.width = CANVAS_WIDTH
weaponCanvasEl.height = CANVAS_HEIGHT
damageCanvasEl.width = CANVAS_WIDTH
damageCanvasEl.height = CANVAS_HEIGHT

const backgroundCtx = backgroundCanvasEl.getContext('2d')
const mapCtx = mapCanvasEl.getContext('2d', {
    willReadFrequently: true
})
const staticCtx = staticCanvasEl.getContext('2d')
const playerCtx = playerCanvasEl.getContext('2d')
const weaponCtx = weaponCanvasEl.getContext('2d')
const damageCanvas = new DamageCanvas(damageCanvasEl, DAMAGE_VALUE_FONTSIZE)


mapCtx.lineWidth = 2
staticCtx.lineWidth = 1
playerCtx.lineWidth = 1
weaponCtx.lineWidth = 1

mapCtx.strokeStyle = '#ff0000'
mapCtx.fillStyle = '#00ff00'
weaponCtx.strokeStyle = '#000'

// ui
const firingAngleEl = document.querySelector('#firingAngle')
const firingPowerEl = document.querySelector('#firingPower')
const skillsEl = document.querySelector('#skills')
const plusOneEl = document.querySelector('#plusOne')
const tridentEl = document.querySelector('#trident')

function transformCanvasCoordinate(ctxArr = []) {
    ctxArr.forEach(ctx => {
        ctx.translate(0, CANVAS_HEIGHT)
        ctx.scale(1, -1)
    })
}

/**
 * 
 * 只有超过左侧 / 超过右侧 / 超过底部时，才算越界。因为超过顶部的炮弹 会落下来
 */
function pointOutOfMap(point) {
    const {
        x, y
    } = point
    return (x < 0 - MAP_BOUNDARY_GAP || x > CANVAS_WIDTH + MAP_BOUNDARY_GAP || y > CANVAS_HEIGHT + MAP_BOUNDARY_GAP)
}

function toCartesianCoordinateY(y) {
    return CANVAS_HEIGHT - y
}

function toCanvasCoordinateY(y) {
    return toCartesianCoordinateY(y)
}

function setCtxPathByMap(ctx, map) {
    map.forEach((item, index) => {
        const x = item.split(',')[0]
        const y = item.split(',')[1]
        if(index === 0) {
            ctx.beginPath()
            ctx.moveTo(x, y)
        }
        else {
            ctx.lineTo(x, y)
        }
    })
    ctx.closePath()
}

function setCtxPathByShellCrater(ctx, shellCrater, offset) {
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

function drawMap(map) {
    // console.log(map)
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

// 优化！！！
function drawMultipleMap(multipleMap) {
    console.log(multipleMap)

    // 先得到所有部分的 内部填充 绘制到 map上
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = CANVAS_WIDTH
    offscreenCanvas.height = CANVAS_HEIGHT
    const offscreenCanvasCtx = offscreenCanvas.getContext('2d')

    offscreenCanvasCtx.fillStyle = mapCtx.fillStyle
    offscreenCanvasCtx.lineWidth = 2
    multipleMap.forEach(map => {
        // 先fill => 再stroke(destination-out) -> 得到 【内部填充】
        offscreenCanvasCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        setCtxPathByMap(offscreenCanvasCtx, map)
        offscreenCanvasCtx.fill()
        offscreenCanvasCtx.save()
        // 以2像素进行 destination-out
        offscreenCanvasCtx.globalCompositeOperation = 'destination-out'
        offscreenCanvasCtx.stroke()
        offscreenCanvasCtx.restore()
        // 绘制到 map上
        mapCtx.drawImage(offscreenCanvas, 0, 0)
    })

    // 最后绘制描边
    multipleMap.forEach(map => {
        setCtxPathByMap(mapCtx, map)
        mapCtx.stroke()
    })
}

// PI radian = 180
function radianToAngle(radian) {
    return 180 / Math.PI * radian
}

function angleToRadian(angle) {
    return Math.PI / 180 * angle
}

function drawPlayerCenterPoint() {
    playerCtx.strokeStyle = '#000'
    playerCtx.beginPath()
    playerCtx.arc(0, 0, 1, 0, Math.PI * 2)
    playerCtx.stroke()
}

function drawPlayerDirectionIndicator() {
    playerCtx.strokeStyle = 'blue'
    playerCtx.beginPath()
    playerCtx.moveTo(0, 0)
    if(players[activePlayerIndex].direction === 'right') {
        playerCtx.lineTo(PLAYER_BOUNDING_BOX_LENGTH / 2, 0)
    }
    else if(players[activePlayerIndex].direction === 'left') {
        playerCtx.lineTo(-PLAYER_BOUNDING_BOX_LENGTH / 2, 0)
    }
    playerCtx.stroke()
}

function drawPlayerBoundingBox() {
    playerCtx.strokeStyle = '#36D'
    playerCtx.beginPath()
    playerCtx.strokeRect(- PLAYER_BOUNDING_BOX_LENGTH / 2, - PLAYER_BOUNDING_BOX_LENGTH / 2, PLAYER_BOUNDING_BOX_LENGTH, PLAYER_BOUNDING_BOX_LENGTH)
}

function drawPlayerName() {
    playerCtx.fillText(players[activePlayerIndex].name, 0, PLAYER_BOUNDING_BOX_LENGTH);
}

function drawPlayerHealth() {
    playerCtx.beginPath()
    const barWidth = 40
    const barHeight = 10
    playerCtx.strokeRect(0 - barWidth / 2, PLAYER_BOUNDING_BOX_LENGTH + barHeight, barWidth, barHeight)
    const ratio = players[activePlayerIndex].health / players[activePlayerIndex].healthMax
    // console.log(ratio)
    playerCtx.fillRect(0 - barWidth / 2, PLAYER_BOUNDING_BOX_LENGTH + barHeight, barWidth * ratio, barHeight)
}

function drawPlayer2Name() {
    staticCtx.fillText(players[inactivePlayerIndex].name, 0, players[inactivePlayerIndex].length);
}

function drawPlayer2Health() {
    staticCtx.beginPath()
    const barWidth = 40
    const barHeight = 10
    staticCtx.strokeRect(0 - barWidth / 2, players[inactivePlayerIndex].length + barHeight, barWidth, barHeight)
    const ratio = players[inactivePlayerIndex].health / players[inactivePlayerIndex].healthMax
    // console.log(ratio)
    staticCtx.fillRect(0 - barWidth / 2, players[inactivePlayerIndex].length + barHeight, barWidth * ratio, barHeight)
}

function drawPlayer2CenterPoint() {
    staticCtx.strokeStyle = '#000'
    staticCtx.beginPath()
    staticCtx.arc(0, 0, 1, 0, Math.PI * 2)
    staticCtx.stroke()
}

function drawPlayer2DirectionIndicator() {
    staticCtx.strokeStyle = 'blue'
    staticCtx.beginPath()
    staticCtx.moveTo(0, 0)
    if(players[inactivePlayerIndex].direction === 'right') {
        staticCtx.lineTo(players[inactivePlayerIndex].length / 2, 0)
    }
    else if(players[inactivePlayerIndex].direction === 'left') {
        staticCtx.lineTo(-players[inactivePlayerIndex].length / 2, 0)
    }
    staticCtx.stroke()
}

function drawPlayer2BoundingBox() {
    staticCtx.strokeStyle = '#36D'
    staticCtx.beginPath()
    staticCtx.strokeRect(- players[inactivePlayerIndex].length / 2, - players[inactivePlayerIndex].length / 2, players[inactivePlayerIndex].length, players[inactivePlayerIndex].length)
}

function getPointsInsidePlayerBoundingBox(_player) {   
    const { data } = mapCtx.getImageData(_player.x - _player.length / 2, _player.y - _player.length / 2, _player.length, _player.length)
    const redPoints = []
    for(let i = 0; i < data.length; i += 4) {
        const index = i / 4
        const r = data[i]
        // const g = data[i + 1]
        // const b = data[i + 2]
        const a = data[i + 3]
        const x = index % _player.length
        const y = Math.floor(index / _player.length)

        // console.log(`index: ${index}, rgba: (${r},${g},${b},${a})`)
        if(r === 255) {
            redPoints.push({
                // index,
                x,
                y,
                a
            })
        }
    }
    // console.log(redPoints)
    return redPoints
}

function filterPointsByAlpha(redPoints) {
    return redPoints.filter(item => item.a > 127)
}

function isAdjacent(pointA, pointB) {
    if(
        (pointA.x === pointB.x - 1) && (pointA.y === pointB.y - 1) ||
        (pointA.x === pointB.x) && (pointA.y === pointB.y - 1) ||
        (pointA.x === pointB.x + 1) && (pointA.y === pointB.y + 1) ||
        (pointA.x === pointB.x - 1) && (pointA.y === pointB.y) ||
        (pointA.x === pointB.x + 1) && (pointA.y === pointB.y) ||
        (pointA.x === pointB.x - 1) && (pointA.y === pointB.y + 1) ||
        (pointA.x === pointB.x) && (pointA.y === pointB.y + 1) ||
        (pointA.x === pointB.x + 1) && (pointA.y === pointB.y + 1)
    ) {
        return true
    }
    return false
}

// function getIntersectionPoints(player, redPoints) {
//     let boundingPoints = redPoints.filter(item => {
//         const { x, y } = item
//         return (x === 0 || x === PLAYER_BOUNDING_BOX_LENGTH - 1 || y === 0 || y === PLAYER_BOUNDING_BOX_LENGTH - 1)
//     })
//     console.log('boundingPoints', [...boundingPoints])

//     const boundingPointGroups = []

//     // 当 boundingPoints 不空
//     while(boundingPoints.length > 0) {
//         let item = boundingPoints.shift()
//         // console.log('pop item', item)

//         let isAdjacentTo = false
//         let indexesToBeRemoved = []
//         // 如果有 group
//         if(boundingPointGroups.length > 0) {
//             // 检查 item 是否 与 某个group的某个groupItem邻接，是则将其加入group，并删除item
//             for(let i = 0; i < boundingPointGroups.length; i++) {
//                 const curGroup = boundingPointGroups[i]

//                 for(let j = 0; j < curGroup.length; j++) {
//                     if(isAdjacent(item, curGroup[j])) {
//                         curGroup.push(item)
//                         indexesToBeRemoved.push(`${item.x},${item.y}`)
//                         isAdjacentTo = true
//                         break
//                     }
//                 }

//                 if(isAdjacentTo) {
//                     break
//                 }
//             }
//         }

//         if(!isAdjacentTo) {
//             const group = [item]
//             indexesToBeRemoved = []

//             // 如果 curItem 与 group的某个groupItem邻接，是则将其加入group，并删除item
//             for(let i = 0; i < boundingPoints.length; i++) {
//                 const curItem = boundingPoints[i]
//                 for(let j = 0; j < group.length; j++) {
//                     if(isAdjacent(curItem, group[j])) {
//                         group.push(curItem)
//                         indexesToBeRemoved.push(`${curItem.x},${curItem.y}`)
//                         break
//                     }
//                 }
//             }

//             boundingPointGroups.push(group)
//         }

//         boundingPoints = boundingPoints.filter(_item => !indexesToBeRemoved.includes(`${_item.x},${_item.y}`))
//     }

//     console.log('boundingPointGroups', boundingPointGroups)
//     // 如果 boundingPointGroups > 2组
//     if(boundingPointGroups.length > 2) {
//         throw new Error('boundingPointGroups > 2组')
//         return null
//     }

//     const filteredIntersectionPoints = []
//     boundingPointGroups.forEach(group => {
//         // 找出group中alpha最大的item 加入 filteredIntersectionPoints
//         const itemWithMaxAlpha = group.sort((pointA, pointB) => pointB.a - pointA.a)[0]
//         filteredIntersectionPoints.push({
//             x: itemWithMaxAlpha.x + player.x - PLAYER_BOUNDING_BOX_LENGTH / 2,
//             y: itemWithMaxAlpha.y + player.y - PLAYER_BOUNDING_BOX_LENGTH / 2,
//         })
//     })

//     // console.log('filteredIntersectionPoints', filteredIntersectionPoints)
//     return filteredIntersectionPoints.sort((pointA, pointB) => pointA.x - pointB.x)
// }

function getAngleByTwoTerrainPoints(pointA, pointB) {
    // console.log('pointA, pointB', pointA, pointB)
    const dy = toCartesianCoordinateY(pointA.y) - toCartesianCoordinateY(pointB.y)
    const dx = pointA.x - pointB.x
    const radian = Math.atan(dy / dx)
    // PI = 180°
    const angle = 180 / Math.PI * radian
    // console.log('angle', angle)
    return Math.floor(angle)
}

function getPlayerAngleByTwoTerrainPoints(pointA, pointB) {
    const angle = getAngleByTwoTerrainPoints(pointA, pointB)
    return players[activePlayerIndex].direction === 'right' ? angle : -angle
}

function drawPlayer() {
    playerCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    playerCtx.save()

    playerCtx.translate(players[activePlayerIndex].x, players[activePlayerIndex].y)
    drawPlayerCenterPoint()
    drawPlayerBoundingBox()

    playerCtx.save()
    playerCtx.fillStyle = '#36D'
    playerCtx.strokeStyle = '#36D'
    playerCtx.textAlign = 'center'

    drawPlayerName()
    drawPlayerHealth()
    
    playerCtx.restore()

    // ctx.rotate的旋转起始位置是x轴正方向，且为顺时针
    if(players[activePlayerIndex].direction === 'right') {
        playerCtx.rotate(-angleToRadian(players[activePlayerIndex].angle))
    }
    else if(players[activePlayerIndex].direction === 'left') {
        playerCtx.rotate(angleToRadian(players[activePlayerIndex].angle))
    }
    
    drawPlayerDirectionIndicator()
    playerCtx.restore()
}

function drawPlayer2() {
    staticCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    staticCtx.save()

    staticCtx.translate(players[inactivePlayerIndex].x, players[inactivePlayerIndex].y)
    drawPlayer2CenterPoint()
    drawPlayer2BoundingBox()

    staticCtx.save()
    staticCtx.fillStyle = '#ff0000'
    staticCtx.strokeStyle = '#ff0000'
    staticCtx.textAlign = 'center'

    drawPlayer2Name()
    drawPlayer2Health()
    
    staticCtx.restore()

    staticCtx.rotate(-angleToRadian(players[inactivePlayerIndex].angle))
    
    drawPlayer2DirectionIndicator()
    staticCtx.restore()
}


function getSurfacePoints(x, y, ctx, length) {
    const res = []
    const { data } = ctx.getImageData(x - length / 2, y - length / 2, length, length)
    for(let col = 0; col < length; col++) {
        for(let row = 0; row < length; row++) {
            const index = (row * length + col) * 4
            // console.log(data[index])
            const r = data[index]
            const g = data[index + 1]
            if(r === 255) {
                res.push({
                    x: col + x - length / 2 + 1,
                    y: row + y - length / 2 + 1,
                })
                break
            } 
            else if(g === 255) {
                break
            }
        }
    }
    // console.log(res)
    return res
}

// function getSurfacePointsOfTrackAroundTarget(track, targetX, targetY, length) {
//     // 1. draw Track on an offscreen canvas:
//     const offscreenCanvas = document.createElement('canvas')
//     offscreenCanvas.width = CANVAS_WIDTH
//     offscreenCanvas.height = CANVAS_HEIGHT
//     const offscreenCanvasCtx = offscreenCanvas.getContext('2d')
//     offscreenCanvasCtx.strokeStyle = '#ff0000'

//     drawTrack(offscreenCanvasCtx, track)

//     // 2.get SurfacePoints Of Track Around Target
//     return getSurfacePoints(targetX, targetY, offscreenCanvasCtx, length)
// }

function calculatePlayerPositionDataByPoint({x, y}) {
    const surfacePoints = getSurfacePoints(x, y, mapCtx, PLAYER_BOUNDING_BOX_LENGTH)
    const leftEndPoint = surfacePoints[0]
    const rightEndPoint = surfacePoints[surfacePoints.length - 1]
    const standPoint = {
        x, y
    }
    const angle = getPlayerAngleByTwoTerrainPoints(leftEndPoint, rightEndPoint)
    return [leftEndPoint, standPoint, rightEndPoint, angle]
}

/**
 * 
 * 根据player的x和y，计算 左右点、angle、weaponAngle 并返回
 */
function calculatePlayerData(player) {
    // 旧
    // let redPoints = getPointsInsidePlayerBoundingBox(player)
    // // console.log('redPoints', redPoints)
    // let intersectionPoints = getIntersectionPoints(player, filterPointsByAlpha(redPoints))
    // // if(!intersectionPoints) {
    // //     console.log('boundingPointGroups > 2组, 用 PLAYER_BOUNDING_BOX_LENGTH - 2 尝试')
    // //     return calculatePlayerData({
    // //         ...player,
    // //         length: PLAYER_BOUNDING_BOX_LENGTH - 2
    // //     })
    // // }
    // const [leftEndPoint, rightEndPoint] = intersectionPoints

    // 新
    const surfacePoints = getSurfacePoints(player.x, player.y, mapCtx, PLAYER_BOUNDING_BOX_LENGTH)
    const leftEndPoint = surfacePoints[0]
    const rightEndPoint = surfacePoints[surfacePoints.length - 1]
    
    if(leftEndPoint.x === rightEndPoint.x) {
        console.info('calculatePlayerData 左右两点的x相同!')
        return null
    }
    const angle = getAngleByTwoTerrainPoints(leftEndPoint, rightEndPoint)
    const data = {
        x: player.x,
        y: player.y,
        leftEndPoint,
        rightEndPoint,
        angle
    }
    if(!player.weaponAngle) {
        // 初始的 weaponAngle
        // data.weaponAngle = Math.floor(player.weapon.angleRange / 2)
    }
    return data
}

function playerSmoothlyMoves() {
    // 判断 block 
    if(isPlayerBlocked()) {
        console.log('block!')
        players[activePlayerIndex].isMoving = false
        return
    }

    // 判断 fall 
    if(willPlayerFallDown()) {
        console.log('fall!')
        playerFall()
        return
    }

    // move init
    players[activePlayerIndex].movingTimer = null
    players[activePlayerIndex].movingStartPoint = {
        x: players[activePlayerIndex].x,
        y: players[activePlayerIndex].y,
    }

    // A -> B anim
    requestAnimationFrame(playerSmoothlyMovesAnim)

    // precalculate position data at B
    const targetPoint = players[activePlayerIndex].direction === 'right' ? players[activePlayerIndex].rightEndPoint : players[activePlayerIndex].leftEndPoint
    const [
        leftEndPoint, standPoint, rightEndPoint, angle
    ] = calculatePlayerPositionDataByPoint(targetPoint)
    // points
    players[activePlayerIndex].preCalculatedPositionData.leftEndPoint = leftEndPoint
    players[activePlayerIndex].preCalculatedPositionData.standPoint = standPoint
    players[activePlayerIndex].preCalculatedPositionData.rightEndPoint = rightEndPoint
    // angle
    players[activePlayerIndex].preCalculatedPositionData.angle =angle
}

function playerSmoothlyMovesAnim(timestamp) {
    if(!players[activePlayerIndex].isMoving) {
        return
    }

    // 根据 player.direction，从当前A -> B
    if(!players[activePlayerIndex].movingTimer) {
        players[activePlayerIndex].movingTimer = timestamp
    }

    const progress = Math.min((timestamp - players[activePlayerIndex].movingTimer) / PLAYER_MOVING_DURATION, 1)

    // 
    const xA = players[activePlayerIndex].movingStartPoint.x
    const yA = players[activePlayerIndex].movingStartPoint.y
    const xB = players[activePlayerIndex].direction === 'right' ? players[activePlayerIndex].rightEndPoint.x : players[activePlayerIndex].leftEndPoint.x
    const yB = players[activePlayerIndex].direction === 'right' ? players[activePlayerIndex].rightEndPoint.y : players[activePlayerIndex].leftEndPoint.y
    const x = xA + (xB - xA) * progress
    const y = yA + (yB - yA) * progress
    players[activePlayerIndex].x = Math.floor(x)
    players[activePlayerIndex].y = Math.floor(y)

    if(progress === 1) {
        // console.log('arrived at B')
        // replace A with B
        updatePlayerPositionDataByPreCalculatedPositionData()

        drawPlayer()
        updatePlayerPositionDataOnPage()

        // B -> C
        playerSmoothlyMoves()
        return
    }
    drawPlayer()
    requestAnimationFrame(playerSmoothlyMovesAnim)
}

function updatePlayerFiringAngle() {
    firingAngleEl.innerHTML = players[activePlayerIndex].angle + players[activePlayerIndex].weaponAngle
}

function updatePlayerFiringPower() {
    firingPowerEl.innerHTML = players[activePlayerIndex].firingPower
}

function updatePlayerSkills(skill) {
    skillsEl.innerHTML += skill
}

function clearPlayerSkills() {
    skillsEl.innerHTML = ''
}

function updatePlayerPositionDataByPreCalculatedPositionData() {
    players[activePlayerIndex].x = players[activePlayerIndex].preCalculatedPositionData.standPoint.x
    players[activePlayerIndex].y = players[activePlayerIndex].preCalculatedPositionData.standPoint.y
    players[activePlayerIndex].leftEndPoint = players[activePlayerIndex].preCalculatedPositionData.leftEndPoint
    players[activePlayerIndex].rightEndPoint = players[activePlayerIndex].preCalculatedPositionData.rightEndPoint
    players[activePlayerIndex].angle = players[activePlayerIndex].preCalculatedPositionData.angle
}

function updatePlayerPositionDataOnPage() {
    updatePlayerFiringAngle()
}

function updatePlayerData(data) {
    const {
        x,
        y,
        leftEndPoint,
        rightEndPoint,
        angle,
        weaponAngle
    } = data
    players[activePlayerIndex].x = x
    players[activePlayerIndex].y = y
    players[activePlayerIndex].leftEndPoint = leftEndPoint
    players[activePlayerIndex].rightEndPoint = rightEndPoint
    players[activePlayerIndex].angle = players[activePlayerIndex].direction === 'right' ? angle : -angle
    if(weaponAngle) {
        // 初始的 weaponAngle
        players[activePlayerIndex].weaponAngle = weaponAngle
    }
    updatePlayerFiringAngle()
}

function updatePlayer2Data(data) {
    const {
        x,
        y,
        leftEndPoint,
        rightEndPoint,
        angle,
        weaponAngle
    } = data

    players[inactivePlayerIndex].x = x
    players[inactivePlayerIndex].y = y
    players[inactivePlayerIndex].leftEndPoint = leftEndPoint
    players[inactivePlayerIndex].rightEndPoint = rightEndPoint
    players[inactivePlayerIndex].angle = angle
    if(weaponAngle) {
        // 初始的 weaponAngle
        players[inactivePlayerIndex].weaponAngle = weaponAngle
    }
    // updatePlayerFiringAngle()
}


// function isPlayerBlocked() {
//     if(players[activePlayerIndex].direction === 'right') {
//         if(players[activePlayerIndex].leftEndPoint.x !== players[activePlayerIndex].rightEndPoint.x) {
//             // 那么就能区分出左右两点
//             if(players[activePlayerIndex].rightEndPoint.y < players[activePlayerIndex].y) {
//                 // 右点在中点的上方
//                 if(players[activePlayerIndex].rightEndPoint.x === players[activePlayerIndex].x) {
//                     console.info('右点在中点的正上方')
//                     return true
//                 }
                
//                 if(players[activePlayerIndex].leftEndPoint.x < players[activePlayerIndex].x && players[activePlayerIndex].rightEndPoint.x < players[activePlayerIndex].x) {
//                     console.info('左右两点在中点的左侧，且右点在中点的上方')
//                     return true
//                 }
//             }

//             return false
//         }
//         else {
//             console.info('isPlayerBlocked 左右两点的x相同!')
//             return true
//         }
//     }
// }

function isPlayerBlocked() {
    const standPoint = {
        x: players[activePlayerIndex].x,
        y: players[activePlayerIndex].y
    }
    if(players[activePlayerIndex].direction === 'right') {
        // 如果 right point 和 stand point 的角度 > 65
         return getPlayerAngleByTwoTerrainPoints(players[activePlayerIndex].rightEndPoint, standPoint) > 65
    }
    else {
        return getPlayerAngleByTwoTerrainPoints(players[activePlayerIndex].leftEndPoint, standPoint) > 65
    }
}

function willPlayerFall() {
    if(players[activePlayerIndex].direction === 'right') {
        if(players[activePlayerIndex].leftEndPoint.x !== players[activePlayerIndex].rightEndPoint.x) {
            // 那么就能区分出左右两点，左点一定在右点的左侧
        
            if(players[activePlayerIndex].rightEndPoint.x === players[activePlayerIndex].x) {
                console.info('右点和中点的x相同')
                return true
            }
            else if(players[activePlayerIndex].rightEndPoint.x < players[activePlayerIndex].x) {
                console.info('右点在中点的左侧')
                return true
            }
              
            return false
        }
        else {
            if(players[activePlayerIndex].leftEndPoint.x <= players[activePlayerIndex].x) {
                // 左右两点和中点的x相同，或 左右两点都在中点左侧
                return true
            }
            else {
                // 左右两点都在中点右侧
                return false
            }
        }
    }
    else {
        if(players[activePlayerIndex].leftEndPoint.x !== players[activePlayerIndex].rightEndPoint.x) {
            // 那么就能区分出左右两点，左点一定在右点的左侧
        
            if(players[activePlayerIndex].leftEndPoint.x === players[activePlayerIndex].x) {
                console.info('左点和中点的x相同')
                return true
            }
            else if(players[activePlayerIndex].leftEndPoint.x > players[activePlayerIndex].x) {
                console.info('左点在中点的右侧')
                return true
            }
              
            return false
        }
        else {
            if(players[activePlayerIndex].leftEndPoint.x >= players[activePlayerIndex].x) {
                // 左右两点和中点的x相同，或 左右两点都在中点右侧
                return true
            }
            else {
                // 左右两点都在中点右侧
                return false
            }
        }
    }
}

function willPlayerFallDown() {
    const standPoint = {
        x: players[activePlayerIndex].x,
        y: players[activePlayerIndex].y
    }
    if(players[activePlayerIndex].direction === 'right') {
        // 如果 right point 和 stand point 的距离 <= 5px
        const d = getDistanceBetweenTwoPoints(standPoint, players[activePlayerIndex].rightEndPoint)
        return d <= 5
    }
    else {
        const d = getDistanceBetweenTwoPoints(standPoint, players[activePlayerIndex].leftEndPoint)
        return d <= 5
    }
}

function playerFallAnim(timestamp) {
    if(!players[activePlayerIndex].movingTimer) {
        players[activePlayerIndex].movingTimer = timestamp
    }

    const progress = Math.min((timestamp - players[activePlayerIndex].movingTimer) / players[activePlayerIndex].fallDuration, 1)

    const xA = players[activePlayerIndex].fallStartPoint.x
    const yA = players[activePlayerIndex].fallStartPoint.y
    const xB = players[activePlayerIndex].fallTargetPoint.x
    const yB = players[activePlayerIndex].fallTargetPoint.y
    const x = xA + (xB - xA) * progress
    const y = yA + (yB - yA) * progress
    players[activePlayerIndex].x = Math.floor(x)
    players[activePlayerIndex].y = Math.floor(y)
    drawPlayer()

    if(progress === 1) {
        players[activePlayerIndex].isFallingDown = false
        updatePlayerPositionData()
        players[activePlayerIndex].isMoving = false
        return
    }
    requestAnimationFrame(playerFallAnim)
}

function playerFall() {
    // console.log('playerFall',players[activePlayerIndex].x, players[activePlayerIndex].y)
    const inc = players[activePlayerIndex].direction === 'right' ? 5 : -5
    const newPlayerX = players[activePlayerIndex].x + inc
    const { data } = mapCtx.getImageData(newPlayerX, players[activePlayerIndex].y, 1, CANVAS_HEIGHT - players[activePlayerIndex].y)
    for(let i = 0; i < data.length; i += 4) {
        const index = i / 4
        const r = data[i]
        // const g = data[i + 1]
        // const b = data[i + 2]
        const a = data[i + 3]
        const x = newPlayerX
        const y = players[activePlayerIndex].y + index

        if(r === 255) {
            // console.log(x, y, a)

            // fall init
            players[activePlayerIndex].isFallingDown = true
            players[activePlayerIndex].movingTimer = null
            players[activePlayerIndex].fallStartPoint = {
                x: newPlayerX,
                y: players[activePlayerIndex].y,
            }
            players[activePlayerIndex].fallTargetPoint = {
                x,
                y
            }
            // 下落速度 1000ms = 1s = 100px
            players[activePlayerIndex].fallDuration = (players[activePlayerIndex].fallTargetPoint.y - players[activePlayerIndex].fallStartPoint.y) * 10

            // fall anim 落到点x，y
            requestAnimationFrame(playerFallAnim)    
            return
        }
    }

    console.info('player掉进地图外了！')
}

function playerMoves(direction) {
    // console.log(players[activePlayerIndex])

    // 如果方向改变了，则只调整角度，不移动...
    if(players[activePlayerIndex].direction !== direction) {
        players[activePlayerIndex].direction = direction
        let _player = {
            ...players[activePlayerIndex]
        }
        calculateAndDrawPlayerByXY(_player)
        return
    }

    if(direction === 'right' || direction === 'left') {
        if(isPlayerBlocked()) {
            console.log('block!')
            return
        }

        if(willPlayerFall()) {
            console.log('fall!')

            playerFall()
            return
        }

        let _player = {
            ...players[activePlayerIndex]
        }

        if(direction === 'right') {
            _player.x = players[activePlayerIndex].rightEndPoint.x
            _player.y = players[activePlayerIndex].rightEndPoint.y
        }
        else {
            _player.x = players[activePlayerIndex].leftEndPoint.x
            _player.y = players[activePlayerIndex].leftEndPoint.y
        }

        calculateAndDrawPlayerByXY(_player)
    }
}

function adjustWeaponAngle(direction) {
    if(direction === 'up') {
        const newWeaponAngle = players[activePlayerIndex].weaponAngle + 1
        if(newWeaponAngle <= players[activePlayerIndex].weapon.angleRange) {
            players[activePlayerIndex].weaponAngle = newWeaponAngle
            updatePlayerFiringAngle()
        }
    }
    else {
        const newWeaponAngle = players[activePlayerIndex].weaponAngle - 1
        if(newWeaponAngle >= 0) {
            players[activePlayerIndex].weaponAngle = newWeaponAngle
            updatePlayerFiringAngle()
        }
    }
}

function adjustFiringPower() {
    const newFiringPower = players[activePlayerIndex].firingPower + 1
    if(newFiringPower <= 100) {
        players[activePlayerIndex].firingPower = newFiringPower
    }
    else {
        players[activePlayerIndex].firingPower = 0
    }
    updatePlayerFiringPower()
}

function playerStartToFire() {
    const { data: canvasData } = bombDrawingOffscreenCanvasCtx.getImageData(0, 0, bombDrawingOffscreenCanvasEl.width, bombDrawingOffscreenCanvasEl.height)

    // console.time('preCalculateBombData')
    // preCalculateBombData 耗时好像也不是很长，所以暂时不需要用web worker吧
    preCalculateBombData(canvasData)
    // console.timeEnd('preCalculateBombData')
    playerFires()
    
    // 发射后，隔1s后再发射
    players[activePlayerIndex].numberOfFires--
    if(players[activePlayerIndex].numberOfFires > 0) {
        const timerId = setTimeout(()=>{
            clearTimeout(timerId)
            playerStartToFire()
        }, 1000)
    }
}

function playerFires() {
    if(isDrawingBomb) return
    isDrawingBomb = true
    drawBomb()
}

function playerStartToFireTrident() {
    const firingAngle = players[activePlayerIndex].angle + players[activePlayerIndex].weaponAngle
    const angle = players[activePlayerIndex].direction === 'right' ? firingAngle : 180 - firingAngle
    const power = players[activePlayerIndex].firingPower
    const v0 = power * 10

    players[activePlayerIndex].bombs = []
    for(let i = 0; i < 3; i++) {
        let newAngle = angle
        if(i === 0) {
            newAngle -= TRIDENT_ANGLE_DIFFERENCE
        }
        else if(i === 2) {
            newAngle += TRIDENT_ANGLE_DIFFERENCE
        }

        const bomb = {
            // bomb从 player中心上方 PLAYER_BOUNDING_BOX_LENGTH 处发射
            x: players[activePlayerIndex].x,
            y: players[activePlayerIndex].y - PLAYER_BOUNDING_BOX_LENGTH,
    
            v0Horizontal: v0 * Math.cos(angleToRadian(newAngle)),
            v0Vertical: v0 * Math.sin(angleToRadian(newAngle)),
    
            damageRadius: 50,
            isBombed: false
        }
    
        players[activePlayerIndex].bombs.push(bomb)
    }

    // console.log('players[activePlayerIndex].bombs', players[activePlayerIndex].bombs)

    playerFiresTrident()
}

function playerFiresTrident() {
    players[activePlayerIndex].numberOfFires--

    preCalculateTridentData()

    players[activePlayerIndex].firingTime = +new Date()
    drawTrident()
}

function drawTrack(ctx, track = []) {
    ctx.save()

    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath()
    track.forEach((point, index) => {
        const {
            x, y
        } = point
        if(index === 0) {
            ctx.moveTo(x, y)
        }
        else {
            ctx.lineTo(x, y)
        }
    })
    ctx.stroke()

    ctx.restore()
}

function preCalculateBombData(canvasData) {
    // 假定发射角度为 60度、力度为100
    const firingAngle = players[activePlayerIndex].angle + players[activePlayerIndex].weaponAngle
    const angle = players[activePlayerIndex].direction === 'right' ? firingAngle : 180 - firingAngle
    const power = players[activePlayerIndex].firingPower
    // 角度会投影到x和y轴、力度决定初速度
    // 位移 = v0 * t + 1/2 * a * t * t
    // 水平方向只有初速度，无加速度，x = v0Horizontal * t
    // 垂直方向有初速度，和重力加速度g, y = v0Vertical * t + 1/2 * g * t * t

    // 力度 和 初速度 的关系：100力度 = 1000px/s => 1力度 = 10px/s

    // 水平方向
    const v0 = power * 10
    // console.log('v0', v0)
    let v0Horizontal = v0 * Math.cos(angleToRadian(angle))
    // console.log('v0Horizontal', v0Horizontal)

    // 垂直方向
    let v0Vertical = v0 * Math.sin(angleToRadian(angle))

    const bomb = {
        id: +new Date(),
        x: players[activePlayerIndex].x,
        y: players[activePlayerIndex].y - PLAYER_BOUNDING_BOX_LENGTH,
        v0Horizontal,
        v0Vertical,
        damageRadius: 50,
    }

    players[activePlayerIndex].bombsData.push(bomb)
    
    let sec = 0
    let _bomb = {
        ...bomb
    }

    // --- calculate Track
    const track = []
    while(!pointOutOfMap(_bomb)) {
        // console.log('preCalculate')
        track.push({
            x: _bomb.x,
            y: _bomb.y,
            sec
        })

        sec += 0.001
        sec = +sec.toFixed(3)

        const x = players[activePlayerIndex].x + _bomb.v0Horizontal * sec
        const y = toCartesianCoordinateY(players[activePlayerIndex].y - PLAYER_BOUNDING_BOX_LENGTH) + _bomb.v0Vertical * sec + 1 / 2 * G * sec * sec
        _bomb.x = Math.floor(x)
        _bomb.y = Math.floor(toCanvasCoordinateY(y))
    }

    // console.log('pointOutOfMap! sec:', sec)
    // console.log('track', track)

    // drawTrack(weaponCtx, track)

    // players[activePlayerIndex].bomb.track = track
    bomb.track = track

    // get real-time angle and target info
    for(let i = 0; i < track.length; i++) {

        // --- bomb角度计算
        if(i >= 10 && i <= track.length - 11) {
            const point1 = track[i - 10]
            const point2 = track[i + 10]

            const angle = getAngleByTwoTerrainPoints(point1, point2)
            // console.log('angle', angle)
    
            let bombAngle = null
            if(players[activePlayerIndex].direction === 'right') {
                // console.log('player朝右 bomb的角度(canvas需要rotate的角度)为：', -angle)
                bombAngle = -angle
            }
            else {
                // console.log('player朝左 bomb的角度(canvas需要rotate的角度)为：', 180 + -angle)
                bombAngle = 180 + -angle
            }
    
            track[i].bombAngle = bombAngle
        }

        if(!bomb.bombSec) {
            const {
                x, y, sec
            } = track[i]

            // 如果track上的该点 在map范围外
            if(x < 0 || y < 0 || x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT) {
                continue
            }

            // x y 像素的数据
            const index = (y * CANVAS_WIDTH + x) * 4
            const r = canvasData[index]
            const g = canvasData[index + 1]
            const b = canvasData[index + 2]
            const a = canvasData[index + 3]
            // console.log('x, y', x, y, 'r, g, b, a', r, g, b, a)
    
            if(!(r === 0 && g === 0 && b === 0)) {
                bomb.targetX = x
                bomb.targetY = y
                bomb.bombSec = sec
    
                console.log(bomb)

                // 在离屏canvas上 bomb 
                bombTarget({
                    x,
                    y,
                    damageRadius: bomb.damageRadius
                }, bombDrawingOffscreenCanvasCtx)

            }
        }
    }

    if(!bomb.bombSec) {
        console.log('out of map boundary', bomb)
        const {
            x, y
        } = track[track.length - 1]
        bomb.targetX = x
        bomb.targetY = y
        bomb.bombSec = sec
        bomb.isOutOfMapBoundary = true
    }

    bomb.firingTime = +new Date()
}

function preCalculateTridentData() {
    const offscreenMapCanvasEl = document.createElement('canvas')
    offscreenMapCanvasEl.width = mapCanvasEl.width
    offscreenMapCanvasEl.height = mapCanvasEl.height
    const offscreenCtx = offscreenMapCanvasEl.getContext('2d', {
        willReadFrequently: true
    })

    // 复制 map到 offscreenMap
    offscreenCtx.drawImage(mapCanvasEl, 0, 0)

    for(let i = 0; i < 3; i++) {
        const bomb = players[activePlayerIndex].bombs[i]
        let sec = 0
        let _bomb = {
            ...bomb
        }

        const track = []
        while(!pointOutOfMap(_bomb)) {
            // console.log('preCalculate')
            track.push({
                x: _bomb.x,
                y: _bomb.y,
                sec
            })

            sec += 0.004
            const x = players[activePlayerIndex].x + _bomb.v0Horizontal * sec
            const y = toCartesianCoordinateY(players[activePlayerIndex].y - PLAYER_BOUNDING_BOX_LENGTH) + _bomb.v0Vertical * sec + 1 / 2 * G * sec * sec
            _bomb.x = Math.floor(x)
            _bomb.y = Math.floor(toCanvasCoordinateY(y))
        }

        // console.log('pointOutOfMap! sec:', sec)
        // console.log('track', track)

        // drawTrack(weaponCtx, track)

        // getTarget
        let isBombOutOfMapBoundary = true
        for(let point of track) {
            const {
                x, y, sec
            } = point
            const { data } = offscreenCtx.getImageData(x, y, 1, 1)
            const r = data[0]
            const g = data[1]
            const b = data[2]
            // console.log('x, y', x, y, 'r, g, b', r, g, b)

            if(!(r === 0 && g === 0 && b === 0)) {
                bomb.targetX = x
                bomb.targetY = y
                bomb.bombSec = sec

                console.log(i, bomb)
                isBombOutOfMapBoundary = false

                // 在离屏canvas上 bomb 
                bombTarget({
                    x,
                    y,
                    damageRadius: bomb.damageRadius
                }, offscreenCtx)

                break
            }
        }

        if(isBombOutOfMapBoundary) {
            console.log('bomb', i, 'out of map boundary')
            const {
                x, y
            } = track[track.length - 1]
            bomb.targetX = x
            bomb.targetY = y
            bomb.bombSec = sec
            bomb.isOutOfMapBoundary = true
        }
    }
}

function drawBomb() {
    if(players[activePlayerIndex].bombsData.length === 0 && players[activePlayerIndex].numberOfFires === 0) {
        isDrawingBomb = false

        // 重置 players[activePlayerIndex].firingPower
        players[activePlayerIndex].firingPower = 0
        updatePlayerFiringPower()

        // nextTurn?
        console.log('startNextTurn')
        // startNextTurn()
        return
    }

    requestAnimationFrame(drawBomb)

    weaponCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    for(let i = 0; i < players[activePlayerIndex].bombsData.length; i++) {
        const bomb = players[activePlayerIndex].bombsData[i]
        const elapsedMs = +new Date() - bomb.firingTime

        // 该bomb不应该再被渲染到画布上了
        if(elapsedMs >= bomb.bombSec * 1000) {
            // weaponCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            players[activePlayerIndex].bombsData = players[activePlayerIndex].bombsData.filter(item => item !== bomb)
    
            if(!bomb.isOutOfMapBoundary) {
                const target = {
                    x: bomb.x,
                    y: bomb.y,
                    damageRadius: bomb.damageRadius,
                    bombAngle: bomb.track[elapsedMs].bombAngle
                }
                bombTarget(target, mapCtx)
                // 对player的effect
                checkBombEffect(target)
            }

            continue
        }

        // --- render bomb
        const {
            x,
            y,
            // bombAngle
        } = bomb.track[elapsedMs]

        // 1.
        weaponCtx.beginPath()
        weaponCtx.arc(bomb.x, bomb.y, 1, 0, Math.PI * 2)
        weaponCtx.stroke()
        // 2.bomb使用图片 且角度动态改变
        // weaponCtx.save()

        // weaponCtx.translate(players[activePlayerIndex].bomb.x, players[activePlayerIndex].bomb.y)
        // weaponCtx.rotate(angleToRadian(bombAngle))
        // weaponCtx.drawImage(bombImgEl, 0, 0, bombImgEl.width, bombImgEl.height, -bombImgEl.width / 2, -bombImgEl.height / 2, bombImgEl.width, bombImgEl.height)

        // weaponCtx.restore()

        // 计算在笛卡尔坐标系下的 x 和 y
        // const x = players[activePlayerIndex].x + players[activePlayerIndex].bomb.v0Horizontal * elapsedSec
        // bomb从 player中心上方 PLAYER_BOUNDING_BOX_LENGTH 处发射
        // const y = toCanvasCoordinateY(toCartesianCoordinateY(players[activePlayerIndex].y - PLAYER_BOUNDING_BOX_LENGTH) + players[activePlayerIndex].bomb.v0Vertical * elapsedSec + 1 / 2 * G * elapsedSec * elapsedSec)
        // 最终要绘制的bomb的坐标 需要用canvas的坐标系
        // players[activePlayerIndex].bomb.x = Math.floor(x)
        // players[activePlayerIndex].bomb.y = Math.floor(y)

        bomb.x = x
        bomb.y = y
    }
}

function drawTrident() {
    if(players[activePlayerIndex].bombs.every(bomb => bomb.isBombed)) {
        // 全部bomb
        console.log('全部bomb')

        if(players[activePlayerIndex].numberOfFires !== 0) {
            // 继续发射
            setTimeout(() => {
                playerStartToFireTrident()
            }, 2000);
        }
        else {
            // 重置 players[activePlayerIndex].firingPower
            players[activePlayerIndex].firingPower = 0
            updatePlayerFiringPower()

            startNextTurn()
        }

        return
    }

    const elapsedSec = (+new Date() - players[activePlayerIndex].firingTime) / 1000

    requestAnimationFrame(drawTrident)

    weaponCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    for(let i = 0; i < 3; i++) {
        const bomb = players[activePlayerIndex].bombs[i]

        if(bomb.isBombed) continue

        // 如果bomb到达了target
        if(!bomb.isBombed && elapsedSec >= bomb.bombSec) {
            bomb.isBombed = true
    
            if(!bomb.isOutOfMapBoundary) {
                const target = {
                    x: bomb.x,
                    y: bomb.y,
                    damageRadius: bomb.damageRadius
                }
                bombTarget(target, mapCtx)
                // 对player的effect
                checkBombEffect(target)
            }

            continue
        }

        weaponCtx.beginPath()
        weaponCtx.arc(bomb.x, bomb.y, 1, 0, Math.PI * 2)
        weaponCtx.stroke()

        // 计算在笛卡尔坐标系下的 x 和 y
        const x = players[activePlayerIndex].x + bomb.v0Horizontal * elapsedSec
        // bomb从 player中心上方 PLAYER_BOUNDING_BOX_LENGTH 处发射
        const y = toCanvasCoordinateY(toCartesianCoordinateY(players[activePlayerIndex].y - PLAYER_BOUNDING_BOX_LENGTH) + bomb.v0Vertical * elapsedSec + 1 / 2 * G * elapsedSec * elapsedSec)
        // 最终要绘制的bomb的坐标 需要用canvas的坐标系
        bomb.x = Math.floor(x)
        bomb.y = Math.floor(y)
    }
}

function bombTarget(target, ctx) {
    const {
        x,
        y,
        damageRadius,
        bombAngle
    } = target
    // console.log(target)

    // ---
    const offscreenCanvas = document.createElement('canvas')
    offscreenCanvas.width = CANVAS_WIDTH
    offscreenCanvas.height = CANVAS_HEIGHT
    const offscreenCanvasCtx = offscreenCanvas.getContext('2d')
    offscreenCanvasCtx.lineWidth = ctx.lineWidth

    // 先fill => 再stroke(destination-out) -> 得到 【内部填充】
    // 1
    // offscreenCanvasCtx.beginPath()
    // offscreenCanvasCtx.arc(x, y, damageRadius, 0, Math.PI * 2)
    // 2
    offscreenCanvasCtx.save()
    // offscreenCanvasCtx.translate(x - damageRadius, y - damageRadius)
    // setCtxPathByMap(offscreenCanvasCtx, SHELL_CRATER_50_round)
    // 3
    offscreenCanvasCtx.translate(x, y)
    offscreenCanvasCtx.rotate(angleToRadian(bombAngle))
    setCtxPathByShellCrater(offscreenCanvasCtx, SHELL_CRATER_50_ellipse, 50)
    offscreenCanvasCtx.fill()

    offscreenCanvasCtx.globalCompositeOperation = 'destination-out'
    offscreenCanvasCtx.stroke()

    offscreenCanvasCtx.restore()

    // 然后将offscreenCanvas 以destination-out的方式，绘制到 mapCanvas上
    ctx.globalCompositeOperation = 'destination-out'
    ctx.drawImage(offscreenCanvas, 0, 0)

    // 最后绘制描边
    // 1
    // ctx.beginPath()
    ctx.globalCompositeOperation = 'source-atop'
    // ctx.arc(x, y, damageRadius, 0, Math.PI * 2)

    ctx.save()
    // 2
    // ctx.translate(x - damageRadius, y - damageRadius)
    // setCtxPathByMap(ctx, SHELL_CRATER_50_round)
    // 3
    ctx.translate(x, y)
    ctx.rotate(angleToRadian(bombAngle))
    setCtxPathByShellCrater(ctx, SHELL_CRATER_50_ellipse, 50)
    ctx.stroke()

    ctx.restore()
}

function checkBombEffect(target) {
    const {
        x,
        y,
        damageRadius
    } = target

    const bombId = +new Date()

    // 对 active player的影响
    // 判断爆炸点 和 player2中心 的距离 是否 <= damageRadius
    const d1 = getDistanceBetweenTwoPoints({
        x,
        y
    }, players[activePlayerIndex])
    if(d1 <= damageRadius) {
        console.log('active player gets hurt!')

        // 准备显示 damageValue            
        damageCanvas.addDamage({
            bombId,
            x: players[activePlayerIndex].x,
            y: players[activePlayerIndex].y,
            damageValue: players[activePlayerIndex].weapon.damage,
            isCriticalHit: false
        })

        // player hp 计算
        const newHealth = players[activePlayerIndex].health - players[activePlayerIndex].weapon.damage
        if(newHealth > 0) {
            players[activePlayerIndex].health = newHealth
        }
        else {
            players[activePlayerIndex].health = 0
            console.log('--- active player is dead! ---')
        }
        
        // --- fall
        // const { data } = mapCtx.getImageData(players[activePlayerIndex].x, players[activePlayerIndex].y, 1, CANVAS_HEIGHT - players[activePlayerIndex].y)
        // let isPlayerOutOfMapBoundary = true
        // for(let i = 0; i < data.length; i += 4) {
        //     const index = i / 4
        //     const r = data[i]
        //     // const g = data[i + 1]
        //     // const b = data[i + 2]
        //     const a = data[i + 3]
        //     const x = players[activePlayerIndex].x
        //     const y = players[activePlayerIndex].y + index

        //     if(r === 255) {
        //         // console.log(x, y, a)
        //         isPlayerOutOfMapBoundary = false
        //         calculateAndDrawPlayerByXY({
        //             ...players[activePlayerIndex],
        //             x,
        //             y
        //         })

        //         break
        //     }
        // }

        // if(isPlayerOutOfMapBoundary) {
        //     console.info('active player 掉进地图外了！')
        // }

        playerFall()
    }

    // 判断爆炸点 和 player2中心 的距离 是否 <= damageRadius
    const d2 = getDistanceBetweenTwoPoints({
        x,
        y
    }, players[inactivePlayerIndex])
    if(d2 <= damageRadius) {

        // 准备显示 damageValue            
        damageCanvas.addDamage({
            bombId,
            x: players[inactivePlayerIndex].x,
            y: players[inactivePlayerIndex].y,
            damageValue: players[activePlayerIndex].weapon.damage,
            isCriticalHit: false
        })

        console.log('player2 gets hurt!')
        // player2 hp 计算
        const newHealth = players[inactivePlayerIndex].health - players[activePlayerIndex].weapon.damage
        if(newHealth > 0) {
            players[inactivePlayerIndex].health = newHealth
        }
        else {
            players[inactivePlayerIndex].health = 0
            console.log('--- player2 is dead! ---')
        }
      
        // 处理爆炸后的地形 对player2的影响
        // 以player2中点 垂直向下画一条线，寻找与地形的第一个红色像素点
        const { data } = mapCtx.getImageData(players[inactivePlayerIndex].x, players[inactivePlayerIndex].y, 1, CANVAS_HEIGHT - players[inactivePlayerIndex].y)
        let isPlayerOutOfMapBoundary = true
        for(let i = 0; i < data.length; i += 4) {
            const index = i / 4
            const r = data[i]
            // const g = data[i + 1]
            // const b = data[i + 2]
            const a = data[i + 3]
            const x = players[inactivePlayerIndex].x
            const y = players[inactivePlayerIndex].y + index

            if(r === 255) {
                // console.log(x, y, a)
                isPlayerOutOfMapBoundary = false
                players[inactivePlayerIndex] = {
                    ...players[inactivePlayerIndex],
                    x,
                    y
                }
                calculateAndDrawPlayer2ByXY()

                break
            }
        }

        if(isPlayerOutOfMapBoundary) {
            console.info('player2 掉进地图外了！')
        }
    }

    damageCanvas.draw(bombId)
}

function handlePlayerMove(direction) {
    // 上锁
    if(players[activePlayerIndex].isMoving) return
    players[activePlayerIndex].isMoving = true

    // player改变了朝向
    if(players[activePlayerIndex].direction !== direction) {
        players[activePlayerIndex].direction = direction

        // 开始计时器 100ms后move
        clearTimeout(players[activePlayerIndex].keydownTimer)
        players[activePlayerIndex].keydownTimer = setTimeout(()=>{
            // 如果100ms内 keyup了 则不移动
            if(!players[activePlayerIndex].isMoving) {
                return
            }
            // 否则 更新player位置信息 并 移动
            players[activePlayerIndex].angle = getPlayerAngleByTwoTerrainPoints(players[activePlayerIndex].leftEndPoint, players[activePlayerIndex].rightEndPoint)
            drawPlayer()
            updatePlayerPositionDataOnPage()
        
            playerSmoothlyMoves()
        }, 100)
    }
    // player未改变朝向
    else {
        players[activePlayerIndex].direction = direction
        playerSmoothlyMoves() 
    }
}

function updatePlayerPositionData() {
    const [
        leftEndPoint, standPoint, rightEndPoint, angle
    ] = calculatePlayerPositionDataByPoint({
        x: players[activePlayerIndex].x,
        y: players[activePlayerIndex].y,
    })

    players[activePlayerIndex].leftEndPoint = leftEndPoint
    players[activePlayerIndex].rightEndPoint = rightEndPoint
    players[activePlayerIndex].angle = angle

    drawPlayer()
    updatePlayerPositionDataOnPage()

    // console.log(`players[activePlayerIndex]:
    //    x,y: ${players[activePlayerIndex].x}, ${players[activePlayerIndex].y}
    //    lx,ly: ${players[activePlayerIndex].leftEndPoint.x}, ${players[activePlayerIndex].leftEndPoint.y}
    //    rx,ry: ${players[activePlayerIndex].rightEndPoint.x}, ${players[activePlayerIndex].rightEndPoint.y}
    // `)

    // test
    weaponCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    weaponCtx.fillRect(players[activePlayerIndex].x - 2, players[activePlayerIndex].y - 2, 4, 4)
    weaponCtx.fillRect(players[activePlayerIndex].leftEndPoint.x - 2, players[activePlayerIndex].leftEndPoint.y - 2, 4, 4)
    weaponCtx.fillRect(players[activePlayerIndex].rightEndPoint.x - 2, players[activePlayerIndex].rightEndPoint.y - 2, 4, 4)
}

function registerListeners() {
    document.body.addEventListener('keydown', (ev) => {
        ev.preventDefault()
        // console.log(ev)

        if(ev.key === 'ArrowRight') {
            handlePlayerMove('right')
        }
        else if(ev.key === 'ArrowLeft') {
            handlePlayerMove('left')
        }
        else if(ev.key === 'ArrowUp') {
            adjustWeaponAngle('up')
        }
        else if(ev.key === 'ArrowDown') {
            adjustWeaponAngle('down')
        }
        else if(ev.key === ' ') {
            // 蓄力
            adjustFiringPower()
        }
    })

    document.body.addEventListener('keyup', (ev) => {
        // console.log(ev)

        if(ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
            if(players[activePlayerIndex].isFallingDown) return
            players[activePlayerIndex].isMoving = false
            // 更新player position data
            updatePlayerPositionData()
        }
        else if(ev.key === ' ') {
            // skills锁，行动结束后，不能再使用skills
            players[activePlayerIndex].isOperationDone = true

            // fire
            if(players[activePlayerIndex].isTrident) {
                playerStartToFireTrident()
            }
            else {
                // 复制 map到 offscreenMap
                bombDrawingOffscreenCanvasCtx.drawImage(mapCanvasEl, 0, 0)
                playerStartToFire()
            }
        }
    })

    document.body.addEventListener('click', (ev) => {
        const {
            offsetX,
            offsetY
        } = ev

        const damageRadius = 50

        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = CANVAS_WIDTH
        offscreenCanvas.height = CANVAS_HEIGHT
        const offscreenCanvasCtx = offscreenCanvas.getContext('2d')
        offscreenCanvasCtx.lineWidth = mapCtx.lineWidth

        offscreenCanvasCtx.save()
        offscreenCanvasCtx.translate(offsetX - damageRadius, offsetY - damageRadius)

        // 先fill => 再stroke(destination-out) -> 得到 【内部填充】
        // offscreenCanvasCtx.beginPath()
        // offscreenCanvasCtx.arc(offsetX, offsetY, damageRadius, 0, Math.PI * 2)
        setCtxPathByMap(offscreenCanvasCtx, SHELL_CRATER_50_round)
        offscreenCanvasCtx.fill()

        // offscreenCanvasCtx.beginPath()
        // offscreenCanvasCtx.arc(offsetX, offsetY, damageRadius, 0, Math.PI * 2)
        offscreenCanvasCtx.globalCompositeOperation = 'destination-out'
        offscreenCanvasCtx.stroke()

        offscreenCanvasCtx.restore()

        // 然后将offscreenCanvas 以destination-out的方式，绘制到 mapCanvas上
        mapCtx.globalCompositeOperation = 'destination-out'
        mapCtx.drawImage(offscreenCanvas, 0, 0)

        // 最后绘制描边
        // mapCtx.beginPath()
        mapCtx.globalCompositeOperation = 'source-atop'
        // mapCtx.arc(offsetX, offsetY, damageRadius, 0, Math.PI * 2)
        mapCtx.save()

        mapCtx.translate(offsetX - damageRadius, offsetY - damageRadius)
        setCtxPathByMap(mapCtx, SHELL_CRATER_50_round)
        mapCtx.stroke()

        mapCtx.restore()

    })

    plusOneEl.addEventListener('click', ()=>{
        // 当前出手的player 未开火时 且（还有体力） 才能使用
        if(players[activePlayerIndex].isOperationDone) {
            return
        }

        players[activePlayerIndex].numberOfFires++
        updatePlayerSkills('+1')
    })

    tridentEl.addEventListener('click', ()=>{
        // 当前出手的player 未开火时 且（还有体力） 才能使用
        if(players[activePlayerIndex].isOperationDone) {
            return
        }

        players[activePlayerIndex].isTrident = true
        updatePlayerSkills('III')
    })
}

function calculateAndDrawPlayerByXY(player) {
    const data = calculatePlayerData(player)
    if(data) {
        updatePlayerData(data)
        drawPlayer()
    }
    else {
        // 说明如果再走一步，那么左右两点的x将会相同！
        // 所以需要根据目前的位置（目前 左右两点的x是不相同的！），决定应该block 还是 fall
        if(player.direction === 'right') {
            if(player.rightEndPoint.y > player.leftEndPoint.y) {
                // fall
                playerFall()
            }
            else if(player.rightEndPoint.y < player.leftEndPoint.y) {
                // block
                // 什么也不用干
            }
        }
        else {
            // left
            if(player.leftEndPoint.y > player.rightEndPoint.y) {
                // fall
                playerFall()
            }
            else if(player.leftEndPoint.y < player.rightEndPoint.y) {
                // block
                // 什么也不用干
            }
        }
    }
}

/**
 * 画出静态的players
 */
function calculateAndDrawPlayer2ByXY() {
    const data = calculatePlayerData(players[inactivePlayerIndex])
    if(data) {
        updatePlayer2Data(data)
        drawPlayer2()
    }
}

function updatePlayerIndex() {
    activePlayerIndex = (activePlayerIndex + 1) % players.length
    inactivePlayerIndex = (activePlayerIndex + 1) % players.length
}

function startNextTurn() {
   
    setTimeout(() => {
        updatePlayerIndex()
        alert(`轮到${players[activePlayerIndex].name}出手了`)

        // 重置
        clearPlayerSkills()

        players[activePlayerIndex].isOperationDone = false
        players[activePlayerIndex].numberOfFires = 1
        players[activePlayerIndex].bombsData = []
        players[activePlayerIndex].isTrident = false

        calculateAndDrawPlayerByXY(players[activePlayerIndex])
        calculateAndDrawPlayer2ByXY()
    }, 3000);
}

let players = [
    {
        x: 662,
        y: 410,
        length: 30,
        
        direction: 'right',
        leftEndPoint: null,
        rightEndPoint: null,
        movingStartPoint: null,
        preCalculatedPositionData: {
            leftEndPoint: null,
            standPoint: null,
            rightEndPoint: null,
            angle: null
        },
        angle: null,
        isMoving: false,
        keydownTimer: null,
        movingTimer: null,
        isFallingDown: false,
        fallStartPoint: null,
        fallTargetPoint: null,
        fallDuration: null,

        name: 'vikim',
        health: 320,
        healthMax: 1000,
        energy: 200,
        // 用来判断是否可以使用skills
        isOperationDone: false,
        numberOfFires: 1,
        isTrident: false,

        weapon: {
            angleRange: 30,
            damage: 250
        },

        bomb: null,
        bombs: [],
        weaponAngle: 0,
        firingPower: 0,
        firingTime: null,

        bombsData: []
    },
    {
        x: 1546,
        y: 710,
        length: 30,
        
        direction: 'right',
        leftEndPoint: null,
        rightEndPoint: null,
        angle: null,
        isMoving: false,
    
        name: '猛士豪伊心灵',
        health: 1000,
        healthMax: 1000,
        energy: 200,
        isOperationDone: false,
        numberOfFires: 1,
        isTrident: false,
    
        weapon: {
            angleRange: 30
        },
    
        bomb: null,
        bombs: [],
        weaponAngle: 0,
        firingPower: 0,
        firingTime: null
    }
]

let activePlayerIndex = 0
let inactivePlayerIndex = (activePlayerIndex + 1) % players.length

let isDrawingBomb = false
let bombDrawingOffscreenCanvasEl = document.createElement('canvas')
bombDrawingOffscreenCanvasEl.width = mapCanvasEl.width
bombDrawingOffscreenCanvasEl.height = mapCanvasEl.height
const bombDrawingOffscreenCanvasCtx = bombDrawingOffscreenCanvasEl.getContext('2d', {
    willReadFrequently: true
})

// 加载 background img
// let backgroundImgEl = document.createElement('img')
// backgroundImgEl.src = "./img/bi.png"
// backgroundImgEl.onload = () => {
//     backgroundCtx.filter = 'blur(5px)'
//     backgroundCtx.drawImage(backgroundImgEl, 0, 0)
// }


// drawMap(fall)
drawMultipleMap(multiple)

// 加载bomb img
let bombImgEl = document.createElement('img')
bombImgEl.src = "./img/bomb.png"
bombImgEl.onload = () => {
    registerListeners()
}

calculateAndDrawPlayerByXY(players[activePlayerIndex])

calculateAndDrawPlayer2ByXY()