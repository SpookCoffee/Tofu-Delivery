/**
 * ORIGINAL mountain pass inspired by the broad feeling of Gunma touge roads.
 * NOT a survey, exact copy, or GPS-accurate recreation of Mount Haruna.
 * x/z = horizontal map coordinates; the y value climbs smoothly from bottom to top.
 * Each bend creates a winding slope; every other corner reverses direction.
 */
export const PASS_WAYPOINTS = [
  [-82,-184],[-18,-182],[54,-180],[97,-162],[109,-132],
  [86,-105],[19,-101],[-66,-103],[-108,-84],[-110,-53],
  [-80,-35],[0,-32],[87,-33],[111,-10],[111,20],
  [84,41],[16,44],[-83,43],[-115,66],[-116,94],
  [-87,111],[-15,113],[76,111],[114,133],[110,165]
];
export const ROAD_WIDTH = 11.2;
export const PASS_NAME = 'Haruna-inspired Mountain Pass';

export function waypointHeight(i) {
  return 15 + i * 4.55;
}

export function horizontalDistance(a,b) {
  return Math.hypot(a.x-b.x, a.z-b.z);
}

export function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
