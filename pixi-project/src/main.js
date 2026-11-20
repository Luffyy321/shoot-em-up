import { Application, Assets, Graphics } from "pixi.js";
import Player from "./Player.js";
import InputManager from "./InputManager.js";
import ProjectilManager from "./ProjectilManager.js";
import CollisionManager from "./CollisionManager.js";
import Enemy from "./Enemy.js";
import eventBus from "./eventBus.js";
import Analyser from "./Analyser.js";
import Conductor from "./Conductor.js";
import Laser from "./Laser.js";

const LEVELS = [
  { id: "firestarter", name: "Firestarter" },
  { id: "nevergoingback", name: "Never going back" },
  { id: "watchme", name: "Watch me" },
];

// cast() reçoit { fire(dx, dy), enemies, kill(enemy) }
const CLASSES = [
  { name: "Mage", desc: "éventail", color: 0x66ccff, cast: ({ fire }) => [-200, -100, 0, 100, 200].forEach((dy) => fire(0, dy)) },
  { name: "Archer", desc: "rafale", color: 0x66ff88, cast: ({ fire }) => [0, 1, 2, 3, 4].forEach((i) => setTimeout(() => fire(0, 0), i * 100)) },
  { name: "Guerrier", desc: "onde de choc", color: 0xff6666, cast: ({ enemies, kill }) => [...enemies].forEach(kill) },
  { name: "Assassin", desc: "exécution", color: 0xcc66ff, cast: ({ enemies, kill }) => enemies.slice(0, 3).forEach(kill) },
];


(async () => {
  const startButton = document.getElementById("start-button");

  // menu : choix de la classe puis du niveau (le clic sur un niveau lance l'analyse)
  const menu = document.getElementById("menu");
  const classesBox = document.getElementById("classes");
  const addButton = (box, text, onClick) => {
    const b = document.createElement("button");
    b.textContent = text;
    b.onclick = () => onClick(b);
    box.append(b);
  };
  let classe = CLASSES[0];
  CLASSES.forEach((c) =>
    addButton(classesBox, `${c.name} (${c.desc})`, (b) => {
      classe = c;
      for (const x of classesBox.children) x.classList.toggle("selected", x === b);
    })
  );
  classesBox.firstChild.classList.add("selected");
  const niveau = await new Promise((resolve) =>
    LEVELS.forEach((l) => addButton(document.getElementById("levels"), l.name, () => resolve(l)))
  );
  menu.textContent = "Analyse de la musique...";

  const analyser = new Analyser(`/musics/${niveau.id}.mp3`);
  const beatMap = await analyser.getBeatMap();
  const loudness = await analyser.getLoudness();
  menu.remove();
  startButton.disabled = false;

  const app = new Application();

  await app.init({ backgroundAlpha: 0, resizeTo: window });
  const pixiContainer = document.getElementById("pixi-container");
  pixiContainer.appendChild(app.canvas);

  const reloadZoneHeight = 96;
  const reloadZone = new Graphics();
  let currentLevel = loudness.length > 0 ? loudness[0].level : 0;
  const drawReloadZone = (level) => {
    const y = (app.screen.height - reloadZoneHeight) * (1 - level / 10);
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

  // jauge du sort : se recharge quand le joueur est dans la barre orange (qui suit le volume)
  let charge = 0;
  const chargeBar = new Graphics();
  chargeBar.zIndex = 2;
  app.stage.addChild(chargeBar);

  const vaisseauTexture = await Assets.load("/assets/Ahri.png");
  const laserTexture = await Assets.load("/assets/laser_bleu.png");
  const enemyTexture = await Assets.load("/assets/Sbire_range.png");

  let general = new eventBus();
  let conductor = new Conductor(general, beatMap, loudness);

  general.on("level:progress", (level) => {
    currentLevel = level;
    drawReloadZone(currentLevel);
  });

  let inputManager = new InputManager();
  let projectilManager = new ProjectilManager();
  let collisionManager = new CollisionManager(projectilManager, general);
  let player = new Player(inputManager, projectilManager, vaisseauTexture, laserTexture, 1);
  player.body.tint = classe.color;
  // chaque tir coûte 5 de jauge, impossible de tirer si elle est trop basse
  const baseShoot = player.shoot.bind(player);
  player.shoot = () => {
    if (charge < 5) return;
    charge -= 5;
    baseShoot();
  };
  collisionManager.addTarget(player);
  let startTime = null;
  app.stage.addChild(player.body);

  app.stage.addChild(projectilManager.body);

  let enemies = [];
  let score = 0;
  const scoreDisplay = document.getElementById("score");

  const kill = (enemy) => {
    enemies.splice(enemies.indexOf(enemy), 1);
    collisionManager.removeTarget(enemy);
    app.stage.removeChild(enemy.body);

    score += enemy.points;
    scoreDisplay.textContent = `Score : ${score}`;
  };
  const fire = (dx, dy) =>
    projectilManager.Spawn(new Laser({ x: player.body.x + dx, y: player.body.y + dy }, laserTexture, 1));

  general.on("projectile:hit", ({ projectile, target }) => {
    if (projectile.sens !== player.sens || !enemies.includes(target)) return;
    if (--target.hp <= 0) kill(target);
  });

  general.on("beat:quarter", ()=> {
    let enemy = new Enemy(projectilManager, enemyTexture, laserTexture, -1, Math.floor(Math.random() * 3));
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

  const gameLoop = () => {
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

    const zone = reloadZone.getBounds();
    const p = player.body.getBounds();
    if (p.bottom > zone.top && p.top < zone.bottom) charge = Math.min(100, charge + 0.3);
    if (charge >= 100 && inputManager.isDown("e")) {
      classe.cast({ fire, enemies, kill });
      charge -= 100;
    }
    chargeBar
      .clear()
      .rect(16, 56, 200, 14)
      .stroke({ width: 2, color: 0xffffff })
      .rect(16, 56, charge * 2, 14)
      .fill(charge >= 100 ? 0x00ff88 : 0xff7f50);

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

    backgroundVideo.src = `/background/${niveau.id}_clip_80p.mp4`;
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