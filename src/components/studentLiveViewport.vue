<template>
    <div class="student-box">
        <div v-for="(item,index) in stream" :key="index" :id="item.id" class="student-viewport-item">
            <!--视频频关闭样式展示-->
            <div class="video-close-style" v-if="item.videoCloseMute || item.videoMuteDisable">
                <img src="../assets/img/hmc-close-sxt.png">
            </div>

            <div class="packets-lost-rate user-position">
                <div>{{item.nickName||item.userId}}</div>
                <div>丢包率:{{packetsLostRate[index]||'0%'}}</div>
                <img class="mciphone-close-icon" src='../assets/img/hmc-close-maciphone.png' v-if="item.audioMuteDisable"/>
            </div>
        </div>
    </div>
</template>

<script>
import eventBus from '../utils/eventBus'
import { mapActions,mapState } from 'vuex'
import { getRemoteVideo,publishStream,unpublishStream,getTransportStats } from '../utils/SDKInstanceMethods/TRTCInstanceMethod'
import { groupMemberProfile_ } from '../utils/SDKInstanceMethods/TIMInstanceMethod'
export default {
    data() {
        return {
            stream: [], //音频流
            packetsLostRate:[],
            intervalTimer:null
        };
    },
    props:{
        liveMode:{
            type: String,
            default: ''
        }
    },
    computed: {
        ...mapState(['USER_INFO','PLAYING_STREAM','LIVING'])
    },
    created() {
        // 学生设置音频流
        eventBus.$on('setting-loc-stream-other',function(newLocStream){
            let localStream = null; //本地流
            this.stream.forEach(item =>{
                if(item.stream.getUserId() === this.USER_INFO.userId){
                    localStream = item.stream
                }
            })
            
            let videoTrack  = newLocStream.getVideoTrack();
            let audioTrack  = newLocStream.getAudioTrack();
            let replaceVideo = localStream.replaceTrack(videoTrack)
            let replaceAudio = localStream.replaceTrack(audioTrack)

            Promise.all([replaceVideo,replaceAudio]).then(res=>{
                // 替换流成功后通知setting(nav)组件销毁创建的本地流
                this.$parent.$parent.$parent.unpublishSetLocStream()
            })

        }.bind(this))

        // 讲师控制学生*视频状态关闭开启 成功后(自定义消息通知)回调
        eventBus.$on('video-switch-listener',function(options){
            let currentUserInfo = options;
            this.stream.forEach(item =>{
                if(item.userId === currentUserInfo.userId){
                    item.videoMuteDisable = !options.status
                    
                    groupMemberProfile_([currentUserInfo.userId],profile=>{
                        this.$notify({
                            title: '视频状态通知',
                            message: options.status?`管理员恢复了${ profile[0].nick || currentUserInfo.userId }的视频窗口`:`管理员关闭了${ profile[0].nick || currentUserInfo.userId }的视频窗口`,
                            type:  options.status?'success':'warning'
                        });
                    })
                }
            })
        }.bind(this))

        // 讲师控制学生*音频状态关闭开启 成功后(自定义消息通知)回调
        eventBus.$on('audio-switch-listener',function(options){
            let currentUserInfo = options;
            this.stream.forEach(item =>{
                if(item.userId === currentUserInfo.userId){
                    item.audioMuteDisable = !options.status

                    groupMemberProfile_([currentUserInfo.userId],profile=>{
                        this.$notify({
                            title: '音频状态通知',
                            message: options.status?`管理员恢复了${ profile[0].nick || currentUserInfo.userId }的麦克风`:`管理员关闭了${ profile[0].nick || currentUserInfo.userId }的麦克风`,
                            type:  options.status?'success':'warning'
                        });
                    })
                }
            })
        }.bind(this))
    },
    methods: {
        ...mapActions(['updateLeaveRomUser','updateAddPlayingStream','updateRemovePlayingStream']),
        
        //存储获取到的所有远端流
        async sendRemoteStream(stream, isPushStream = false) {

            await groupMemberProfile_([stream.getUserId()], async profile=>{
                await this.stream.push({
                    id: `id-${stream.getId()}`,
                    stream: stream,
                    userId:stream.getUserId(),
                    nickName: profile[0].nick,
                    videoCloseMute:false,//是否关闭视频轨道
                });
                
                this.intervalTimer = setInterval(() => {
                    // 获取当前所有远端流的视频统计数据
                    getRemoteVideo(stats => {
                        let packetsLostRate = [];
                        for (const key in stats) {
                            if (stats.hasOwnProperty(key)) {
                                const element = stats[key];
                                const currentPacketsLostRate = ((element.packetsLost/(element.packetsReceived +element.packetsLost)).toFixed(2))+'%'
                                packetsLostRate.push(currentPacketsLostRate)
                            }
                        }
                        this.packetsLostRate = packetsLostRate
                    });
                }, 2000);

                if(isPushStream === 'pushStream') {
                    publishStream(stream,stream =>{
                        stream.play(`id-${stream.getId()}`)
                    })
                }else{
                    stream.play(`id-${stream.getId()}`).catch((e) => {
                        if (e.getCode() === 0x4043) {
                            stream.resume()
                        }
                    });
                }
            })

        },

        // 讲师操作 学员上麦(播放指定流)/下麦
        handleOpenLive(userId,status){
            if(!status){
                this.stream.forEach( item =>{
                    if(userId === item.userId){
                        //上麦--播放指定用户音频流
                        item.stream.play(`id-${item.stream.getId()}`).then(() => {

                            let options = [{
                                id: `id-${item.stream.getId()}`,
                                stream: item.stream,
                                userId:item.stream.getUserId()
                            }];
                            this.updateAddPlayingStream(options)

                            // 通知userDrawer组件该用户上麦成功
                            eventBus.$emit('studentLiveSucc',item.userId,'top')
                        })
                        .catch((err)=>{
                            console.log(err)
                        })                   
                    }
                })
            }else{
                this.stream.forEach( item =>{
                    if(userId === item.userId){
                        let options = [{
                            id: `id-${item.stream.getId()}`,
                            stream: item.stream,
                            userId:item.stream.getUserId()
                        }];
                        this.updateRemovePlayingStream(options)
                        //下麦
                        item.stream.stop()
                        // 通知userDrawer组件该用户下麦成功
                        eventBus.$emit('studentLiveSucc',item.userId,'down')                    
                    }
                })
            }
            
            let hasUser = this.stream.find( item => item.userId == userId )
            // 用户已经不在房间 （由于tic没监听到）
            if(!hasUser){
                this.$notify({
                    title: '上麦提示',
                    message: `${userId}同学可能已经退出了直播间`,
                    type: 'warning'
                });
                // 不在直播间用户退群 通知白板组件进行退群操作
                eventBus.$emit('timQuitGroup',userId)
                // 将该用户从缓存中删除
                this.updateLeaveRomUser([userId])
            }
        },

        // 讲师操作 学员*视频开关控制
        handlerVideoSwitch(userId,status,videoStatus){
            if(status){ 
                //非禁用状态
                this.stream.forEach( item =>{
                    if(item.userId === userId){
                        if(!videoStatus){
                            // 禁用当前学生视频轨道
                            let videoMuteDisable = item.stream.muteVideo();
                            if(videoMuteDisable){
                                item.videoMuteDisable = true
                                // 视频禁用成功
                                eventBus.$emit('student-video-status',item.userId,videoMuteDisable)
                            }
                        }else{
                            //启用当前学生视频轨道
                            let videoMuteDisables = item.stream.unmuteVideo()
                            if(videoMuteDisables){
                                item.videoMuteDisable = false
                                // 视频启用成功
                                eventBus.$emit('student-video-status',item.userId,false)
                            }
                        }
                    }
                })
            }
        },

        // 讲师操作 学员*音频开关控制
        handlerAudioSwitch(userId,status,audioStatus){

            if(status){ 
                //非禁用状态
                this.stream.forEach( item =>{
                    if(item.userId === userId){
                        if(!audioStatus){
                            // 禁用当前学生视频轨道
                            let audioMuteDisable = item.stream.muteAudio();
                            if(audioMuteDisable){
                                item.audioMuteDisable = true
                                // 视频禁用成功
                                eventBus.$emit('student-audio-status',item.userId,audioMuteDisable)
                            }
                        }else{
                            //启用当前学生视频轨道
                            let audioMuteDisable = item.stream.unmuteAudio()
                            if(audioMuteDisable){
                                item.audioMuteDisable = false
                                // 视频启用成功
                                eventBus.$emit('student-audio-status',item.userId,false)
                            }
                        }
                    }
                })
            }
        },

        //监听音视频禁用开启状态回调
        muteState(userId,eventName){
            this.stream.forEach(item =>{
                if(item.userId === userId){
                    if(eventName==='禁用视频'){
                        this.videoCloseMute = true
                    }else if(eventName==='启用视频'){
                        this.videoCloseMute = false
                    }
                }
            })
        },

        // 删除指定流
        async deleteStream(stream) {
            await stream.stop();
            await stream.close();

            this.stream.forEach((item, index) => {
                if (item.id.indexOf(stream.getId()) != -1) {
                    this.stream.splice(index, 1);
                }
            });
        },

        // 一对一模式 上课后学生视口推流
        publishStream(){
            this.stream[0].stream.stop()
            publishStream(this.stream[0].stream,stream =>{
                stream.play(`id-${stream.getId()}`)
            })
        },

        // 一对一模式 下课后学生视口取消推流
        unpublishStream(){
            this.stream[0].stream.stop()
            unpublishStream(this.stream[0].stream,stream =>{
                stream.play(`id-${stream.getId()}`)
            })
        }
    },
    beforeDestroy(){
        clearInterval(this.intervalTimer)
        eventBus.$off('studentLiveSucc')
        eventBus.$off('timQuitGroup')
        eventBus.$off('student-video-status')
        eventBus.$off('student-audio-status')
    }
};
</script>
<style lang='less' scoped>
.student-box {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 0;
  margin:0;
  display: flex;
  justify-content: center;
  
  .student-viewport-item{
      position: relative;
      height: 100%;
      width:100%;
      overflow: hidden;
      margin: 0;
    .video-close-style{
        z-index: 1;
        position: absolute;
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
    .packets-lost-rate{
        z-index: 1;
        position: absolute;
        height: 15px;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 5px;
        color: #eee;
        font-size: 8px;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.62) 100%);
        .mciphone-close-icon{
            width: 10px;
            height: 10px;
        }
    }
    .stream-userId{
        left: 0 !important;
    }
    
    .user-position{
        bottom: 0px;
        height: 30px;
        line-height: 30px;
        font-size: 11px;
    }
  }
}

.live-size div {
    max-width: 200px;
    max-height: 120px;
}
</style>