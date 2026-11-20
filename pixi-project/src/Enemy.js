import { Sprite } from 'pixi.js';
import Laser from './Laser';

export default class Enemy {
    constructor(projectilManager, texture, laserTexture, sens) {
        this.projectilManager = projectilManager;
        this.laserTexture = laserTexture;
        this.sens = sens;
        this.body = new Sprite(texture);
        this.body.width = 80;
        this.body.height = 80;
        this.body.x = window.innerWidth - this.body.width - 30;
        this.body.y = 120;
        this.speedX = -0.5;
        this.speedY = 5;
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
        this.projectilManager.Spawn(new Laser(this.getPosition(), this.laserTexture, -1));      

    }
}