import { Graphics } from "pixi.js";
import { Sprite } from 'pixi.js';

export default class Laser{
    constructor(position, texture, sens){
        this.body = new Sprite(texture);
        this.body.width = 100;
        this.body.height = 100;
        this.body.tint = 0xffff00;
        this.body.x = position.x;
        this.body.y = position.y;
        this.speed = 70;
        this.sens = sens;
    }

    update(){
        this.body.x += this.speed * this.sens;
        
    }
}