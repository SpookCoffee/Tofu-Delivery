import test from 'node:test';
import assert from 'node:assert/strict';
import { stepPhysics } from '../src/game/DriftPhysics.js';
import { PASS_WAYPOINTS, ROAD_WIDTH, waypointHeight } from '../src/game/trackData.js';
const state=()=>({x:0,z:0,heading:0,vx:0,vz:0,yaw:0,speed:0,slipAngle:0,drifting:false});
const input=(extra={})=>({forward:false,back:false,left:false,right:false,handbrake:false,...extra});
test('route has several sweeping bends and real increasing elevation',()=>{
  assert.ok(PASS_WAYPOINTS.length>=20);
  assert.ok(waypointHeight(PASS_WAYPOINTS.length-1)>waypointHeight(0)+60);
  assert.ok(ROAD_WIDTH>7);
});
test('W accelerates forward and S reverses from rest',()=>{
  const a=state(),b=state();
  for(let i=0;i<60;i++){stepPhysics(a,input({forward:true}),1/60);stepPhysics(b,input({back:true}),1/60);}
  assert.ok(a.vz>0);assert.ok(b.vz<0);
});
test('A turns left and D turns right when driving forward',()=>{
  const a=state(),b=state();a.vz=13;b.vz=13;
  for(let i=0;i<30;i++){stepPhysics(a,input({left:true}),1/60);stepPhysics(b,input({right:true}),1/60);}
  assert.ok(a.heading<0);assert.ok(b.heading>0);
});
test('handbrake makes the car keep lateral momentum for a visible drift',()=>{
  const grip=state(),slide=state();
  grip.vz=20;slide.vz=20;
  for(let i=0;i<45;i++){
    stepPhysics(grip,input({right:true}),1/60);
    stepPhysics(slide,input({right:true,handbrake:true}),1/60);
  }
  assert.ok(slide.slipAngle>grip.slipAngle+2,`slip with brake ${slide.slipAngle} vs normal ${grip.slipAngle}`);
});
test('bounded positions and speed limit',()=>{
  const a=state();a.x=300;a.z=240;a.vz=100;
  stepPhysics(a,input({forward:true}),.016);
  assert.ok(a.x<=235 && a.z<=230 && a.speed<=41);
});
