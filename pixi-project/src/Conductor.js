export default class Conductor {
    constructor(eventBus, ticks, segment) {
        this.eventBus = eventBus;
        this.ticks = ticks;
        this.tickIndex = 0;
        this.segment = segment;
        this.segmentIndex = 0;
    }

    update(elapsed){
        while(this.tickIndex < this.ticks.length && elapsed >= this.ticks[this.tickIndex]){
            if(this.tickIndex % 2 == 0) this.eventBus.emit("beat:even");
            if(this.tickIndex % 2 != 0) this.eventBus.emit("beat:odd");
            if(this.tickIndex % 10 == 0) this.eventBus.emit("beat:tens");
            if(this.tickIndex % 4 == 0) this.eventBus.emit("beat:quarter");
            if(this.tickIndex % 8 == 0) this.eventBus.emit("beat:phrase");
            this.tickIndex ++;
        }

        while(this.segmentIndex < this.segment.length && elapsed >= this.segment[this.segmentIndex].time){
            if(this.segmentIndex % 2 == 0) this.eventBus.emit("level:even");
            if(this.segmentIndex % 2 != 0) this.eventBus.emit("level:odd");
            this.eventBus.emit("level:change", this.segment[this.segmentIndex].level);
            this.segmentIndex ++;
        }
    }
}