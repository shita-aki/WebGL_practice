/*eslint-env browser */
/*globals makePerspective Matrix $V*/

var gl;							//WebGLコンテキスト格納用
var horizAspect = 640.0/480.0;	// 縦横比(なんの？)

var shaderProgram;				// シェーダープログラム(コンパイル/リンク済み)
var vertexPositionAttribute;		// 頂点座標用変数的な何かに振るインデックス
var textureCoordAttribute;		// テクスチャー用変数的な何かに振るインデックス
var squareVerticesBuffer;		// 3Dモデルの頂点座標格納用バッファ
var cubeVerticesTextureCoordBuffer;//3Dモデルのテクスチャ格納用バッファ
var cubeVerticesIndexBuffer;		// 3Dモデルの面(三角形)毎の頂点インデックス格納用バッファ
var cubeTexture;					// 3Dモデルに張るテクスチャー(全面を1枚にしてる)
var perspectiveMatrix;			// 透視投影変換行列らしい
var mvMatrix;					// モデルビュー行列だってよ
var mvMatrixStack = [];			// 行列を保存しておくスタック


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

		initShaders();	// シェーダーのコードを取得/コンパイル/リンクしてシェーダープログラムを作る
		initBuffers();	// バッファ(要は3Dモデル？)を作成する
		initTextures();	// テクスチャ初期化関数呼び出し

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
 * コンパイル済みシェーダープログラムを取得し、それらをリンクしてシェーダープログラムを作成する。
 * また、頂点描画用変数の設定を行う。
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
	
	// シェーダーソース中の変数を頂点座標用の変数に設定して、インデックス番号を振る？
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	// インデックス指定で、それを使用可能にする？
	gl.enableVertexAttribArray(vertexPositionAttribute);

	// シェーダーソース中の変数を頂点座標のテクスチャー用の変数に設定して、インデックス番号を振る？
	textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	// インデックス指定で、それを使用可能にする？
	gl.enableVertexAttribArray(textureCoordAttribute);
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
	
	// シェーダーのタイプに応じたシェーダーを作成する
	if (shaderScript.type === "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type === "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		//認識できないシェーダータイプだったら終了
		return null;
	}
	
	gl.shaderSource(shader, theSource);	// 作成したシェーダーにシェーダーのコードを設定
	gl.compileShader(shader);			// シェーダーコードをコンパイル
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		// コンパイルに失敗したらエラーメッセージを表示
		alert("シェーダーコンパイル中にエラー発生: " + gl.getShaderInfoLog(shader));
		return null;
	}
	
	// コンパイル済みシェーダープログラムを返す
	return shader;
}


