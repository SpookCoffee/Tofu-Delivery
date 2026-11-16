import * as THREE from 'three';
/** Smooth chase camera. C toggles between close and scenic distances. */
export class ChaseCamera {
  constructor(camera){this.camera=camera;this.mode=0;this.initialized=false;}
  toggle(){this.mode=(this.mode+1)%3;}
  reset(){this.initialized=false;}
  update(dt,car){
    const s=car.state,fx=Math.sin(s.heading),fz=Math.cos(s.heading);
    const distances=[13.5,23,33],heights=[6.9,11.8,24];
    const d=distances[this.mode],h=heights[this.mode];
    const ideal=new THREE.Vector3(s.x-fx*d,car.height+h,s.z-fz*d);
    if(!this.initialized){this.camera.position.copy(ideal);this.initialized=true;}
    this.camera.position.lerp(ideal,1-Math.exp(-dt*5.3));
    this.camera.lookAt(s.x+fx*6,car.height+1.55,s.z+fz*6);
  }
}
