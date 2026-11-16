import * as THREE from 'three';
import { PASS_WAYPOINTS, ROAD_WIDTH, waypointHeight, horizontalDistance, clamp } from './trackData.js';

const hash = (n) => { const v=Math.sin(n*127.1+51.7)*43758.5453; return v-Math.floor(v); };

/** Builds the mountain, genuine elevated road mesh, trees, guardrails and start area. */
export class MountainWorld {
  constructor(scene) {
    this.scene=scene;
    this.roadWidth=ROAD_WIDTH;
    this.curve=new THREE.CatmullRomCurve3(
      PASS_WAYPOINTS.map(([x,z],i)=>new THREE.Vector3(x,waypointHeight(i),z)),
      false,'catmullrom',0.35
    );
    this.road=this.curve.getSpacedPoints(600);
    this.roadLength=this.curve.getLength();
    this.createLighting();
    this.createTerrain();
    this.createRoad();
    this.createTrees();
    this.createProps();
  }
  material(color, roughness=0.94){return new THREE.MeshStandardMaterial({color,roughness});}
  /** Returns nearest sampled road point. Used for surface detection and ground shaping. */
  nearestRoad(x,z) {
    let best=Infinity, bestPoint=this.road[0], bestIndex=0;
    // Sampling the 3D road along its length makes the slope continuous.
    for(let i=0;i<this.road.length;i++) {
      const p=this.road[i], dx=x-p.x, dz=z-p.z, d=dx*dx+dz*dz;
      if(d<best){best=d;bestPoint=p;bestIndex=i;}
    }
    return {distance:Math.sqrt(best),point:bestPoint,index:bestIndex};
  }
  naturalGround(x,z){
    return Math.max(2,12+(z+184)*.265 + 5.5*Math.sin(x*.018+z*.004) +
      3.5*Math.sin(x*.043-z*.022) + 2.4*Math.cos(z*.033));
  }
  /** Ground is blended up to the road so the asphalt is never a floating bridge. */
  groundHeight(x,z,near=null) {
    const road=near??this.nearestRoad(x,z);
    const base=this.naturalGround(x,z);
    const weight=1-clamp((road.distance-this.roadWidth*.4)/21,0,1);
    const smooth=weight*weight*(3-2*weight);
    return base*(1-smooth)+(road.point.y-.24)*smooth;
  }
  heightAt(x,z){return this.groundHeight(x,z)+.19;}
  getSurface(x,z){
    const d=this.nearestRoad(x,z).distance;
    return d<this.roadWidth*.5?'ASPHALT': d<this.roadWidth*.85?'SHOULDER':'GRASS';
  }
  createLighting(){
    this.scene.background=new THREE.Color('#a9b6b4');
    this.scene.fog=new THREE.FogExp2('#a9b6b4',.0034);
    this.scene.add(new THREE.HemisphereLight('#e5e6ed','#526049',2.15));
    const sun=new THREE.DirectionalLight('#fff0dd',2.6);
    sun.position.set(-75,175,-110);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-220;sun.shadow.camera.right=220;
    sun.shadow.camera.top=240;sun.shadow.camera.bottom=-240;
    sun.shadow.camera.near=1;sun.shadow.camera.far=440;
    sun.shadow.bias=-.0002;
    this.scene.add(sun);
  }
  createTerrain(){
    const segments=136, width=510, vertices=[], colors=[],indices=[];
    const c=new THREE.Color(), low=new THREE.Color('#506a4e'), high=new THREE.Color('#75866b');
    for(let iz=0;iz<=segments;iz++) {
      const z=-width/2+iz*width/segments;
      for(let ix=0;ix<=segments;ix++) {
        const x=-width/2+ix*width/segments;
        const y=this.groundHeight(x,z);
        vertices.push(x,y,z);
        const t=clamp((y+7)/160,0,1);
        c.copy(low).lerp(high,t*.75);
        const variation=(hash(ix*17+iz*819)-.5)*.075;
        colors.push(clamp(c.r+variation,0,1),clamp(c.g+variation,0,1),clamp(c.b+variation,0,1));
      }
    }
    for(let iz=0;iz<segments;iz++)for(let ix=0;ix<segments;ix++){
      const a=iz*(segments+1)+ix,b=a+1,c=a+(segments+1),d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    const terrain=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}));
    terrain.receiveShadow=true;this.scene.add(terrain);
  }
  ribbon(offset,width,yOffset,color,drawDashed=false){
    const n=this.road.length, verts=[],indices=[];
    for(let i=0;i<n;i++) {
      const p=this.road[i],prev=this.road[Math.max(0,i-1)],next=this.road[Math.min(n-1,i+1)];
      const dx=next.x-prev.x,dz=next.z-prev.z,len=Math.hypot(dx,dz)||1;
      const nx=dz/len,nz=-dx/len;
      const left=offset-width/2,right=offset+width/2;
      for(const d of [left,right])verts.push(p.x+nx*d,p.y+yOffset,p.z+nz*d);
      if(i>0 && (!drawDashed || Math.floor(i/7)%2===0)){
        const a=(i-1)*2,b=i*2;indices.push(a,b,a+1,b,b+1,a+1);
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setIndex(indices);geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:.94}));
    m.receiveShadow=true;this.scene.add(m);
  }
  createRoad(){
    this.ribbon(0,ROAD_WIDTH+3,.03,'#666259');
    this.ribbon(0,ROAD_WIDTH,.12,'#343839');
    this.ribbon(0,.17,.147,'#d3c7a3',true);
    this.ribbon(-ROAD_WIDTH*.45,.12,.148,'#ded8ca');
    this.ribbon( ROAD_WIDTH*.45,.12,.148,'#ded8ca');
    // Roadside guardrails on the outside of many bends.
    const railMat=this.material('#a6aaa9'),postMat=this.material('#81878a');
    for(let i=22;i<this.road.length-10;i+=10){
      const p=this.road[i],p0=this.road[i-8],p1=this.road[i+8];
      const cross=(p.x-p0.x)*(p1.z-p.z)-(p.z-p0.z)*(p1.x-p.x);
      if(Math.abs(cross)<12 || hash(i*.3)>.9)continue;
      const prev=this.road[i-1],next=this.road[i+1];
      const dx=next.x-prev.x,dz=next.z-prev.z,mag=Math.hypot(dx,dz)||1;
      const side=cross>0?1:-1, off=ROAD_WIDTH*.5+.75;
      const x=p.x+side*dz/mag*off,z=p.z-side*dx/mag*off;
      const post=new THREE.Mesh(new THREE.BoxGeometry(.21,1.15,.21),postMat);
      post.position.set(x,p.y+.53,z);this.scene.add(post);
      const rail=new THREE.Mesh(new THREE.BoxGeometry(.18,.17,5.8),railMat);
      rail.position.set(x,p.y+1.0,z);
      rail.rotation.y=Math.atan2(dx,dz);
      this.scene.add(rail);
    }
  }
  createTrees(){
    const trunkMat=this.material('#51463b'),leafMat=this.material('#314c3e');
    const trunkGeo=new THREE.CylinderGeometry(.36,.49,3.6,6);
    const pineGeo=new THREE.ConeGeometry(2.55,8.3,7);
    const count=260,trunks=new THREE.InstancedMesh(trunkGeo,trunkMat,count),
      crowns=new THREE.InstancedMesh(pineGeo,leafMat,count);
    const d=new THREE.Object3D();let placed=0;
    for(let i=0;i<2500 && placed<count;i++){
      const x=-218+hash(i*3+5)*436,z=-219+hash(i*2+77)*447;
      if(this.nearestRoad(x,z).distance<16 || (x<-94&&z<-183&&z>-210))continue;
      const y=this.groundHeight(x,z);
      const scale=.65+hash(i+19)*.8;
      d.position.set(x,y+1.8*scale,z);d.scale.setScalar(scale);d.rotation.set(0,hash(i*4)*Math.PI*2,0);d.updateMatrix();trunks.setMatrixAt(placed,d.matrix);
      d.position.set(x,y+6.3*scale,z);d.updateMatrix();crowns.setMatrixAt(placed,d.matrix);
      placed++;
    }
    trunks.count=placed;crowns.count=placed;
    trunks.castShadow=true;crowns.castShadow=true;
    trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
    this.scene.add(trunks,crowns);
  }
  createProps(){
    // Low-poly tofu shop at the bottom of the pass (the visitor's starting point).
    const bottom=this.road[0];
    const shopX=-112, shopZ=-190, shopY=this.groundHeight(shopX,shopZ);
    const base=this.material('#e2dbca'),roof=this.material('#353334'),glass=this.material('#657c77',.45);
    const box=(x,y,z,w,h,d,mat)=>{
      const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y+h/2,z);o.castShadow=true;o.receiveShadow=true;this.scene.add(o);return o;
    };
    box(shopX,shopY,shopZ,15,5.8,10,base);
    box(shopX,shopY+5.8,shopZ,17,.65,12,roof);
    box(shopX+7.55,shopY+1.05,shopZ-2.2,.18,3.1,3,glass);
    box(shopX+7.55,shopY+1.05,shopZ+2.5,.18,3.1,3,glass);
    // Location labels generated locally; no downloaded anime graphics or logos.
    this.makeSign('TOFU DELIVERY',shopX+7.85,shopY+4.9,shopZ,1);
    const top=this.road[this.road.length-1];
    this.makeSign('SUMMIT',top.x+8.2,top.y+3.2,top.z,1);
    // Scenic rock clusters near hillsides.
    const rocks=[this.material('#5f675d'),this.material('#83877b')];
    for(let i=0;i<85;i++) {
      const x=-205+hash(i*11+44)*410,z=-209+hash(i*7+103)*425;
      if(this.nearestRoad(x,z).distance<14)continue;
      const size=1+hash(i*2)*3;
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),rocks[i%2]);
      rock.position.set(x,this.groundHeight(x,z)+size*.5,z);
      rock.scale.y=.55+hash(i*12)*.6;rock.castShadow=true;this.scene.add(rock);
    }
  }
  makeSign(label,x,y,z,face=1){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=180;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#241e21';ctx.fillRect(0,0,1024,180);
    ctx.strokeStyle='#a76d79';ctx.lineWidth=9;ctx.strokeRect(5,5,1014,170);
    ctx.font='bold 86px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff5ec';ctx.fillText(label,512,90,920);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(11.2,2),new THREE.MeshBasicMaterial({map:texture,side:THREE.FrontSide}));
    sign.position.set(x,y,z);sign.rotation.y=face===1?Math.PI/2:-Math.PI/2;this.scene.add(sign);
  }
  spawnAtEnd(which='summit') {
    const atTop=which==='summit';const index=atTop?this.road.length-12:11;
    const p=this.road[index],a=this.road[index-2],b=this.road[index+2];
    const dx=b.x-a.x,dz=b.z-a.z;
    return {x:p.x,z:p.z,y:p.y,heading:Math.atan2(dx,dz)+(atTop?Math.PI:0)};
  }
}
