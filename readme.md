# cesium示例项目
* 本工程主要演示了cesium的一些基本操作，并结合[ffmpeg wasm](https://github.com/huweijian5/wasm-video-player) 及[流协议解析websocket服务](https://github.com/huweijian5/WebSocketStreamProtocolParseServer)实现取流解码的过程

* 其中主要功能如下：
    * 自定义rgb纹理数据，动态更新纹理数据
    * 视频融合
    * 深度测试
    * 自定义材质
    * 屏幕空间位置的拾取
    * 键盘键控制

## 注意
* 由于3dtile模型数据过大，无法上传，故需要用户自行寻找并下载后放到assets/3dtile里
* 首次使用需在根目录执行：  npm install