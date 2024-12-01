// 计算得到下一个目标点
console.time('getNextDes')
// 耗时的计算 在后台线程中进行
for(let i = 0; i < 3000000000; i++) {
                    
}

nextDes = {
    x: Math.floor(100 + Math.random() * 1700),
    y: Math.floor(100 + Math.random() * 700)
}

console.timeEnd('getNextDes')
console.log('nextDes', nextDes.x, nextDes.y)
postMessage(nextDes)