import {SimulationState} from './supplyChainSimulation';

export const SCENE_WIDTH = 1920;
export const SCENE_HEIGHT = 720;
export const GROUND_Y = 505;
export const WATER_Y = 534;

export interface RenderOptions {
  showAnnotations?: boolean;
}

const INK = '#111111';
const PAPER = '#FFFFFF';
const ACCENT_BLUE = '#0284C7';
const ACCENT_AMBER = '#D97706';

function strokeAndFill(
  ctx: CanvasRenderingContext2D,
  fillStyle: string = PAPER,
  lineWidth = 2.6,
  strokeStyle: string = INK
) {
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawRockMound(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  width: number,
  height: number,
  seed: number,
  fillInterior = true
) {
  if (height <= 1 || width <= 2) return;
  const half = width / 2;
  const bumps = Math.max(5, Math.floor(width / 22));

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - half, baseY);
  for (let i = 0; i <= bumps; i++) {
    const t = i / bumps;
    const x = cx - half + width * t;
    const arch = Math.sin(t * Math.PI);
    const wave =
      Math.sin(t * bumps * 2.1 + seed) * 0.18 +
      Math.cos(t * bumps * 3.7 + seed * 1.7) * 0.12;
    const y = baseY - height * Math.max(0.08, arch + wave * arch);
    if (i === 0) ctx.lineTo(x, baseY);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + half, baseY);
  ctx.closePath();

  if (fillInterior) {
    ctx.fillStyle = PAPER;
    ctx.fill();
  }
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Individual rock pebbles along the mound surface
  const rockCount = Math.max(4, Math.floor(width / 26));
  for (let i = 0; i < rockCount; i++) {
    const u = (i + 0.5) / rockCount;
    const rx = cx - half * 0.78 + width * 0.78 * u;
    const arch = Math.sin(u * Math.PI);
    const ry = baseY - height * (0.28 + 0.42 * arch) + ((i % 2) * 5 - 2);
    const rr = 5 + ((i * 7 + Math.floor(seed * 10)) % 5);
    if (ry < baseY - 4) {
      ctx.beginPath();
      ctx.ellipse(rx, ry, rr * 1.15, rr * 0.78, ((i % 3) - 1) * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = PAPER;
      ctx.fill();
      ctx.lineWidth = 1.9;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  state: SimulationState
) {
  // Pure drafting white background
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Background Central Mountain Ridge (between mine and port)
  ctx.beginPath();
  ctx.moveTo(575, 452);
  ctx.bezierCurveTo(645, 442, 710, 405, 765, 350);
  ctx.bezierCurveTo(795, 318, 822, 304, 855, 326);
  ctx.bezierCurveTo(892, 350, 922, 370, 955, 366);
  ctx.bezierCurveTo(985, 362, 1005, 352, 1038, 376);
  ctx.bezierCurveTo(1082, 410, 1135, 452, 1198, 488);
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Secondary subtle ridge shadow line inside mountain
  ctx.beginPath();
  ctx.moveTo(855, 326);
  ctx.bezierCurveTo(868, 352, 882, 372, 905, 386);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Left Open-Pit Mine Terraced Slope Contours
  // Top terrace
  ctx.beginPath();
  ctx.moveTo(0, 290);
  ctx.bezierCurveTo(88, 292, 178, 298, 232, 312);
  ctx.bezierCurveTo(288, 326, 338, 362, 388, 408);
  ctx.bezierCurveTo(424, 442, 456, 476, 486, GROUND_Y);
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Mid terrace
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.bezierCurveTo(78, 354, 146, 366, 204, 392);
  ctx.bezierCurveTo(256, 415, 296, 452, 334, GROUND_Y);
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Lower bench contour
  ctx.beginPath();
  ctx.moveTo(0, 412);
  ctx.bezierCurveTo(62, 418, 112, 434, 152, 462);
  ctx.bezierCurveTo(176, 480, 194, 495, 212, GROUND_Y);
  ctx.lineWidth = 1.9;
  ctx.stroke();

  // 3. Left Foreground Rock & Ore Mounds (matching reference image)
  drawRockMound(ctx, 88, GROUND_Y, 138, 36, 1.3, true);
  drawRockMound(ctx, 248, GROUND_Y, 108, 25, 2.7, true);

  // Active Excavation Ore Bank (where excavator bucket drags & scoops)
  const bankHeight = 52 - state.mineBankDepletion * 13;
  drawRockMound(ctx, 395, GROUND_Y, 112, bankHeight, 4.1, true);

  // 4. Main Ground / Haul Road Line
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(1522, GROUND_Y);
  // Shore slope down to harbor water
  ctx.bezierCurveTo(1548, GROUND_Y, 1572, 520, 1605, WATER_Y);
  ctx.lineWidth = 2.6;
  ctx.stroke();

  // Subtle road dash marks along haul corridor
  ctx.lineWidth = 1.4;
  for (let gx = 680; gx <= 1160; gx += 95) {
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y + 9);
    ctx.lineTo(gx + 34, GROUND_Y + 9);
    ctx.stroke();
  }

  ctx.restore();
}

function drawHydraulicCylinder(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  barrelRatio = 0.56
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // Outer barrel
  const barrelLen = len * barrelRatio;
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.rect(0, -4.5, barrelLen, 9);
  ctx.fill();
  ctx.stroke();

  // Inner piston rod
  ctx.beginPath();
  ctx.rect(barrelLen, -2.3, len - barrelLen, 4.6);
  ctx.fill();
  ctx.stroke();

  // End pin circles
  ctx.beginPath();
  ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(len, 0, 3.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawExcavator(
  ctx: CanvasRenderingContext2D,
  state: SimulationState
) {
  const baseX = 236;
  const baseY = GROUND_Y;

  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- 1. Undercarriage / Crawler Tracks ---
  const trackLeft = baseX - 74;
  const trackRight = baseX + 74;
  const trackTop = baseY - 36;
  const trackBot = baseY;
  const trackR = 18;

  // Outer crawler belt
  ctx.beginPath();
  ctx.moveTo(trackLeft + trackR, trackTop);
  ctx.lineTo(trackRight - trackR, trackTop);
  ctx.arc(trackRight - trackR, trackTop + trackR, trackR, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(trackLeft + trackR, trackBot);
  ctx.arc(trackLeft + trackR, trackTop + trackR, trackR, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.8);

  // Inner track frame
  ctx.beginPath();
  ctx.moveTo(trackLeft + trackR + 2, trackTop + 7);
  ctx.lineTo(trackRight - trackR - 2, trackTop + 7);
  ctx.arc(
    trackRight - trackR - 2,
    trackTop + trackR,
    trackR - 7,
    -Math.PI / 2,
    Math.PI / 2
  );
  ctx.lineTo(trackLeft + trackR + 2, trackBot - 7);
  ctx.arc(
    trackLeft + trackR + 2,
    trackTop + trackR,
    trackR - 7,
    Math.PI / 2,
    -Math.PI / 2
  );
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.0);

  // Rollers & end sprockets
  for (let i = 0; i < 6; i++) {
    const rx = trackLeft + 24 + i * 20;
    ctx.beginPath();
    ctx.arc(rx, trackTop + trackR, 5.2, 0, Math.PI * 2);
    strokeAndFill(ctx, PAPER, 1.8);
  }

  // Track cleats along bottom/top
  ctx.lineWidth = 1.6;
  for (let cx = trackLeft + 18; cx <= trackRight - 18; cx += 11) {
    ctx.beginPath();
    ctx.moveTo(cx, trackTop - 2);
    ctx.lineTo(cx, trackTop + 2);
    ctx.moveTo(cx, trackBot - 2);
    ctx.lineTo(cx, trackBot + 2);
    ctx.stroke();
  }

  // Slewing turntable pedestal
  ctx.beginPath();
  ctx.rect(baseX - 34, trackTop - 10, 68, 10);
  strokeAndFill(ctx, PAPER, 2.4);

  // --- 2. Rotating Upper House / Cab (with subtle pitch) ---
  ctx.save();
  ctx.translate(baseX, trackTop - 10);
  ctx.rotate(state.excavatorBodyPitch);

  // Main rear body & counterweight
  ctx.beginPath();
  ctx.moveTo(-70, 0);
  ctx.lineTo(-70, -40);
  ctx.quadraticCurveTo(-70, -52, -55, -54);
  ctx.lineTo(2, -54);
  ctx.lineTo(10, -40);
  ctx.lineTo(48, -40);
  ctx.lineTo(54, -12);
  ctx.lineTo(48, 0);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.7);

  // Engine hood detail lines
  ctx.beginPath();
  ctx.moveTo(-58, -32);
  ctx.lineTo(-10, -32);
  ctx.moveTo(-54, -20);
  ctx.lineTo(-16, -20);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Operator glass cab (front-left/center-right)
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(-4, -74);
  ctx.quadraticCurveTo(-4, -84, 8, -84);
  ctx.lineTo(32, -84);
  ctx.quadraticCurveTo(44, -84, 48, -68);
  ctx.lineTo(52, -2);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.6);

  // Cab window cutout
  ctx.beginPath();
  ctx.moveTo(6, -18);
  ctx.lineTo(6, -74);
  ctx.lineTo(30, -74);
  ctx.quadraticCurveTo(37, -74, 40, -62);
  ctx.lineTo(42, -18);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.0);

  // Boom mount ear
  const boomPivotX = 12;
  const boomPivotY = -28;
  ctx.beginPath();
  ctx.arc(boomPivotX, boomPivotY, 7, 0, Math.PI * 2);
  strokeAndFill(ctx, PAPER, 2.2);

  // --- 3. Articulated Boom, Stick & Bucket ---
  const L1 = 192;
  const L2 = 152;
  const boomA = state.excavatorBoomAngle;
  const stickA = state.excavatorStickAngle;
  const bucketA = state.excavatorBucketAngle;

  const stickPivotX = boomPivotX + Math.cos(boomA) * L1;
  const stickPivotY = boomPivotY + Math.sin(boomA) * L1;

  const bucketPivotX = stickPivotX + Math.cos(stickA) * L2;
  const bucketPivotY = stickPivotY + Math.sin(stickA) * L2;

  // Boom spine shape (drawn in boom-local space)
  ctx.save();
  ctx.translate(boomPivotX, boomPivotY);
  ctx.rotate(boomA);

  // Characteristic excavator bent boom profile
  ctx.beginPath();
  ctx.moveTo(-6, -10);
  ctx.lineTo(L1 * 0.46, -26);
  ctx.lineTo(L1, -9);
  ctx.lineTo(L1, 8);
  ctx.lineTo(L1 * 0.48, -6);
  ctx.lineTo(-4, 12);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.7);

  // Boom inner rib line
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(L1 * 0.46, -16);
  ctx.lineTo(L1 - 14, -1);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // Boom lift hydraulic cylinder (from upper house front to mid-boom)
  const boomCylAnchorX = boomPivotX + Math.cos(boomA) * (L1 * 0.44) - Math.sin(boomA) * 6;
  const boomCylAnchorY = boomPivotY + Math.sin(boomA) * (L1 * 0.44) + Math.cos(boomA) * 6;
  drawHydraulicCylinder(ctx, 42, -10, boomCylAnchorX, boomCylAnchorY, 0.54);

  // Stick / Dipper Arm (drawn in stick-local space)
  ctx.save();
  ctx.translate(stickPivotX, stickPivotY);
  ctx.rotate(stickA);

  ctx.beginPath();
  ctx.moveTo(-26, -8);
  ctx.lineTo(0, -12);
  ctx.lineTo(L2, -6);
  ctx.lineTo(L2, 6);
  ctx.lineTo(0, 10);
  ctx.lineTo(-26, 4);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.6);

  // Stick inner detail
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(L2 - 10, 0);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Stick hydraulic cylinder (boom top spine -> stick tail)
  const stickCylStartX = boomPivotX + Math.cos(boomA) * (L1 * 0.48) + Math.sin(boomA) * 24;
  const stickCylStartY = boomPivotY + Math.sin(boomA) * (L1 * 0.48) - Math.cos(boomA) * 24;
  const stickCylEndX = stickPivotX - Math.cos(stickA) * 24;
  const stickCylEndY = stickPivotY - Math.sin(stickA) * 24;
  drawHydraulicCylinder(ctx, stickCylStartX, stickCylStartY, stickCylEndX, stickCylEndY, 0.56);

  // Bucket hydraulic cylinder (stick spine -> bucket linkage)
  const bktCylStartX = stickPivotX + Math.cos(stickA) * 26 + Math.sin(stickA) * 12;
  const bktCylStartY = stickPivotY + Math.sin(stickA) * 26 - Math.cos(stickA) * 12;
  const bktCylEndX =
    bucketPivotX + Math.cos(bucketA - 0.5) * 18;
  const bktCylEndY =
    bucketPivotY + Math.sin(bucketA - 0.5) * 18;
  drawHydraulicCylinder(ctx, bktCylStartX, bktCylStartY, bktCylEndX, bktCylEndY, 0.55);

  // Bucket (drawn at bucketPivot)
  ctx.save();
  ctx.translate(bucketPivotX, bucketPivotY);
  ctx.rotate(bucketA);

  // Ore mound inside bucket when filled
  if (state.excavatorBucketFill > 0.05) {
    const f = state.excavatorBucketFill;
    ctx.beginPath();
    ctx.arc(16, 18, 16 * f, 0, Math.PI * 2);
    strokeAndFill(ctx, PAPER, 2.0);
    ctx.beginPath();
    ctx.arc(24, 12, 11 * f, 0, Math.PI * 2);
    strokeAndFill(ctx, PAPER, 1.8);
  }

  // Curved scoop shell
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(14, -4);
  ctx.bezierCurveTo(38, 2, 46, 20, 34, 34);
  ctx.lineTo(4, 32);
  ctx.quadraticCurveTo(-8, 24, -4, -8);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.6);

  // Bucket digging teeth
  ctx.lineWidth = 2.2;
  for (let ti = 0; ti < 3; ti++) {
    const ty = 29 + ti * 2;
    const tx = 4 - ti * 3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 8, ty + 6);
    ctx.stroke();
  }

  ctx.restore();

  // Joint pins
  ctx.beginPath();
  ctx.arc(stickPivotX, stickPivotY, 4.5, 0, Math.PI * 2);
  strokeAndFill(ctx, PAPER, 2.0);
  ctx.beginPath();
  ctx.arc(bucketPivotX, bucketPivotY, 4.2, 0, Math.PI * 2);
  strokeAndFill(ctx, PAPER, 2.0);

  // Drag kick-up pebbles when dragging through mine face
  if (state.excavatorDragAlpha > 0.08) {
    ctx.save();
    ctx.globalAlpha = state.excavatorDragAlpha;
    for (let i = 0; i < 6; i++) {
      const px = bucketPivotX - 22 + ((i * 17) % 40);
      const py = bucketPivotY + 26 - Math.sin(state.timeSec * 14 + i) * 10;
      ctx.beginPath();
      ctx.arc(px, py, 2.8 + (i % 3), 0, Math.PI * 2);
      strokeAndFill(ctx, PAPER, 1.6);
    }
    ctx.restore();
  }

  // Pouring ore stream from bucket into waiting dumper bed
  if (state.excavatorPourAlpha > 0.06) {
    const worldBucketX = baseX + bucketPivotX + 24;
    const worldBucketY = trackTop - 10 + bucketPivotY + 28;
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.excavatorPourAlpha * 1.4);
    for (let i = 0; i < 8; i++) {
      const fallT = ((state.timeSec * 3.6 + i * 0.14) % 1);
      const px = worldBucketX - baseX + (i % 3 - 1) * 9 + fallT * 14;
      const py = worldBucketY - (trackTop - 10) + fallT * 68;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 3.5, fallT * 2, 0, Math.PI * 2);
      strokeAndFill(ctx, PAPER, 1.8);
    }
    // Motion drop lines
    ctx.lineWidth = 1.4;
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      ctx.moveTo(worldBucketX - baseX + j * 10, worldBucketY - (trackTop - 10) + 6);
      ctx.lineTo(worldBucketX - baseX + j * 10 + 6, worldBucketY - (trackTop - 10) + 52);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore(); // end upper house
  ctx.restore();
}

function drawSpokedWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  isBackgroundWheel = false
) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer tire
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  strokeAndFill(ctx, PAPER, isBackgroundWheel ? 2.2 : 2.8);

  if (!isBackgroundWheel) {
    // Rotating tire tread notches
    ctx.save();
    ctx.rotate(angle);
    const treadCount = 12;
    ctx.lineWidth = 2.0;
    for (let i = 0; i < treadCount; i++) {
      const a = (i / treadCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (radius - 4.5), Math.sin(a) * (radius - 4.5));
      ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.stroke();
    }

    // Inner rim
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
    strokeAndFill(ctx, PAPER, 2.2);

    // Hub & lug bolts (clearly show rotation!)
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
    strokeAndFill(ctx, PAPER, 1.9);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (radius * 0.4), Math.sin(a) * (radius * 0.4), 2.1, 0, Math.PI * 2);
      ctx.fillStyle = INK;
      ctx.fill();
    }
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, 0, Math.PI * 2);
    strokeAndFill(ctx, PAPER, 1.8);
  }

  ctx.restore();
}

function drawDumper(ctx: CanvasRenderingContext2D, state: SimulationState) {
  const cx = state.dumperX;
  const cy = GROUND_Y;
  const wheelR = 33;

  ctx.save();

  // Speed lines trailing behind moving dumper (matching reference center truck!)
  if (state.dumperSpeedRatio > 0.08) {
    const dir = state.dumperFacingScale >= 0 ? -1 : 1;
    ctx.save();
    ctx.globalAlpha = Math.min(0.9, state.dumperSpeedRatio);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    const tailX = cx + dir * 116;
    const offsets = [
      {y: -28, len: 74, dx: 0},
      {y: -52, len: 52, dx: 18},
      {y: -76, len: 38, dx: 10},
    ];
    for (const ln of offsets) {
      ctx.beginPath();
      ctx.moveTo(tailX + dir * ln.dx, cy + ln.y);
      ctx.lineTo(tailX + dir * (ln.dx + ln.len), cy + ln.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Flip cleanly during turnaround at port/mine
  ctx.translate(cx, cy + state.dumperBounceY);
  const scaleX = Math.abs(state.dumperFacingScale) < 0.06
    ? (state.dumperFacingScale >= 0 ? 0.06 : -0.06)
    : state.dumperFacingScale;
  ctx.scale(scaleX, 1);

  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Background far-side tires (visible slightly offset like the reference drawing)
  drawSpokedWheel(ctx, -40, -wheelR + 2, wheelR * 0.88, state.dumperWheelAngle, true);
  drawSpokedWheel(ctx, 42, -wheelR + 2, wheelR * 0.88, state.dumperWheelAngle, true);

  // Chassis main frame
  ctx.beginPath();
  ctx.moveTo(-88, -36);
  ctx.lineTo(94, -36);
  ctx.lineTo(98, -48);
  ctx.lineTo(84, -56);
  ctx.lineTo(-84, -56);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.5);

  // Operator Cab (front-right in local coords)
  ctx.beginPath();
  ctx.moveTo(32, -52);
  ctx.lineTo(32, -104);
  ctx.lineTo(74, -104);
  ctx.lineTo(90, -76);
  ctx.lineTo(92, -46);
  ctx.lineTo(32, -46);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.6);

  // Cab Windshield & Side Window
  ctx.beginPath();
  ctx.moveTo(42, -74);
  ctx.lineTo(42, -97);
  ctx.lineTo(68, -97);
  ctx.lineTo(80, -74);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.0);

  // Front grille & headlight
  ctx.beginPath();
  ctx.rect(78, -68, 12, 16);
  strokeAndFill(ctx, PAPER, 1.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(81, -63);
  ctx.lineTo(88, -63);
  ctx.moveTo(81, -58);
  ctx.lineTo(88, -58);
  ctx.stroke();

  // Boarding ladder steps
  ctx.beginPath();
  ctx.rect(18, -48, 14, 16);
  strokeAndFill(ctx, PAPER, 1.8);

  // Hydraulic hoist ram (visible when bed tilts up!)
  if (state.dumperBedTiltDeg > 1) {
    const tiltRad = (-state.dumperBedTiltDeg * Math.PI) / 180;
    const pivotX = -70;
    const pivotY = -58;
    const bedAttachLocalX = 88;
    const bedAttachLocalY = 2;
    const attachX =
      pivotX +
      bedAttachLocalX * Math.cos(tiltRad) -
      bedAttachLocalY * Math.sin(tiltRad);
    const attachY =
      pivotY +
      bedAttachLocalX * Math.sin(tiltRad) +
      bedAttachLocalY * Math.cos(tiltRad);
    drawHydraulicCylinder(ctx, 8, -46, attachX, attachY, 0.52);
  }

  // --- Articulated Dump Bed (pivots at rear tail (-70, -58)) ---
  ctx.save();
  ctx.translate(-70, -58);
  ctx.rotate((-state.dumperBedTiltDeg * Math.PI) / 180);

  // Ore Mound inside dump bed (slides slightly toward rear tail when tilted)
  if (state.dumperLoad > 0.02) {
    const slideX = -(state.dumperBedTiltDeg / 38) * 18;
    const moundW = 122 * (0.62 + 0.38 * state.dumperLoad);
    const moundH = 38 * state.dumperLoad;
    drawRockMound(ctx, 56 + slideX, -48, moundW, moundH, 7.2, true);
  }

  // Dump bed steel body + protective canopy brow over cab
  ctx.beginPath();
  ctx.moveTo(-26, -42); // Rear chute lip
  ctx.lineTo(-10, -2); // Rear bottom corner
  ctx.lineTo(100, -2); // Front floor
  ctx.lineTo(106, -48); // Front headboard
  ctx.lineTo(148, -52); // Protective canopy brow extending over cab
  ctx.lineTo(148, -60);
  ctx.lineTo(100, -60);
  ctx.lineTo(68, -48);
  ctx.lineTo(-26, -48);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.7);

  // Bed side vertical ribs
  ctx.lineWidth = 2.0;
  for (const rx of [16, 46, 76]) {
    ctx.beginPath();
    ctx.moveTo(rx, -47);
    ctx.lineTo(rx - 3, -5);
    ctx.stroke();
  }

  ctx.restore(); // end dump bed

  // Foreground rugged spoked wheels
  const wheelSpin = state.dumperWheelAngle * (state.dumperFacingScale >= 0 ? 1 : -1);
  drawSpokedWheel(ctx, -64, -wheelR, wheelR, wheelSpin, false);
  drawSpokedWheel(ctx, 58, -wheelR, wheelR, wheelSpin, false);

  ctx.restore();
}

