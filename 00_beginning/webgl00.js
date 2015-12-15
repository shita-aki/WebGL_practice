/*eslint-env browser */

/*globals makePerspective Matrix $V*/

var gl;							//WebGLコンテキスト格納用
var horizAspect = 480.0/640.0;	// 縦横比(なんの？)

var shaderProgram;				// シェーダープログラム(コンパイル/リンク済み)
var squareVerticesBuffer;		// ？？
var vertexPositionAttribute;		// ？？
var perspectiveMatrix;			// ？？
var mvMatrix;					// ？？


function start() {
/*
 * HTMLが読み込まれた時に呼ばれる関数。
 * canvasからWebGLのコンテキストを取得し、コンテキストに対して色々設定を行う。
 */

	var canvas = document.getElementById("glcanvas");	// canvasを取得
	initWebGL(canvas);									// WeGLコンテキスト初期化関数を呼ぶ

	// WebGLに対応していたら、以下の処理を実施する
	if (gl) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);					// 初期化用カラーを黒(不透明)
		gl.enable(gl.DEPTH_TEST);							// 深度のテスト？？を許可
		gl.depthFunc(gl.LEQUAL);								// 手前の物体が影になっている物体を隠す(透過させない)
		gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);	// カラーバッファと空間バッファをクリア

		initShaders();	// シェーダープログラムを取得/コンパイル
		initBuffers();	// 
		drawScene();	// WebGLコンテキストに描画する
	}
}


function initWebGL(canvas) {
/*
 * canvasからWebGLのコンテキストを取得する関数。
 * 	canvas:コンテキストを取得する対象のcanvas
 */
	gl = null;	// グローバル変数glをnullに初期化

	try {
		// 標準のWebGLコンテキストを取得する。失敗した場合、試験用？WebGLコンテキストを取得する(標準策定中時の実装？)
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	}
	catch(e) {
		// エラーは無視
	}
	
	// GLコンテキストを取得出来なかった場合、諦める
	if (!gl) {
		alert("WebGL初期化失敗。あなたのブラウザはWebGLをサポートしていないと思います");
	}
}


function initShaders() {
/*
 * 
 */
	var fragmentShader = getShader(gl, "shader-fs");		// コンパイル済みのfragmentのシェーダープログラムを読み込む
	var vertexShader = getShader(gl, "shader-vs");		// コンパイル済みのvertexのシェーダープログラムを読み込む

	// シェーダープログラムを作成する(リンク)
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	
	// シェーダープログラムの作成に失敗したらメッセージを表示
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize the shader program.");
	}
	
	// 作成したシェーダープログラムを、使用するシェーダープログラムとして設定
	gl.useProgram(shaderProgram);
	
	// ？？
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(vertexPositionAttribute);
}


function getShader(gl, id) {
/*
 * シェーダープログラムをDOMから取得し、コンパイルする。
 * 	gl:WebGLコンテキスト
 * 	id:DOM識別ID(シェーダー格納DOM識別用)
 */
	var shaderScript;	// シェーダープログラム格納DOM指定用変数
	var theSource;		// シェーダープログラムソースコード格納用変数
	var currentChild;	// DOMの子要素を順に見ていくための作業用変数
	var shader;			// コンパイル済みシェーダープログラム格納用変数
	
	shaderScript = document.getElementById(id);	// シェーダープログラム格納DOMを取得
	// シェーダープログラム格納DOMが見つからなかったら終了！
	if (!shaderScript) {
		return null;
	}
	
	theSource = "";		// ソースコード格納用変数を初期化
	currentChild = shaderScript.firstChild;						// シェーダープログラム格納DOMの最初の子要素を初期要素として、
	while (currentChild) {										// 順に子要素を見ていき、
		if (currentChild.nodeType === currentChild.TEXT_NODE) {	// 子要素がテキストノードだったら、
			theSource += currentChild.textContent;				// 子要素中のテキストをつなげてく。へ～、こんな風にソース格納していいんだ。
		}
		currentChild = currentChild.nextSibling;
	}
	
	if (shaderScript.type === "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type === "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		//認識できないシェーダータイプ
		return null;
	}
	
	gl.shaderSource(shader, theSource);	//
	gl.compileShader(shader);			//
	//
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}


function initBuffers() {
/*
 * 
 */

	squareVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	
	var vertices = [
		 1.0,  1.0, 0.0,
		-1.0,  1.0, 0.0,
		 1.0, -1.0, 0.0,
		-1.0, -1.0, 0.0
	];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
}


function drawScene() {
/*
 * 
 */

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
	
	loadIdentity();
	mvTranslate([-0.0, 0.0, -6.0]);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}


function loadIdentity() {
	mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
	mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
	multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
	var pUniform	 = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
	
	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}
