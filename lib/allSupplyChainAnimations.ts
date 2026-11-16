export type AnimationId =
  | 'stevedoring'
  | 'intra-port'
  | 'mine-to-port'
  | 'heavy-equipment'
  | 'earthmoving'
  | 'fabrication'
  | 'ready-mix';

export interface AnimationDefinition {
  id: AnimationId;
  index: number;
  title: string;
  subtitle: string;
  durationSec: number;
  phases: string[];
}

export const ANIMATION_DEFINITIONS: AnimationDefinition[] = [
  {
    id: 'stevedoring',
    index: 1,
    title: '01. Stevedoring Services',
    subtitle:
      'Real-time cargo container tracking and ship-to-shore throughput visualization from quay stack to vessel bays.',
    durationSec: 8.0,
    phases: ['Lock Container', 'Hoist & Track', 'Lower to Vessel', 'Return Trolley'],
  },
  {
    id: 'intra-port',
    index: 2,
    title: '02. Port Handling & Intra-Port Transportation',
    subtitle:
      'Quayside crane transfer onto internal terminal tractor-trailer with apron transit to inland RTG container stack.',
    durationSec: 8.5,
    phases: ['Load Trailer', 'Apron Transit', 'Yard Stack Lift', 'Empty Return'],
  },
  {
    id: 'mine-to-port',
    index: 3,
    title: '03. Mine-to-Port Transportation',
    subtitle:
      'Excavator scoops ore into haul dumper, crosses mountain corridor, tips into conveyor gantry, loads bulk ship, and returns.',
    durationSec: 10.0,
    phases: ['Excavate & Fill', 'Haul to Port', 'Convey to Ship', 'Empty Return'],
  },
  {
    id: 'heavy-equipment',
    index: 4,
    title: '04. Heavy Equipment & Port Handling',
    subtitle:
      'Multi-axle modular transporter delivers oversized project cargo to mobile harbor crane for heavy-lift barge loading.',
    durationSec: 9.0,
    phases: ['SPMT Approach', 'Rig & Hoist', 'Swing to Barge', 'Set & Retract'],
  },
  {
    id: 'earthmoving',
    index: 5,
    title: '05. Earthmoving',
    subtitle:
      'Tracked bulldozer blades earth forward across cut terrain while excavator loads and reshapes the embankment.',
    durationSec: 8.0,
    phases: ['Blade Push', 'Excavator Scoop', 'Dump & Grade', 'Reverse Pass'],
  },
  {
    id: 'fabrication',
    index: 6,
    title: '06. Specialized Fabrication',
    subtitle:
      'Automated welding arm fabricates structural steel module, then overhead bridge crane hoists and sets it onto skid.',
    durationSec: 8.5,
    phases: ['Seam Welding', 'Crane Hoist', 'Bay Transfer', 'Skid Placement'],
  },
  {
    id: 'ready-mix',
    index: 7,
    title: '07. Infrastructure & Ready-Mix Concrete',
    subtitle:
      'Concrete mixer drum charges at batching plant, drives to site, pumps through articulated boom into pier formwork, and returns.',
    durationSec: 9.5,
    phases: ['Batch Charge', 'Site Transit', 'Boom Pour', 'Plant Return'],
  },
];

export const BASE_W = 300;
export const BASE_H = 100;

const INK = '#111111';
const PAPER = '#FFFFFF';
const ACCENT_BLUE = '#0284C7';
const ACCENT_AMBER = '#D97706';

export interface SceneRenderOptions {
  showAccents: boolean;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function fillStroke(
  ctx: CanvasRenderingContext2D,
  lineWidth = 1.3,
  fill: string = PAPER,
  stroke: string = INK
) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawGround(ctx: CanvasRenderingContext2D, y = 84, endX = 300) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(endX, y);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawWaterWaves(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  y: number,
  phase: number
) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(startX, y + 1, endX - startX, BASE_H - y);

  ctx.beginPath();
  for (let x = startX; x <= endX; x += 4) {
    const wy = y + Math.sin(x * 0.25 - phase * 2.4) * 1.4;
    if (x === startX) ctx.moveTo(x, wy);
    else ctx.lineTo(x, wy);
  }
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  fillStroke(ctx, 1.3);

  ctx.save();
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
  fillStroke(ctx, 1.0);
  // 4 rotating spoke ticks
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
    ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawContainerBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  accentStroke = false
) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  fillStroke(ctx, accentStroke ? 1.5 : 1.2, PAPER, accentStroke ? ACCENT_BLUE : INK);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = accentStroke ? ACCENT_BLUE : INK;
  for (let cx = x + 3.5; cx < x + w - 2; cx += 3.5) {
    ctx.beginPath();
    ctx.moveTo(cx, y + 1.5);
    ctx.lineTo(cx, y + h - 1.5);
    ctx.stroke();
  }
}

function drawRockPile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  w: number,
  h: number
) {
  if (h < 1 || w < 2) return;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  const steps = 6;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = cx - w / 2 + w * t;
    const bump = Math.sin(t * Math.PI) * h + Math.sin(i * 2.5) * h * 0.14;
    ctx.lineTo(x, baseY - Math.max(1, bump));
  }
  ctx.lineTo(cx + w / 2, baseY);
  ctx.closePath();
  fillStroke(ctx, 1.2);
}

/* ============================================================================
 * 01. STEVEDORING SERVICES — Real-time container tracking & throughput
 * ========================================================================== */
