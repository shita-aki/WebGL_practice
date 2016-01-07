/*globals THREE */
/*eslint-env browser */


var scene;				// シーン 
var camera;				// カメラ
var directionalLight;	// ライト(平行光用)
var ambientLight;		// ライト(環境光用)
var renderer;			// レンダラ
var multi, cube0, cube1, cube2, floor;	// メッシュとかオブジェクト

function display () {
	// 場を作成！
	initSpace();

	// キューブ0を作成
	cube0 = initCube(3, 1, 1, 0x3333ff);
	// キューブ1を作成
	cube1 = initCube(1, 1, 1, 0xff0000);
	// キューブ2を作成
	cube2 = initCubeC(0.5, 5, 4, [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff]);

	// 各キューブの位置を設定
	cube0.position.set(-3, -1, -1);
	cube1.position.set(1, -2, 0);
	cube2.position.set(0, 2.5, 0);

	// 各キューブをまとめたシーングラフを作成し、シーンに追加
	multi = new THREE.Object3D();
	multi.add(cube0);
	multi.add(cube1);
	multi.add(cube2);
	scene.add(multi);
	multi.position.set(0, 0, -2);
	
	// フロアを作成しシーンに追加
	floor = initFloor(20, 25, 0xcfcfcf);
    floor.rotation.x = Math.PI/2;
    floor.position.y = -4;
	scene.add(floor);

	// requestAnimationFrame使わないで、自前で一定間隔で表示させる
	setInterval(function(){
		render();
	}, 33);
}

function render () {
/*
 * 表示する
 */
//	requestAnimationFrame(render);

	// 表示する
	renderer.render(scene, camera);

	// 各キューブの回転角を設定する
	cube0.rotation.x += 0.01;
	cube0.rotation.y += 0.01;
	cube1.rotation.x += 0.01;
	cube1.rotation.y += 0.02;
	cube1.rotation.z += 0.03;
	cube2.rotation.x += 0.02;
	cube2.rotation.y += 0.01;
	multi.rotation.y += 0.03;
}

function initSpace () {
/*
 * Scene、Camera、Light、Rendererの初期設定をまとめてやる
 */
	// Scene作る
	scene = new THREE.Scene();

	// Camera作って設定する
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);	
	camera.position.z = 5;

	// Light作って設定して、sceneに追加する
	directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.set(-10, 20, 5);
	// 影を付ける設定を行う
    directionalLight.castShadow = true;
    directionalLight.shadowDarkness = 1.0;
    directionalLight.shadowCameraRight = 30;
    directionalLight.shadowCameraLeft = -30;
    directionalLight.shadowCameraTop = 30;
    directionalLight.shadowCameraBottom = -30;
    directionalLight.shadowCameraNear = 5;
    directionalLight.shadowCameraFar = 100;

	// 環境光作って設定して、sceneに追加する
	scene.add(directionalLight);
	ambientLight = new THREE.AmbientLight(0x555555);
	scene.add(ambientLight);

	// Renderer作って設定して、DOMに追加する
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;		// 影をレンダリングする
	document.body.appendChild(renderer.domElement);
}

function initCube (tx, ty, tz, tcolor) {
/*
 * 直方体のmeshを作成する
 *   x, y, z: サイズ
 *   tcolor: 色
 */
	// geoetry作成する
	var geometry = new THREE.BoxGeometry(tx, ty, tz);
	// material作成する
	var material = new THREE.MeshLambertMaterial( { color: tcolor } );
	// mesh作成する
	var tmesh = new THREE.Mesh(geometry, material);	

	// 影の設定を行う
	tmesh.castShadow = true;		// 影を投影する
	tmesh.receiveShadow = true;	// 影が投影される

	// 作成したmeshをリターンする
	return tmesh;
}

function initCubeC (tx, ty, tz, tcolors) {
/*
 * 直方体のmeshを作成する
 *   x, y, z: サイズ
 *   tcolor:6色の配列
 */
	// geoetry作成する
	var geometry = new THREE.BoxGeometry(tx, ty, tz);
	// material作成する
    tcolors.forEach( function(color, idx)
    	{ geometry.faces[2 * idx + 1].color.setHex(color);
    	  geometry.faces[2 * idx].color.setHex(color);}
    );
	var material = new THREE.MeshLambertMaterial({vertexColors: THREE.FaceColors});
	// mesh作成する
	var tmesh = new THREE.Mesh(geometry, material);

	// 影の設定を行う
	tmesh.castShadow = true;		// 影を投影する
	tmesh.receiveShadow = true;	// 影が投影される

	// 作成したmeshをリターンする
	return tmesh;
}

function initFloor (tx, ty, tcolor) {
/*
 * 平面のmeshを作成する
 */
	// geoetry作成する
	var geometry = new THREE.PlaneGeometry(tx, ty);
	// material作成する
	var material = new THREE.MeshLambertMaterial({color: tcolor});
	// mesh作成する
	var tfloor = new THREE.Mesh(geometry, material);
	
	// materialを両面に設定する
	tfloor.material.side = THREE.DoubleSide;
	// 影の設定を行う
	tfloor.receiveShadow = true;		// 影が投影される

	// 作成したmeshをリターンする
	return tfloor;
}