function initBuffers() {
/*
 * 3Dモデル格納バッファを作成する。
 */
	// 空のバッファを作成
	squareVerticesBuffer = gl.createBuffer();
	// コンテキストに結び付けて、そのバッファに対する操作を可能にする？
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	// モデルの、面毎に頂点座標を並べた配列
	// 下の方で頂点のインデックスを指定して面を作ってるから、ここは頂点8個だけ定義すればいんじゃないの？
	// …と思ったけど、すぐ下のカラーの処理のコメントを書いてて、ダメだと気付いた。
	// 同じ頂点でも面によって色が違うから、頂点は面毎に全部用意しなければならない。
	// テクスチャ張る場合は違うのかな？
	var vertices = [
		// 前面
		-1.0, -1.0,  1.0,
		 1.0, -1.0,  1.0,
		 1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,

		// 後面
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0, -1.0, -1.0,
		
		// 上面
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		 1.0,  1.0,  1.0,
		 1.0,  1.0, -1.0,
		
		// 下面
		-1.0, -1.0, -1.0,
		 1.0, -1.0, -1.0,
		 1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,
		
		// 右面
		 1.0, -1.0, -1.0,
		 1.0,  1.0, -1.0,
		 1.0,  1.0,  1.0,
		 1.0, -1.0,  1.0,
		
		// 左面
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0
	];	
	// バッファに頂点座標を設定する。3つ目、STATITとSTREAMとDYNAMICがあるな…
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	// 空のバッファを作成
	cubeVerticesTextureCoordBuffer = gl.createBuffer();
	// コンテキストに結び付けて、そのバッファに対する操作を可能にする？
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	// 各面に張るテクスチャの画像上の座標(正規化した値)を定義
	var textureCoordinates = [
		// 前面
		0.0, 0.0, 0.25, 0.0, 0.25, 0.5, 0.0, 0.5,
		// 後面
		0.5, 0.5, 0.75, 0.5, 0.75, 1.0, 0.5, 1.0,
		// 上面
		0.25, 0.0, 0.5, 0.0, 0.5, 0.5, 0.25, 0.5,
		// 下面
		0.25, 0.5, 0.5, 0.5, 0.5, 1.0, 0.25, 1.0,
		// 右面
		0.5, 0.0, 0.75, 0.0, 0.75, 0.5, 0.5, 0.5,
		// 左面
		0.0, 0.5, 0.25, 0.5, 0.25, 1.0, 0.0, 1.0
	];
	// バッファに各面に張るテクスチャの座標(正規化されたもの)の配列を設定する
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

	// 例によって空のバッファを作成
	cubeVerticesIndexBuffer = gl.createBuffer();
	// コンテキストに結び付けるらしいぞ
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	// 面(三角形)毎の頂点のインデックスを並べた配列
	var cubeVertexIndices = [
		 0,  1,  2,    0,  2,  3,	//
		 4,  5,  6,    4,  6,  7,	//
		 8,  9, 10,    8, 10, 11,	//
		12, 13, 14,   12, 14, 15,	//
		16, 17, 18,   16, 18, 19,	//
		20, 21, 22,   20, 22, 23		//
	];
	// バッファに
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

function initTextures () {
/*
 * テクスチャの初期化を行う
 */
	cubeTexture = gl.createTexture();	// テクスチャを取得
	var cubeImage = new Image();			// テクスチャに張る画像を作成(空)
	// 画像が読み込めた場合に呼び出す関数を設定(テクスチャの設定を行う関数)
	cubeImage.onload = function() {handleTextureLoaded(cubeImage, cubeTexture);};
	cubeImage.src = "dice.png";			// 画像を設定
}

function handleTextureLoaded (image, texture) {
/*
 * テクスチャの各種設定を行う
 *   image  :テクスチャに設定する画像
 *   texture:テクスチャ(WebGLで取得した)
 */
	gl.bindTexture(gl.TEXTURE_2D, texture);	// テクスチャをバインド
	// テクスチャに画像を設定する
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	// テクスチャが画面上で拡大/縮小表示される場合の補間の仕方を設定
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);					// 拡大はリニア
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);	// 縮小はよく知らんミップマップ
	gl.generateMipmap(gl.TEXTURE_2D);		// よく分からんがミップマップを作製
	//gl.bindTexture(gl.TEXTURE_2D, null);	// 今回はバインドしたままで行きまっす
}