function drawStevedoring(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 8.0;
  const u = (t % dur) / dur; // 0..1

  // Quay wall & harbor ground
  drawGround(ctx, 84, 174);
  ctx.beginPath();
  ctx.moveTo(174, 84);
  ctx.lineTo(174, 92);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Quay static container stack (left)
  drawContainerBox(ctx, 14, 73, 24, 11);
  drawContainerBox(ctx, 14, 62, 24, 11);
  drawContainerBox(ctx, 42, 73, 24, 11);

  // Next waiting container at quay pickup spot (42, 62) before pickup
  const pickX = 42;
  const pickY = 62;
  const dropX = 212;
  const dropY = 51;

  // Trolley & container state
  let trolleyX = pickX + 12;
  let hoistDrop = 28;
  let carrying = false;
  let containerX = pickX;
  let containerY = pickY;
  let containerDelivered = false;

  if (u < 0.16) {
    // Lower spreader onto quay container
    const k = easeInOut(u / 0.16);
    trolleyX = pickX + 12;
    hoistDrop = lerp(18, 36, k);
  } else if (u < 0.34) {
    // Hoist container up
    const k = easeInOut((u - 0.16) / 0.18);
    trolleyX = pickX + 12;
    hoistDrop = lerp(36, 14, k);
    carrying = true;
  } else if (u < 0.62) {
    // Trolley glides across boom to ship
    const k = easeInOut((u - 0.34) / 0.28);
    trolleyX = lerp(pickX + 12, dropX + 12, k);
    hoistDrop = 14;
    carrying = true;
  } else if (u < 0.78) {
    // Lower container onto vessel bay
    const k = easeInOut((u - 0.62) / 0.16);
    trolleyX = dropX + 12;
    hoistDrop = lerp(14, 25, k);
    carrying = true;
  } else {
    // Release & return trolley to quay
    const k = easeInOut((u - 0.78) / 0.22);
    trolleyX = lerp(dropX + 12, pickX + 12, k);
    hoistDrop = lerp(25, 18, k);
    containerDelivered = true;
  }

  // Container Ship on right (184..294)
  const bob = Math.sin(t * 2.2) * 0.7;
  ctx.save();
  ctx.translate(0, bob);
  // Existing containers on ship deck
  drawContainerBox(ctx, 186, 62, 24, 11);
  drawContainerBox(ctx, 212, 62, 24, 11);
  drawContainerBox(ctx, 238, 62, 24, 11);
  drawContainerBox(ctx, 186, 51, 24, 11);

  if (containerDelivered) {
    drawContainerBox(ctx, dropX, dropY, 24, 11, opts.showAccents);
  }

  // Bridge aft superstructure
  ctx.beginPath();
  ctx.rect(266, 46, 18, 27);
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.rect(264, 38, 16, 8);
  fillStroke(ctx, 1.2);
  // Hull
  ctx.beginPath();
  ctx.moveTo(180, 73);
  ctx.lineTo(294, 73);
  ctx.lineTo(288, 90);
  ctx.lineTo(188, 90);
  ctx.closePath();
  fillStroke(ctx, 1.4);
  ctx.restore();

  drawWaterWaves(ctx, 174, 300, 88, t);

  // STS Gantry Crane (legs at x=96 and x=136)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(96, 84);
  ctx.lineTo(106, 14);
  ctx.lineTo(132, 14);
  ctx.lineTo(140, 84);
  // Portal crossbar & bracing
  ctx.moveTo(100, 56);
  ctx.lineTo(136, 56);
  ctx.moveTo(103, 34);
  ctx.lineTo(134, 34);
  ctx.stroke();

  // Horizontal STS Boom (x=36..256, y=22)
  ctx.beginPath();
  ctx.rect(36, 20, 220, 4.5);
  fillStroke(ctx, 1.3);

  // Tension stays from crane apex (118, 12)
  ctx.beginPath();
  ctx.moveTo(118, 12);
  ctx.lineTo(42, 20);
  ctx.moveTo(118, 12);
  ctx.lineTo(248, 20);
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Rolling Trolley
  ctx.beginPath();
  ctx.rect(trolleyX - 7, 22, 14, 5);
  fillStroke(ctx, 1.2);

  // Hoist cables & Spreader
  const spreaderY = 26 + hoistDrop;
  ctx.beginPath();
  ctx.moveTo(trolleyX - 4, 27);
  ctx.lineTo(trolleyX - 4, spreaderY);
  ctx.moveTo(trolleyX + 4, 27);
  ctx.lineTo(trolleyX + 4, spreaderY);
  ctx.lineWidth = 1.0;
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(trolleyX - 11, spreaderY, 22, 3);
  fillStroke(ctx, 1.2);

  // Active tracked container (either waiting on quay or carried by spreader)
  if (!containerDelivered) {
    if (carrying) {
      containerX = trolleyX - 12;
      containerY = spreaderY + 3;
    }
    drawContainerBox(ctx, containerX, containerY, 24, 11, opts.showAccents);

    // Subtle real-time tracking corner reticles
    if (opts.showAccents) {
      ctx.strokeStyle = ACCENT_BLUE;
      ctx.lineWidth = 1.1;
      const pulse = 1.5 + Math.sin(t * 7) * 0.6;
      ctx.beginPath();
      ctx.moveTo(containerX - pulse, containerY + 3);
      ctx.lineTo(containerX - pulse, containerY - pulse);
      ctx.lineTo(containerX + 4, containerY - pulse);
      ctx.moveTo(containerX + 20, containerY - pulse);
      ctx.lineTo(containerX + 24 + pulse, containerY - pulse);
      ctx.lineTo(containerX + 24 + pulse, containerY + 3);
      ctx.stroke();
    }
  }
}

/* ============================================================================
 * 02. PORT HANDLING & INTRA-PORT TRANSPORTATION
 * ========================================================================== */
