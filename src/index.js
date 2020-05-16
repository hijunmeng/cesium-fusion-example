//有时为了调试源码，需要打开以下行，同时在html中打开源码版，关闭压缩版
// import * as Cesium from "../node_modules/cesium/Source/Cesium.js";

//cesium的相关对象
let viewer;
let scene;
let canvas;

let videoMaterial;//视频材质，用于更新视频纹理
let videoAppearance;
let videoTexture; //视频纹理
let decoder;


let isTestVideoFusionWithPrimitiveApi = false;
let isTestVideoFusionWithEntityApi = false;

let log=113.74963020;//相机定位点
let lat=23.02150002;

initCesium();
initDecoder();
initEvent();//键盘wsad控制相机上下左右移动，qe控制拉近拉远，鼠标控制相机方向
showPosition();//显示鼠标在屏幕对应的经纬度以及相机离地的高度,与initEvent不可同时使用
initDatas();
initOthers();

// testVideoFusionWithEntityApi(); //测试视频融合
// testVideoFusionWithPrimitiveApi();//测试视频融合,使用深度测试
testVideoFusionWithPrimitiveApi2();//测试视频融合，使用GroundPrimitive

// testFetchImage(); //测试从网络加载图片并制成纹理
// getCustomTexture(); //获得一张自定义纹理

// testCustomShader(); //测试自定义材质


function videoCallback(data, width, height) {//data：Uint8Array
    if (!scene) {
        return;
    }
    if (isTestVideoFusionWithPrimitiveApi && !videoAppearance) {
        return;
    }
    if (isTestVideoFusionWithEntityApi && !videoMaterial) {
        return;
    }

    let arrayBufferView = flipY(
        data,
        Cesium.PixelFormat.RGB,
        Cesium.PixelDatatype.UNSIGNED_BYTE,
        width,
        height
    );

    //验证rgb数据是否正常
    // let can = document.getElementById("canvas-test");
    // // console.log("dddd:"+can instanceof HTMLCanvasElement);
    // let ctx = can.getContext("2d");
    // var imgData = ctx.createImageData(width, height);
    // for (var i = 0, j = 0; i < imgData.data.length; i += 4, j += 3) {
    //     imgData.data[i + 0] = arrayBufferView[j + 0];
    //     imgData.data[i + 1] = arrayBufferView[j + 1];
    //     imgData.data[i + 2] = arrayBufferView[j + 2];
    //     imgData.data[i + 3] = 255;
    // }
    // ctx.putImageData(imgData, 10, 10);

    //  return ;

    console.log("type=" + typeof (data) + ",len=" + data.byteLength + ",w=" + width + ",h=" + height);
    let size = Cesium.PixelFormat.textureSizeInBytes(Cesium.PixelFormat.RGB, Cesium.PixelDatatype.UNSIGNED_BYTE, width, height);
    console.log("size=" + size);
    if (!videoTexture) {
        videoTexture = new Cesium.Texture({
            context: scene.context,
            pixelFormat: Cesium.PixelFormat.RGB,
            pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,//存储方式，UNSIGNED_BYTE对应Uint8Array
            width: width,
            height: height,
            flipY: false,
            source: {
                arrayBufferView: arrayBufferView
            }
        });
        if (isTestVideoFusionWithEntityApi) {
            videoMaterial.image = videoTexture;
        }
        if (isTestVideoFusionWithPrimitiveApi) {
            videoAppearance.material.uniforms.image = videoTexture;
        }

    } else {
        // console.log("copyFrom");
        videoTexture.copyFrom({
            width: width,
            height: height,
            arrayBufferView: arrayBufferView
        });

    }

}

