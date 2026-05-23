// load json
// 读取 json
let data;

// all records
// 所有记录
let entries = [];

// hair images
// 头发图片
let hairImages = [];

// brush images
// 梳子图图片
let brushImages = [];

// loaded image count
// 已加载图片数
let loadedCount = 0;

// show brush mode or hair mode
// 是否显示梳子图
let showBrush = false;

// current record
// 当前记录
let currentIndex = 0;

let targetIndex = 0;

// smooth record change
// 平滑切换记录
let smoothIndex = 0;

// mouse movement energy
// 鼠标移动能量
let interactionEnergy = 0;

// hold mouse to pause
// 按住鼠标暂停
let isInspecting = false;

// trace layer
// 残影图层
let traceLayer;

// cursor image
// 鼠标图片
let cursorBrush;


// load files first
// 先加载文件
function preload() {
  data = loadJSON("data/hairRecords.json");
  cursorBrush = loadImage("assets/cursorBrush.png");
}


// count loaded images
// 计算加载数量
function countLoadedImage() {
  loadedCount++;
}


// check missing ids
// 检查缺少的 id
function checkMissingIds() {
  let ids = entries.map(e => e.id);

  for (let i = 1; i <= 91; i++) {
    if (!ids.includes(i)) {
      console.log("Missing id:", i);
    }
  }
}


// set up the sketch
// 设置画面
function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  textFont("Georgia");

  // hide normal cursor
  // 隐藏默认鼠标
  noCursor();

  // get records
  // 获取记录
  entries = data.records;

  // debug missing ids
  // 检查漏掉的 id
  checkMissingIds();

  // make trace layer
  // 创建残影图层
  traceLayer = createGraphics(windowWidth, windowHeight);
  traceLayer.clear();
  traceLayer.imageMode(CENTER);

  // load images
  // 加载图片
  for (let i = 0; i < entries.length; i++) {
    hairImages[i] = loadImage(
      entries[i].hairImage,
      countLoadedImage,
      () => {
        console.log("HAIR IMAGE FAILED:", i + 1, entries[i].hairImage);
      }
    );

    brushImages[i] = loadImage(
      entries[i].brushImage,
      countLoadedImage,
      () => {
        console.log("BRUSH IMAGE FAILED:", i + 1, entries[i].brushImage);
      }
    );
  }
}


// main loop
// 主循环
function draw() {
  drawSoftBackground();

  // wait for images
  // 等图片加载
  if (loadedCount < entries.length * 2) {
    drawLoadingScreen();
    return;
  }

  // mouse speed
  // 鼠标速度
  let mouseSpeed = dist(mouseX, mouseY, pmouseX, pmouseY);
  let targetEnergy = constrain(mouseSpeed / 55, 0, 1);

  // smooth energy
  // 平滑能量
  interactionEnergy = lerp(interactionEnergy, targetEnergy, 0.08);

  // mouse x chooses record
  // 鼠标 x 选择记录
  if (!isInspecting) {
    targetIndex = floor(map(mouseX, 0, width, 0, entries.length));
    targetIndex = constrain(targetIndex, 0, entries.length - 1);
  }

  // smooth index
  // 平滑编号
  smoothIndex = lerp(smoothIndex, targetIndex, 0.08);
  currentIndex = round(smoothIndex);
  currentIndex = constrain(currentIndex, 0, entries.length - 1);

  // current data
  // 当前数据
  let entry = entries[currentIndex];

  // choose image
  // 选择图片
  let img = showBrush ? brushImages[currentIndex] : hairImages[currentIndex];

  // draw old traces
  // 画旧残影
  image(traceLayer, width / 2, height / 2);

  // draw main image
  // 画主图
  drawFloatingRecordImage(img);

  // add trace
  // 添加残影
  addToTraceLayer(img);

  // draw text
  // 画文字
  drawInfo(entry);
  drawTimeline();
  drawInstructions();

  // draw cursor
  // 画鼠标
  drawBrushCursor();
}


