import * as THREE from 'three';
import { stepPhysics } from './DriftPhysics.js';
import { clamp } from './trackData.js';

/** Low-poly white/black 1980s Japanese coupe with AE86-style proportions. */
export class AE86Car {
  constructor(scene,world) {
    this.scene=scene;this.world=world;
    this.group=new THREE.Group();this.scene.add(this.group);
    this.state={x:0,z:0,heading:0,vx:0,vz:0,yaw:0,speed:0,slipAngle:0,drifting:false};
    this.wheels=[];this.makeModel();this.reset('summit');
  }
  mat(color,roughness=.7){return new THREE.MeshStandardMaterial({color,roughness,metalness:.04});}
  block(x,y,z,w,h,d,mat,group=this.group){
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
  }
  makeModel(){
    const white=this.mat('#e9e8e1'),black=this.mat('#24282b'),glass=this.mat('#5b858a',.25),red=this.mat('#d94545');
    const lamp=this.mat('#f3ede0'),chrome=this.mat('#a6abb1');
    // Long hood, compact roofline, black lower two-tone sides.
    this.block(0,.82,0,2.22,.67,4.55,white);
    this.block(0,.52,-.03,2.24,.29,4.53,black);
    this.block(0,1.36,-.44,2.0,.72,2.3,white);
    this.block(0,1.45,-.44,2.04,.55,2.22,glass);
    this.block(0,1.83,-.50,2.03,.13,1.72,white);
    this.block(0,.9,1.55,2.24,.17,1.35,white);
    this.block(0,.60,2.28,1.93,.26,.18,black);
    this.block(-.74,.97,2.29,.42,.19,.13,lamp);
    this.block(.74,.97,2.29,.42,.19,.13,lamp);
    this.block(-.72,.8,-2.29,.49,.21,.1,red);
    this.block(.72,.8,-2.29,.49,.21,.1,red);
    this.block(0,.79,-2.29,.58,.14,.1,chrome);
    // Long angular rear hatch and modest lip spoiler.
    this.block(0,1.21,-1.66,1.91,.18,.98,glass);
    this.block(0,1.19,-2.21,2.02,.15,.32,black);
    for(const x of [-1,1]){
      this.block(x*1.17,1.30,.42,.23,.14,.42,black);
      this.block(x*1.075,.59,0,.06,.23,3.6,black);
      for(const z of [-1.48,1.48]){
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.27,14),black);
        wheel.rotation.z=Math.PI/2;
        wheel.position.set(x*1.16,.49,z);
        wheel.castShadow=true;this.group.add(wheel);this.wheels.push(wheel);
        const hub=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.29,12),chrome);
        hub.rotation.z=Math.PI/2;hub.position.set(x*1.16,.49,z);this.group.add(hub);
      }
    }
    // Small square headlights and bonnet details evoke the pop-up-headlight era.
    this.block(-.67,1.025,1.72,.58,.11,.65,black);
    this.block(.67,1.025,1.72,.58,.11,.65,black);
    // The game deliberately uses original geometry and no protected anime artwork.
  }
  reset(which='summit'){
    const start=this.world.spawnAtEnd(which);
    Object.assign(this.state,{x:start.x,z:start.z,heading:start.heading,vx:0,vz:0,yaw:0,speed:0,slipAngle:0,drifting:false});
    this.height=start.y;this.group.position.set(start.x,start.y,start.z);
    this.group.rotation.set(0,start.heading,0);this.grade=0;
  }
  update(dt,input){
    const s=this.state,fx=Math.sin(s.heading),fz=Math.cos(s.heading);
    const frontY=this.world.heightAt(s.x+fx*3,s.z+fz*3);
    const backY=this.world.heightAt(s.x-fx*3,s.z-fz*3);
    this.grade=clamp((frontY-backY)/6,-.65,.65);
    stepPhysics(s,input,dt,this.world.getSurface(s.x,s.z),this.grade);
    const targetY=this.world.heightAt(s.x,s.z);
    this.height+=(targetY-this.height)*Math.min(1,dt*11);
    this.group.position.set(s.x,this.height,s.z);
    // Raise the nose on climbs and gently bank to follow uneven shoulders.
    const pitch=-Math.atan(this.grade)*.8;
    const rx=Math.cos(s.heading),rz=-Math.sin(s.heading);
    const rightH=this.world.heightAt(s.x+rx*1.4,s.z+rz*1.4);
    const leftH=this.world.heightAt(s.x-rx*1.4,s.z-rz*1.4);
    const roll=clamp((rightH-leftH)/5,-.13,.13);
    this.group.rotation.set(pitch,s.heading,roll,'YXZ');
    for(const wheel of this.wheels)wheel.rotation.x+=s.speed*dt/.42;
  }
  rearWheelPositions(){
    const h=this.state.heading,{x,z}=this.state;
    const rx=Math.cos(h),rz=-Math.sin(h),fx=Math.sin(h),fz=Math.cos(h);
    return [-1,1].map(side=>new THREE.Vector3(
      x+side*rx*1.14-fx*1.5,
      this.height+.37,
      z+side*rz*1.14-fz*1.5
    ));
  }
}
