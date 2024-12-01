export class DamageCanvas {
    el = null
    ctx = null
    validBombList = []
    fontSize = null

    constructor(el, fontSize) {
        this.el = el
        this.ctx = el.getContext('2d')
        this.fontSize = fontSize
        this.loadFont()
    }

    loadFont() {
        // 加载 damage font
        let damageFont = new FontFace("", "url(./SHOWG.TTF)");
        damageFont.load().then(()=>{
            this.ctx.font = `${this.fontSize}px Showcard Gothic`;
        })
    }

    addDamage({bombId, x, y, damageValue, isCriticalHit}) {
        const item = this.validBombList.find(item => item.bombId === bombId)
        if(item) {
            item.damageList.push({
                x, 
                y, 
                damageValue, 
                isCriticalHit
            })
        }
        else {
            this.validBombList.push({
                bombId,
                timer: null,
                damageList: [
                    {
                        x, 
                        y, 
                        damageValue, 
                        isCriticalHit
                    }
                ]
            })
        }
    }

    drawText({text, leftPadding, topPadding, x, y, backgroundColor, color}) {
        this.ctx.beginPath()
        this.ctx.fillStyle = backgroundColor
        this.ctx.fillRect(x - leftPadding, y - this.fontSize, this.ctx.measureText(text).width + leftPadding * 2, this.fontSize + topPadding * 2)
      
        this.ctx.fillStyle = color
        this.ctx.fillText(text, x, y)
    }

    draw(bombId = '') {
        // draw damage
        this.ctx.clearRect(0, 0, this.el.width, this.el.height)

        this.validBombList.forEach(item => {
            if(item.bombId === bombId) {
                item.timer = setTimeout(()=>{
                    clearTimeout(item.timer)
                    this.validBombList = this.validBombList.filter(_item => _item.bombId !== bombId)
                    this.draw()
                }, 3000)
            }

            item.damageList.forEach(({
                x, 
                y, 
                damageValue,
                isCriticalHit
            }) => {
                    // this.ctx.fillText(damageValue, x, y)
                    this.drawText({
                        text: damageValue,
                        leftPadding:10,
                        topPadding:5,
                        x: x,
                        y: y,
                        backgroundColor: 'transparent',
                        color: isCriticalHit ? 'red' : '#e9da0b'
                    })
            })
        })
    }
}