// draw background
// 画背景
function drawSoftBackground() {
  // black background
  // 黑色背景
  background(0);

  // grid
  // 网格
  let gridSpacing = 22;

  strokeWeight(1);

  // vertical lines
  // 竖线
  stroke(255, 18);
  for (let x = 0; x <= width; x += gridSpacing) {
    line(x, 0, x, height);
  }

  // horizontal lines
  // 横线
  stroke(255, 18);
  for (let y = 0; y <= height; y += gridSpacing) {
    line(0, y, width, y);
  }

  // moving scan lines
  // 移动扫描线
  let scanX = map(noise(frameCount * 0.004, 1000), 0, 1, 0, width);
  let scanY = map(noise(frameCount * 0.0053, 2000), 0, 1, 0, height);

  // vertical scan line
  // 竖向扫描线
  strokeWeight(1.2);
  stroke(255, 20);
  line(scanX, 0, scanX, height);

  // soft glow
  // 轻微发光
  strokeWeight(4);
  stroke(255, 10);
  line(scanX, 0, scanX, height);

  // horizontal scan line
  // 横向扫描线
  strokeWeight(1.2);
  stroke(255, 20);
  line(0, scanY, width, scanY);

  // soft glow
  // 轻微发光
  strokeWeight(4);
  stroke(255, 10);
  line(0, scanY, width, scanY);
}


// draw main hair image
// 画当前头发图
function drawFloatingRecordImage(img) {
  if (!img) return;

  // max size
  // 最大尺寸
  let maxW = width * 0.72;
  let maxH = height * 0.72;

  // keep image ratio
  // 保持比例
  let imgRatio = img.width / img.height;
  let boxRatio = maxW / maxH;

  let drawW, drawH;

  if (imgRatio > boxRatio) {
    drawW = maxW;
    drawH = maxW / imgRatio;
  } else {
    drawH = maxH;
    drawW = maxH * imgRatio;
  }

  // mouse y controls anxiety
  // 鼠标 y 控制焦虑感
  let anxiety = map(mouseY, 0, height, 0.15, 1.0);
  anxiety = constrain(anxiety, 0.15, 1.0);

  // drifting strength
  // 漂移强度
  let driftAmountX = width * map(interactionEnergy, 0, 1, 0.025, 0.075);
  let driftAmountY = height * map(interactionEnergy, 0, 1, 0.025, 0.07);

  let driftX = sin(frameCount * 0.006 + currentIndex * 1.7) * driftAmountX * anxiety;
  let driftY = cos(frameCount * 0.007 + currentIndex * 1.3) * driftAmountY * anxiety;

  // breathing scale
  // 呼吸缩放
  let breathing = 1 + sin(frameCount * 0.018) * map(anxiety, 0.15, 1.0, 0.018, 0.045);

  // rotation
  // 旋转
  let angle = sin(frameCount * 0.006 + currentIndex) * map(interactionEnergy, 0, 1, 0.025, 0.095);

  // small distortion
  // 轻微变形
  let stretchX = 1 + sin(frameCount * 0.011 + currentIndex) * map(interactionEnergy, 0, 1, 0.02, 0.085);
  let stretchY = 1 + cos(frameCount * 0.013 + currentIndex) * map(interactionEnergy, 0, 1, 0.02, 0.075);

  push();
  translate(width / 2 + driftX, height / 2 + driftY);
  rotate(angle);
  tint(255, 240);

  image(
    img,
    0,
    0,
    drawW * breathing * stretchX,
    drawH * breathing * stretchY
  );

  noTint();
  pop();
}


// add image to trace layer
// 添加残影
function addToTraceLayer(img) {
  if (!img) return;

  // trace amount
  // 残影数量感
  let anxiety = map(mouseY, 0, height, 0.1, 1.0);
  anxiety = constrain(anxiety, 0.1, 1.0);

  let interval = floor(map(anxiety + interactionEnergy * 0.6, 0.1, 1.6, 44, 16));
  interval = constrain(interval, 16, 44);

  if (frameCount % interval !== 0) return;

  // trace size
  // 残影尺寸
  let maxW = width * 0.52;
  let maxH = height * 0.52;

  let imgRatio = img.width / img.height;
  let boxRatio = maxW / maxH;

  let drawW, drawH;

  if (imgRatio > boxRatio) {
    drawW = maxW;
    drawH = maxW / imgRatio;
  } else {
    drawH = maxH;
    drawW = maxH * imgRatio;
  }

  traceLayer.push();

  // trace spread
  // 残影扩散
  let orbitRangeX = width * map(interactionEnergy, 0, 1, 0.12, 0.28);
  let orbitRangeY = height * map(interactionEnergy, 0, 1, 0.1, 0.23);

  let orbitX = sin(frameCount * 0.017 + currentIndex * 2.1) * orbitRangeX;
  let orbitY = cos(frameCount * 0.013 + currentIndex * 1.6) * orbitRangeY;

  // random position
  // 随机位置
  let offsetX = orbitX + random(-width * 0.06, width * 0.06) * anxiety;
  let offsetY = orbitY + random(-height * 0.05, height * 0.05) * anxiety;

  // random angle
  // 随机角度
  let angle = random(-0.18, 0.18) * anxiety;

  // random size
  // 随机大小
  let scaleAmount = random(0.72, 1.08);

  // random stretch
  // 随机拉伸
  let stretchX = random(0.86, 1.18 + interactionEnergy * 0.2);
  let stretchY = random(0.86, 1.16 + interactionEnergy * 0.18);

  traceLayer.translate(width / 2 + offsetX, height / 2 + offsetY);
  traceLayer.rotate(angle);

  // trace opacity
  // 残影透明度
  let traceAlpha = map(anxiety + interactionEnergy, 0.1, 2.0, 16, 34);
  traceAlpha = constrain(traceAlpha, 16, 34);

  traceLayer.tint(255, traceAlpha);

  traceLayer.image(
    img,
    0,
    0,
    drawW * scaleAmount * stretchX,
    drawH * scaleAmount * stretchY
  );

  traceLayer.noTint();
  traceLayer.pop();

  // clear traces sometimes
  // 偶尔清空残影
  if (frameCount % 1600 === 0) {
    traceLayer.clear();
  }
}


