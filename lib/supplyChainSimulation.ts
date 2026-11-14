export type StageId = 'excavate' | 'haul' | 'unload' | 'return';

export interface StageDefinition {
  id: StageId;
  index: number;
  title: string;
  shortLabel: string;
  startSec: number;
  endSec: number;
  description: string;
  equipmentFocus: string;
}

export const TOTAL_CYCLE_SECONDS = 18.0;

export const SUPPLY_CHAIN_STAGES: StageDefinition[] = [
  {
    id: 'excavate',
    index: 1,
    title: '01. Mine Excavation & Loading',
    shortLabel: 'Excavate & Fill',
    startSec: 0.0,
    endSec: 5.4,
    description:
      'Tracked excavator drags its bucket through the mine bench ore face, lifts two full scoops, and loads the waiting haul dumper.',
    equipmentFocus: 'Tracked Excavator · Mine Ore Face',
  },
  {
    id: 'haul',
    index: 2,
    title: '02. Mine-to-Port Haulage',
    shortLabel: 'Haul to Port',
    startSec: 5.4,
    endSec: 9.2,
    description:
      'Loaded 120-ton haul dumper travels east along the mountain corridor road toward the coastal port unloading terminal.',
    equipmentFocus: 'Haul Dumper · Mountain Corridor',
  },
  {
    id: 'unload',
    index: 3,
    title: '03. Port Unloading & Ship Loading',
    shortLabel: 'Unload to Ship',
    startSec: 9.2,
    endSec: 14.0,
    description:
      'Dumper tilts its hydraulic bed into the intake hopper; ore ascends the port conveyor gantry and cascades through the loader chute into the bulk carrier.',
    equipmentFocus: 'Conveyor Gantry · Ship Loader · Bulk Carrier',
  },
  {
    id: 'return',
    index: 4,
    title: '04. Empty Return Cycle',
    shortLabel: 'Return to Mine',
    startSec: 14.0,
    endSec: 18.0,
    description:
      'Empty dumper turns at the terminal bay and returns along the haul road back to the mine loading point for the next cycle.',
    equipmentFocus: 'Haul Dumper · Return Loop',
  },
];

export interface FallingRock {
  x: number;
  y: number;
  r: number;
  rot: number;
}

export interface SimulationState {
  timeSec: number;
  normalizedProgress: number;
  activeStage: StageDefinition;
  subPhaseLabel: string;

  // Excavator kinematics (angles in radians)
  excavatorBoomAngle: number;
  excavatorStickAngle: number;
  excavatorBucketAngle: number;
  excavatorBodyPitch: number;
  excavatorBucketFill: number; // 0..1
  excavatorPourAlpha: number; // 0..1
  excavatorDragAlpha: number; // 0..1
  mineBankDepletion: number; // 0..1

  // Dumper kinematics
  dumperX: number;
  dumperFacingScale: number; // 1 = right, -1 = left (smoothly interpolates on turn)
  dumperWheelAngle: number;
  dumperBedTiltDeg: number; // 0..38
  dumperLoad: number; // 0..1
  dumperSpeedRatio: number; // 0..1 for speed lines
  dumperBounceY: number;

  // Port & Conveyor kinematics
  hopperPourAlpha: number; // 0..1
  conveyorActive: boolean;
  conveyorPhase: number; // continuous offset for conveyor ore chunks
  chutePourAlpha: number; // 0..1

  // Bulk Carrier Ship kinematics
  shipHoldLoad: number; // 0..1
  shipDraftOffsetY: number;
  shipBobY: number;
  waterWavePhase: number;

