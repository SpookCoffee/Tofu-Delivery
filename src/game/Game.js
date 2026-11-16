import * as THREE from 'three';
import { MountainWorld } from './MountainWorld.js';
import { AE86Car } from './AE86Car.js';
import { TireSmoke } from './TireSmoke.js';
import { ChaseCamera } from './ChaseCamera.js';
import { Input } from './Input.js';
import { Hud } from '../ui/Hud.js';

/** Runs the render loop. All gameplay happens in the user's browser. */
export class Game {
  constructor(container) {
    this.container=container;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(67,1,.12,750);
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.55;
    container.appendChild(this.renderer.domElement);
    this.world=new MountainWorld(this.scene);
    this.car=new AE86Car(this.scene,this.world);
    this.smoke=new TireSmoke(this.scene);
    this.chase=new ChaseCamera(this.camera);
    this.controls=new Input(()=>this.chase.toggle());
    this.hud=new Hud(this.world);
    this.running=true;
    const resize=()=>{
      const w=container.clientWidth,h=container.clientHeight;
      this.renderer.setSize(w,h,false);
      this.camera.aspect=w/Math.max(1,h);this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize',resize);resize();
    document.getElementById('summit-button').addEventListener('click',()=>this.reset('summit'));
    document.getElementById('base-button').addEventListener('click',()=>this.reset('base'));
    document.getElementById('camera-button').addEventListener('click',()=>this.chase.toggle());
    document.addEventListener('visibilitychange',()=>{this.lastTime=0;});
    this.clock=0;this.lastTime=0;
    requestAnimationFrame(t=>this.frame(t));
  }
  reset(place){this.car.reset(place);this.smoke.clear();this.chase.reset();}
  frame(t){
    const dt=this.lastTime?Math.min(.035,(t-this.lastTime)/1000):.016;
    this.lastTime=t;
    this.car.update(dt,this.controls.state);
    this.smoke.update(dt,this.car);
    this.chase.update(dt,this.car);
    this.hud.update(this.car,dt);
    this.renderer.render(this.scene,this.camera);
    requestAnimationFrame(time=>this.frame(time));
  }
}