function testFetchImage() {
    var imageUri = '../res/image/note.jpg';
    Cesium.Resource.createIfNeeded(imageUri).fetchImage().then(function (image) {
        console.log('image loaded!' + typeof (image));
        var texture;
        var context = viewer.scene.context;
        if (Cesium.defined(image.internalFormat)) {
            texture = new Cesium.Texture({
                context: context,
                pixelFormat: image.internalFormat,
                width: image.naturalWidth,
                height: image.naturalHeight,
                source: {
                    arrayBufferView: image.bufferView
                }
            });
        } else {
            texture = new Cesium.Texture({
                context: context,
                source: image
            });
        }
    });
}

function initDecoder() {
    decoder = new DecoderWrap(videoCallback, { tag: "fusion" });


}

function flipY(bufferView, pixelFormat, pixelDatatype, width, height) {

    if (height === 1) {
        return bufferView;
    }
    var flipped = Cesium.PixelFormat.createTypedArray(
        pixelFormat,
        pixelDatatype,
        width,
        height
    );
    var numberOfComponents = Cesium.PixelFormat.componentsLength(pixelFormat);
    var textureWidth = width * numberOfComponents;
    for (var i = 0; i < height; ++i) {
        var row = i * width * numberOfComponents;
        var flippedRow = (height - i - 1) * width * numberOfComponents;
        for (var j = 0; j < textureWidth; ++j) {
            flipped[flippedRow + j] = bufferView[row + j];
        }
    }
    return flipped;

}




function initOthers() {
    document.getElementById("playBtn").addEventListener("click", (event) => {
        let wsUrl = "ws://192.168.39.122:9002";
        var playUrl = "rtsp://192.168.39.122/video/265/surfing.265";
        var playUrl = "rtsp://192.168.39.122/video/h265_aac.ts";
        // var playUrl="http://192.168.25.105:8380/live?app=demo&stream=stream-1";
        var playUrl = "http://devimages.apple.com/iphone/samples/bipbop/gear3/prog_index.m3u8";

        // var playUrl="rtsp://192.168.40.201:554/PSIA/Streaming/channels/0";
        var playUrl = "rtsp://192.168.39.94:554/PSIA/Streaming/channels/1";

        decoder.play(wsUrl, playUrl);
    });
    document.getElementById("stopBtn").addEventListener("click", (event) => {
        decoder.stop();
    });
}
function testCustomShader() {
    // let log = 113.78184887;
    // let lat = 23.00039352;
    let material = new Cesium.Material({
        translucent: false,////是否半透明
        //minificationFilter:Cesium.TextureMinificationFilter.LINEAR,//纹理缩小过滤器
        //magnificationFilter:Cesium.TextureMinificationFilter.LINEAR,//纹理放大滤镜
        fabric: {
            type: 'Image',
            uniforms: {
                image: "../assets/image/test.jpg",
                // color: new Cesium.Color(1.0, 0.0, 1.0, 1.0),
                // cellAlpha: 1.0,
                // myColor: new Cesium.Color(1.0, 0.0, 1.0, 1.0),
                // myimage: "../res/image/view.jpg",
            },
            // source: `
            //             uniform vec4 color;
            //             uniform float cellAlpha;
            //             uniform sampler2D myimage;

            //             czm_material czm_getMaterial(czm_materialInput materialInput)
            //             {
            //                 czm_material material = czm_getDefaultMaterial(materialInput);
            //                 vec2 st = materialInput.st;
            //                 float aa = st.s * st.t;
            //                 vec3 halfColor = color.rgb * aa + texture2D(myimage, materialInput.st).rgb * (1.0 - aa);
            //                 halfColor *= 0.5;
            //                 material.diffuse = texture2D(myimage, materialInput.st).rgb;
            //                 material.emission = texture2D(myimage, materialInput.st).rgb;
            //                 // material.alpha = color.a * aa;
            //                 material.alpha = 1.0;
            //                 return material;
            //             }
            //         `
        }

    });
    //material.uniforms.myImage="../res/image/note.jpg";

    let appearance = new Cesium.MaterialAppearance({
        flat: false,//平面阴影
        faceForward: false,//为true时片段着色器会根据需要翻转表面法线，以确保法线面对观察者，避免出现黑斑
        translucent: false,//是否半透明
        closed: false,//背面剔除
        // materialSupport: Cesium.MaterialAppearance.MaterialSupport.TEXTURED,//支持的材质类型
        material: material,
        // vertexShaderSource:document.getElementById("vertex_shader").textContent,
        // vertexShaderSource:"void main(){ gl_Position = czm_computePosition();}",
        // fragmentShaderSource:document.getElementById("fragment_shader").textContent,
        //fragmentShaderSource:"void main(){ gl_FragColor = vec4(1.0,0.0,0.0,1.0);}"
        //renderState:{}

        renderState: {
            depthTest: {
                enabled: true //是否开启深度测试
            },
            // depthMask: false,
            //blending: Cesium.BlendingState.DISABLED,  //混合
        }
    });


    let geometryInstances = new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(log, lat, log + 0.0002, lat + 0.0002),
            // vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
            height: 10.0,
            extrudedHeight:25
        }),
        id: 'rectangle',
        //   attributes : {
        //     color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5)
        //   },

    });

    let primitive = new Cesium.Primitive({
        geometryInstances: geometryInstances,
        appearance: appearance,
        // show: true,//显示
        // modelMatrix: Cesium.Matrix4.IDENTITY,//4x4转换矩阵，用于将图元（所有几何实例）从模型坐标转换为世界坐标
        // shadows: Cesium.ShadowMode.DISABLED//是否从光源投射或接收阴影
    });

    

    scene.primitives.add(primitive);
    // viewer.zoomTo(primitive);
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(log + 0.0001, lat + 0.0001), 30));

    console.log("vert:\n" + appearance.vertexShaderSource);
    console.log("frag:\n" + appearance.fragmentShaderSource);
    console.log("frag:\n" + appearance.getFragmentShaderSource());
}

