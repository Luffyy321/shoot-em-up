import { Container } from "pixi.js";

export default class ProjectilManager {
    constructor() {
        this.projectiles = [];
        this.body = new Container();
    }

    Spawn(projectile) {
        this.projectiles.push(projectile);
        this.body.addChild(projectile.body);
    }

    isOutOfBounds(positionX) {
        return positionX < 0 || positionX > window.innerWidth;
    }

    despawn(projectile) {
        this.body.removeChild(projectile.body);
        this.projectiles.splice(this.projectiles.indexOf(projectile), 1);
    }

    update() {
        for (let projectile of this.projectiles) {
            projectile.update();
            if (this.isOutOfBounds(projectile.body.x)) {
                this.despawn(projectile);
            }
        }
    }
}