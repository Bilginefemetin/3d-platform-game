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
let locked=false,sliding=false,slideVelocity=new THREE.Vector3(),ctrlWasDown=false,spaceWasDown=false;
const standingCameraY=1.6,crouchCameraY=.9;

// Fast forward throw/dash: Q uses one of three charges.
const dashMax=3;
let dashCharges=dashMax;
let dashVelocity=new THREE.Vector3();
let dashTime=0;
let dashCooldown=0;
let dashRechargeTimer=0;
const dashSpeed=52;
const dashDuration=.24;
const dashGravityScale=.18;
const dashFriction=7;
const dashRechargeOne=3;
const dashRechargeTwo=4;
const dashRechargeThree=5;

const dashBars=document.querySelectorAll('.dash-bar');
function updateDashUI(){dashBars.forEach((bar,i)=>bar.classList.toggle('empty',i>=dashCharges));}
updateDashUI();

function doDash(){
  if(!locked||dashCharges<=0||dashCooldown>0)return;
  dashCharges--; updateDashUI();
  dashTime=dashDuration; dashCooldown=.28; dashRechargeTimer=0;
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion())).normalize();
  dashVelocity.copy(forward).multiplyScalar(dashSpeed);
  dashVelocity.y+=3.5;
  vy=0;
}

// Double jump: first Space = normal jump, second Space = aerial jump.
// After the aerial jump is used, it becomes available again after 3 seconds.
const doubleJumpCooldownMax=3;
let doubleJumpReady=true;
let doubleJumpCooldown=0;

addEventListener('keydown',e=>{
  if(keys[e.code])return;
  keys[e.code]=true;
  if(e.code==='Space')e.preventDefault();
  if(e.code==='ControlLeft'||e.code==='ControlRight')e.preventDefault();
  if(e.code==='KeyQ')doDash();
});
addEventListener('keyup',e=>{keys[e.code]=false});

const start=document.querySelector('#start-screen');
start.addEventListener('click',()=>renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===renderer.domElement;
  start.classList.toggle('hidden',locked);
  if(!locked){dashTime=0;dashVelocity.set(0,0,0);}
});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.5,Math.min(1.5,pitch));player.rotation.y=yaw;camera.rotation.x=pitch});
document.addEventListener('contextmenu',e=>e.preventDefault());

const clock=new THREE.Clock();

function handleDashRecharge(dt){
  if(dashCharges>=dashMax){dashRechargeTimer=0;return;}
  if(dashTime>0)return;
  dashRechargeTimer+=dt;
  if(dashCharges===2&&dashRechargeTimer>=dashRechargeOne){dashCharges=3;dashRechargeTimer=0;updateDashUI();}
  else if(dashCharges===1&&dashRechargeTimer>=dashRechargeTwo){dashCharges=3;dashRechargeTimer=0;updateDashUI();}
  else if(dashCharges===0&&dashRechargeTimer>=dashRechargeThree){dashCharges=3;dashRechargeTimer=0;updateDashUI();}
}

function updateDoubleJump(dt){
  if(doubleJumpReady)return;
  doubleJumpCooldown=Math.max(0,doubleJumpCooldown-dt);
  if(doubleJumpCooldown<=0){doubleJumpReady=true;doubleJumpCooldown=0;}
}

function updateMovement(dt){
  const sprinting=keys.ShiftLeft||keys.ShiftRight;
  const crouching=keys.ControlLeft||keys.ControlRight;
  const ctrlPressed=crouching&&!ctrlWasDown;
  const spacePressed=keys.Space&&!spaceWasDown;
  const dir=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
  if(dir.lengthSq()){dir.normalize();dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw)}

  if(ctrlPressed&&sprinting&&dir.lengthSq()&&!sliding){slideVelocity.copy(dir).multiplyScalar(slideStartSpeed);sliding=true}

  if(dashTime>0){
    dashTime=Math.max(0,dashTime-dt);
    player.position.addScaledVector(dashVelocity,dt);
    dashVelocity.multiplyScalar(Math.max(0,1-dashFriction*dt));
    vy-=gravity*dashGravityScale*dt;
    player.position.y+=vy*dt;
  }else{
    if(sliding){
      player.position.addScaledVector(slideVelocity,dt);
      const ns=Math.max(0,slideVelocity.length()-slideFriction*dt);
      if(ns===0){slideVelocity.set(0,0,0);sliding=false}else slideVelocity.setLength(ns);
    }else if(dir.lengthSq()){
      player.position.addScaledVector(dir,(sprinting?sprintSpeed:(crouching?crouchSpeed:walkSpeed))*dt);
    }
    vy-=gravity*dt;
    player.position.y+=vy*dt;
  }

  camera.position.y=THREE.MathUtils.lerp(camera.position.y,(crouching||sliding)?crouchCameraY:standingCameraY,Math.min(1,dt*14));
  player.position.x=Math.max(-41,Math.min(41,player.position.x));
  player.position.z=Math.max(-41,Math.min(41,player.position.z));

  let ground=0;
  const px=player.position.x,pz=player.position.z;
  const plats=[[0,1,-10,14,10],[18,4,-3,10,9],[-20,3,12,12,12],[8,6,16,16,8],[-16,8,20,9,9],[28,1,23,10,10],[-29,1,-19,11,8],[28,8,-22,9,9]];
  for(const [x,y,z,w,dz] of plats){if(Math.abs(px-x)<w/2&&Math.abs(pz-z)<dz/2&&player.position.y>=y&&player.position.y<=y+2.5)ground=y+1.05;}

  if(player.position.y<=ground){
    player.position.y=ground;
    if(vy<0)vy=0;
    if(spacePressed&&!crouching&&!sliding&&dashTime<=0)vy=jump;
  }else if(spacePressed&&!crouching&&!sliding&&dashTime<=0&&doubleJumpReady){
    vy=jump;
    doubleJumpReady=false;
    doubleJumpCooldown=doubleJumpCooldownMax;
  }

  ctrlWasDown=crouching;
  spaceWasDown=keys.Space;
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.033);
  dashCooldown=Math.max(0,dashCooldown-dt);
  if(locked){updateMovement(dt);handleDashRecharge(dt);updateDoubleJump(dt);}
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