function getCustomTexture() {

    let width = 100;
    let height = 100;
    let size = width * height * 3;
    let buffer = new Uint8Array(size);
    //随机生成颜色
    for (let i = 0; i < size; i += 3) {
        buffer[i] = Math.random() * 255;//r
        buffer[i + 1] = Math.random() * 255;//g
        buffer[i + 2] = Math.random() * 255;//b
    }

    let texture = new Cesium.Texture({
        context: scene.context,
        pixelFormat: Cesium.PixelFormat.RGB,
        pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,//存储方式，UNSIGNED_BYTE对应Uint8Array
        width: width,
        height: height,
        source: {
            arrayBufferView: buffer
        }
    });
    return texture;
}


function initCesium() {
    viewer = new Cesium.Viewer('cesiumContainer', {
        // terrainProvider: Cesium.createWorldTerrain({
        //     requestWaterMask: true, // required for water effects
        //     requestVertexNormals: true // required for terrain lighting
        // }),//山脉

        animation: false,//左侧的动画栏
        homeButton: true,//回到home,回到home可以自定义
        scene3DOnly: false,
        sceneModePicker: true,//地图2 3维切换,当scene3DOnly为false时有效
        selectionIndicator: true,
        baseLayerPicker: false, //地图选择
        navigationHelpButton: false,//右上角帮助按钮
        fullscreenButton: false,//全屏按钮
        navigationInstructionsInitiallyVisible: false,
        timeline: false,//时间线
        infoBox: true,//弹窗信息
        geocoder: false,//搜索栏
        navigationInstructionsInitiallyVisible: false,

        // imageryProvider: new Cesium.TileMapServiceImageryProvider({
        //     url: Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
        // })
        // imageryProvider: new Cesium.TileMapServiceImageryProvider({
        //     url: Cesium.buildModuleUrl('http://192.168.39.122:3002/NaturalEarthII')
        // })
        // imageryProvider: new Cesium.GoogleEarthEnterpriseImageryProvider({
        //     url: 'http://192.168.39.122:3002/dongguan'
        // })

    });

    //去除版权信息
    viewer._cesiumWidget._creditContainer.style.display = "none";

    //基于太阳或月亮的位置启用照明，明暗会随着一天的时间变化而变化
    viewer.scene.globe.enableLighting = true;

    //显示cesium画板，可以查看帧率等
    viewer.extend(Cesium.viewerCesiumInspectorMixin);

    //地形遮挡效果开关，打开后地形会遮挡看不到的区域
    // viewer.scene.globe.depthTestAgainstTerrain = true;

    scene = viewer.scene;
    canvas = viewer.canvas;

}