function drawIntraPort(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 8.5;
  const u = (t % dur) / dur;

  drawGround(ctx, 84, 300);

  // Dashed intra-port apron lane ticks
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = INK;
  for (let gx = 92; gx <= 205; gx += 18) {
    ctx.beginPath();
    ctx.moveTo(gx, 88);
    ctx.lineTo(gx + 8, 88);
    ctx.stroke();
  }

  // Left Quayside Container Stack & RTG Crane (x=14..68)
  drawContainerBox(ctx, 14, 73, 22, 11);
  drawContainerBox(ctx, 14, 62, 22, 11);

  // Left Crane Frame
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(10, 84);
  ctx.lineTo(10, 26);
  ctx.lineTo(68, 26);
  ctx.lineTo(68, 84);
  ctx.stroke();

  // Right Inland Yard RTG Crane & Stack (x=226..288)
  drawContainerBox(ctx, 256, 73, 24, 11);
  drawContainerBox(ctx, 256, 62, 24, 11);
  ctx.beginPath();
  ctx.moveTo(216, 84);
  ctx.lineTo(216, 26);
  ctx.lineTo(286, 26);
  ctx.lineTo(286, 84);
  ctx.stroke();

  // Terminal Tractor-Trailer kinematics
  let truckX = 56;
  let facing = 1;
  let hasContainer = false;
  let wheelAngle = 0;

  // Left RTG hoist drop & Right RTG hoist drop
  let leftDrop = 14;
  let rightDrop = 14;
  let waitingOnLeft = true;
  let placedOnRight = false;

  if (u < 0.2) {
    // Left crane lowers container onto trailer
    const k = easeInOut(u / 0.2);
    leftDrop = lerp(12, 32, k);
    if (k > 0.85) {
      waitingOnLeft = false;
      hasContainer = true;
    }
  } else if (u < 0.28) {
    // Left crane retracts
    const k = easeInOut((u - 0.2) / 0.08);
    leftDrop = lerp(32, 12, k);
    waitingOnLeft = false;
    hasContainer = true;
  } else if (u < 0.56) {
    // Truck transports container across port apron
    const k = easeInOut((u - 0.28) / 0.28);
    truckX = lerp(56, 232, k);
    wheelAngle = (truckX - 56) / 6;
    waitingOnLeft = false;
    hasContainer = true;
  } else if (u < 0.72) {
    // Right RTG lifts container off trailer onto yard stack
    const k = easeInOut((u - 0.56) / 0.16);
    truckX = 232;
    wheelAngle = (232 - 56) / 6;
    waitingOnLeft = false;
    if (k < 0.35) {
      rightDrop = lerp(12, 32, k / 0.35);
      hasContainer = true;
    } else {
      rightDrop = lerp(32, 12, (k - 0.35) / 0.65);
      placedOnRight = true;
    }
  } else if (u < 0.96) {
    // Empty terminal tractor returns left
    const k = easeInOut((u - 0.72) / 0.24);
    truckX = lerp(232, 56, k);
    facing = -1;
    wheelAngle = (truckX - 56) / 6;
    waitingOnLeft = false;
    placedOnRight = true;
  } else {
    truckX = 56;
    facing = lerp(-1, 1, (u - 0.96) / 0.04);
    waitingOnLeft = true;
  }

  // Left Crane Spreader & waiting container
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(46, 26);
  ctx.lineTo(46, 26 + leftDrop);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(36, 26 + leftDrop, 20, 2.5);
  fillStroke(ctx, 1.1);
  if (waitingOnLeft) {
    drawContainerBox(ctx, 34, 28.5 + leftDrop, 24, 11, opts.showAccents);
  }

  // Right Crane Spreader & lifted/placed container
  ctx.beginPath();
  ctx.moveTo(240, 26);
  ctx.lineTo(240, 26 + rightDrop);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(230, 26 + rightDrop, 20, 2.5);
  fillStroke(ctx, 1.1);
  if (placedOnRight && u < 0.72) {
    drawContainerBox(ctx, 228, 28.5 + rightDrop, 24, 11, opts.showAccents);
  } else if (placedOnRight) {
    drawContainerBox(ctx, 230, 73, 24, 11);
  }

  // Terminal Tractor + Flatbed Chassis
  ctx.save();
  ctx.translate(truckX, 84);
  ctx.scale(Math.abs(facing) < 0.08 ? 0.08 : facing, 1);

  // Speed lines when moving
  if ((u > 0.3 && u < 0.54) || (u > 0.74 && u < 0.94)) {
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = opts.showAccents ? ACCENT_BLUE : INK;
    ctx.beginPath();
    ctx.moveTo(-36, -12);
    ctx.lineTo(-50, -12);
    ctx.moveTo(-34, -20);
    ctx.lineTo(-44, -20);
    ctx.stroke();
  }

  // Flatbed trailer
  ctx.beginPath();
  ctx.rect(-28, -11, 34, 4);
  fillStroke(ctx, 1.2);
  // Tractor cab
  ctx.beginPath();
  ctx.moveTo(6, -7);
  ctx.lineTo(6, -24);
  ctx.lineTo(18, -24);
  ctx.lineTo(22, -16);
  ctx.lineTo(22, -7);
  ctx.closePath();
  fillStroke(ctx, 1.3);
  // Windshield
  ctx.beginPath();
  ctx.rect(11, -21, 7, 6);
  fillStroke(ctx, 1.0);

  if (hasContainer) {
    drawContainerBox(ctx, -25, -22, 24, 11, opts.showAccents);
  }

  const spin = wheelAngle * (facing >= 0 ? 1 : -1);
  drawWheel(ctx, -20, -4.5, 4.5, spin);
  drawWheel(ctx, -4, -4.5, 4.5, spin);
  drawWheel(ctx, 15, -4.5, 4.5, spin);
  ctx.restore();
}

/* ============================================================================
 * 03. MINE-TO-PORT TRANSPORTATION (Compact 300x100 version of user's image)
 * ========================================================================== */
