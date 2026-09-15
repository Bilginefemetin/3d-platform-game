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

box(0,-1,0,90,2,90,0x3f4952);
box(0,9,-45,90,20,2,0x59636d); box(0,9,45,90,20,2,0x59636d);
box(-45,9,0,2,20,90,0x59636d); box(45,9,0,2,20,90,0x59636d);
[[0,2,-10,14,2,10],[18,5,-3,10,2,9],[-20,4,4,12,2,12],[8,7,16,16,2,8],[-16,9,20,9,2,9],[28,2,23,10,2,10],[-29,2,-19,11,2,8],[28,9,-22,9,2,9]].forEach(p=>box(...p,0x77828d));

const player=new THREE.Object3D(); player.position.set(0,2.2,25); scene.add(player);
const torso=box(0,-.65,0,1.0,1.4,.55,0x2f5f91); torso.position.set(0,-.65,0); player.add(torso); torso.visible=false;
camera.position.set(0,1.6,0); player.add(camera);

const keys={}; let yaw=0,pitch=0,vy=0;
const walkSpeed=8, sprintSpeed=14, crouchSpeed=4.5, slideSpeed=16;
const gravity=24, jump=9.5;
let locked=false, sliding=false, slideVelocity=new THREE.Vector3();
const standingCameraY=1.6, crouchCameraY=0.9;

addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='Space')e.preventDefault();
  if(e.code==='ControlLeft'||e.code==='ControlRight'){
    e.preventDefault();
    const sprinting=keys.ShiftLeft||keys.ShiftRight;
    // A crouch press while sprinting turns the current movement into a slide.
    if(!sliding && sprinting){
      const move=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
      if(move.lengthSq()){
        move.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
        slideVelocity.copy(move).multiplyScalar(slideSpeed);
        sliding=true;
      }
    }
  }
});
addEventListener('keyup',e=>keys[e.code]=false);
const start=document.querySelector('#start-screen');
start.addEventListener('click',()=>{renderer.domElement.requestPointerLock()});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;start.classList.toggle('hidden',locked)});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.5,Math.min(1.5,pitch));player.rotation.y=yaw;camera.rotation.x=pitch});

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.033);
 if(locked){
  const sprinting=keys.ShiftLeft||keys.ShiftRight;
  const crouching=keys.ControlLeft||keys.ControlRight;
  const dir=new THREE.Vector3((keys.KeyD?1:0)-(keys.KeyA?1:0),0,(keys.KeyS?1:0)-(keys.KeyW?1:0));
  if(dir.lengthSq()){
    dir.normalize();
    dir.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
    if(!sliding)player.position.addScaledVector(dir,(sprinting?sprintSpeed:(crouching?crouchSpeed:walkSpeed))*dt);
  }

  // The slide keeps moving even after CTRL is released, then smoothly loses momentum and stops.
  if(sliding){
    player.position.addScaledVector(slideVelocity,dt);
    slideVelocity.multiplyScalar(Math.pow(0.07,dt));
    if(slideVelocity.length()<0.35){sliding=false;slideVelocity.set(0,0,0)}
  }

  const targetCameraY=(crouching||sliding)?crouchCameraY:standingCameraY;
  camera.position.y=THREE.MathUtils.lerp(camera.position.y,targetCameraY,Math.min(1,dt*14));

  vy-=gravity*dt; player.position.y+=vy*dt;
  player.position.x=Math.max(-41,Math.min(41,player.position.x)); player.position.z=Math.max(-41,Math.min(41,player.position.z));
  let ground=0; const px=player.position.x,pz=player.position.z;
  const plats=[[0,1,-10,14,10],[18,4,-3,10,9],[-20,3,4,12,12],[8,6,16,16,8],[-16,8,20,9,9],[28,1,23,10,10],[-29,1,-19,11,8],[28,8,-22,9,9]];
  for(const [x,y,z,w,dz] of plats)if(Math.abs(px-x)<w/2&&Math.abs(pz-z)<dz/2&&player.position.y>=y&&player.position.y<=y+2.5)ground=y+1.05;
  if(player.position.y<=ground){player.position.y=ground;vy=0;if(keys.Space&&!crouching&&!sliding){vy=jump}}
 }
 renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
