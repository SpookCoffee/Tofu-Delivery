import * as THREE from 'three';

/** Expanding translucent sprites, emitted from the two rear tires during slides. */
export class TireSmoke {
  constructor(scene){
    this.scene=scene;this.particles=[];this.pending=0;this.max=115;
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');const g=ctx.createRadialGradient(64,64,2,64,64,62);
    g.addColorStop(0,'rgba(255,255,255,.66)');g.addColorStop(.46,'rgba(230,233,230,.31)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
    this.texture=new THREE.CanvasTexture(canvas);
  }
  clear(){for(const p of this.particles){this.scene.remove(p.sprite);p.sprite.material.dispose();}this.particles=[];}
  spawn(position,dirt=false){
    if(this.particles.length>=this.max){const old=this.particles.shift();this.scene.remove(old.sprite);old.sprite.material.dispose();}
    const material=new THREE.SpriteMaterial({map:this.texture,color:dirt?'#d1b697':'#e7e9e6',transparent:true,opacity:.38,depthWrite:false});
    const sprite=new THREE.Sprite(material);
    sprite.position.copy(position);sprite.scale.setScalar(1.35);this.scene.add(sprite);
    const dx=(Math.random()-.5)*2.1,dz=(Math.random()-.5)*2.1;
    this.particles.push({sprite,age:0,life:1.05+Math.random()*.48,dx,dz});
  }
  update(dt,car){
    const active=car.state.drifting && car.state.speed>5;
    if(active){
      this.pending+=dt*(car.state.slipAngle>16?38:23);
      while(this.pending>=1){this.pending--;for(const pos of car.rearWheelPositions())this.spawn(pos,this.scene && car.world.getSurface(car.state.x,car.state.z)!=='ASPHALT');}
    }else this.pending=0;
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];p.age+=dt;
      if(p.age>=p.life){this.scene.remove(p.sprite);p.sprite.material.dispose();this.particles.splice(i,1);continue;}
      const t=p.age/p.life;p.sprite.position.x+=p.dx*dt;p.sprite.position.y+=.75*dt;p.sprite.position.z+=p.dz*dt;
      p.sprite.scale.setScalar(1.35+t*3.2);
      p.sprite.material.opacity=.4*Math.pow(1-t,1.7);
    }
  }
}
