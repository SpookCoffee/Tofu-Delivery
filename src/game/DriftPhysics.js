import { clamp } from './trackData.js';

/**
 * Simple arcade RWD drift model. The car has world-space velocity, so the nose
 * can point in a different direction than its motion. That difference is drift.
 * It is intentionally NOT a real-world tire simulation.
 */
export function stepPhysics(state,input,dt,surface='ASPHALT',grade=0) {
  const steer=Number(!!input.left)-Number(!!input.right);
  const brake=!!input.handbrake;
  const throttle=Number(!!input.forward)-Number(!!input.back);
  const forwardX=Math.sin(state.heading),forwardZ=Math.cos(state.heading);
  let long=state.vx*forwardX+state.vz*forwardZ;
  const speed=Math.hypot(state.vx,state.vz);
  const offroad=surface==='GRASS';
  // Turning increases with forward speed, then saturates. Reverse steering reverses.
  const steeringPower=steer*(long<-.7?-1:1)*clamp(Math.abs(long)/6,0,1);
  const targetYaw=steeringPower*(brake?1.56:1.12)*clamp(1-speed/130,.55,1);
  state.yaw+=(targetYaw-state.yaw)*Math.min(1,dt*5.3);
  state.heading+=state.yaw*dt;
  const fx=Math.sin(state.heading),fz=Math.cos(state.heading);
  // Throttle and downhill gravity work in the direction the car faces.
  const accel=throttle>=0 ? throttle*15.2 : throttle*17.5;
  const downhill=clamp(-grade*7.6,-5.8,5.8);
  state.vx+=(fx*(accel+downhill))*dt;
  state.vz+=(fz*(accel+downhill))*dt;
  // Lateral momentum is not removed instantly: that's what makes slides possible.
  // Handbrake sharply reduces tire grip. Off-road also reduces traction.
  const rightX=fz,rightZ=-fx;
  const side=state.vx*rightX+state.vz*rightZ;
  const grip=brake?.72:offroad?2.2:4.1;
  const sideAfter=side*Math.exp(-grip*dt);
  const correction=side-sideAfter;
  state.vx-=rightX*correction;
  state.vz-=rightZ*correction;
  if(brake && Math.abs(steer)>.01 && speed>6) {
    const kick=steer*speed*.62*dt;
    state.vx-=rightX*kick;state.vz-=rightZ*kick;
  }
  // Rolling resistance / high-speed drag, plus stronger loss on grass.
  const drag=(offroad?.19:.045) + Math.hypot(state.vx,state.vz)*(offroad?.006:.0035);
  const factor=Math.exp(-drag*dt);
  state.vx*=factor;state.vz*=factor;
  const mag=Math.hypot(state.vx,state.vz);
  const maxSpeed=offroad?23:41;
  if(mag>maxSpeed){state.vx*=maxSpeed/mag;state.vz*=maxSpeed/mag;}
  state.x+=state.vx*dt;state.z+=state.vz*dt;
  state.x=clamp(state.x,-235,235);state.z=clamp(state.z,-238,230);
  long=state.vx*fx+state.vz*fz;
  const sideways=state.vx*rightX+state.vz*rightZ;
  state.slipAngle=Math.atan2(Math.abs(sideways),Math.max(2,Math.abs(long)))*180/Math.PI;
  state.speed=Math.hypot(state.vx,state.vz);
  state.drifting=state.speed>6 && (state.slipAngle>8 || (brake && Math.abs(steer)>.1));
  return state;
}
