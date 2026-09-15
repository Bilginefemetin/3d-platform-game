import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8db8d8);
scene.fog=new THREE.Fog(0x8db8d8,55,180);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,300);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true;
document.querySelector('#game').appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x52606d,2.2));
const sun=new THREE.DirectionalLight(0xffffff,2.5); sun.position.set(35,60,25); sun.castShadow=true; scene.add(sun);
function box(x,y,z,w,h,d,mat=0x6f7b86){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:mat,roughness:.78}));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
box(0,-1,0,90,2,90,0x3f4952); box(0,9,-45,90,20,2,0x59636d); box(0,9,45,90,20,2,0x59636d); box(-45,9,0,2,20,90,0x59636d); box(45,9,0,2,20,90,0x59636d);
[[0,2,-10,14,2,10],[18,5,-3,10,2,9],[-20,4,12,12,2,12],[8,7,16,16,2,8],[-16,9,20,9,2,9],[28,2,23,10,2,10],[-29,2,-19,11,2,8],[28,9,-22,9,2,9]].forEach(p=>box(...p,0x77828d));

const player=new THREE.Object3D(); player.position.set(0,2.2,25); scene.add(player);
const torso=box(0,-.65,0,1.0,1.4,.55,0x2f5f91); torso.position.set(0,-.65,0); player.add(torso); torso.visible=false;
camera.position.set(0,1.6,0); player.add(camera);

const keys={}; let yaw=0,pitch=0,vy=0;
const walkSpeed=8,sprintSpeed=15,crouchSpeed=4.5,slideStartSpeed=17,gravity=24,jump=9.5,slideFriction=11;
let locked=false,sliding=false,slideVelocity=new THREE.Vector3(),ctrlWasDown=false;
const standingCameraY=1.6,crouchCameraY=.9;

// Dual grappling hooks: Q = left, E = right.
const raycaster=new THREE.Raycaster();
const grappleTargets=[];
scene.traverse(o=>{if(o.isMesh) grappleTargets.push(o)});
const hooks={
  left:{active:false,holding:false,shooting:false,point:new THREE.Vector3(),start:new THREE.Vector3(),flight:0,line:null,rope:null,head:null},
  right:{active:false,holding:false,shooting:false,point:new THREE.Vector3(),start:new THREE.Vector3(),flight:0,line:null,rope:null,head:null}
};
const grappleMaterial=new THREE.LineBasicMaterial({color:0x20242a});
const ropeMaterial=new THREE.MeshStandardMaterial({color:0x20242a,roughness:.65,metalness:.1});
const hookMaterial=new THREE.MeshStandardMaterial({color:0x30363b,metalness:.8,roughness:.25});

function makeHookVisual(hook){
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  hook.line=new THREE.Line(geo,grappleMaterial); hook.line.frustumCulled=false; hook.line.visible=false; scene.add(hook.line);
  const ropeGeo=new THREE.CylinderGeometry(.045,.045,1,8);
  hook.rope=new THREE.Mesh(ropeGeo,ropeMaterial); hook.rope.frustumCulled=false; hook.rope.visible=false; scene.add(hook.rope);
  hook.head=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.19,.055,8,18),hookMaterial);
  ring.rotation.x=Math.PI/2; hook.head.add(ring);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.08,.32,6),hookMaterial);
  tip.rotation.x=-Math.PI/2; tip.position.z=.19; hook.head.add(tip);
  hook.head.visible=false; scene.add(hook.head);
}
makeHookVisual(hooks.left); makeHookVisual(hooks.right);

function findGrapplePoint(){
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(grappleTargets,false);
  return hits.find(h=>h.object!==hooks.left.line&&h.object!==hooks.left.rope&&h.object!==hooks.left.head&&h.object!==hooks.right.line&&h.object!==hooks.right.rope&&h.object!==hooks.right.head)||null;
}
function prepareGrapple(hook){
  if(!locked||hook.active||hook.shooting)return;
  const hit=findGrapplePoint();
  if(!hit)return;
  hook.point.copy(hit.point);
  hook.holding=true;
  hook.head.visible=true;
  hook.head.position.copy(camera.getWorldPosition(new THREE.Vector3()));
}
function firePreparedGrapple(hook){
  if(!locked||!hook.holding)return;
  hook.holding=false;
  hook.shooting=true;
  hook.flight=0;
  hook.start.copy(camera.getWorldPosition(new THREE.Vector3()));
  hook.head.position.copy(hook.start);
  hook.head.visible=true;
  hook.line.visible=true;
  hook.rope.visible=true;
}
function cancelGrapple(hook){hook.holding=false;hook.shooting=false;hook.active=false;hook.head.visible=false;hook.rope.visible=false;hook.line.visible=false}
function cancelAllGrapples(){cancelGrapple(hooks.left);cancelGrapple(hooks.right)}