function drawPortTerminal(
  ctx: CanvasRenderingContext2D,
  state: SimulationState
) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- 1. Unloading Hopper & Conveyor Gantry (left side of port) ---
  // Intake hopper at ground bay (receives ore from dumper rear tail around x=1262)
  ctx.beginPath();
  ctx.moveTo(1204, 462);
  ctx.lineTo(1276, 462);
  ctx.lineTo(1264, 492);
  ctx.lineTo(1216, 492);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.5);

  // Hopper support legs
  ctx.beginPath();
  ctx.moveTo(1220, 492);
  ctx.lineTo(1216, GROUND_Y);
  ctx.moveTo(1260, 492);
  ctx.lineTo(1264, GROUND_Y);
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Falling ore from tilted dumper tail into intake hopper
  if (state.hopperPourAlpha > 0.05) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.hopperPourAlpha * 1.35);
    for (let i = 0; i < 7; i++) {
      const fallT = (state.timeSec * 4.2 + i * 0.16) % 1;
      const px = 1262 - fallT * 18 + ((i % 3) - 1) * 6;
      const py = 408 + fallT * 56;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.8, 3.6, fallT * 2.5, 0, Math.PI * 2);
      strokeAndFill(ctx, PAPER, 1.8);
    }
    ctx.restore();
  }

  // Left X-braced Conveyor Trestle Tower (x = 1236..1294)
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(1236, GROUND_Y);
  ctx.lineTo(1236, 412);
  ctx.moveTo(1292, GROUND_Y);
  ctx.lineTo(1292, 396);
  // X-bracing
  ctx.moveTo(1236, GROUND_Y);
  ctx.lineTo(1292, 412);
  ctx.moveTo(1292, GROUND_Y);
  ctx.lineTo(1236, 412);
  ctx.stroke();

  // Inclined Conveyor Truss Gantry from (1218, 422) up-right to (1486, 336)
  const gx1 = 1218;
  const gy1 = 422;
  const gx2 = 1486;
  const gy2 = 336;
  const perpY = 22;

  // Conveyor belt backing & top ore chunks
  ctx.beginPath();
  ctx.moveTo(gx1, gy1 - 5);
  ctx.lineTo(gx2, gy2 - 5);
  ctx.lineTo(gx2, gy2 + perpY);
  ctx.lineTo(gx1, gy1 + perpY);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.5);

  // Truss diagonal webbing inside gantry
  ctx.lineWidth = 1.7;
  const segments = 9;
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const x0 = gx1 + (gx2 - gx1) * t0;
    const y0 = gy1 + (gy2 - gy1) * t0;
    const x1 = gx1 + (gx2 - gx1) * t1;
    const y1 = gy1 + (gy2 - gy1) * t1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y0 + perpY);
    ctx.moveTo(x0, y0 + perpY);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // Animated ore parcels moving UP the inclined conveyor belt!
  if (state.conveyorActive) {
    const numChunks = 7;
    for (let i = 0; i < numChunks; i++) {
      const u = ((state.conveyorPhase * 0.48 + i / numChunks) % 1);
      const ox = gx1 + (gx2 - gx1) * u;
      const oy = gy1 + (gy2 - gy1) * u - 8;
      ctx.beginPath();
      ctx.ellipse(ox, oy, 7.5, 4.8, -0.31, 0, Math.PI * 2);
      strokeAndFill(ctx, PAPER, 2.0);
    }
  }

  // --- 2. Main A-Frame Ship Loader Mast & Cantilevered Boom ---
  // Main vertical & battered legs at x = 1435..1498
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(1438, GROUND_Y);
  ctx.lineTo(1468, 204);
  ctx.lineTo(1498, 204);
  ctx.lineTo(1498, GROUND_Y);
  ctx.stroke();

  // Horizontal crossbars & diagonal bracing on main tower
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(1454, 305);
  ctx.lineTo(1498, 305);
  ctx.moveTo(1446, 398);
  ctx.lineTo(1498, 398);
  ctx.moveTo(1446, 398);
  ctx.lineTo(1498, 305);
  ctx.moveTo(1438, GROUND_Y);
  ctx.lineTo(1498, 398);
  ctx.stroke();

  // Operator machinery deck & safety railing
  ctx.beginPath();
  ctx.rect(1402, 294, 108, 13);
  strokeAndFill(ctx, PAPER, 2.4);
  // Handrail posts
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(1405, 294);
  ctx.lineTo(1405, 281);
  ctx.lineTo(1464, 281);
  for (let rx = 1420; rx <= 1460; rx += 14) {
    ctx.moveTo(rx, 294);
    ctx.lineTo(rx, 281);
  }
  ctx.stroke();

  // Cantilevered Ship Loader Boom extending out over the harbor
  const bx1 = 1456;
  const by1 = 304;
  const bx2 = 1712;
  const by2 = 274;
  ctx.beginPath();
  ctx.moveTo(bx1, by1);
  ctx.lineTo(bx2, by2);
  ctx.lineTo(bx2, by2 + 18);
  ctx.lineTo(bx1, by1 + 20);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.6);

  // Boom truss verticals & animated ore along boom top
  ctx.lineWidth = 1.6;
  for (let i = 1; i < 8; i++) {
    const u = i / 8;
    const px = bx1 + (bx2 - bx1) * u;
    const py = by1 + (by2 - by1) * u;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + 18);
    ctx.stroke();
  }

  if (state.conveyorActive) {
    for (let i = 0; i < 6; i++) {
      const u = ((state.conveyorPhase * 0.52 + i / 6) % 1);
      const ox = bx1 + (bx2 - bx1) * u;
      const oy = by1 + (by2 - by1) * u - 4;
      ctx.beginPath();
      ctx.ellipse(ox, oy, 6.5, 4.2, -0.1, 0, Math.PI * 2);
      strokeAndFill(ctx, PAPER, 1.9);
    }
  }

  // Twin Diagonal Tension Stay Cables from Mast Apex (1483, 204) to Boom
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(1483, 204);
  ctx.lineTo(1706, 274);
  ctx.moveTo(1483, 204);
  ctx.lineTo(1596, 286);
  ctx.stroke();

  // Telescopic Ship-Loading Chute / Spout hanging from Boom Tip
  ctx.save();
  ctx.translate(1706, 284);
  const chuteSwing = state.chutePourAlpha > 0.05 ? Math.sin(state.timeSec * 6) * 0.03 : 0;
  ctx.rotate(chuteSwing);
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(10, 0);
  ctx.lineTo(28, 72);
  ctx.lineTo(10, 76);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.5);
  // Chute ribs
  ctx.lineWidth = 1.6;
  for (const ry of [20, 40, 58]) {
    ctx.beginPath();
    ctx.moveTo(-4 + ry * 0.24, ry);
    ctx.lineTo(14 + ry * 0.24, ry);
    ctx.stroke();
  }
  ctx.restore();

  // Cascading Ore Stream from Chute into Ship Cargo Hold
  if (state.chutePourAlpha > 0.04) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.chutePourAlpha * 1.45);
    const spoutX = 1724;
    const spoutY = 358;
    const targetY = 440 - state.shipHoldLoad * 24;

    for (let i = 0; i < 12; i++) {
      const fallT = (state.timeSec * 3.8 + i * 0.09) % 1;
      const spread = (i % 5 - 2) * (3 + fallT * 6);
      const rx = spoutX + spread + fallT * 8;
      const ry = spoutY + fallT * Math.max(25, targetY - spoutY);
      ctx.beginPath();
      ctx.ellipse(rx, ry, 5.2, 4.0, fallT * 3 + i, 0, Math.PI * 2);
      strokeAndFill(ctx, PAPER, 1.9);
    }

    // Stream lines
    ctx.lineWidth = 1.5;
    for (let s = -1; s <= 1; s++) {
      ctx.beginPath();
      ctx.moveTo(spoutX + s * 6, spoutY + 4);
      ctx.lineTo(spoutX + s * 10 + 4, targetY - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawShipAndWater(
  ctx: CanvasRenderingContext2D,
  state: SimulationState
) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const shipOffsetY = state.shipDraftOffsetY + state.shipBobY;

  // --- 1. Bulk Carrier Vessel (x = 1585..1914) ---
  ctx.save();
  ctx.translate(0, shipOffsetY);

  // Growing ore cargo pile inside open cargo hold (drawn behind deck coaming)
  const holdHeight = 12 + state.shipHoldLoad * 44;
  drawRockMound(ctx, 1732, 452, 134, holdHeight, 9.4, true);

  // Cargo hold coaming rim
  ctx.beginPath();
  ctx.rect(1646, 444, 152, 12);
  strokeAndFill(ctx, PAPER, 2.3);

  // Aft Bridge / Superstructure on right side (x = 1796..1892)
  // Tier 1 cabin
  ctx.beginPath();
  ctx.rect(1802, 412, 78, 42);
  strokeAndFill(ctx, PAPER, 2.4);
  // Tier 2 bridge deck
  ctx.beginPath();
  ctx.rect(1810, 386, 62, 26);
  strokeAndFill(ctx, PAPER, 2.4);
  // Wheelhouse bridge wings
  ctx.beginPath();
  ctx.moveTo(1800, 386);
  ctx.lineTo(1878, 386);
  ctx.lineTo(1874, 368);
  ctx.lineTo(1816, 368);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.4);
  // Bridge windows
  ctx.lineWidth = 1.8;
  for (let wx = 1820; wx <= 1862; wx += 10) {
    ctx.beginPath();
    ctx.rect(wx, 373, 6, 7);
    ctx.stroke();
  }
  // Funnel & radar mast
  ctx.beginPath();
  ctx.moveTo(1856, 368);
  ctx.lineTo(1862, 344);
  ctx.lineTo(1874, 344);
  ctx.lineTo(1872, 368);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.2);

  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(1836, 368);
  ctx.lineTo(1836, 336);
  ctx.moveTo(1826, 348);
  ctx.lineTo(1846, 348);
  ctx.stroke();

  // Main Ship Hull (flared bow on left-facing harbor or classic double-flared profile matching drawing)
  ctx.beginPath();
  ctx.moveTo(1592, 454);
  ctx.lineTo(1912, 454);
  ctx.lineTo(1894, 534);
  ctx.lineTo(1624, 534);
  ctx.closePath();
  strokeAndFill(ctx, PAPER, 2.8);

  // Subtle hull deck sheer line & hawsepipe detail
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(1598, 466);
  ctx.lineTo(1906, 466);
  ctx.stroke();

  ctx.restore(); // end ship

  // --- 2. Animated Harbor Waterline Waves (occluding hull bottom) ---
  ctx.fillStyle = PAPER;
  ctx.fillRect(1585, WATER_Y + 4, 340, SCENE_HEIGHT - WATER_Y);

  ctx.beginPath();
  const waveStart = 1588;
  const waveEnd = 1920;
  ctx.moveTo(waveStart, WATER_Y);
  for (let wx = waveStart; wx <= waveEnd; wx += 14) {
    const wy = WATER_Y + Math.sin(wx * 0.095 - state.waterWavePhase) * 3.5;
    ctx.lineTo(wx, wy);
  }
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Secondary lower water ripple line
  ctx.beginPath();
  for (let wx = 1615; wx <= 1905; wx += 16) {
    const wy = WATER_Y + 14 + Math.cos(wx * 0.08 + state.waterWavePhase * 0.85) * 2.5;
    if (wx === 1615) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  }
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.restore();
}

