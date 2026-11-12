// 宣告變數以儲存各種圖片精靈檔案
let stopSprite, walkSprite, magicSprite, magicEffectSprite, jumpSprite;

// === 角色 1：「站立/停止」狀態參數 (12張, 1663x212, 橫向) ===
let stopTotalFrames = 12;
let stopSheetWidth = 1663;
let stopSheetHeight = 212;
let stopFrameWidth, stopFrameHeight;
let stopCurrentFrame = 0;

// === 角色 1：「走路」狀態參數 (9張, 1246x198, 橫向) ===
let walkTotalFrames = 9;
let walkSheetWidth = 1246;
let walkSheetHeight = 198;
let walkFrameWidth, walkFrameHeight;
let walkCurrentFrame = 0;

// === 角色 1：「施法魔法」狀態參數 (4張, 1039x146, 橫向) ===
let magicTotalFrames = 4;
let magicSheetWidth = 1039;
let magicSheetHeight = 146;
let magicFrameWidth, magicFrameHeight;
let magicCurrentFrame = 0;

// === 角色 1：「跳躍」狀態參數 (13張, 1776x188, 橫向) ===
let jumpTotalFrames = 13;
let jumpSheetWidth = 1776;
let jumpSheetHeight = 188;
let jumpFrameWidth, jumpFrameHeight;
let jumpCurrentFrame = 0;

// === 魔法特效參數 (5張, 740x19, 橫向) ===
let effectTotalFrames = 5;
let effectSheetWidth = 740;
let effectSheetHeight = 19;
let effectFrameWidth, effectFrameHeight;
let effectCurrentFrame = 0;

// === 動畫與載入控制變數 ===
let frameDelay = 6;            // 動畫播放速度
let imgLoadedCount = 0;        // 記錄已載入圖片數量
let totalImagesToLoad = 5;     // 總共需載入 5 張圖片精靈
let isLoaded = false;          // 是否全部載入完成
let failedPaths = [];          // 紀錄載入失敗的圖片路徑，方便除錯

// === 角色與移動/物理狀態變數 ===
let charX;                     // 角色 1 的 X 軸位置
let charY;                     // 角色 1 的 Y 軸位置（中心點）
let groundY;                   // 地面基準 Y 座標
let moveSpeed = 4;             // 移動速度
let jumpVelocityY = 0;         // 跳躍垂直速度
let gravity = 0.8;             // 重力加速度
let jumpForce = -15;           // 起跳瞬間的向上推力
let currentAction = "stop";    // 目前狀態："stop", "walk", "magic", "jump"
let facingDirection = 1;       // 朝向：1=右, -1=左

// 魔法特效物件變數
let activeEffect = null; 

// 輔助載入函式：自動追蹤成功與失敗的路徑
function loadSpriteWithCheck(path) {
  return loadImage(
    path,
    () => {
      imgLoadedCount++;
      if (imgLoadedCount >= totalImagesToLoad) {
        isLoaded = true;
      }
    },
    () => {
      failedPaths.push(path);
      console.error("找不到檔案：", path);
    }
  );
}

// 預載入函式：在程式啟動前載入所有圖片資源
function preload() {
  stopSprite = loadSpriteWithCheck('1/stop/stop.png');
  walkSprite = loadSpriteWithCheck('1/walk/walk.png');
  magicSprite = loadSpriteWithCheck('1/magic1/magic1.png');
  magicEffectSprite = loadSpriteWithCheck('1/magic1_effect/magic1_effect.png');
  jumpSprite = loadSpriteWithCheck('1/jump/jump.png');
}

