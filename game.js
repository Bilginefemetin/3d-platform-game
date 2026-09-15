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
[[0,2,-10,14,2,10],[18,5,-3,10,2,9],[-20,4,4,12,2,12],[8,7,16,16,2,8],[-16,9,20,9,2,9],[28,2,23,10,2,10],[-29,2,-19,11,2,8],[28,9,-22,9,2,9]].forEach(p=>box(...p,0x77828d));

const player=new THREE.Object3D(); player.position.set(0,2.2,25); scene.add(player);
const torso=box(0,-.65,0,1.0,1.4,.55,0x2f5f91); torso.position.set(0,-.65,0); player.add(torso); torso.visible=false;
camera.position.set(0,1.6,0); player.add(camera);

const keys={}; let yaw=0,pitch=0,vy=0;
const walkSpeed=8,sprintSpeed=15,crouchSpeed=4.5,slideStartSpeed=17,gravity=24,jump=9.5,slideFriction=11;
let locked=false,sliding=false,slideVelocity=new THREE.Vector3(),ctrlWasDown=false;
const standingCameraY=1.6,crouchCameraY=.9;

// Grappling hook / cable
const raycaster=new THREE.Raycaster();
const grappleTargets=[];
scene.traverse(o=>{if(o.isMesh) grappleTargets.push(o)});
let grappleActive=false,grapplePoint=new THREE.Vector3(),grappleVelocity=new THREE.Vector3();
let grappleLine=null,grappleHead=null;
const grappleMaterial=new THREE.LineBasicMaterial({color:0x20242a});
const hookMaterial=new THREE.MeshStandardMaterial({color:0x30363b,metalness:.8,roughness:.25});

function makeGrappleVisual(){
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  grappleLine=new THREE.Line(geo,grappleMaterial); grappleLine.frustumCulled=false; scene.add(grappleLine);
  grappleHead=new THREE.Group();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.045,8,18),hookMaterial);
  ring.rotation.x=Math.PI/2; grappleHead.add(ring);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(.07,.28,6),hookMaterial);
  tip.rotation.x=-Math.PI/2; tip.position.z=.17; grappleHead.add(tip);
  grappleHead.visible=false; scene.add(grappleHead);
}
makeGrappleVisual();

function fireGrapple(){
  if(!locked)return;
  raycaster.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=raycaster.intersectObjects(grappleTargets,false);
  if(!hits.length)return;
  const hit=hits.find(h=>h.object!==grappleLine&&h.object!==grappleHead);
  if(!hit)return;
  grapplePoint.copy(hit.point);
  grappleActive=true;
  grappleHead.visible=true;
  grappleHead.position.copy(grapplePoint);
  grappleHead.lookAt(camera.getWorldPosition(new THREE.Vector3()));
}
function cancelGrapple(){grappleActive=false;grappleHead.visible=false}

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space')e.preventDefault();if(e.code==='ControlLeft'||e.code==='ControlRight')e.preventDefault();if(e.code==='KeyE')fireGrapple()});
addEventListener('keyup',e=>keys[e.code]=false);

const start=document.querySelector('#start-screen');
start.addEventListener('click',()=>renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;start.classList.toggle('hidden',locked);if(!locked)cancelGrapple()});
document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.5,Math.min(1.5,pitch));player.rotation.y=yaw;camera.rotation.x=pitch});
document.addEventListener('mousedown',e=>{if(e.button===0)fireGrapple();if(e.button===2)cancelGrapple()});
document.addEventListener('contextmenu',e=>e.preventDefault());

const clock=new THREE.Clock();
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

    // Pull the player toward the grapple point while the cable is visible.
    if(grappleActive){
      const playerWorld=camera.getWorldPosition(new THREE.Vector3());
      const toHook=grapplePoint.clone().sub(playerWorld);
      const distance=toHook.length();
      if(distance<2.2){cancelGrapple()}
      else{
        toHook.normalize();
        const pullSpeed=Math.min(32,10+distance*.65);
        player.position.addScaledVector(toHook,pullSpeed*dt);
        vy=0;
      }
    }

    camera.position.y=THREE.MathUtils.lerp(camera.position.y,(crouching||sliding)?crouchCameraY:standingCameraY,Math.min(1,dt*14));
    vy-=gravity*dt;player.position.y+=vy*dt;
    player.position.x=Math.max(-41,Math.min(41,player.position.x));player.position.z=Math.max(-41,Math.min(41,player.position.z));
    let ground=0;const px=player.position.x,pz=player.position.z,plats=[[0,1,-10,14,10],[18,4,-3,10,9],[-20,3,4,12,12],[8,6,16,16,8],[-16,8,20,9,9],[28,1,23,10,10],[-29,1,-19,11,8],[28,8,-22,9,9]];
    for(const [x,y,z,w,dz] of plats)if(Math.abs(px-x)<w/2&&Math.abs(pz-z)<dz/2&&player.position.y>=y&&player.position.y<=y+2.5)ground=y+1.05;
    if(player.position.y<=ground){player.position.y=ground;vy=0;if(keys.Space&&!crouching&&!sliding)vy=jump}
    ctrlWasDown=crouching;
  }

  if(grappleActive){
    const startPoint=camera.getWorldPosition(new THREE.Vector3());
    const positions=grappleLine.geometry.attributes.position;
    positions.setXYZ(0,startPoint.x,startPoint.y,startPoint.z);
    positions.setXYZ(1,grapplePoint.x,grapplePoint.y,grapplePoint.z);
    positions.needsUpdate=true;
    grappleHead.position.copy(grapplePoint);
  }
  grappleLine.visible=grappleActive;
  grappleHead.visible=grappleActive;
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});