function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  state: SimulationState
) {
  ctx.save();
  ctx.font = '600 15px "IBM Plex Mono", monospace';
  ctx.textBaseline = 'middle';

  const markers: {
    x: number;
    y: number;
    label: string;
    active: boolean;
    color: string;
  }[] = [
    {
      x: 240,
      y: 196,
      label: '01 · MINE EXCAVATION',
      active: state.activeStage.id === 'excavate',
      color: ACCENT_AMBER,
    },
    {
      x: 880,
      y: 235,
      label:
        state.activeStage.id === 'return'
          ? '04 · EMPTY RETURN'
          : '02 · HAUL CORRIDOR',
      active:
        state.activeStage.id === 'haul' || state.activeStage.id === 'return',
      color: ACCENT_BLUE,
    },
    {
      x: 1580,
      y: 165,
      label: '03 · PORT LOADER & SHIP',
      active: state.activeStage.id === 'unload',
      color: ACCENT_BLUE,
    },
  ];

  for (const m of markers) {
    ctx.fillStyle = m.active ? m.color : '#64748B';
    ctx.strokeStyle = m.active ? m.color : '#CBD5E1';
    ctx.lineWidth = m.active ? 2 : 1.2;

    const textW = ctx.measureText(m.label).width;
    const boxW = textW + 24;
    const boxH = 30;
    const bx = m.x - boxW / 2;
    const by = m.y - boxH / 2;

    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = m.active ? m.color : '#475569';
    ctx.fillText(m.label, bx + 12, m.y + 0.5);
  }

  // Directional travel arrow when hauling or returning
  if (state.activeStage.id === 'haul' || state.activeStage.id === 'return') {
    const dir = state.activeStage.id === 'haul' ? 1 : -1;
    const arrowX = state.dumperX;
    const arrowY = 335;
    ctx.strokeStyle = ACCENT_BLUE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(arrowX - dir * 36, arrowY);
    ctx.lineTo(arrowX + dir * 36, arrowY);
    ctx.lineTo(arrowX + dir * 24, arrowY - 9);
    ctx.moveTo(arrowX + dir * 36, arrowY);
    ctx.lineTo(arrowX + dir * 24, arrowY + 9);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderSupplyChainFrame(
  ctx: CanvasRenderingContext2D,
  state: SimulationState,
  options: RenderOptions = {}
) {
  drawEnvironment(ctx, state);
  drawPortTerminal(ctx, state);
  drawShipAndWater(ctx, state);
  drawDumper(ctx, state);
  drawExcavator(ctx, state);

  if (options.showAnnotations) {
    drawAnnotations(ctx, state);
  }
}
