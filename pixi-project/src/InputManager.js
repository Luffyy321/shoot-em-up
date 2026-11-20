export default class InputManager {

    constructor() {
        this.keys = new Set();

        window.addEventListener("keydown", (event) => {
            this.keys.add(event.key);
        });
        window.addEventListener("keyup", (event) => {
            this.keys.delete(event.key);
        });
    }

    isDown(key) {
        return this.keys.has(key);
    }

    getMovementVector(){
        let movementVector = {x:0, y:0};

        if(this.isDown("d")) {
            movementVector.x = 1;
        }
        if(this.isDown("q")) {
            movementVector.x = -1;
        }
        if(this.isDown("z")) {
            movementVector.y = -1;
        }
        if(this.isDown("s")) {
            movementVector.y = 1;
        }

        return movementVector;
    }

    isShooting() {
        return this.isDown(" ");
    }
}