function drawScene() {
/*
 * シーンを描画する。
 */
	var squareRotation = 0.0;	// モデルの角度(ラジアン)
	var lastSquareUpdateTime;	// 最後にモデルの角度を算出した時の時間(時間で角度を決めるため)
	
	// モデルの絶対移動量(初期値)
	var squareXOffset = 0.0;
	var squareYOffset = 0.0;
	var squareZOffset = -10.0;
	// 1回に移動させる量
	var xIncValue = 0.1;
	var yIncValue = -0.2;
	var zIncValue = 0.3;

	// makePerspectiveはglUtils.jsの関数、透視投影変換行列を作成する
	perspectiveMatrix = makePerspective(45, horizAspect, 0.1, 100.0);
	
	loadIdentity();					// 行列演算。↓に少し記載
	
	// 頂点属性に頂点データを設定するそうな
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	
	// ★★★
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
	gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
	
	// 使用するテクスチャの設定をする…のか？
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
	gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

	// これはちょっと意味が分からない。モデルを画面に投影する際に適応するマトリクスを作ってシェーダーに設定してるような…
	setMatrixUniforms();

	// 定期的に(モデルを動かしながら)描画する。
	// (サイトの説明だけ見て作ったから、インターバルで呼ばれる関数の中身がサイトのサンプルとは違うかも)
	setInterval(function() {

		// カラーバッファ、深度バッファをクリア
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// 現在のモデルビュー行列を保存
		mvPushMatrix();

		// モデルを平行移動させる(モデルビュー行列を作成する)
		mvTranslate([squareXOffset, squareYOffset, squareZOffset]);
		// モデルを回転させる(モデルビュー行列を作成する)
		mvRotate(squareRotation, [1, 1, 1]);

		// これはちょっと意味が分からない。モデルを画面に投影する際に適応するマトリクスを作ってシェーダーに設定してるような…
		setMatrixUniforms();
		// やっと描画します！
		gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
	
		// 保存していたモデルビュー行列を復帰
		mvMatrix = mvPopMatrix();
				
		// 前回回転させた時との時間差分から、次の回転角および位置を求める
		var currentTime = (new Date()).getTime();
		var delta = currentTime - lastSquareUpdateTime;
		if (lastSquareUpdateTime) {
			// 次の位置を算出
			squareXOffset = squareXOffset + xIncValue * ((10 * delta) / 1000);
			squareYOffset = squareYOffset + yIncValue * ((10 * delta) / 1000);
			squareZOffset = squareZOffset + zIncValue * ((10 * delta) / 1000);		
			if (Math.abs(squareXOffset) > 4.0) {
				xIncValue = - xIncValue;
			}
			if (Math.abs(squareYOffset) > 3.0) {
				yIncValue = - yIncValue;
			}
			if (Math.abs(squareZOffset + 10) > 5.0) {
				zIncValue = - zIncValue;
			}

			// 次の角度を算出
			squareRotation = squareRotation + (30 * delta) / 1000.0;		// 約12秒で360[度]
		}
		lastSquareUpdateTime = currentTime;

	}, 17);
}


function loadIdentity() {
/*
 * Matrixはsylvester.jsで定義されてる行列演算用関数か？
 * ちょっとsylvester.jsのソース見てみたけど、
 * Matrix.I(x)は x次元の単位行列を作る関数のようだが、自信なし
 */
	mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
/*
 * 渡されたmatrixと自分自身を掛け合わせて、新しい行列を作成する。
 * (今までのモデルビュー行列に、新しい変換行列を掛け合わせ、新しいモデルビュー行列を作成する。)
 */
	mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
/*
 * Matrix.Translation(m)はglUtils.jsで定義されている。
 * Translationは、3×4の行列を作って平行移動量[X, Y, Z]を[0][3]～[2][3]に並べて、平行移動行列作成の前準備。
 * ensure4x4は、4x4より小さい行列を4x4の行列に拡張する。追加部分は単位行列と同じ値。
 * Translatationで作成した行列を4x4に拡張して、[x, y, z, 1]を平行移動させる行列を作る。
 */
	multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
/*
 * uniformはシェーダーのグローバル変数みたいよ。
 * シェーダープログラムにJavaScrptから値を渡す役目をしてるのかな。
 */
	// これは、カメラっていうか画面っていうか、に投影するための行列(透視投影行列)を渡している
	var pUniform	 = gl.getUniformLocation(shaderProgram, "uPMatrix");
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
	
	// mvMatixが何の行列か分かんないけど、シェーダーに渡してる。
	// モデルを動かす時に使用する行列？？
	var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function mvPushMatrix (m) {
/*
 * 受け取った行列を、行列保存用スタックに格納する
 *   m:行列
 */
	if (m) {
		// mを渡されたらそれを格納
		mvMatrixStack.push(m.dup());
		mvMatrix = m.dup();
	} else {
		// mを渡されてなかったらモデルビュー行列を格納
		mvMatrixStack.push(mvMatrix.dup());
	}
}

function mvPopMatrix () {
/*
 * 行列保存用スタックから行列を読み込みreturnする
 */
	if (!mvMatrixStack.length) {
		Error ("行列スタックが空だから取ってこられません。");
	}
	return mvMatrixStack.pop();
}

function mvRotate (angle, V) {
/*
 *  モデルを回転させるモデルビュー行列を作成する(で合ってる？)
 *   angle:角度(度)
 *   V    :回転軸([x, y, z]で回転させる軸が1)
 */
	var inRadians = angle * Math.PI / 180.0;
	
	var m = Matrix.Rotation(inRadians, $V([V[0], V[1], V[2]])).ensure4x4();
	multMatrix(m);
}
