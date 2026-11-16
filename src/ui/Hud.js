/** Speed, drift status, mountain altitude and a fixed north-up course map. */
export class Hud {
  constructor(world) {
    this.world=world;
    this.speed=document.getElementById('speed');
    this.altitude=document.getElementById('altitude');
    this.slip=document.getElementById('slip');
    this.drift=document.getElementById('drift-indicator');
    this.surface=document.getElementById('surface');
    this.score=document.getElementById('score');
    this.best=document.getElementById('best');
    this.stage=document.getElementById('stage');
    this.map=document.getElementById('minimap');
    this.ctx=this.map.getContext('2d');
    this.sessionScore=0;this.currentChain=0;this.bestChain=0;
    this.mapBounds={left:-155,right:155,bottom:-221,top:202};
    this.renderMap(null);
  }
  project(x,z){
    const b=this.mapBounds;
    return {x:14+(x-b.left)/(b.right-b.left)*(this.map.width-28),
      y:12+(b.top-z)/(b.top-b.bottom)*(this.map.height-24)};
  }
  update(car,dt){
    const s=car.state;
    this.speed.textContent=Math.round(s.speed*3.6);
    this.altitude.textContent=Math.round(car.height);
    this.slip.textContent=Math.round(s.slipAngle);
    this.drift.classList.toggle('active',s.drifting);
    this.surface.textContent=car.world.getSurface(s.x,s.z);
    this.stage.textContent=car.grade<-.012?'DOWNHILL':car.grade>.012?'UPHILL':'LEVEL';
    if(s.drifting){
      this.currentChain+=dt*s.speed*(1+Math.min(s.slipAngle,40)/25)*4.8;
      this.sessionScore+=dt*s.speed*(1+Math.min(s.slipAngle,40)/25)*4.8;
      this.bestChain=Math.max(this.bestChain,this.currentChain);
    } else if(s.speed<3 || s.slipAngle<5) this.currentChain=0;
    this.score.textContent=Math.round(this.sessionScore).toLocaleString();
    this.best.textContent=Math.round(this.bestChain).toLocaleString();
    this.renderMap(car);
  }
  renderMap(car){
    const c=this.ctx,W=this.map.width,H=this.map.height;
    c.clearRect(0,0,W,H);
    c.fillStyle='#16221e';c.fillRect(0,0,W,H);
    c.strokeStyle='#455a4c';c.lineWidth=1.5;c.strokeRect(1,1,W-2,H-2);
    // The course is not an actual geographic map; its corners match the 3D road.
    const road=this.world.road;
    c.lineJoin='round';c.lineCap='round';
    for(const [w,col] of [[9,'#a19a7e'],[5.5,'#4b5454']]){
      c.beginPath();c.strokeStyle=col;c.lineWidth=w;
      for(let i=0;i<road.length;i++){
        const p=this.project(road[i].x,road[i].z);
        if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);
      }
      c.stroke();
    }
    for(const [position,label,color] of [[road[0],'BASE','#d0b18b'],[road[road.length-1],'TOP','#dca4af']]){
      const p=this.project(position.x,position.z);
      c.fillStyle=color;c.beginPath();c.arc(p.x,p.y,5,0,Math.PI*2);c.fill();
      c.font='bold 10px Arial';c.textAlign='center';c.fillText(label,p.x,p.y-11);
    }
    if(!car)return;
    const p=this.project(car.state.x,car.state.z);
    c.save();c.translate(p.x,p.y);
    c.rotate(car.state.heading);
    c.fillStyle='#f7dbe4';c.strokeStyle='#682338';c.lineWidth=1.5;
    c.beginPath();c.moveTo(0,-9);c.lineTo(6,8);c.lineTo(0,4);c.lineTo(-6,8);c.closePath();c.fill();c.stroke();c.restore();
  }
}
