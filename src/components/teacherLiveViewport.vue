<template>
    <div class="teacher-live-viewport" ref='liveViewport' :class="{'teacher-viewport-bg':!Object.keys(localStream).length}" id="teacher-live-viewport">
        <!--已上课并获取到老师音频流-->
        <div v-if="Object.keys(localStream).length">

            <!--摄像头/麦克风控制 center-->
            <div class="live-control" v-if="localStream.getUserId() === USER_INFO.userId">
                <div class="control-box" @click="handlerVideoControl(videoControl)">
                    <img v-if='videoControl' :src="require('../assets/img/shexiangtou.png')" title="打开视频"/>
                    <img v-else :src="require('../assets/img/hmc-close-sxt.png')" title="关闭视频"/>
                </div>
                <div class="control-box" @click="handlerAudioCotrol(audioCotrol)" v-if="!screenShareStatus">
                    <img v-if='audioCotrol' :src="require('../assets/img/macIphone.png')" title="打开音频"/>
                    <img v-else :src="require('../assets/img/hmc-close-maciphone.png')" title="关闭音频"/>
                </div>
                <div class="control-box" v-else @click="handlerCloseScreenShare">
                    <img src="../assets/img/close-screen-share.png" title="关闭屏幕共享" style="height:16px;width:20px">
                </div>
            </div>

            <!-- 学员放大老师直播视口操作 -->
            <div class="live-control live-big-box" v-else>
                <div class="control-box live-big" @click="handlerFullScreen">
                    <img src="../assets/img/live-big.png" title="放大显示">
                </div>
            </div>

            <!--音频流音量展示 bottom-->
            <div class="live-name">
                <div>{{userNickName}}</div>
                <div class="live-voice">
                    <div v-if='audioCotrol' class='voice-box'>
                        <img src="../assets/img/hmc-open-maciphone.png">
                        <div class="voice-level">
                            <div :class="{green:this.voice>=1}"></div>
                            <div :class="{green:this.voice>=2}"></div>
                            <div :class="{green:this.voice>=3}"></div>
                            <div :class="{green:this.voice>=4}"></div>
                            <div :class="{green:this.voice>=5}"></div>
                        </div>
                    </div>

                    <div v-else class='voice-box'>
                        <img src="../assets/img/hmc-close-maciphone.png">
                    </div>
                </div>
            </div>
            <!--视频频关闭样式展示-->
            <div class="video-close-style" v-if='!videoControl'>
                <img src='../assets/img/hmc-close-sxt.png'>
            </div>
        </div>
    </div>

</template>

<script>
import screenfull from "screenfull";
import { createCustomMessage,groupMemberProfile_ } from "../utils/SDKInstanceMethods/TIMInstanceMethod";
import { publishStream,unpublishStream,getTransportStats,screenSharingStopped } from "../utils/SDKInstanceMethods/TRTCInstanceMethod";
import EventBus from '../utils/eventBus'
import { mapState } from "vuex";
import { define } from 'mime';

