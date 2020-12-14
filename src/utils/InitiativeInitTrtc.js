import TRTC from "trtc-js-sdk";

class TrtcClass {
    constructor(options) {
        this.sdkAppId = options.sdkAppId;
        this.userSig = options.userSig;
        this.userId = options.userId;
        this.client = null; //客户端服务
        this.MicrophonesArr = []; //用户麦克风设备数组集合
        this.camerasArr = []; //用户摄像头设备数组集合
        this.speakersArr = []; //用户扬声器设备
        this.localStream = null; ////本地流
    }

    // 检查设备环境 获取设备列表
    /***
     * @param checkStep 可选值 'getCameras','getMicrophones','getSpeakers'
     */
    checkDevicesEnv(checkStep = false) {
        return new Promise((resolve, reject) => {
            TRTC.checkSystemRequirements().then(result => {
                if (!result) {
                    alert('您的浏览器不兼容此应用！\n建议下载最新版Chrome浏览器');
                    window.location.href = 'http://www.google.cn/chrome/';
                } else {
                    // 用户授权摄像头、麦克风设备
                    // *****注意测试环境下此API(navigator.mediaDevices.getUserMedia)只在开启本地服务的设备上有效
                    navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    })
                    .then(stream => {
                        // console.log('已点击允许,开启成功', stream);

                        // 获取媒体输入输出设备列表。
                        TRTC.getDevices()
                        .then(devices => {
                            devices.forEach(item => {
                                // console.log('媒体输入输出设备列表↓↓↓: ',item);
                            });
                        })
                        .catch(error => console.error('getDevices error observed ', error));

                        let getCameras = TRTC.getCameras(); // 获取摄像头设备列表。
                        let getMicrophones = TRTC.getMicrophones(); //获取麦克风设备列表
                        let getSpeakers = TRTC.getSpeakers(); // 获取扬声器设备
                        if (!checkStep) { // 同时检测返回设备集合
                            Promise.all([getCameras, getMicrophones, getSpeakers]).then(result => {
                                this.camerasArr = result[0];
                                this.MicrophonesArr = result[1];
                                this.speakersArr = result[2];
                                resolve(result)
                            })
                        } else { //分步骤检测 按传入‘checkStep’设备名称检测
                            if (checkStep === '摄像头') {
                                getCameras.then(res => {
                                    this.camerasArr = res;
                                    resolve(res)
                                })
                            } else if (checkStep === '扬声器') {
                                getSpeakers.then(res => {
                                    this.speakersArr = res;
                                    resolve(res)
                                })
                            } else if (checkStep === '麦克风') {
                                getMicrophones.then(async res => {
                                    this.MicrophonesArr = res; //麦克风设备列表
                                    resolve(res)
                                })
                            }
                        }
                    })
                    .catch(error=>{
                        console.log(`错误===>：${error}`)
                        reject(error)
                    })
                }
            });

            process.env.NODE_ENV ==='production'? TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.NONE) : TRTC.Logger.setLogLevel(TRTC.Logger.LogLevel.DEBUG);
            TRTC.Logger.enableUploadLog();
        })
    }

    clientInit(userId) {
        this.client = TRTC.createClient({
            mode: 'rtc',
            sdkAppId:this.sdkAppId,
            userId:userId,
            userSig:this.userSig
        });
    }


    /**
     * @param deviceIdObj 摄像头麦克风设备ID对象
     * deviceIdObj = {
     *      cameraId:'xxx',
     *      microphoneId:'xxx',
     *      mirror: true //视频镜像
     * }
     */
    async join(deviceIdObj = {}, callback) {

        if(!deviceIdObj.switchMirror)
        await this.client.join({
            roomId: this.roomId
        });
        
        this.initLocalStream(deviceIdObj, callback)
    }

    // 初始化本地流
    async initLocalStream(deviceIdObj, callback) {
        let localStreamParams = {
            audio: true,
            video: true,
            userId: this.userId,
            mirror: false
        };
        if (deviceIdObj.audio != undefined) localStreamParams.audio = deviceIdObj.audio;
        if (deviceIdObj.video != undefined) localStreamParams.video = deviceIdObj.video;
        if (deviceIdObj.mirror != undefined) localStreamParams.mirror = deviceIdObj.mirror;
        if (deviceIdObj.cameraId) localStreamParams.cameraId = deviceIdObj.cameraId;
        if (deviceIdObj.microphoneId) localStreamParams.microphoneId = deviceIdObj.microphoneId;
        // localStreamParams
        //根据是否传入（deviceIdObj）设备id来创建有无麦克风/摄像头本地流 Stream 对象
        this.localStream = await TRTC.createStream(localStreamParams);
        // this.localStream.setVideoProfile('1080p')
        // 初始化本地音视频流对象
        await this.localStream.initialize()
            .then(() => {
                callback.call(window,this.localStream)
            })
            .catch(error => {
                console.error('初始化本地流失败 ', error);
            })
    }
}

export default TrtcClass;