function initDatas() {

    // loadGltf();
    loadTile(); //加载3dtile模型

}

function testVideoFusionWithEntityApi() {
    isTestVideoFusionWithEntityApi = true;
    // let log = 113.78184887;
    // let lat = 23.00039352;

    let video = document.getElementById("video");
    // let canvas = document.getElementById("canvas-test");
    videoMaterial = new Cesium.ImageMaterialProperty({
        image: video
        //image: canvas // canvas似乎无效？
    });
    let entity = viewer.entities.add({
        rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(log, lat, log + 0.0002, lat + 0.0002),
            classificationType: Cesium.ClassificationType.BOTH,
            material: videoMaterial
        }
    });

    // polygon与rectangle都可以
    // let entity = viewer.entities.add({
    //     polygon: {
    //         // hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray([114.25, 30.34, 114.30, 30.34, 114.30, 30.36, 114.25, 30.36])),
    //         hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray([log, lat, log + 0.0002, lat, log + 0.0002, lat + 0.0002, log, lat + 0.0002])),
    //         classificationType: Cesium.ClassificationType.BOTH,
    //         material: videoCanvas
    //     }
    // });

}

function testVideoFusionWithPrimitiveApi() {
    isTestVideoFusionWithPrimitiveApi = true;
    // let log = 113.78184887;
    // let lat = 23.00039352;

    var video = document.getElementById("video");

    videoAppearance = new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
            fabric: {
                type: "Image",
                uniforms: {
                    image: ""
                    // image: video // 这样做是无效的 
                },
            },
        }),
        renderState: {
            depthTest: {
                enabled: true //是否开启深度测试
            },
            // depthMask: false,
            //blending: Cesium.BlendingState.DISABLED,  //混合
        }
    });

    videoAppearance.material.uniforms.image = video;

    let instance = new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(log, lat, log + 0.0002, lat + 0.0002),
            // vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            // vertexFormat: Cesium.VertexFormat.POSITION_ONLY
            height: 19 //离地高度,为了不被模型遮挡，需要一定高度
        })
    });
    let primitive = new Cesium.Primitive({
        geometryInstances: instance,
        appearance: videoAppearance
    });
    scene.primitives.add(primitive);
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(log + 0.0001, lat + 0.0001), 50));


}

function testVideoFusionWithPrimitiveApi2() {
    isTestVideoFusionWithPrimitiveApi = true;
    // let log = 113.78184887;
    // let lat = 23.00039352;

    var video = document.getElementById("video");

    videoAppearance = new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
            fabric: {
                type: "Image",
                uniforms: {
                    image: ""
                    // image: video // 这样做是无效的 
                },
            },
        }),
        renderState: {
            depthTest: {
                enabled: false//深度测试，在GroundPrimitive下此设置无效
            }
        }
    });

    videoAppearance.material.uniforms.image = video;

    let instance = new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(log, lat, log + 0.0002, lat + 0.0002),
             vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            // vertexFormat: Cesium.VertexFormat.POSITION_ONLY
            height: 378 //离地高度，在GroundPrimitive下此设置无效
        })
    });
    let primitive = new Cesium.GroundPrimitive({//GroundPrimitive的话会紧贴地面
        geometryInstances: instance,
        classificationType: Cesium.ClassificationType.BOTH,
        appearance: videoAppearance
    });
    scene.primitives.add(primitive);
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(log + 0.0001, lat + 0.0001), 80));

}

