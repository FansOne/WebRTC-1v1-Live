import TRTC from "trtc-js-sdk";
import $store from "../../store/index";

// 设置媒体设备
export const settingMediaDevice = function (DeviceTypes) {
    return new Promise((resolve) => {
        let getCameras = TRTC.getCameras(); // 获取摄像头设备列表。
        let getMicrophones = TRTC.getMicrophones(); //获取麦克风设备列表
        let getSpeakers = TRTC.getSpeakers(); // 获取扬声器设备

        if (DeviceTypes === '摄像头') {
            getCameras.then(res => {
                resolve(res)
            })
        } else if (DeviceTypes === '扬声器') {
            getSpeakers.then(res => {
                resolve(res)
            })
        } else if (DeviceTypes === '麦克风') {
            getMicrophones.then(async res => {
                resolve(res)
            })
        }
    })
}

// 创建音视频流
export const createTrtcStream = async function(deviceIdObj, callback){
    let localStreamParams = {
        audio: true,
        video: true,
        userId: $store.state.USER_INFO.userId,
        cameraId: deviceIdObj.cameraId,
        microphoneId: deviceIdObj.microphoneId
    };

    let localStream = await TRTC.createStream(localStreamParams);
    // localStream.setVideoProfile('1080p')
    // 初始化本地音视频流对象
    await localStream.initialize()
    .then(() => {
        callback.call(window,localStream)
    })
    .catch(error => {
        console.error('初始化本地流失败 ', error);
    })
}

//发布本地音视频流(上课)
export const publishStream = function(stream,callback){
    stream.initialize().then(() => {
        // 本地流初始化成功，发布本地流
        trtcClient.publish(stream).then(() => {
            callback(stream)
        });
    });
}

// 取消发布本地流(下课)
export const unpublishStream = function(stream,callback){
    trtcClient.unpublish(stream).then(() => {
        callback(stream)
    });
}

// 远端流(增加)监听
export const subscribedRemoteStream = function(callback){
    // step 1>远端流增加事件，当远端用户发布流后会收到该通知
    trtcClient.on('stream-added', event => {
        const remoteStream = event.stream;
        // const remoteUserId = remoteStream.getUserId();
        console.log('1>远端流增加: ' + remoteStream.getId());

        // step 2>订阅远端音频和视频流
        trtcClient.subscribe(remoteStream)
            .then(() => {
                console.log('2>订阅远端流成功===>');
            })
            .catch((e) => {
                console.error('订阅远端流失败↓↓↓', e);
            });
    });

    // step 3>监听远端流订阅成功事件
    trtcClient.on('stream-subscribed', event => {
        const remoteStream = event.stream;
        // 远端流订阅成功
        console.log('3>远端流订阅成功，准备播放远端音视频流>>>', remoteStream)
        //播放远端音视频流
        callback(remoteStream)
    });

    //远端流更新事件，当远端用户添加、移除或更换音视频轨道后会收到该通知。
    trtcClient.on('stream-updated', event => {
        const remoteStream = event.stream;
        console.log('stream-updated>>>远端用户添加、移除或更换音视频轨道', remoteStream)
    });
}

// 远端流(移除)监听
export const remoteRemoveStream = function(callback) {
    trtcClient.on('stream-removed', event => {
        const remoteStream = event.stream;
        callback(remoteStream)
    });
}

// 远端流音视频禁用开启状态监听
export const subscribedRemoteMute = function(callback){
    // 远端用户禁用音频通知
    trtcClient.on('mute-audio',event =>{
        callback(event.userId,'禁用音频')
    })
    // 远端用户禁用视频通知
    trtcClient.on('mute-video',event =>{
        callback(event.userId,'禁用视频')
    })
    // 远端用户启用音频通知
    trtcClient.on('unmute-audio',event =>{
        callback(event.userId,'启用音频')
    })
    //远端用户启用视频通知
    trtcClient.on('unmute-video',event =>{
        callback(event.userId,'启用视频')
    })
}

// 获取当前网络传输状况统计数据
export const getTransportStats = function(callback){
    trtcClient.getTransportStats().then( status =>{
        callback && callback(status)
    })
}

// 获取当前所有远端流的视频统计数据
export const getRemoteVideo = function(callback){
    trtcClient.getRemoteVideoStats().then( status =>{
        callback && callback(status)
    })
}

// Web 端用户通过浏览器自带的按钮取消屏幕分享停止事件监听
export const screenSharingStopped = function(shareStream,callback){
    shareStream.on('screen-sharing-stopped', () => {
        callback()
    });
}