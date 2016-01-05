/*globals THREE */
/*eslint-env browser */


var scene;
var camera;
var directionalLight;
var renderer;
var cube0;
var cube1;

function display () {
	initSpace();

	// キューブ0を作成しシーンに追加
	cube0 = initCube(2, 1, 1, 0x0000ff);
	scene.add(cube0);

	// キューブ0を作成しシーンに追加
	cube1 = initCube(1, 1, 1, 0xff0000);
	scene.add(cube1);

	// 各キューブの位置を設定
	cube0.position.x = -2;
	cube0.position.z = -1;
	cube1.position.x = 1;
	cube1.position.z = 0;

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
	directionalLight.position.set( 0, 50, 50 );
	scene.add( directionalLight );

	// Renderer作って設定して、DOMに追加する
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
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
	//var material = new THREE.MeshBasicMaterial({color: 0xff0000});

	// mesh作成する
	return new THREE.Mesh(geometry, material);	
}