// 初始化設定函式
function setup() {
  createCanvas(windowWidth, windowHeight);
  charX = width * (2 / 3);

  // 計算各精靈的單一影格寬高
  stopFrameWidth = stopSheetWidth / stopTotalFrames;
  stopFrameHeight = stopSheetHeight;

  walkFrameWidth = walkSheetWidth / walkTotalFrames;
  walkFrameHeight = walkSheetHeight;

  magicFrameWidth = magicSheetWidth / magicTotalFrames;
  magicFrameHeight = magicSheetHeight;

  jumpFrameWidth = jumpSheetWidth / jumpTotalFrames;
  jumpFrameHeight = jumpSheetHeight;

  effectFrameWidth = effectSheetWidth / effectTotalFrames;
  effectFrameHeight = effectSheetHeight;

  imageMode(CENTER);
}

// 主繪圖迴圈函式
function draw() {
  drawFightingBackground();

  // 若有圖片載入失敗，直接在畫面上顯示哪一個路徑找不到
  if (failedPaths.length > 0) {
    fill(255, 80, 80);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("以下圖片路徑載入失敗，請確認已使用「開啟資料夾」方式載入專案：\n" + failedPaths.join("\n"), width / 2, height / 2);
    return;
  }

  if (!isLoaded) {
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("正在載入圖片精靈檔案，請稍候...", width / 2, height / 2);
    return;
  }

  let displayHeight = height / 3;
  let currentImg, frameW, frameH, currentFrame, totalFrames;

  // 動態計算當前畫布比例下的地面高度（對齊畫面最下方）
  groundY = height - (displayHeight / 2);

  // 若不在跳躍狀態，Y 座標維持在地面
  if (currentAction !== "jump") {
    charY = groundY;
  }

  // === 根據目前動作狀態切換對應的圖片與邏輯 ===
  if (currentAction === "jump") {
    currentImg = jumpSprite;
    frameW = jumpFrameWidth;
    frameH = jumpFrameHeight;
    totalFrames = jumpTotalFrames;

    // 套用物理重力公式更新垂直位置
    jumpVelocityY += gravity;
    charY += jumpVelocityY;

    // 空中左右移動控制
    if (keyIsDown(RIGHT_ARROW)) {
      charX += moveSpeed;
      facingDirection = 1;
      if (charX > width) charX = width;
    } else if (keyIsDown(LEFT_ARROW)) {
      charX -= moveSpeed;
      facingDirection = -1;
      if (charX < 0) charX = 0;
    }

    // 動畫影格計算：將跳躍過程平均對應到 13 張圖片影格
    let jumpProgress = map(charY, groundY, groundY - (height * 0.4), 0, jumpTotalFrames - 1);
    jumpCurrentFrame = constrain(floor(jumpProgress), 0, jumpTotalFrames - 1);

    // 檢查是否落回到地面
    if (charY >= groundY) {
      charY = groundY;
      jumpVelocityY = 0;
      // 若落地時還按著左右鍵則切回走路，否則切回站立
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(LEFT_ARROW)) {
        currentAction = "walk";
      } else {
        currentAction = "stop";
      }
    }

  } else if (currentAction === "magic") {
    currentImg = magicSprite;
    frameW = magicFrameWidth;
    frameH = magicFrameHeight;
    currentFrame = floor(magicCurrentFrame); 
    totalFrames = magicTotalFrames;

    // 播放魔法動畫
    if (frameCount % frameDelay === 0) {
      magicCurrentFrame++;
      if (magicCurrentFrame >= magicTotalFrames) {
        magicCurrentFrame = 0;
        currentAction = "stop";

        // 產生魔法特效
        activeEffect = {
          x: charX + (facingDirection * (displayHeight * 0.3)), 
          y: groundY,                                          
          direction: facingDirection,                          
          speed: 8                                             
        };
      }
    }
  } else if (currentAction === "walk") {
    currentImg = walkSprite;
    frameW = walkFrameWidth;
    frameH = walkFrameHeight;
    currentFrame = walkCurrentFrame;
    totalFrames = walkTotalFrames;

    // 左右移動與邊界限制
    if (keyIsDown(RIGHT_ARROW)) {
      charX += moveSpeed;
      facingDirection = 1;
      if (charX > width) charX = width;
    } else if (keyIsDown(LEFT_ARROW)) {
      charX -= moveSpeed;
      facingDirection = -1;
      if (charX < 0) charX = 0;
    }

    if (frameCount % frameDelay === 0) {
      walkCurrentFrame = (walkCurrentFrame + 1) % walkTotalFrames;
    }
  } else {
    // 預設為站立狀態 "stop"
    currentImg = stopSprite;
    frameW = stopFrameWidth;
    frameH = stopFrameHeight;
    currentFrame = stopCurrentFrame;
    totalFrames = stopTotalFrames;

    if (frameCount % frameDelay === 0) {
      stopCurrentFrame = (stopCurrentFrame + 1) % stopTotalFrames;
    }
  }

  let activeFrame = (currentAction === "jump") ? jumpCurrentFrame : currentFrame;

  // 計算顯示寬度與高度比例
  let scaleRatio = displayHeight / frameH;
  let displayWidth = frameW * scaleRatio;
  let srcX = activeFrame * frameW;

  // === 繪製角色 1 ===
  push();
  translate(charX, charY);
  scale(facingDirection, 1);
  image(currentImg, 0, 0, displayWidth, displayHeight, srcX, 0, frameW, frameH);
  pop();

  // === 處理與繪製魔法特效 ===
  if (activeEffect !== null) {
    activeEffect.x += activeEffect.speed * activeEffect.direction;

    if (activeEffect.x > width || activeEffect.x < 0) {
      activeEffect = null;
    } else {
      let effectDisplayH = height / 6; 
      let effectScale = effectDisplayH / effectFrameHeight;
      let effectDisplayW = effectFrameWidth * effectScale;
      let effectSrcX = floor(effectCurrentFrame) * effectFrameWidth;

      push();
      translate(activeEffect.x, activeEffect.y);
      scale(activeEffect.direction, 1); 
      image(
        magicEffectSprite,
        0,
        0,
        effectDisplayW,
        effectDisplayH,
        effectSrcX,
        0,
        effectFrameWidth,
        effectFrameHeight
      );
      pop();

      if (frameCount % 3 === 0) {
        effectCurrentFrame = (effectCurrentFrame + 1) % effectTotalFrames;
      }
    }
  }
}

