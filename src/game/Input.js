/** Keyboard and simple touch controls. Space is the handbrake, C changes camera. */
export class Input {
  constructor(onCamera){
    this.keys=new Set();this.touch=new Set();
    const tracked=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyC']);
    window.addEventListener('keydown',e=>{
      if(tracked.has(e.code)){e.preventDefault();this.keys.add(e.code);}
      if(e.code==='KeyC'&&!e.repeat)onCamera();
    });
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);});
    window.addEventListener('blur',()=>{this.keys.clear();this.touch.clear();});
    document.querySelectorAll('[data-drive]').forEach(button=>{
      const control=button.dataset.drive;
      const press=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.touch.add(control);button.classList.add('pressed');};
      const release=e=>{e.preventDefault();this.touch.delete(control);button.classList.remove('pressed');};
      button.addEventListener('pointerdown',press);
      button.addEventListener('pointerup',release);
      button.addEventListener('pointercancel',release);
      button.addEventListener('lostpointercapture',()=>{this.touch.delete(control);button.classList.remove('pressed');});
    });
  }
  get state(){
    const down=(codes,t)=>codes.some(k=>this.keys.has(k))||this.touch.has(t);
    return {
      forward:down(['KeyW','ArrowUp'],'forward'),
      back:down(['KeyS','ArrowDown'],'back'),
      left:down(['KeyA','ArrowLeft'],'left'),
      right:down(['KeyD','ArrowRight'],'right'),
      handbrake:down(['Space'],'handbrake')
    };
  }
}