addEventListener('keydown',e=>{
  if(keys[e.code])return;
  keys[e.code]=true;
  if(e.code==='Space')e.preventDefault();
  if(e.code==='ControlLeft'||e.code==='ControlRight')e.preventDefault();
  if(e.code==='KeyQ')prepareGrapple(hooks.left);
  if(e.code==='KeyE')prepareGrapple(hooks.right);
});
addEventListener('keyup',e=>{
  keys[e.code]=false;
  if(e.code==='KeyQ')firePreparedGrapple(hooks.left);
  if(e.code==='KeyE')firePreparedGrapple(hooks.right);
});

const start=document.querySelector('#start-screen');
start.addEventListener('click',()=>renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;start.classList.toggle('hidden',locked);if(!locked)cancelAllGrapples()});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.5,Math.min(1.5,pitch));player.rotation.y=yaw;camera.rotation.x=pitch});
document.addEventListener('contextmenu',e=>e.preventDefault());

const clock=new THREE.Clock();
const tmpStart=new THREE.Vector3();
const tmpMid=new THREE.Vector3();
const tmpDir=new THREE.Vector3();
const worldCamera=new THREE.Vector3();
function updateHookVisual(hook,dt){
  if(!hook.active&&!hook.holding&&!hook.shooting)return;
  camera.getWorldPosition(worldCamera);

  // While Q/E is held, show the hook sitting at the player's hand/camera.
  if(hook.holding){
    hook.head.position.copy(worldCamera);
    hook.line.visible=false;
    hook.rope.visible=false;
    return;
  }

  // After release, visibly launch the hook from the player to the exact target point.
  if(hook.shooting){
    hook.flight=Math.min(1,hook.flight+dt*5.5);
    const t=THREE.MathUtils.smoothstep(hook.flight,0,1);
    hook.head.position.lerpVectors(hook.start,hook.point,t);
    if(hook.flight>=1){
      hook.shooting=false;
      hook.active=true;
      hook.head.position.copy(hook.point);
      hook.head.lookAt(worldCamera);
    }
  }

  const end=hook.head.position;
  const positions=hook.line.geometry.attributes.position;
  positions.setXYZ(0,worldCamera.x,worldCamera.y,worldCamera.z);
  positions.setXYZ(1,end.x,end.y,end.z);
  positions.needsUpdate=true;
  hook.line.visible=true;

  tmpDir.copy(end).sub(worldCamera);
  const distance=tmpDir.length();
  if(distance>.001){
    hook.rope.visible=true;
    tmpDir.normalize();
    tmpMid.copy(worldCamera).add(end).multiplyScalar(.5);
    hook.rope.position.copy(tmpMid);
    hook.rope.scale.set(1,distance,1);
    hook.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tmpDir);
  }
}

function updateGrapplePull(hook,dt){
  if(!hook.active)return;
  const playerWorld=camera.getWorldPosition(tmpStart);
  const toHook=hook.point.clone().sub(playerWorld);
  const distance=toHook.length();
  if(distance<2.2){cancelGrapple(hook);return}
  toHook.normalize();
  const pullSpeed=Math.min(32,10+distance*.65);
  player.position.addScaledVector(toHook,pullSpeed*dt);
  vy=0;
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  if(locked){
    const sprinting=keys.ShiftLeft||keys.ShiftRight;
    const crouching=keys.ControlLeft||keys.ControlRight;
    const ctrlPressed=crouching&&!ctrlWasDown;
    const dir=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
    if(dir.lengthSq()){dir.normalize();dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw)}
    if(ctrlPressed&&sprinting&&dir.lengthSq()&&!sliding){slideVelocity.copy(dir).multiplyScalar(slideStartSpeed);sliding=true}
    if(sliding){player.position.addScaledVector(slideVelocity,dt);const ns=Math.max(0,slideVelocity.length()-slideFriction*dt);if(ns===0){slideVelocity.set(0,0,0);sliding=false}else slideVelocity.setLength(ns)}
    else if(dir.lengthSq()){player.position.addScaledVector(dir,(sprinting?sprintSpeed:(crouching?crouchSpeed:walkSpeed))*dt)}

    updateGrapplePull(hooks.left,dt);
    updateGrapplePull(hooks.right,dt);

    camera.position.y=THREE.MathUtils.lerp(camera.position.y,(crouching||sliding)?crouchCameraY:standingCameraY,Math.min(1,dt*14));
    vy-=gravity*dt;player.position.y+=vy*dt;
    player.position.x=Math.max(-41,Math.min(41,player.position.x));player.position.z=Math.max(-41,Math.min(41,player.position.z));
    let ground=0;const px=player.position.x,pz=player.position.z,plats=[[0,1,-10,14,10],[18,4,-3,10,9],[-20,3,12,12,12],[8,6,16,16,8],[-16,8,20,9,9],[28,1,23,10,10],[-29,1,-19,11,8],[28,8,-22,9,9]];
    for(const [x,y,z,w,dz] of plats)if(Math.abs(px-x)<w/2&&Math.abs(pz-z)<dz/2&&player.position.y>=y&&player.position.y<=y+2.5)ground=y+1.05;
    if(player.position.y<=ground){player.position.y=ground;vy=0;if(keys.Space&&!crouching&&!sliding)vy=jump}
    ctrlWasDown=crouching;
  }

  updateHookVisual(hooks.left,dt);
  updateHookVisual(hooks.right,dt);
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});