function loadTile() {
    var tileset = new Cesium.Cesium3DTileset({
        // url: 'http://192.168.39.122:3002/gxx-3dtile/tileset.json'
        // url: 'http://192.168.39.122:3002/chengbao-3dtile/tileset.json'
        url: '../assets/3dtile/chengbao-3dtile/tileset.json'
    });
    viewer.scene.primitives.add(tileset);

    //3dtile加载完成后执行,比如调整高度，将相机移动过去
    tileset.readyPromise.then(function (tileset) {
        console.log("3dtile load finished");
        // 定位到3dtiles的位置
        //viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -20, 0));

        //调整到要离地的高度
        let height=18;
        //计算tileset的绑定范围
        let boundingSphere=tileset.boundingSphere;
        //计算中心点位置
        let cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        //计算中心点位置的地表坐标
        let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
        //偏移后的坐标
        let offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude,height);
        //得到偏移矩阵
        let translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

    });
    var defaultStyle = new Cesium.Cesium3DTileStyle({
        color: "color('white')",//可以设置模型原色，但设置为white好像不起效，其他颜色还是能生效的
        show: true
    });
    tileset.style = defaultStyle;

     viewer.zoomTo(tileset);

}



function loadGltf() {
    var modelEntity = viewer.entities.add({
        //  position: Cesium.Cartesian3.fromDegrees(113.68553638, 22.91705132),-100.0, 20.0
        position: Cesium.Cartesian3.fromDegrees(-100.0, 20.0, 1000000),
        model: {
            //dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
            uri: '../res/model/city.gltf',
            scale: 2000.0
        }
    });
    viewer.zoomTo(modelEntity);
}

function addPrimitive() {
    var appearance = new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
            fabric: {
                type: "Image",
                uniforms: {
                    image: "../res/image/note.jpg",
                    // image :getCustomTexture()

                },
            },
        }),
        renderState: {
            depthTest: {
                enabled: false
            },
            // depthMask: false,
            // blending: Cesium.BlendingState.ADDITIVE_BLEND,  //混合
        }
    });

    var instance = new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
            // rectangle: Cesium.Rectangle.fromDegrees(113.68553638 - 0.1, 22.91705132 - 0.1, 113.68553638 + 0.1, 22.91705132 + 0.1),
            rectangle: Cesium.Rectangle.fromDegrees(113.78, 23.0, 113.78 + 0.01, 23.0 + 0.01),

            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            height: 0,
            // vertexFormat: Cesium.VertexFormat.POSITION_ONLY
        }),
        // modelMatrix : Cesium.Matrix4.multiplyByTranslation(
        //     Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(-100.0, 40.0)),
        //     new Cesium.Cartesian3(0.0, 0.0, 450000.0),
        //     new Cesium.Matrix4()
        // )
    });
    let primitive = new Cesium.Primitive({
        geometryInstances: instance,
        appearance: appearance
    });
    scene.primitives.add(primitive);
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(113.78, 23.0), 100));

}

