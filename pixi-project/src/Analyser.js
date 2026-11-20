import { Essentia, EssentiaWASM } from "essentia.js";

export default class Analyser {
    constructor(musics) {
        this.musics = musics;
        this.audioContext = null;
        this.buffer = null;
        this.essentia = new Essentia(EssentiaWASM.EssentiaWASM);

    }

    async getBeatMap() {
        await this.getAudio();
        const monoSignal = this.essentia.audioBufferToMonoSignal(this.buffer);
        const vector = this.essentia.arrayToVector(monoSignal);
        const extractor = this.essentia.RhythmExtractor2013(vector);
        return this.essentia.vectorToArray(extractor.ticks);
    }

    async getLoudness() {
        const segmentCount = 80;
        await this.getAudio();
        const signal = this.essentia.audioBufferToMonoSignal(this.buffer);
        const segmentDuration = this.buffer.duration / segmentCount;
        //precision temporelle plus précise
        const sliceSize = 2048;
        const bucket = Array.from({ length: segmentCount }, () => []);
        for (let i = 0; i * sliceSize < signal.length; i++) {
            const slice = signal.slice(i * sliceSize, (i + 1) * sliceSize);
            const rms = this.getRMS(slice);
            const time = (i * sliceSize) / this.buffer.sampleRate;
            const segmentIndex = Math.min(
                segmentCount - 1,
                Math.floor(time / segmentDuration)
            );
            bucket[segmentIndex].push(rms);
        }
        const averages = bucket.map((values) => this.averageMap(values));
        const levels = this.toLevels(averages, 10);
        return levels.map((level, index) => ({
            time: index * segmentDuration,
            level: ((level - 1) / 9) * 10,
        }));
    }

    getRMS(slice) {
        let sumOfSquare = 0;
        for (const sample of slice) {
            sumOfSquare += sample * sample;
        }
        const meanOfSquare = sumOfSquare / slice.length;
        return Math.sqrt(meanOfSquare);
    }

    averageMap(values) {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    toLevels(values, numberOfLevels) {
        if (values.length === 0) return [];
        const sorted = [...values].sort((a, b) => a - b);
        const thresholds = [];
        for (let level = 1; level < numberOfLevels; level++) {
            const index = Math.min(
                sorted.length - 1,
                Math.ceil((sorted.length * level) / numberOfLevels) - 1
            );
            thresholds.push(sorted[index]);
        }
        return values.map((v) => {
            let level = 1;
            for (const threshold of thresholds) {
                if (v > threshold) level++;
            }
            return level;
        });
    }

    async getAudio() {
        if (this.audioContext == null && this.buffer == null) {
            const response = await fetch(this.musics);
            const arrayBuffer = await response.arrayBuffer();
            this.audioContext = new AudioContext();
            this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }

    }
}