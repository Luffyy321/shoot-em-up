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

        if(this.segment.length === 0) return;
        const activeIndex = Math.max(0, this.segmentIndex - 1);
        let startIndex = activeIndex;
        while(
            startIndex > 0 &&
            this.segment[startIndex - 1].level === this.segment[activeIndex].level
        ){
            startIndex--;
        }

        let nextIndex = startIndex + 1;
        while(
            nextIndex < this.segment.length &&
            this.segment[nextIndex].level === this.segment[startIndex].level
        ){
            nextIndex++;
        }

        const current = this.segment[startIndex];
        const next = this.segment[nextIndex];
        let level = current.level;

        if(next){
            const duration = next.time - current.time;
            const progress = duration > 0
                ? Math.min(1, Math.max(0, (elapsed - current.time) / duration))
                : 1;
            const easedProgress = 1 - Math.pow(1 - progress, 1.3);
            level += (next.level - current.level) * easedProgress;
        }

        this.eventBus.emit("level:progress", level);
    }
}