function drawMineToPortCompact(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 10.0;
  const u = (t % dur) / dur;

  // Mine terraces (left)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.quadraticCurveTo(34, 46, 62, 84);
  ctx.moveTo(0, 60);
  ctx.quadraticCurveTo(26, 63, 44, 84);
  ctx.stroke();

  // Mountain ridge (center)
  ctx.beginPath();
  ctx.moveTo(86, 72);
  ctx.quadraticCurveTo(122, 42, 138, 48);
  ctx.quadraticCurveTo(156, 56, 186, 80);
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Ground line & shore
  ctx.beginPath();
  ctx.moveTo(0, 84);
  ctx.lineTo(240, 84);
  ctx.quadraticCurveTo(248, 84, 254, 88);
  ctx.lineWidth = 1.4;
  ctx.stroke();

  drawRockPile(ctx, 14, 84, 16, 6);
  drawRockPile(ctx, 56, 84, 16, 8);

  // Kinematics
  let boomA = -54;
  let stickA = 56;
  let dumperX = 88;
  let dumperFacing = 1;
  let dumperLoad = 0;
  let bedTilt = 0;
  let wheelAngle = 0;
  let conveyorOn = false;
  let shipLoad = 0.25;

  if (u < 0.28) {
    // Excavator scoop & pour into dumper
    const k = u / 0.28;
    if (k < 0.25) {
      const s = easeInOut(k / 0.25);
      boomA = lerp(-54, -24, s);
      stickA = lerp(56, 88, s);
    } else if (k < 0.5) {
      const s = easeInOut((k - 0.25) / 0.25);
      boomA = lerp(-24, -40, s);
      stickA = lerp(88, 108, s);
    } else if (k < 0.82) {
      const s = easeInOut((k - 0.5) / 0.32);
      boomA = lerp(-40, -50, s);
      stickA = lerp(108, 16, s);
      dumperLoad = clamp((s - 0.4) / 0.6);
    } else {
      const s = easeInOut((k - 0.82) / 0.18);
      boomA = lerp(-50, -58, s);
      stickA = lerp(16, 60, s);
      dumperLoad = 1;
    }
  } else if (u < 0.52) {
    // Haul east to port
    const k = easeInOut((u - 0.28) / 0.24);
    dumperX = lerp(88, 214, k);
    wheelAngle = (dumperX - 88) / 5.5;
    dumperLoad = 1;
  } else if (u < 0.78) {
    // Tip into hopper -> conveyor -> ship
    const k = (u - 0.52) / 0.26;
    dumperX = 214;
    wheelAngle = (214 - 88) / 5.5;
    if (k < 0.25) {
      bedTilt = lerp(0, 36, easeInOut(k / 0.25));
      dumperLoad = 1;
    } else if (k < 0.8) {
      const p = (k - 0.25) / 0.55;
      bedTilt = 36;
      dumperLoad = clamp(1 - p * 1.3);
      conveyorOn = true;
      shipLoad = lerp(0.25, 0.95, p);
    } else {
      bedTilt = lerp(36, 0, easeInOut((k - 0.8) / 0.2));
      dumperLoad = 0;
      shipLoad = 0.95;
    }
  } else {
    // Empty return to mine
    const k = (u - 0.78) / 0.22;
    shipLoad = lerp(0.95, 0.25, easeInOut(k));
    if (k < 0.12) {
      dumperX = 214;
      dumperFacing = lerp(1, -1, k / 0.12);
    } else if (k < 0.88) {
      const r = easeInOut((k - 0.12) / 0.76);
      dumperX = lerp(214, 88, r);
      dumperFacing = -1;
      wheelAngle = (dumperX - 88) / 5.5;
    } else {
      dumperX = 88;
      dumperFacing = lerp(-1, 1, (k - 0.88) / 0.12);
    }
  }

  // Port Conveyor Gantry & A-frame Ship Loader (right)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  // Intake hopper
  ctx.beginPath();
  ctx.moveTo(188, 76);
  ctx.lineTo(200, 76);
  ctx.lineTo(197, 84);
  ctx.lineTo(191, 84);
  ctx.closePath();
  fillStroke(ctx, 1.1);
  // Trestle & A-frame tower
  ctx.beginPath();
  ctx.moveTo(194, 84);
  ctx.lineTo(194, 70);
  ctx.moveTo(232, 84);
  ctx.lineTo(234, 34);
  ctx.lineTo(239, 34);
  ctx.lineTo(240, 84);
  ctx.stroke();
  // Inclined conveyor & loader boom
  ctx.beginPath();
  ctx.moveTo(191, 71);
  ctx.lineTo(236, 54);
  ctx.lineTo(236, 59);
  ctx.lineTo(191, 75);
  ctx.closePath();
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(232, 50);
  ctx.lineTo(274, 44);
  ctx.lineTo(274, 48);
  ctx.lineTo(232, 54);
  ctx.closePath();
  fillStroke(ctx, 1.2);
  // Stay cable & spout
  ctx.beginPath();
  ctx.moveTo(236, 34);
  ctx.lineTo(272, 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(271, 48);
  ctx.lineTo(275, 48);
  ctx.lineTo(278, 60);
  ctx.lineTo(273, 60);
  ctx.closePath();
  fillStroke(ctx, 1.1);

  if (conveyorOn) {
    // Moving ore dots on conveyor & falling chute
    for (let i = 0; i < 4; i++) {
      const f = ((t * 1.4 + i * 0.25) % 1);
      ctx.beginPath();
      ctx.arc(lerp(193, 234, f), lerp(69, 53, f), 1.4, 0, Math.PI * 2);
      fillStroke(ctx, 0.9, opts.showAccents ? ACCENT_AMBER : PAPER);
    }
    for (let i = 0; i < 4; i++) {
      const f = ((t * 2.2 + i * 0.25) % 1);
      ctx.beginPath();
      ctx.arc(276, lerp(61, 74, f), 1.4, 0, Math.PI * 2);
      fillStroke(ctx, 0.9, opts.showAccents ? ACCENT_AMBER : PAPER);
    }
  }

  // Bulk Carrier Ship (x=250..298)
  ctx.save();
  ctx.translate(0, Math.sin(t * 2) * 0.5 + shipLoad * 1.2);
  drawRockPile(ctx, 273, 76, 22, 4 + shipLoad * 8);
  ctx.beginPath();
  ctx.rect(284, 64, 11, 12);
  fillStroke(ctx, 1.1);
  ctx.beginPath();
  ctx.moveTo(251, 75);
  ctx.lineTo(298, 75);
  ctx.lineTo(295, 90);
  ctx.lineTo(256, 90);
  ctx.closePath();
  fillStroke(ctx, 1.3);
  ctx.restore();
  drawWaterWaves(ctx, 250, 300, 88, t);

  // Tracked Excavator at x=34
  ctx.save();
  ctx.translate(34, 84);
  // Tracks
  ctx.beginPath();
  ctx.roundRect(-14, -7, 28, 7, 3.5);
  fillStroke(ctx, 1.3);
  // Cab
  ctx.beginPath();
  ctx.rect(-11, -18, 20, 10);
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.rect(-1, -22, 10, 12);
  fillStroke(ctx, 1.2);
  // Boom + Stick + Bucket
  const bRad = (boomA * Math.PI) / 180;
  const sRad = (stickA * Math.PI) / 180;
  const sx = 2 + Math.cos(bRad) * 28;
  const sy = -13 + Math.sin(bRad) * 28;
  const bx = sx + Math.cos(sRad) * 22;
  const by = sy + Math.sin(sRad) * 22;
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(2, -13);
  ctx.lineTo(sx, sy);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx, by + 3, 4, 0, Math.PI);
  fillStroke(ctx, 1.2);
  ctx.restore();

  // Haul Dumper
  ctx.save();
  ctx.translate(dumperX, 84);
  ctx.scale(Math.abs(dumperFacing) < 0.08 ? 0.08 : dumperFacing, 1);

  if ((u > 0.3 && u < 0.5) || (u > 0.82 && u < 0.96)) {
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = opts.showAccents ? ACCENT_BLUE : INK;
    ctx.beginPath();
    ctx.moveTo(-22, -8);
    ctx.lineTo(-32, -8);
    ctx.moveTo(-22, -15);
    ctx.lineTo(-29, -15);
    ctx.stroke();
  }

  // Cab
  ctx.beginPath();
  ctx.rect(6, -17, 10, 11);
  fillStroke(ctx, 1.2);
  // Tilting bed + ore
  ctx.save();
  ctx.translate(-12, -10);
  ctx.rotate((-bedTilt * Math.PI) / 180);
  if (dumperLoad > 0.05) {
    drawRockPile(ctx, 10, -8, 18, 6 * dumperLoad);
  }
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-1, 0);
  ctx.lineTo(18, 0);
  ctx.lineTo(24, -10);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  fillStroke(ctx, 1.2);
  ctx.restore();

  const spin = wheelAngle * (dumperFacing >= 0 ? 1 : -1);
  drawWheel(ctx, -10, -5.5, 5.5, spin);
  drawWheel(ctx, 10, -5.5, 5.5, spin);
  ctx.restore();
}

