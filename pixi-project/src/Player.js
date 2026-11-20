import { Sprite } from 'pixi.js';
import Laser from './Laser.js';

export default class Player {
    constructor(inputManager, projectileManager, Vaisseautexture, laserTexture, sens) {
        this.body = new Sprite(Vaisseautexture);
        this.body.width = 100;
        this.body.height = 100;
        this.inputManager = inputManager;
        this.projectileManager = projectileManager;
        this.laserTexture = laserTexture;
        this.speed = 10;
        this.coolingDown = false;
        this.cooldown = 0.3;
        this.lastShotTime = 0;
        this.sens = sens;
    }

    update(time) {
        if(this.coolingDown){
            let actualTime = performance.now();
            if((actualTime - this.lastShotTime) / 1000 > this.cooldown){
                this.coolingDown = false;
                this.lastShotTime = 0;
            }
        }

        let direction = this.inputManager.getMovementVector();
        this.body.x += this.speed * direction.x;
        this.body.y += this.speed * direction.y;

        if (this.inputManager.isShooting() && !this.coolingDown) {
            this.shoot();
            this.coolingDown = true;
            this.lastShotTime = performance.now();
        }
    }

    getPosition() {
        return { x: this.body.x, y: this.body.y };
    }

    shoot() {
        this.projectileManager.Spawn(new Laser(this.getPosition(), this.laserTexture, 1));
    }
}
