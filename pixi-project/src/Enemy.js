import { Sprite } from 'pixi.js';
import Laser from './Laser';

// 0 : sbire à distance (celui d'origine), 1 : sbire mêlée (rapide, ne tire pas), 2 : sbire canon (gros, 3 PV)
const TYPES = [
    { size: 80, speedX: -0.5, speedY: 5, tint: 0xffffff, hp: 1, points: 10, shoots: true },
    { size: 70, speedX: -4, speedY: 2, tint: 0xff5555, hp: 1, points: 10, shoots: false },
    { size: 130, speedX: -0.3, speedY: 1, tint: 0x66aaff, hp: 3, points: 30, shoots: true },
];

export default class Enemy {
    constructor(projectilManager, texture, laserTexture, sens, type = 0) {
        const t = TYPES[type];
        this.projectilManager = projectilManager;
        this.laserTexture = laserTexture;
        this.sens = sens;
        this.body = new Sprite(texture);
        this.body.width = t.size;
        this.body.height = t.size;
        this.body.tint = t.tint;
        this.body.x = window.innerWidth - this.body.width - 30;
        this.body.y = 120;
        this.speedX = t.speedX;
        this.speedY = t.speedY;
        this.hp = t.hp;
        this.points = t.points;
        this.shoots = t.shoots;
        this.directionY = 1;
    }

    update() {
        this.body.x += this.speedX;
        this.body.y += this.speedY * this.directionY;

        if (this.body.y <= 0) {
            this.body.y = 0;
            this.directionY = 1;
        } else if (this.body.y + this.body.height >= window.innerHeight) {
            this.body.y = window.innerHeight - this.body.height;
            this.directionY = -1;
        }

        if (this.body.x + this.body.width < 0) {
            this.body.x = window.innerWidth;
        }
    }

    getPosition(){
        return {x:this.body.x, y:this.body.y};
    }

    shoot(){
        if (!this.shoots) return;
        this.projectilManager.Spawn(new Laser(this.getPosition(), this.laserTexture, -1));      

    }
}