/* ============================================================================
 * 04. HEAVY EQUIPMENT & PORT HANDLING — SPMT + Mobile Harbor Crane -> Barge
 * ========================================================================== */
function drawHeavyEquipment(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 9.0;
  const u = (t % dur) / dur;

  drawGround(ctx, 84, 188);
  ctx.beginPath();
  ctx.moveTo(188, 84);
  ctx.lineTo(188, 92);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = INK;
  ctx.stroke();

  let spmtX = 36;
  let wheelAngle = 0;
  let boomAngleDeg = -58;
  let hookLen = 14;
  let cargoMode: 'spmt' | 'hook' | 'barge' = 'spmt';

  if (u < 0.22) {
    const k = easeInOut(u / 0.22);
    spmtX = lerp(24, 68, k);
    wheelAngle = (spmtX - 24) / 3.5;
  } else if (u < 0.36) {
    // Crane lowers hook onto cargo
    const k = easeInOut((u - 0.22) / 0.14);
    spmtX = 68;
    boomAngleDeg = lerp(-58, -140, k);
    hookLen = lerp(14, 24, k);
  } else if (u < 0.68) {
    // Hoist & swing heavy machinery block over to barge
    const k = easeInOut((u - 0.36) / 0.32);
    spmtX = 68;
    cargoMode = 'hook';
    boomAngleDeg = lerp(-140, -40, k);
    hookLen = k < 0.4 ? lerp(24, 14, k / 0.4) : lerp(14, 22, (k - 0.4) / 0.6);
  } else {
    // Set onto barge, return boom & reverse SPMT
    const k = easeInOut((u - 0.68) / 0.32);
    cargoMode = 'barge';
    boomAngleDeg = lerp(-40, -58, k);
    hookLen = lerp(22, 14, k);
    spmtX = lerp(68, 24, k);
    wheelAngle = (spmtX - 24) / 3.5;
  }

  // Heavy-lift Barge on right (198..294)
  ctx.save();
  ctx.translate(0, Math.sin(t * 2) * 0.6);
  ctx.beginPath();
  ctx.moveTo(198, 76);
  ctx.lineTo(294, 76);
  ctx.lineTo(288, 90);
  ctx.lineTo(204, 90);
  ctx.closePath();
  fillStroke(ctx, 1.4);
  if (cargoMode === 'barge') {
    // Heavy industrial transformer/turbine unit placed on barge
    ctx.beginPath();
    ctx.rect(226, 61, 24, 15);
    fillStroke(ctx, 1.3, PAPER, opts.showAccents ? ACCENT_BLUE : INK);
    ctx.beginPath();
    ctx.rect(232, 57, 12, 4);
    fillStroke(ctx, 1.1);
  }
  ctx.restore();
  drawWaterWaves(ctx, 188, 300, 88, t);

  // SPMT Multi-axle Heavy Transporter
  ctx.save();
  ctx.translate(spmtX, 84);
  ctx.beginPath();
  ctx.rect(-20, -10, 40, 4);
  fillStroke(ctx, 1.3);
  for (let wx = -15; wx <= 15; wx += 7.5) {
    drawWheel(ctx, wx, -3.2, 3.2, wheelAngle);
  }
  if (cargoMode === 'spmt') {
    ctx.beginPath();
    ctx.rect(-12, -25, 24, 15);
    fillStroke(ctx, 1.3, PAPER, opts.showAccents ? ACCENT_AMBER : INK);
    ctx.beginPath();
    ctx.rect(-6, -29, 12, 4);
    fillStroke(ctx, 1.1);
  }
  ctx.restore();

  // Mobile Harbor Crane (MHC) at x=142
  ctx.save();
  ctx.translate(142, 84);
  // Outriggers & chassis
  ctx.beginPath();
  ctx.rect(-20, -12, 40, 6);
  fillStroke(ctx, 1.3);
  drawWheel(ctx, -12, -3.5, 3.5, 0);
  drawWheel(ctx, 0, -3.5, 3.5, 0);
  drawWheel(ctx, 12, -3.5, 3.5, 0);
  // Tower pedestal & slewing house
  ctx.beginPath();
  ctx.rect(-10, -34, 20, 22);
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.rect(-13, -44, 26, 10);
  fillStroke(ctx, 1.3);

  // Lattice Boom
  const bRad = (boomAngleDeg * Math.PI) / 180;
  const tipX = Math.cos(bRad) * 62;
  const tipY = -42 + Math.sin(bRad) * 62;
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, -42);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  // Hoist line & spreader
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX, tipY + hookLen);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(tipX - 8, tipY + hookLen, 16, 2.5);
  fillStroke(ctx, 1.1);

  if (cargoMode === 'hook') {
    ctx.beginPath();
    ctx.rect(tipX - 12, tipY + hookLen + 2.5, 24, 15);
    fillStroke(ctx, 1.3, PAPER, opts.showAccents ? ACCENT_BLUE : INK);
    ctx.beginPath();
    ctx.rect(tipX - 6, tipY + hookLen + 17.5, 12, 4);
    fillStroke(ctx, 1.0);
  }
  ctx.restore();
}