function initEvent() {

    canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
    canvas.onclick = function () {
        canvas.focus();
    };
    var ellipsoid = viewer.scene.globe.ellipsoid;

    // disable the default event handlers
    scene.screenSpaceCameraController.enableRotate = false;
    scene.screenSpaceCameraController.enableTranslate = false;
    scene.screenSpaceCameraController.enableZoom = false;
    scene.screenSpaceCameraController.enableTilt = false;
    scene.screenSpaceCameraController.enableLook = false;

    var startMousePosition;
    var mousePosition;
    var flags = {
        looking: false,
        moveForward: false,
        moveBackward: false,
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false
    };

    var handler = new Cesium.ScreenSpaceEventHandler(canvas);

    handler.setInputAction(function (movement) {
        flags.looking = true;
        mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction(function (movement) {
        mousePosition = movement.endPosition;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (position) {
        flags.looking = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    function getFlagForKeyCode(keyCode) {
        switch (keyCode) {
            case 'W'.charCodeAt(0):
                //return 'moveForward';
                return 'moveUp';
            case 'S'.charCodeAt(0):
                // return 'moveBackward';
                return 'moveDown';
            case 'Q'.charCodeAt(0):
                //return 'moveUp';
                return 'moveForward';
            case 'E'.charCodeAt(0):
                //return 'moveDown';
                return 'moveBackward';
            case 'D'.charCodeAt(0):
                return 'moveRight';
            case 'A'.charCodeAt(0):
                return 'moveLeft';
            default:
                return undefined;
        }
    }

    document.addEventListener('keydown', function (e) {
        var flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = true;
        }
    }, false);

    document.addEventListener('keyup', function (e) {
        var flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = false;
        }
    }, false);

    viewer.clock.onTick.addEventListener(function (clock) {
        var camera = viewer.camera;

        if (flags.looking) {
            var width = canvas.clientWidth;
            var height = canvas.clientHeight;

            // Coordinate (0.0, 0.0) will be where the mouse was clicked.
            var x = (mousePosition.x - startMousePosition.x) / width;
            var y = -(mousePosition.y - startMousePosition.y) / height;

            var lookFactor = 0.05;
            camera.lookRight(x * lookFactor);
            camera.lookUp(y * lookFactor);
        }

        // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
        var cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
        var moveRate = cameraHeight / 100.0;

        if (flags.moveForward) {
            camera.moveForward(moveRate);
        }
        if (flags.moveBackward) {
            camera.moveBackward(moveRate);
        }
        if (flags.moveUp) {
            camera.moveUp(moveRate);
        }
        if (flags.moveDown) {
            camera.moveDown(moveRate);
        }
        if (flags.moveLeft) {
            camera.moveLeft(moveRate);
        }
        if (flags.moveRight) {
            camera.moveRight(moveRate);
        }
    });
}

function showPosition() {
    // 设置鼠标位置经纬度\视角高度实时显示
    var longitude_show = document.getElementById('longitude_show');
    var latitude_show = document.getElementById('latitude_show');
    var altitude_show = document.getElementById('altitude_show');

    //具体事件的实现  
    var ellipsoid = viewer.scene.globe.ellipsoid;
    var handler = new Cesium.ScreenSpaceEventHandler(canvas);

    //设置鼠标移动事件的处理函数，这里负责监听x,y坐标值变化
    handler.setInputAction(function (movement) {
        //捕获椭球体，将笛卡尔二维平面坐标转为椭球体的笛卡尔三维坐标，返回球体表面的点  
        var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        if (cartesian) {
            //将笛卡尔三维坐标转为地图坐标（弧度）  
            var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            //将地图坐标（弧度）转为十进制的度数  
            var lat_String = Cesium.Math.toDegrees(cartographic.latitude).toFixed(8);
            var log_String = Cesium.Math.toDegrees(cartographic.longitude).toFixed(8);
            // 获取相机的海拔高度作为视角高度/km
            let alti_String = (viewer.camera.positionCartographic.height).toFixed(2);
            longitude_show.innerHTML = log_String;
            latitude_show.innerHTML = lat_String;
            altitude_show.innerHTML = alti_String;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    //设置鼠标滚动事件的处理函数，这里负责监听高度值变化
    handler.setInputAction(function (wheelment) {
        // let height = Math.ceil(viewer.camera.positionCartographic.height);
        let height = Math.ceil(viewer.camera.positionCartographic.height).toFixed(2);
        altitude_show.innerHTML = height;
    }, Cesium.ScreenSpaceEventType.WHEEL);
}