export default class CollisionManager{

    constructor(projectileManager, eventBus){
        this.target = [];
        this.projectileManager = projectileManager;
        this.eventBus = eventBus;
    }

    addTarget(entity){
        this.target.push(entity);
    }

    removeTarget(entity){
        const index = this.target.indexOf(entity);
        if(index !== -1)this.target.splice(index, 1);
    }

    collide(objetA, objetB){
        let limiteA = objetA.getBounds();
        let limiteB = objetB.getBounds();

        return(
            limiteA.left < limiteB.right &&
            limiteA.right > limiteB.left && 
            limiteA.top < limiteB.bottom &&
            limiteA.bottom > limiteB.top
        );
    }

    update(){
        for(let projectile of [...this.projectileManager.projectiles]){
            const target = this.findTarget(projectile);
            if(!target) continue;
            this.projectileManager.despawn(projectile);
            // console.log("Collision détectée :", { projectile, target });
            this.eventBus.emit("projectile:hit", {projectile, target});
        };
    }

    findTarget(projectile){
        return this.target.find(
            (target) => target.sens !== projectile.sens && this.collide(projectile.body, target.body)
        );
    }

}