import { Application, Assets, Graphics } from "pixi.js";
import Player from "./Player.js";
import InputManager from "./InputManager.js";
import ProjectilManager from "./ProjectilManager.js";
import CollisionManager from "./CollisionManager.js";
import Enemy from "./Enemy.js";
import eventBus from "./eventBus.js";
import Analyser from "./Analyser.js";
import Conductor from "./Conductor.js";


(async () => {
  const startButton = document.getElementById("start-button");
  startButton.disabled = false;

  const analyser = new Analyser("/musics/firestarter.mp3");
  const beatMap = await analyser.getBeatMap();
  const loudness = await analyser.getLoudness();

  const app = new Application();

  await app.init({ backgroundAlpha: 0, resizeTo: window });
  const pixiContainer = document.getElementById("pixi-container");
  pixiContainer.appendChild(app.canvas);

  const reloadZoneHeight = 24;
  const reloadZone = new Graphics();
  let currentLevel = 0;
  const drawReloadZone = (level) => {
    currentLevel = level;
    const y = (app.screen.height - reloadZoneHeight) * (1 - currentLevel / 10);
    reloadZone
      .clear()
      .rect(0, y, app.screen.width, reloadZoneHeight)
      .fill({ color: 0xff7f50, alpha: 0.8 });
  };
  app.stage.sortableChildren = true;
  reloadZone.zIndex = 1;
  drawReloadZone(currentLevel);
  app.stage.addChild(reloadZone);
  window.addEventListener("resize", () => drawReloadZone(currentLevel));

  const vaisseauTexture = await Assets.load("/assets/Ahri.png");
  const laserTexture = await Assets.load("/assets/laser_bleu.png");
  const enemyTexture = await Assets.load("/assets/Sbire_range.png");

  let general = new eventBus();
  let conductor = new Conductor(general, beatMap, loudness);

  general.on("level:change", (level) => {
    drawReloadZone(level);
  });

  let inputManager = new InputManager();
  let projectilManager = new ProjectilManager();
  let collisionManager = new CollisionManager(projectilManager, general);
  let player = new Player(inputManager, projectilManager, vaisseauTexture, laserTexture, 1);
  collisionManager.addTarget(player);
  let startTime = null;
  app.stage.addChild(player.body);

  app.stage.addChild(projectilManager.body);

  let enemies = [];
  general.on("beat:quarter", ()=> {
    let enemy = new Enemy(projectilManager, enemyTexture, laserTexture, -1);
    enemies.push(enemy);
    collisionManager.addTarget(enemy);
    app.stage.addChild(enemy.body);
  })

  general.on("beat:even",() =>{
    for(let enemy of enemies){
      enemy.shoot();
    }
  })

  const source = analyser.audioContext.createBufferSource();

  const backgroundVideo = document.createElement("video");

   
  let coolingdown = false;
  let cooldown = 0.5;
  let lastShotTime = 0;

  const gameLoop = (time) => {
    const elapsed = analyser.audioContext.currentTime - startTime;
    conductor.update(elapsed);
    if (coolingdown) {
      let actualTime = performance.now();
      if ((actualTime - lastShotTime) / 1000 > cooldown) {
        coolingdown = false;
        lastShotTime = 0;
        general.emit("enemy:spawn");
      }
    }

    if (!coolingdown) {
      general.emit("enemy:shoot");
      coolingdown = true;
      lastShotTime = performance.now();
    }

    player.update();
    projectilManager.update();
    for (const enemy of enemies) {
      enemy.update();
    }

    collisionManager.update();
  };

  startButton.addEventListener("click",async () => {
    startButton.disabled = true;
    const context = analyser.audioContext;
    if (context.state === "suspended") {
      await context.resume();
    }
    const source = context.createBufferSource();
    source.buffer = analyser.buffer;
    source.connect(context.destination);

    backgroundVideo.src = "/background/firestarter_clip_80p.mp4";
    backgroundVideo.className = "background-video";
    backgroundVideo.autoplay = true;
    backgroundVideo.muted = true;
    backgroundVideo.loop = true;
    backgroundVideo.playsInline = true;
    pixiContainer.prepend(backgroundVideo);

    void backgroundVideo.play().catch((error) => {
      console.error("Impossible de lancer la vidéo d'arrière-plan :", error);
    });

    source.start();
    startTime = analyser.audioContext.currentTime;
    app.ticker.add(gameLoop); 
  
  });

})();
