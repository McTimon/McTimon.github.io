import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { Curve, TetrahedronGeometry } from "./three.module.js";


let camera;
function main(){

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setClearColor(0xAAAAAA);
renderer.shadowMap.enabled = true;

camera = new THREE.PerspectiveCamera( 40, (0.78* window.innerWidth) / window.innerHeight, 0.1, 1000 );
camera.position.set( - 1.1, 0.9, 0.5 );
camera.position.set(8, 4, 10).multiplyScalar(3);
camera.lookAt(0,0,0);


const scene = new THREE.Scene();

{
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0,20,0);
    scene.add(light);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    const d = 50;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 50;
    light.shadow.bias = 0.001;
}

{
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1,2,4);
    scene.add(light);
}

const groundGeometry = new THREE.PlaneBufferGeometry(50, 50);
const groundMaterial = new THREE.MeshPhongMaterial({color: 0xCC8866});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.rotation.x = Math.PI * -.5;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

const carWidth = 0.05;
const carHeight = 0.05;
const carLength = 0.4;

const tank = new THREE.Object3D();
// scene.add(tank);

const bodyGeometry = new THREE.BoxBufferGeometry(carWidth, carHeight, carLength);
const bodyMaterial = new THREE.MeshPhongMaterial({color: 0x6688AA});
const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
bodyMesh.position.y = 0;
// bodyMesh.position.y = 1.4;
bodyMesh.castShadow = true;
tank.add(bodyMesh);

const wheelRadius = 0.1;
const wheelThickness = .05;
const wheelSegments = 16;
const wheelGeometry = new THREE.CylinderBufferGeometry(
    wheelRadius, //top rad
    wheelRadius, //bottom rad
    wheelThickness,
    wheelSegments

);
const wheelMaterial = new THREE.MeshPhongMaterial(
    {color: 0x888888}
);
const wheelPositions = [
    [-carWidth/2 - wheelThickness/2, - 0*carHeight/2, 0],
    [carWidth/2 + wheelThickness/2, - 0*carHeight/2, 0],
];

const wheelMeshes = wheelPositions.map((position) => {
    const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
    mesh.position.set(...position);
    mesh.rotation.z = Math.PI/2;
    mesh.castShadow =  true;
    bodyMesh.add(mesh);
    return mesh;
});


const turretWidth = .1;
const turretHeight = .1;
const turretLength = carLength * .75 * .2;
const turretGeometry = new THREE.BoxBufferGeometry(
    turretWidth, turretHeight, turretLength
);
const turretMesh = new THREE.Mesh(turretGeometry, bodyMaterial);
const turretPivot = new THREE.Object3D();
turretMesh.castShadow = true;
turretPivot.scale.set(5,5,5);
turretPivot.position.y = 0;
turretMesh.position.z = turretLength * .5;
turretPivot.add(turretMesh);
bodyMesh.add(turretPivot);

let noOfLinks = 134;
let linkMeshes = [];

for(let i = 0; i<noOfLinks;i++){
    linkMeshes.push(tank.clone());
    scene.add(linkMeshes[i]);
}


const arrayGenPoint = [];

const radiusL = 2;//RL
const radiusR = 5;//Rr
const sprocketCentreInterval= radiusL + radiusR + 5;  //d
const aMax = Math.atan((radiusR-radiusL)/sprocketCentreInterval);
const curveResolution = 10;//number of curve "handles"
let interval = (Math.PI-2*aMax)/(curveResolution/2); //angle interval for arcs during spline generation
let aRanger = aMax;
let chainTheta = 0;
let xPoint = 0;
let yPoint = 0;


//smaller sprocker points
for (let i = 0; i < (curveResolution/2); i++){
    
    chainTheta = Math.PI/2 + aRanger + interval*i;
    xPoint = radiusL*Math.cos(chainTheta);
    yPoint = -1 * radiusL*Math.sin(chainTheta) - radiusR;

    arrayGenPoint.push(new THREE.Vector3(xPoint,0,yPoint));//append
}

chainTheta = 0;
interval = (Math.PI+2*aMax)/(curveResolution/2); 
aRanger = Math.PI/2 - aMax;

//larger sprocker points
for (let j = 0; j < (curveResolution/2); j++){
    
    chainTheta = Math.PI + aRanger + interval*(j);
    xPoint = sprocketCentreInterval + radiusR*Math.cos(chainTheta);
    yPoint = -1*radiusR*Math.sin(chainTheta) - radiusR;
    // console.log(chainTheta);

    arrayGenPoint.push(new THREE.Vector3(xPoint,0,yPoint));//append
}

arrayGenPoint.push(arrayGenPoint[0]);//append


// const curve = new THREE.CatmullRomCurve3(arrayPoints);
const chainCurve = new THREE.CatmullRomCurve3(arrayGenPoint);

// const points = curve.getPoints(50);
// const geometry = new THREE.BufferGeometry().setFromPoints(points);
// const material = new THREE.LineBasicMaterial({color:0xff0000});
// const splineObject =  new THREE.Line(geometry, material);
// splineObject.rotation.x = Math.PI * .5;
// splineObject.position.y = 0.05;
// scene.add(splineObject);

const chainPoints = chainCurve.getPoints(curveResolution);
const chainGeometry = new THREE.BufferGeometry().setFromPoints(chainPoints);
const chainMaterial = new THREE.LineBasicMaterial({color:0xff0000});
const chainSplineObject =  new THREE.Line(chainGeometry, chainMaterial);
chainSplineObject.rotation.x = Math.PI * .5;
chainSplineObject.position.y = 0.05;
scene.add(chainSplineObject);

// console.log(chainTheta);

////Resize canvas according to window size
function resizeRendererToDisplaySize(renderer){
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if(needResize){
        renderer.setSize(width, height, false);
    }
    return needResize
}

// const targetPosition = new THREE.Vector3( );
// const tankPosition = new THREE.Vector3();
// const tankTarget = new THREE.Vector3();





const infoElem = document.querySelector('#info');

function render(time) {
        
    time *= 0.001;

    if(resizeRendererToDisplaySize(renderer)){
        const canvas = renderer.domElement;
        // cameras.forEach((cameraInfo) => {
            // const camera = cameraInfo.cam;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        // });
    }



    //////
    // let targetXPosition = new THREE.Vector3();
    let tankXPosition = new THREE.Vector3();
    let tankXTarget = new THREE.Vector3();

    //move tank
    for(let k = 0;k<noOfLinks;k++){
    let tankXTime = ((time + k*0.15) * .05);
    chainCurve.getPointAt(tankXTime % 1, tankXPosition);
    chainCurve.getPointAt((tankXTime + 0.01) % 1, tankXTarget);
    linkMeshes[k].position.set(tankXPosition.x, tankXPosition.z * -1, tankXPosition.y);
    tank.rotation.x=Math.PI;
    // tank.rotation.z=Math.PI;
    linkMeshes[k].lookAt(tankXTarget.x, tankXTarget.z *-1, tankXTarget.y);
    }
    
    // const controls = new OrbitControls( camera, renderer.domElement );
    // controls.addEventListener( 'change', render ); // use if there is no animation loop
    // controls.minDistance = 2;
    // controls.maxDistance = 1000;
    // controls.target.set( 0.1, 0.1, 0.2 );
    // controls.update();

    renderer.render(scene, camera);

    requestAnimationFrame(render);
    }

    requestAnimationFrame(render);



}

main();