// draw record info
// 画记录信息
function drawInfo(entry) {
  fill(245);
  noStroke();

  textAlign(LEFT, TOP);

  // date
  // 日期
  textSize(26);
  text(entry.displayDate, 40, 34);

  // time and session
  // 时间和时段
  textSize(16);
  text(entry.time + " / " + entry.session, 40, 72);

  // emotion
  // 情绪
  textSize(18);
  text(entry.emotionRaw, 40, 104);

  // mode
  // 模式
  textSize(13);
  fill(170);
  let modeText = showBrush ? "brush trace / dotted record" : "hair trace / pure line";
  text(modeText, 40, 134);

  // record number
  // 记录编号
  textAlign(RIGHT, TOP);
  fill(220);
  textSize(18);
  text((currentIndex + 1) + " / " + entries.length, width - 40, 38);
}


// draw timeline
// 画时间轴
function drawTimeline() {
  let margin = 40;
  let y = height - 70;

  stroke(90);
  strokeWeight(1);
  line(margin, y, width - margin, y);

  // current position
  // 当前位置
  let x = map(smoothIndex, 0, entries.length - 1, margin, width - margin);

  noStroke();
  fill(255);
  ellipse(x, y, 10, 10);

  fill(160);
  textAlign(CENTER, TOP);
  textSize(12);
  text("daily brushing archive", width / 2, y + 14);
}


// draw instructions
// 画操作提示
function drawInstructions() {
  fill(145);
  noStroke();
  textSize(13);
  textAlign(LEFT, BOTTOM);

  text(
    "Move mouse left/right to browse. Move down for heavier traces. Hold mouse to inspect. Press B to switch mode. Press C to clear.",
    40,
    height - 24
  );
}


// draw custom cursor
// 画自定义鼠标
function drawBrushCursor() {
  if (!cursorBrush) return;

  push();
  imageMode(CENTER);

  // cursor tilt
  // 鼠标倾斜
  let speed = dist(mouseX, mouseY, pmouseX, pmouseY);
  let angle = map(speed, 0, 80, -0.08, 0.18);
  angle = constrain(angle, -0.08, 0.18);

  translate(mouseX + 28, mouseY + 36);
  rotate(angle);

  // cursor size
  // 鼠标大小
  let cursorW = 150;
  let cursorH = cursorW * (cursorBrush.height / cursorBrush.width);

  tint(255, 230);
  image(cursorBrush, 0, 0, cursorW, cursorH);
  noTint();

  pop();
}


// loading screen
// 加载页面
function drawLoadingScreen() {
  background(0);
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(20);

  text(
    "loading hair archive... " + loadedCount + " / " + entries.length * 2,
    width / 2,
    height / 2
  );
}


// keyboard control
// 键盘控制
function keyPressed() {
  if (key === "b" || key === "B") {
    showBrush = !showBrush;
  }

  if (key === "c" || key === "C") {
    traceLayer.clear();
  }
}


// pause browsing
// 暂停浏览
function mousePressed() {
  isInspecting = true;
}


// continue browsing
// 继续浏览
function mouseReleased() {
  isInspecting = false;
}


// resize canvas
// 调整画布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // remake trace layer
  // 重做残影图层
  traceLayer = createGraphics(windowWidth, windowHeight);
  traceLayer.clear();
  traceLayer.imageMode(CENTER);

  // old traces are cleared
  // 旧残影会清空
}