  // Quantitative readout values
  payloadTons: number;
  shipTonsLoaded: number;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutQuad(t: number): number {
  const x = clamp(t);
  return 1 - (1 - x) * (1 - x);
}

function easeInQuad(t: number): number {
  const x = clamp(t);
  return x * x;
}

function deg(d: number): number {
  return (d * Math.PI) / 180;
}

interface ExcavatorPose {
  boom: number;
  stick: number;
  bucket: number;
  pitch: number;
  fill: number;
  pour: number;
  drag: number;
}

function computeSingleScoopPose(u: number): ExcavatorPose {
  // u in [0, 1] for one complete scoop-drag-lift-dump cycle
  // Keyframe poses:
  // standby: boom=-58, stick=+58, bucket=+70
  // reach:   boom=-26, stick=+85, bucket=+30 (teeth open pointing down-left)
  // drag:    boom=-40, stick=+108, bucket=+132 (curled full)
  // lift:    boom=-55, stick=+45, bucket=+128
  // dumpPos: boom=-52, stick=+16, bucket=+128 -> bucket opens to +15
  if (u < 0.16) {
    // Reach out & down into ore face
    const k = easeInOutCubic(u / 0.16);
    return {
      boom: lerp(-58, -26, k),
      stick: lerp(58, 85, k),
      bucket: lerp(70, 28, k),
      pitch: lerp(0, 1.2, k),
      fill: 0,
      pour: 0,
      drag: 0,
    };
  }
  if (u < 0.42) {
    // Drag bucket backward through mine pile & curl up
    const k = easeInOutCubic((u - 0.16) / 0.26);
    return {
      boom: lerp(-26, -40, k),
      stick: lerp(85, 108, k),
      bucket: lerp(28, 134, k),
      pitch: lerp(1.2, -1.5, k),
      fill: easeOutQuad(k),
      pour: 0,
      drag: Math.sin(k * Math.PI),
    };
  }
  if (u < 0.68) {
    // Lift boom & extend stick over dumper bed
    const k = easeInOutCubic((u - 0.42) / 0.26);
    return {
      boom: lerp(-40, -52, k),
      stick: lerp(108, 16, k),
      bucket: lerp(134, 118, k),
      pitch: lerp(-1.5, 0.6, k),
      fill: 1,
      pour: 0,
      drag: 0,
    };
  }
  if (u < 0.88) {
    // Tilt bucket open to pour ore into dumper bed
    const k = easeInOutCubic((u - 0.68) / 0.20);
    return {
      boom: lerp(-52, -50, k),
      stick: lerp(16, 20, k),
      bucket: lerp(118, 18, k),
      pitch: lerp(0.6, 0, k),
      fill: 1 - easeInQuad(k),
      pour: Math.sin(clamp(k * 1.15) * Math.PI),
      drag: 0,
    };
  }
  // Retract smoothly back toward standby
  const k = easeInOutCubic((u - 0.88) / 0.12);
  return {
    boom: lerp(-50, -58, k),
    stick: lerp(20, 58, k),
    bucket: lerp(18, 70, k),
    pitch: 0,
    fill: 0,
    pour: 0,
    drag: 0,
  };
}

export const MINE_DUMPER_X = 595;
export const PORT_DUMPER_X = 1358;
const WHEEL_RADIUS = 33;

export function computeSimulationState(rawTimeSec: number): SimulationState {
  const t = ((rawTimeSec % TOTAL_CYCLE_SECONDS) + TOTAL_CYCLE_SECONDS) % TOTAL_CYCLE_SECONDS;

  const activeStage =
    SUPPLY_CHAIN_STAGES.find((s) => t >= s.startSec && t < s.endSec) ??
    SUPPLY_CHAIN_STAGES[0];

  // Defaults
  let boom = -58;
  let stick = 58;
  let bucket = 70;
  let bodyPitch = 0;
  let bucketFill = 0;
  let excavatorPourAlpha = 0;
  let excavatorDragAlpha = 0;
  let mineBankDepletion = 0;

  let dumperX = MINE_DUMPER_X;
  let dumperFacingScale = 1;
  let dumperWheelAngle = 0;
  let dumperBedTiltDeg = 0;
  let dumperLoad = 0;
  let dumperSpeedRatio = 0;
  let dumperBounceY = 0;

  let hopperPourAlpha = 0;
  let conveyorActive = false;
  let conveyorPhase = 0;
  let chutePourAlpha = 0;

  let shipHoldLoad = 0.18;
  let subPhaseLabel = 'Positioning excavator boom';

  // Phase 1: 0.0 - 5.4s (2 scoops)
  if (t < 5.4) {
    if (t < 2.55) {
      // Scoop 1
      const u = t / 2.55;
      const pose = computeSingleScoopPose(u);
      boom = pose.boom;
      stick = pose.stick;
      bucket = pose.bucket;
      bodyPitch = pose.pitch;
      bucketFill = pose.fill;
      excavatorPourAlpha = pose.pour;
      excavatorDragAlpha = pose.drag;

      if (u < 0.16) subPhaseLabel = 'Lowering bucket to mine bench';
      else if (u < 0.42) subPhaseLabel = 'Dragging scoop 1 through ore pile';
      else if (u < 0.68) subPhaseLabel = 'Swinging boom over haul dumper';
      else if (u < 0.88) subPhaseLabel = 'Dumping first scoop into bed';
      else subPhaseLabel = 'Returning for second scoop';

      if (u < 0.68) {
        dumperLoad = 0;
      } else if (u < 0.88) {
        dumperLoad = lerp(0, 0.52, easeInOutCubic((u - 0.68) / 0.2));
      } else {
        dumperLoad = 0.52;
      }
      mineBankDepletion = lerp(0, 0.45, clamp((u - 0.16) / 0.26));
    } else if (t < 5.0) {
      // Scoop 2
      const u = (t - 2.55) / 2.45;
      const pose = computeSingleScoopPose(u);
      boom = pose.boom;
      stick = pose.stick;
      bucket = pose.bucket;
      bodyPitch = pose.pitch;
      bucketFill = pose.fill;
      excavatorPourAlpha = pose.pour;
      excavatorDragAlpha = pose.drag;

      if (u < 0.16) subPhaseLabel = 'Positioning for scoop 2';
      else if (u < 0.42) subPhaseLabel = 'Dragging scoop 2 through ore pile';
      else if (u < 0.68) subPhaseLabel = 'Lifting loaded bucket to dumper';
      else if (u < 0.88) subPhaseLabel = 'Topping off dumper ore mound';
      else subPhaseLabel = 'Clearing boom for departure';

      if (u < 0.68) {
        dumperLoad = 0.52;
      } else if (u < 0.88) {
        dumperLoad = lerp(0.52, 1.0, easeInOutCubic((u - 0.68) / 0.2));
      } else {
        dumperLoad = 1.0;
      }
      mineBankDepletion = lerp(0.45, 0.9, clamp((u - 0.16) / 0.26));
    } else {
      // 5.0 - 5.4s: Retract slightly to parked standby
      const k = easeInOutCubic((t - 5.0) / 0.4);
      boom = lerp(-58, -62, k);
      stick = lerp(58, 66, k);
      bucket = lerp(70, 82, k);
      dumperLoad = 1.0;
      mineBankDepletion = lerp(0.9, 0.5, k);
      subPhaseLabel = 'Load complete · Preparing departure';
    }
  }
  // Phase 2: 5.4 - 9.2s (Haul from mine to port)
  else if (t < 9.2) {
    boom = -62;
    stick = 66;
    bucket = 82;
    dumperLoad = 1.0;
    const u = (t - 5.4) / 3.8;
    const eased = easeInOutCubic(u);
    dumperX = lerp(MINE_DUMPER_X, PORT_DUMPER_X, eased);
    dumperWheelAngle = (dumperX - MINE_DUMPER_X) / WHEEL_RADIUS;
    // Derivative of easeInOutCubic peaks at u=0.5 (velocity = 1.5)
    const velNorm = u < 0.5 ? 12 * u * u / 1.5 : 12 * (1 - u) * (1 - u) / 1.5;
    dumperSpeedRatio = clamp(velNorm * 0.65);
    dumperBounceY = Math.sin(t * 19) * 1.1 * dumperSpeedRatio;
    mineBankDepletion = lerp(0.5, 0, clamp(u * 2));

    if (u < 0.25) subPhaseLabel = 'Accelerating out of mine loading bay';
    else if (u < 0.78) subPhaseLabel = 'Hauling ore past central mountain ridge';
    else subPhaseLabel = 'Braking into port unloading bay';
  }
  // Phase 3: 9.2 - 14.0s (Unload at port & load bulk carrier ship)
  else if (t < 14.0) {
    boom = -62;
    stick = 66;
    bucket = 82;
    dumperX = PORT_DUMPER_X;
    dumperWheelAngle = (PORT_DUMPER_X - MINE_DUMPER_X) / WHEEL_RADIUS;

    const local = t - 9.2; // 0..4.8s
    if (local < 0.85) {
      // Raise hydraulic dump bed
      const k = easeInOutCubic(local / 0.85);
      dumperBedTiltDeg = lerp(0, 38, k);
      dumperLoad = 1.0;
      subPhaseLabel = 'Raising hydraulic dump bed';
    } else if (local < 3.45) {
      // Unloading into hopper -> conveyor -> chute -> ship
      const k = (local - 0.85) / 2.6;
      dumperBedTiltDeg = 38;
      dumperLoad = clamp(1 - easeInOutCubic(clamp(k * 1.35)));
      hopperPourAlpha = Math.sin(clamp(k * 1.3) * Math.PI);
      conveyorActive = true;
      conveyorPhase = k * 3.8;
      // Chute starts pouring slightly after conveyor starts (lag ~0.22)
      const chuteK = clamp((k - 0.14) / 0.86);
      chutePourAlpha = chuteK > 0 ? Math.sin(chuteK * Math.PI) : 0;
      shipHoldLoad = lerp(0.18, 0.96, easeInOutCubic(chuteK));

      if (k < 0.35) subPhaseLabel = 'Tipping ore into port intake hopper';
      else if (k < 0.72) subPhaseLabel = 'Conveying ore up gantry to ship loader';
      else subPhaseLabel = 'Pouring ore into bulk carrier hold';
    } else if (local < 4.35) {
      // Lower dump bed & finish chute tail
      const k = easeInOutCubic((local - 3.45) / 0.9);
      dumperBedTiltDeg = lerp(38, 0, k);
      dumperLoad = 0;
      conveyorActive = k < 0.55;
      conveyorPhase = 3.8 + k * 0.7;
      chutePourAlpha = k < 0.45 ? (1 - k / 0.45) * 0.4 : 0;
      shipHoldLoad = 0.96;
      subPhaseLabel = 'Lowering dump bed · Hold loaded';
    } else {
      dumperBedTiltDeg = 0;
      dumperLoad = 0;
      shipHoldLoad = 0.96;
      subPhaseLabel = 'Clearing port unloading bay';
    }
  }
  // Phase 4: 14.0 - 18.0s (Turn around and return empty to mine)
  else {
    const local = t - 14.0; // 0..4.0s
    dumperLoad = 0;

    // Ship cargo smoothly settles/trims into lower hold so loop at t=18 matches t=0
    shipHoldLoad = lerp(0.96, 0.18, easeInOutCubic(clamp((local - 0.4) / 3.2)));

    if (local < 0.48) {
      // Smooth turnaround to face left
      const k = easeInOutCubic(local / 0.48);
      dumperX = PORT_DUMPER_X;
      dumperFacingScale = lerp(1, -1, k);
      dumperWheelAngle = (PORT_DUMPER_X - MINE_DUMPER_X) / WHEEL_RADIUS;
      boom = -62;
      stick = 66;
      bucket = 82;
      subPhaseLabel = 'Turning around at port terminal';
    } else if (local < 3.45) {
      // Drive empty back to mine
      const u = (local - 0.48) / 2.97;
      const eased = easeInOutCubic(u);
      dumperX = lerp(PORT_DUMPER_X, MINE_DUMPER_X, eased);
      dumperFacingScale = -1;
      dumperWheelAngle = (dumperX - MINE_DUMPER_X) / WHEEL_RADIUS;
      const velNorm = u < 0.5 ? 12 * u * u / 1.5 : 12 * (1 - u) * (1 - u) / 1.5;
      dumperSpeedRatio = clamp(velNorm * 0.72);
      dumperBounceY = Math.sin(t * 22) * 1.25 * dumperSpeedRatio;
      boom = -62;
      stick = 66;
      bucket = 82;
      subPhaseLabel = 'Returning empty along haul road';
    } else {
      // Smooth turnaround back to face right under excavator
      const k = easeInOutCubic((local - 3.45) / 0.55);
      dumperX = MINE_DUMPER_X;
      dumperFacingScale = lerp(-1, 1, k);
      dumperWheelAngle = 0;
      boom = lerp(-62, -58, k);
      stick = lerp(66, 58, k);
      bucket = lerp(82, 70, k);
      subPhaseLabel = 'Aligning under excavator for next load';
    }
  }

  const shipDraftOffsetY = lerp(0, 7.5, clamp((shipHoldLoad - 0.18) / 0.78));
  const shipBobY = Math.sin(t * 2.1) * 1.3;
  const waterWavePhase = t * 1.4;

  return {
    timeSec: t,
    normalizedProgress: t / TOTAL_CYCLE_SECONDS,
    activeStage,
    subPhaseLabel,

    excavatorBoomAngle: deg(boom),
    excavatorStickAngle: deg(stick),
    excavatorBucketAngle: deg(bucket),
    excavatorBodyPitch: deg(bodyPitch),
    excavatorBucketFill: clamp(bucketFill),
    excavatorPourAlpha: clamp(excavatorPourAlpha),
    excavatorDragAlpha: clamp(excavatorDragAlpha),
    mineBankDepletion: clamp(mineBankDepletion),

    dumperX,
    dumperFacingScale,
    dumperWheelAngle,
    dumperBedTiltDeg,
    dumperLoad: clamp(dumperLoad),
    dumperSpeedRatio: clamp(dumperSpeedRatio),
    dumperBounceY,

    hopperPourAlpha: clamp(hopperPourAlpha),
    conveyorActive,
    conveyorPhase,
    chutePourAlpha: clamp(chutePourAlpha),

    shipHoldLoad: clamp(shipHoldLoad),
    shipDraftOffsetY,
    shipBobY,
    waterWavePhase,

    payloadTons: Math.round(dumperLoad * 120),
    shipTonsLoaded: Math.round(((shipHoldLoad - 0.18) / 0.78) * 120),
  };
}