/* ============================================================================
 * 05. EARTHMOVING — Tracked Bulldozer & Excavator Grading Embankment
 * ========================================================================== */
function drawEarthmoving(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 8.0;
  const u = (t % dur) / dur;

  // Uneven earth embankment on far right & ground line
  drawGround(ctx, 84, 300);
  ctx.beginPath();
  ctx.moveTo(222, 84);
  ctx.quadraticCurveTo(246, 54, 274, 48);
  ctx.lineTo(300, 48);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = INK;
  ctx.stroke();

  // Bulldozer pushing earth left-to-right (x=42..118)
  let dozerX = 42;
  let pushedDirt = 5;
  if (u < 0.48) {
    const k = easeInOut(u / 0.48);
    dozerX = lerp(42, 112, k);
    pushedDirt = lerp(4, 12, k);
  } else {
    const k = easeInOut((u - 0.48) / 0.52);
    dozerX = lerp(112, 42, k);
    pushedDirt = lerp(12, 4, k);
  }

  // Earth pile pushed in front of dozer blade
  drawRockPile(ctx, dozerX + 26, 84, 22, pushedDirt);
  drawRockPile(ctx, 162, 84, 34, 10);

  // Bulldozer rig
  ctx.save();
  ctx.translate(dozerX, 84);
  // Crawler tracks
  ctx.beginPath();
  ctx.roundRect(-18, -9, 34, 9, 4);
  fillStroke(ctx, 1.4);
  for (let rx = -12; rx <= 10; rx += 5.5) {
    ctx.beginPath();
    ctx.arc(rx, -4.5, 1.8, 0, Math.PI * 2);
    fillStroke(ctx, 0.9);
  }
  // Engine hood & cab
  ctx.beginPath();
  ctx.rect(-14, -20, 26, 11);
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.rect(-12, -30, 13, 10);
  fillStroke(ctx, 1.3);
  // Push arm & curved front blade
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(20, -6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, -18);
  ctx.quadraticCurveTo(23, -9, 21, 0);
  ctx.lineTo(17, 0);
  ctx.lineTo(17, -18);
  ctx.closePath();
  fillStroke(ctx, 1.3, PAPER, opts.showAccents && u < 0.48 ? ACCENT_AMBER : INK);
  ctx.restore();

  // Excavator on right (x=218) digging earth mound & swinging to embankment
  const exBoom = u < 0.5 ? lerp(-30, -56, easeInOut(u / 0.5)) : lerp(-56, -30, easeInOut((u - 0.5) / 0.5));
  const exStick = u < 0.5 ? lerp(-110, -145, easeInOut(u / 0.5)) : lerp(-145, -110, easeInOut((u - 0.5) / 0.5));
  ctx.save();
  ctx.translate(222, 84);
  ctx.scale(-1, 1); // facing left toward center earth pile
  ctx.beginPath();
  ctx.roundRect(-14, -8, 28, 8, 3.5);
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.rect(-11, -18, 20, 10);
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.rect(-2, -25, 11, 12);
  fillStroke(ctx, 1.2);
  const bRad = (exBoom * Math.PI) / 180;
  const sRad = ((180 + exStick) * Math.PI) / 180;
  const sx = 2 + Math.cos(bRad) * 26;
  const sy = -14 + Math.sin(bRad) * 26;
  const bx = sx + Math.cos(sRad) * 20;
  const by = sy + Math.sin(sRad) * 20;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(2, -14);
  ctx.lineTo(sx, sy);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(bx, by + 2, 4, 0, Math.PI);
  fillStroke(ctx, 1.2);
  ctx.restore();
}

