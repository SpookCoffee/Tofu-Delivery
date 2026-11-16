import { Game } from './game/Game.js';

try {
  if(!('WebGL2RenderingContext' in window))throw Error('WebGL 2 is not available in this browser.');
  const game=new Game(document.getElementById('viewport'));
  window.tofuGame=game; // Useful for local debugging in VS Code.
  document.getElementById('loading').hidden=true;
} catch(error) {
  console.error(error);
  const loading=document.getElementById('loading');
  loading.hidden=false;
  loading.querySelector('strong').textContent='The 3D game could not start';
  loading.querySelector('p').textContent=`${error.message} Try a modern browser and serve this folder using VS Code Live Server.`;
}