// 鍵盤按下事件
function keyPressed() {
  if (keyCode === UP_ARROW && currentAction !== "jump") {
    currentAction = "jump";
    jumpVelocityY = jumpForce;
  }
  else if (key === ' ' && currentAction !== "magic" && currentAction !== "jump") {
    currentAction = "magic";
    magicCurrentFrame = 0; 
  } 
  else if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) {
    if (currentAction !== "magic" && currentAction !== "jump") {
      currentAction = "walk";
    }
  }
}

// 鍵盤放開事件
function keyReleased() {
  if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) {
    if (!keyIsDown(RIGHT_ARROW) && !keyIsDown(LEFT_ARROW)) {
      if (currentAction !== "magic" && currentAction !== "jump") {
        currentAction = "stop";
      }
    }
  }
}

// 自訂函式：繪製格鬥遊戲背景
function drawFightingBackground() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let bgColor = lerpColor(color(20, 12, 28), color(85, 20, 25), inter);
    stroke(bgColor);
    line(0, y, width, y);
  }

  noStroke();
  fill(230, 80, 30, 160);
  ellipse(width * 0.35, height * 0.45, width * 0.25, width * 0.25);

  fill(15, 10, 20);
  rect(0, height * 0.55, width * 0.2, height * 0.45);
  rect(width * 0.18, height * 0.48, width * 0.15, height * 0.52);
  rect(width * 0.75, height * 0.52, width * 0.25, height * 0.48);

  let floorY = height * 0.88;
  fill(35, 30, 35);
  rect(0, floorY, width, height - floorY);

  stroke(220, 60, 40);
  strokeWeight(4);
  line(0, floorY, width, floorY);
  strokeWeight(1);
}

// 視窗大小改變時自適應調整
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}