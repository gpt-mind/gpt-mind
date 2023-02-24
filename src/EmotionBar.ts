export class EmotionBar {
    element: HTMLElement;
    emotions: any;
    constructor(element: HTMLElement, emotions: any) {
        this.element = element;
        this.emotions = emotions || {
            "anger": 0,
            "disgust": 0,
            "fear": 0,
            "joy": 0,
            "sadness": 0,
            "surprise": 0
        }
        this.updateEmotionBar();
    }
    style() {
        return `
            .emotion-bar {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                width: 98%;
                height: 40ps;
                margin-left: 1%;
            }
            .emotion-bar-cell {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 100px;
                height: 40ps;
                padding: 0.5em;
                box-sizing: border-box;
            }
            .emotion-bar-cell-name {
                font-size: 0.7em;
                font-weight: bold;
                text-align: center;
            }
            .emotion-bar-cell-value {
                font-size: 0.7em;
                font-weight: bold;
                text-align: center;
            }
            .emotion-bar-cell-bar {
                width: 100%;
                height: 0.5em;
                background-color: #ccc;
                border-radius: 0.25em;
            }
        `;
    }
    createEmotionDiv(emotion: any, value: any) {
        return `<style>${this.style()}</style><div class="emotion-bar-cell" style="background-color: ${this.emotionColor(value)};">
            <div class="emotion-bar-cell-name">${emotion}</div>
            <div class="emotion-bar-cell-value">${value}</div>
        </div>`
    }
    updateEmotionBar() {
        if (!this.element) return;
        this.element.innerHTML = "";
        for (let emotion in this.emotions) {
            this.element.innerHTML += this.createEmotionDiv(emotion, this.emotions[emotion]);
        }
    }
    updateEmotion(_emotion: string, intensity: number) {
        this.emotions[_emotion] = intensity;
        this.updateEmotionBar();
    }
    emotionColor(d:any) {
        d = parseInt(d)
        return  ( d > 10 ? '#800026' :
                d > 9 ? '#BD0026' :
                d > 8 ? '#E31A1C' :
                d > 7 ? '#FC4E2A' :
                d > 6 ? '#FD8D3C' :
                d > 5 ? '#FEB24C' :
                d > 4 ? '#FED976' :
                d > 3 ? '#FFEDA0' :
                d > 2 ? '#FFFFCC' :
                d > 1 ? '#FFFFCC' :
                        '#FFFFCC' );
    }
    
}