/* ============================================================================
 * 06. SPECIALIZED FABRICATION — Welding Bay + Overhead Bridge Crane
 * ========================================================================== */
function drawFabrication(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 8.5;
  const u = (t % dur) / dur;

  drawGround(ctx, 84, 300);

  // Fabrication bay structural columns & overhead crane girder
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.rect(14, 14, 5, 70);
  ctx.rect(281, 14, 5, 70);
  fillStroke(ctx, 1.2);
  // Overhead rail beam
  ctx.beginPath();
  ctx.rect(14, 14, 272, 5);
  fillStroke(ctx, 1.3);

  // Fabrication cradle (left, x=46..98) & Shipping skid (right, x=212..264)
  ctx.beginPath();
  ctx.rect(48, 76, 48, 8);
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.rect(212, 76, 48, 8);
  fillStroke(ctx, 1.2);

  // Welding robot arm at x=34
  let weldX = 62;
  let welding = false;
  let trolleyX = 72;
  let hoistDrop = 14;
  let moduleX = 54;
  let moduleY = 62;

  if (u < 0.34) {
    // Robotic arm welds steel module on left cradle
    const k = u / 0.34;
    weldX = lerp(58, 88, k);
    welding = true;
    trolleyX = 72;
    hoistDrop = 14;
  } else if (u < 0.48) {
    // Lower crane slings to module
    const k = easeInOut((u - 0.34) / 0.14);
    hoistDrop = lerp(14, 38, k);
  } else if (u < 0.78) {
    // Hoist & transfer steel module across fabrication bay to skid
    const k = easeInOut((u - 0.48) / 0.30);
    if (k < 0.25) {
      hoistDrop = lerp(38, 22, k / 0.25);
    } else if (k < 0.8) {
      hoistDrop = 22;
      trolleyX = lerp(72, 236, (k - 0.25) / 0.55);
    } else {
      trolleyX = 236;
      hoistDrop = lerp(22, 38, (k - 0.8) / 0.2);
    }
    moduleX = trolleyX - 18;
    moduleY = 23 + hoistDrop;
  } else {
    // Module set on shipping skid; crane retracts & returns
    const k = easeInOut((u - 0.78) / 0.22);
    moduleX = 218;
    moduleY = 62;
    trolleyX = lerp(236, 72, Math.max(0, (k - 0.3) / 0.7));
    hoistDrop = k < 0.3 ? lerp(38, 14, k / 0.3) : 14;
  }

  // Welding Robot Arm
  ctx.save();
  ctx.translate(34, 84);
  ctx.beginPath();
  ctx.rect(-6, -12, 12, 12);
  fillStroke(ctx, 1.2);
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(12, -32);
  ctx.lineTo(weldX - 34, -24);
  ctx.stroke();
  if (welding && opts.showAccents) {
    ctx.strokeStyle = ACCENT_AMBER;
    ctx.lineWidth = 1.2;
    for (let s = 0; s < 4; s++) {
      const a = -0.6 + s * 0.4 + Math.sin(t * 25 + s) * 0.2;
      ctx.beginPath();
      ctx.moveTo(weldX - 34, -22);
      ctx.lineTo(weldX - 34 + Math.cos(a) * 6, -22 + Math.sin(a) * 6);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Overhead Bridge Crane Trolley & Slings
  ctx.beginPath();
  ctx.rect(trolleyX - 8, 19, 16, 4.5);
  fillStroke(ctx, 1.2);
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(trolleyX - 5, 23.5);
  ctx.lineTo(trolleyX - 5, 23.5 + hoistDrop);
  ctx.moveTo(trolleyX + 5, 23.5);
  ctx.lineTo(trolleyX + 5, 23.5 + hoistDrop);
  ctx.stroke();

  // Specialized Fabricated Steel Truss/Vessel Module
  ctx.beginPath();
  ctx.rect(moduleX, moduleY, 36, 14);
  fillStroke(ctx, 1.3, PAPER, opts.showAccents && u > 0.34 ? ACCENT_BLUE : INK);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(moduleX, moduleY + 14);
  ctx.lineTo(moduleX + 12, moduleY);
  ctx.lineTo(moduleX + 24, moduleY + 14);
  ctx.lineTo(moduleX + 36, moduleY);
  ctx.stroke();
}

/* ============================================================================
 * 07. INFRASTRUCTURE & READY-MIX CONCRETE — Batch Plant + Mixer + Boom Pour
 * ========================================================================== */
function drawReadyMix(
  ctx: CanvasRenderingContext2D,
  t: number,
  opts: SceneRenderOptions
) {
  const dur = 9.5;
  const u = (t % dur) / dur;

  drawGround(ctx, 84, 300);

  // Left Concrete Batching Plant (x=14..68)
  ctx.strokeStyle = INK;
  // Cement silo
  ctx.beginPath();
  ctx.rect(16, 22, 18, 42);
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.moveTo(16, 64);
  ctx.lineTo(25, 72);
  ctx.lineTo(34, 64);
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(18, 66);
  ctx.lineTo(18, 84);
  ctx.moveTo(32, 66);
  ctx.lineTo(32, 84);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  // Aggregate hopper & discharge gantry
  ctx.beginPath();
  ctx.moveTo(38, 34);
  ctx.lineTo(66, 34);
  ctx.lineTo(59, 54);
  ctx.lineTo(45, 54);
  ctx.closePath();
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.moveTo(42, 54);
  ctx.lineTo(42, 84);
  ctx.moveTo(62, 54);
  ctx.lineTo(62, 84);
  ctx.stroke();

  // Right Infrastructure Pier Formwork & Articulated Concrete Boom Pump (x=218..288)
  // Pier formwork box
  ctx.beginPath();
  ctx.rect(256, 52, 26, 32);
  fillStroke(ctx, 1.3);

  // Kinematics
  let truckX = 56;
  let facing = 1;
  let wheelAngle = 0;
  let charging = false;
  let pouring = false;
  let pierFill = 0.25;

  if (u < 0.2) {
    // Batching plant charging mixer drum
    truckX = 56;
    charging = true;
  } else if (u < 0.45) {
    // Transit to construction site
    const k = easeInOut((u - 0.2) / 0.25);
    truckX = lerp(56, 178, k);
    wheelAngle = (truckX - 56) / 4.5;
  } else if (u < 0.75) {
    // Boom pump pours concrete into pier formwork
    const k = (u - 0.45) / 0.3;
    truckX = 178;
    wheelAngle = (178 - 56) / 4.5;
    pouring = true;
    pierFill = lerp(0.25, 0.92, easeInOut(k));
  } else {
    // Return empty mixer truck to batching plant
    const k = (u - 0.75) / 0.25;
    pierFill = lerp(0.92, 0.25, easeInOut(k));
    if (k < 0.14) {
      truckX = 178;
      facing = lerp(1, -1, k / 0.14);
    } else if (k < 0.86) {
      const r = easeInOut((k - 0.14) / 0.72);
      truckX = lerp(178, 56, r);
      facing = -1;
      wheelAngle = (truckX - 56) / 4.5;
    } else {
      truckX = 56;
      facing = lerp(-1, 1, (k - 0.86) / 0.14);
    }
  }

  // Concrete fill level inside pier formwork
  const fillH = pierFill * 28;
  ctx.fillStyle = opts.showAccents ? '#E0F2FE' : '#E2E8F0';
  ctx.fillRect(257.5, 82.5 - fillH, 23, fillH);
  // Rebar vertical lines sticking out top
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.0;
  for (let rx = 262; rx <= 276; rx += 7) {
    ctx.beginPath();
    ctx.moveTo(rx, 46);
    ctx.lineTo(rx, 54);
    ctx.stroke();
  }

  // Concrete Boom Pump Truck parked at x=218
  ctx.save();
  ctx.translate(220, 84);
  ctx.beginPath();
  ctx.rect(-18, -11, 34, 5);
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.rect(6, -20, 10, 9);
  fillStroke(ctx, 1.2);
  drawWheel(ctx, -12, -4, 4, 0);
  drawWheel(ctx, 10, -4, 4, 0);
  // Articulated Placing Boom arching over pier
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = INK;
  ctx.beginPath();
  ctx.moveTo(-4, -11);
  ctx.lineTo(12, -56);
  ctx.lineTo(42, -52);
  ctx.lineTo(49, -36);
  ctx.stroke();
  if (pouring) {
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = opts.showAccents ? ACCENT_BLUE : INK;
    ctx.setLineDash([2.5, 2.5]);
    ctx.lineDashOffset = -t * 28;
    ctx.beginPath();
    ctx.moveTo(49, -36);
    ctx.lineTo(49, -12);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // Batch discharge stream when charging
  if (charging) {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = opts.showAccents ? ACCENT_AMBER : INK;
    ctx.setLineDash([2, 2]);
    ctx.lineDashOffset = -t * 24;
    ctx.beginPath();
    ctx.moveTo(52, 54);
    ctx.lineTo(52, 62);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ready-Mix Transit Truck (drum rotates continuously!)
  ctx.save();
  ctx.translate(truckX, 84);
  ctx.scale(Math.abs(facing) < 0.08 ? 0.08 : facing, 1);

  // Chassis & Cab
  ctx.beginPath();
  ctx.rect(-18, -10, 32, 4);
  fillStroke(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(6, -10);
  ctx.lineTo(6, -23);
  ctx.lineTo(16, -23);
  ctx.lineTo(20, -16);
  ctx.lineTo(20, -10);
  ctx.closePath();
  fillStroke(ctx, 1.3);
  ctx.beginPath();
  ctx.rect(10, -20, 6, 5);
  fillStroke(ctx, 0.9);

  // Tilted Mixing Drum with rotating spiral stripes
  ctx.save();
  ctx.translate(-5, -18);
  ctx.rotate(-0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 7.5, 0, 0, Math.PI * 2);
  fillStroke(ctx, 1.3);
  // Animated helical stripe band inside drum
  const stripeOffset = ((t * 14) % 10) - 5;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(stripeOffset - 3, -6);
  ctx.lineTo(stripeOffset + 2, 6);
  ctx.moveTo(stripeOffset + 4, -5);
  ctx.lineTo(stripeOffset + 7, 4);
  ctx.stroke();
  ctx.restore();

  const spin = wheelAngle * (facing >= 0 ? 1 : -1);
  drawWheel(ctx, -12, -4.5, 4.5, spin);
  drawWheel(ctx, 12, -4.5, 4.5, spin);
  ctx.restore();
}

export function renderAnimationFrame(
  ctx: CanvasRenderingContext2D,
  id: AnimationId,
  timeSec: number,
  width: number,
  height: number,
  opts: SceneRenderOptions
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);

  // Scale uniformly from 300x100 logical drafting space
  ctx.scale(width / BASE_W, height / BASE_H);

  switch (id) {
    case 'stevedoring':
      drawStevedoring(ctx, timeSec, opts);
      break;
    case 'intra-port':
      drawIntraPort(ctx, timeSec, opts);
      break;
    case 'mine-to-port':
      drawMineToPortCompact(ctx, timeSec, opts);
      break;
    case 'heavy-equipment':
      drawHeavyEquipment(ctx, timeSec, opts);
      break;
    case 'earthmoving':
      drawEarthmoving(ctx, timeSec, opts);
      break;
    case 'fabrication':
      drawFabrication(ctx, timeSec, opts);
      break;
    case 'ready-mix':
      drawReadyMix(ctx, timeSec, opts);
      break;
  }

  ctx.restore();
}