export default {
  components: {},
  data() {
    return {
      userNickName:'',
      voiceTimer:null,
      localStream: {},
      screenShareStream:{},
      transportStatsTimer:null,
      level: 0,
      voice: 0,
      videoControl:true,
      audioCotrol:true,
      isPushing:false, //本地流发布
      screenShareStatus: false
    };
  },

  props:{
      liveMode:{
        type: String,
        default: ''
      }
  },

  computed: {
    ...mapState(['USER_INFO','LIVING']),
  },

  created() {
    // 讲师设置音频流事件
    EventBus.$on('setting-loc-stream',async function(newLocStream){
        
        if(this.LIVING == 1){
            let videoTrack  = newLocStream.getVideoTrack();
            let audioTrack  = newLocStream.getAudioTrack();
            let replaceVideo = this.localStream.replaceTrack(videoTrack)
            let replaceAudio = this.localStream.replaceTrack(audioTrack)

            Promise.all([replaceVideo,replaceAudio]).then(res=>{
                // 替换流成功后通知setting(nav)组件销毁创建的本地流
                this.$parent.$parent.$parent.unpublishSetLocStream()
            })
        }else if(this.LIVING == 3 || this.LIVING == 2 || this.LIVING == 4){
            await this.$parent.$parent.$parent.unpublishSetLocStream()
            await this.localStream.stop()
            this.localStream = newLocStream
            this.localStream.play('teacher-live-viewport')
        }

    }.bind(this))

    // 学生(非讲师)身份根据讲师对其音视频流的设置进行同步调整讲师视口ui
    EventBus.$on('teacher-video-control',function(options){
        this.videoControl = !options.videoControl
    }.bind(this))
    EventBus.$on('teacher-audio-control',function(options){
        this.audioCotrol = !options.audioCotrol
    }.bind(this))

    // 屏幕分享
    EventBus.$on('pushScreen',screenShareStream =>{
        // 如果正在推流, 先停止发布流
        if(this.isPushing){
            this.stopPush(this.screenShareStatus ? this.screenShareStream : this.localStream,() => {
                this.publishLocalStream(screenShareStream);
            });
        }else{
            this.localStream.stop()
            this.publishLocalStream(screenShareStream);
        }

        // 屏幕分享流监听屏幕分享停止事件(在 Web 端，用户还有可能通过浏览器自带的按钮取消屏幕分享，因此屏幕分享流需要监听屏幕分享停止事件。)
        screenSharingStopped(screenShareStream,()=>{
            this.handlerCloseScreenShare()
        })
    })
  },

  watch: {
    'localStream'(val){
        // 音频采集
        if(Object.keys(val).length) {
            this.macPhoneStreamVolume()
            groupMemberProfile_([this.localStream.getUserId()], Profile=>{
                return this.userNickName = Profile[0].nick || Profile[0].userID
            })
        }else{
             clearInterval(this.voiceTimer)

        }
    },
    // 监听麦克风声音
    level(value) {
      // console.log(value)
      if (value >= 400 && value <= 800) {
        // 显示一格音谱
        this.voice = 1;
      } else if (value >= 801 && value <= 1200) {
        this.voice = 2;
        // 显示二格音谱
      } else if (value >= 1201 && value <= 1600) {
        this.voice = 3;
        // 显示三格音谱
      } else if (value >= 1601 && value <= 2000) {
        this.voice = 4;
        // 显示四格音谱
      } else if (value >= 2000) {
        this.voice = 5;
        // 显示五格音谱
      } else {
        this.voice = 0;
      }
    },
    // 监听讲师修改直播状态
    'LIVING'(status){
        // status 直播状态 1:直播中 3:未开始
        if(status == 3 || status == 4 || status == 2){ //下課
            unpublishStream(this.screenShareStatus ? this.screenShareStream : this.localStream,()=>{
                this.isPushing = false
            })
        }else if(status == 1){ //上課
            this.eventPublishStream()
        }
    },
  },

  methods: {
    // this.isPushing = true; // 本地音频正在推流

    play(localStream) {
      this.localStream = localStream;
      this.screenShareStream = {};
      // 播放本地流音频
      localStream.play("teacher-live-viewport")
        .then(() => {
            if(this.LIVING === 1 && this.USER_INFO.identity=== 'teacher'){
                // 当前为直播状态重新发布本地流
                this.eventPublishStream()
            }
        })
        .catch(e => {
            // console.error(e);
            if (e.getCode() === 0x4043) {
                localStream.resume()
            }
        });
    },

    // 发布本地流
    async eventPublishStream(){
        trtcClient.publish(this.screenShareStatus ? this.screenShareStream : this.localStream).then(stream =>{
            this.isPushing = true
            // 获取延时
            this.transportStatsTimer = setInterval(function(){
                getTransportStats(status => {
                    if(status.rtt>=1000){
                        let delayed = (status.rtt/1000)+'s';
                        this.$emit('getTransportStats',delayed)
                    }else{
                        this.$emit('getTransportStats',status.rtt+'ms')
                    }
                });
            }.bind(this),3000)

        })
    },
    // 音频采集 获取音频流麦克风输出音量
    macPhoneStreamVolume(status = true) {
        this.voiceTimer = setInterval(() => {
            const level = !this.screenShareStatus? this.localStream.getAudioLevel() :　this.screenShareStream.getAudioLevel();
            this.level = parseInt(level * 10000);
        }, 200);   
      
    },

    // 视频控制
    handlerVideoControl(status){
        if(!status){
            this.videoControl = true
            // 启用视频轨道
            if(this.screenShareStatus){
                this.screenShareStream.unmuteVideo()
            }else{
                this.localStream.unmuteVideo()
            }
            // 发送群组自定义消息
            createCustomMessage({msgType:'teacherVideoControl',videoControl:status})
        }else{
            this.videoControl = false
            // 禁用视频轨道
            if(this.screenShareStatus){
                this.screenShareStream.muteVideo()
            }else{
                this.localStream.muteVideo()
            }
            // 发送群组自定义消息
            createCustomMessage({msgType:'teacherVideoControl',videoControl:status})
        }
    },

    // 音频控制
    handlerAudioCotrol(status){
        if(!status){
            this.audioCotrol = true
            // 启用音频轨道
            if(this.screenShareStatus){
                this.screenShareStream.unmuteAudio()
            }else{
                this.localStream.unmuteAudio()
            }
            // 发送群组自定义消息
            createCustomMessage({msgType:'teacherAudioCotrol',audioCotrol:status})
        }else{
            this.audioCotrol = false
            // 禁用音频轨道
            if(this.screenShareStatus){
                this.screenShareStream.muteAudio()
            }else{
                this.localStream.muteAudio()
            }
            // 发送群组自定义消息
            createCustomMessage({msgType:'teacherAudioCotrol',audioCotrol:status})
        }
    },

    /**
     * 结束推流
    */
    stopPush(stream,callback) {
        unpublishStream(stream,()=>{
            this.isPushing = false;
            this.screenShareStatus ? this.screenShareStream.close() : this.localStream.close()
            clearInterval(this.voiceTimer);
            if (Object.prototype.toString.call(callback) === '[object Function]') callback();
        })
    },

    //播放本地屏幕分享流
    publishLocalStream(screenShareStream) {
        screenShareStream.initialize()
        .then(() => {
            this.screenShareStatus = true
            this.screenShareStream = screenShareStream;
            // 本地流播放
            screenShareStream.play('teacher-live-viewport')
            // 远端发布
            if(this.LIVING == 1){
                // 发布本地屏幕分享流
                trtcClient.publish(screenShareStream).then(() => {
                    // 本地分享流发布成功
                    this.screenShareStream = screenShareStream;
                    this.macPhoneStreamVolume()
                    this.isPushing = true
                });
            }
        })
        .catch(error => {
            // 用户点击弹窗取消按钮
            this.screenShareStatus = false
            if(this.LIVING == 1){
                publishStream(this.localStream,stream =>{
                    this.isPushing = true;
                    stream.play('teacher-live-viewport')
                })
            }else{
                this.play(this.localStream)
            }
            
        });
    },

    // 关闭屏幕共享
    handlerCloseScreenShare(){
        if(this.isPushing){
            this.stopPush(this.screenShareStream,()=>{
                this.localStream.initialize()
                .then(async ()=>{
                    publishStream(this.localStream,stream =>{
                        this.screenShareStatus = false
                        this.isPushing = true;
                        stream.play('teacher-live-viewport')
                    })
                    
                    // this.handlerVideoControl(false)
                })
                
            });
        }else{
            this.screenShareStream.stop()
            this.localStream.initialize().then(async ()=>{
                await this.play(this.localStream)
                this.screenShareStatus = false
            })
        }
        
    },
    //学员监听老师远端流移除事件回调
    deleteStream(removeStream){
        if( removeStream.getUserId() === this.USER_INFO.AnchorId ) this.localStream = {},this.isPushing = false;
    },
    //全屏
    handlerFullScreen(){
        if (!screenfull.isEnabled) {
            this.$message({
            message: "不支持全屏",
            type: "warning"
            });
            return false;
        }
        screenfull.toggle(this.$refs.liveViewport);
    }
  },

  beforeDestroy(){
    clearInterval(this.voiceTimer);
    clearInterval(this.transportStatsTimer);
  }
};
</script>
<style lang='less' scoped>
.teacher-live-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #e5e5e5;
  .live-control{
      z-index: 2;
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 120px;
      div{
        display: none;
        background-color:rgba(0,0,0,0);
        width: 33px;
        height: 33px;
        border-radius: 50%;
          img{
              display: none;
              width: 23px;
              height: 23px;
          }
      }
  }

  .live-big-box{
    justify-content: center !important;
    .live-big{
        width: 45px !important;
        height: 45px !important;
        img{
            width: 27px !important;
            height: 27px !important;
        }
    }
  }
  .live-control:hover{
      .control-box{
          display: block;
          background-color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          img{
              display: block;
              cursor: pointer;
          }
          
      }
  }
  .control-box:hover{
    border: 1px solid rgb(204, 204, 204);
  }
  .live-name{
      z-index: 2;
      width: 100%;
      height: 30px;
      position: absolute;
      bottom: 0;
      left: 0;
      color: #f5f5f5;
      background:linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 100%);
      line-height: 30px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      img{
          width: 20px;
          height: 18px;
      }
      .live-voice .voice-box{
          display: flex;
          align-items: center;
          .voice-level{
              display: flex;
              align-items: center;
              div{
                  width: 5px;
                  height: 13px;
                  background-color: #bdbdbd;
                  margin-left: 4px;
                  border-radius: 6px;
              }
          }
      }
  }
  .video-close-style{
      z-index: 1;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      img{
          width: 60px;
          height: 60px;
      }
  }
}
.teacher-viewport-bg:before{
    content: '';
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    margin: auto;
    height: 170px;
    width: 130px;
    background:url('../assets/img/teacher-icon.png') no-repeat;
    background-size: 130px 170px;
}
.green {
  background-color: yellow !important;
}

</style>