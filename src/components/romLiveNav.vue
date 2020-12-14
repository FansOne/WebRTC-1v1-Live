<template>
    <div class="nav">
        <div class="nav-left-box">
            <img src="../assets/img/XFLOGO.png">
            <div class="rom-id">
                <span>房间号：</span>
                <span>{{USER_INFO.roomId}}</span>
                <span style="disply:inline-block;padding-left:15px;" v-show="LIVING==1">延时：{{delayed}}</span>
            </div>
            <!-- 计时器 -->
            <div class="timer" v-show="LIVING==1">
                <div ref="startTimer">00:00:00</div>
            </div>
        </div>
        
        <el-popover
          placement="bottom"
          title="简介"
          width="200"
          trigger="hover"
          :content= groupProfile.introduction>
          <div slot="reference" style="padding-top:15px;color:#fff">{{groupProfile.name}}</div>
        </el-popover>
        <div class="nav-right-box">
            <div class="icon-bg icon-hmc" @click="handlerDrawer('花名册')" v-if="USER_INFO.identity !=='student'"> 
                <el-badge :is-dot='raiseHandsTip' class="item">
                    <i class="iconfont icon-huamingce" title="花名册"/>
                    <div class="raise-hands-tip" :class="{'tip-show':raiseHandsTip}">有人举手了</div>
                </el-badge>
            </div>
            <div class="icon-bg" @click="handlerDrawer('课件库')">
                <i class="iconfont icon-bianzubeifen" title="课件库"/>
            </div>
            <div class="icon-bg" @click="handlerDrawer('消息')">
                <i class="iconfont icon-liaotian1" title="消息" style="font-size:19px"/>
            </div>
            <!-- <div class="icon-bg"v-if="USER_INFO.identity !=='student'">
                <img src="../assets/img/layout-icon.png" title="布局切换">
            </div> -->
            <div class="icon-bg screen-share" @click="handlerScreenShare" v-if="USER_INFO.identity !=='student'">
                <i class="iconfont icon-pingmufenxiang" title="屏幕分享" />
            </div>
            <div class="icon-bg" @click="handlerHelpJump">
                <i class="iconfont icon-qiuzhu" title="求助"/>
            </div>
            <div class="icon-bg" @click="dialogVisible=true">
                <i class="iconfont icon-shezhi" title="设置" style="font-size:18px"/>
            </div>
            <div class="icon-bg">
                <i class="iconfont icon-caozuo_quanpingfangda" @click="handlerFullScreen" title="全屏"/>
            </div>
            <el-button type="primary" round size="small" v-if="USER_INFO.identity !=='student'" @click="handleLivingStatus">{{ LIVING==1?'下课':'开始上课' }}</el-button>
            <el-tooltip v-if="USER_INFO.identity !=='teacher'" :disabled='!tooltipDisabled' effect="dark" content="老师已收到举手，等待处理" placement="bottom-end">
                <el-button round type="primary" class="raise-hands-btn" @click="handleRaiseHands">举手</el-button>
            </el-tooltip>
        </div>
        <!--设置弹窗-->
        <el-dialog
            title="设置"
            :visible.sync="dialogVisible"
            width="37%"
            custom-class="setting-dialog"
        >
            <el-tabs type="card" tab-position="left" stretch @tab-click="handleTabClick">
                <el-tab-pane label="视频检测">
                    <!--选择框-->
                    <div class="device-option-box">
                        <div class="option-title">摄像头选项</div>
                        <el-select
                            v-model="selectedValue"
                            clearable
                            placeholder="未检测到摄像头设备"
                            no-data-text="未检测到摄像头设备"
                            @change="handleSelectChange"
                        >
                            <el-option
                                v-for="item in deviceInputOption"
                                :key="item.deviceId"
                                :label="item.label"
                                :value="item.deviceId"
                            ></el-option>
                        </el-select>
                    </div>
                    <div v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.3)" id="cameras" class="cameras"></div>
                    <div class="mirror-box">
                        <!--<div class="title">镜像模式</div>
                        <el-checkbox v-model="mirrorChecked">镜像模式</el-checkbox>-->
                    </div>
                    <div class="text-prompt">
                        <p>温馨提示:如果您无法看到视频，请按以下方式排查问题</p>
                        <p>1.若杀毒软件（如：360卫士，百度卫士）弹出提示信息，请选择“允许”；</p>
                        <p>2.确认摄像头已连接并开启；</p>
                        <p>3.如果摄像头仍然没有画面，换一个插口重新插入摄像头；</p>
                        <p>4.请选择正确摄像头选项，选择禁用会导致摄像头不可用；</p>
                        <p>5.确认摄像头没有被其他程序占用；</p>
                        <p>6.重启电脑。</p>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="扬声器检测">
                    <!--选择框-->
                    <div class="device-option-box">
                        <div class="option-title">扬声器选项</div>
                        <el-select
                            v-model="selectedValue"
                            clearable
                            placeholder="未检测到扬声器设备"
                            no-data-text="未检测到扬声器设备"
                            @change="handleSelectChange"
                        >
                            <el-option
                                v-for="item in deviceInputOption"
                                :key="item.deviceId"
                                :label="item.label"
                                :value="item.deviceId"
                            ></el-option>
                        </el-select>
                    </div>
                    <p style="margin-top:40px">点击下方播放按钮，您能听到音乐吗？</p>
                    <audio
                        id="music_audio"
                        style="margin-top:10px"
                        controls
                        class="audio-play"
                        src="https://doccdn.talk-cloud.net/static/h5_new_3.3.13/music/detectionDevice_default.wav"
                    ></audio>
                    <div class="text-prompt">
                        <p>温馨提示:如果您无法听见声音，请按以下方式排查</p>
                        <p>1.若杀毒软件（如：360卫士，百度卫士）弹出提示信息，请选择“允许”；</p>
                        <p>2.确认手机、扬声器已连接并开启；</p>
                        <p>3.如果耳机、扬声器音量已经调整到最大；</p>
                        <p>4.请选择正确的耳机选项，选择禁用会导致耳机、扬声器不可用；</p>
                        <p>5.如果耳机、扬声器仍然没有声音，换一个插口重新插入耳机、扬声器；</p>
                        <p>6.重启电脑。</p>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="麦克风检测">
                    <!--选择框-->
                    <div class="device-option-box">
                        <div class="option-title">麦克风选项</div>
                        <el-select
                            v-model="selectedValue"
                            placeholder="未检测到麦克风设备"
                            no-data-text="未检测到麦克风设备"
                            @change="handleSelectChange"
                        >
                            <el-option
                                v-for="item in deviceInputOption"
                                :key="item.deviceId"
                                :label="item.label"
                                :value="item.deviceId"
                            ></el-option>
                        </el-select>
                    </div>
                    <p
                        style="color:#C3C3C3;font-size:13px;margin-top:35px"
                    >对着麦克风从1数到10，您能听到自己的声音并且看到绿条滚动吗？</p>
                    <!-- 滚动音条 -->
                    <div class="spectrum">
                        <div class="spectrum-item">
                            <span :class="{green:this.voice>=1}"></span>
                            <span :class="{green:this.voice>=2}"></span>
                            <span :class="{green:this.voice>=3}"></span>
                            <span :class="{green:this.voice>=4}"></span>
                            <span :class="{green:this.voice>=5}"></span>
                            <span :class="{green:this.voice>=6}"></span>
                            <span :class="{green:this.voice>=7}"></span>
                            <span :class="{green:this.voice>=8}"></span>
                            <span :class="{green:this.voice>=9}"></span>
                            <span :class="{green:this.voice>=10}"></span>
                        </div>
                    </div>
                    <div class="text-prompt">
                        <p>温馨提示:如果您无法看到绿色滚动条，请按以下方式排查</p>
                        <p>1.若杀毒软件（如：360卫士，百度卫士）弹出提示信息，请选择“允许”；</p>
                        <p>2.确认麦克风已连接并开启；</p>
                        <p>3.确认麦克风已插入电脑的麦克风插孔中，并且麦克风声音已调整到最大；</p>
                        <p>4.请选择正确的麦克风选项，选择禁用会导致麦克风不可用；</p>
                        <p>5.如果麦克风仍然没有声音，换一个插口重新插入麦克风；</p>
                        <p>6.重启电脑。</p>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="系统信息">
                    <div v-for="(item,index) in systemInfo" :key="index" class="system-info-item">
                        <div>{{item.title}}：</div>
                        <div>{{item.content}}</div>
                    </div>
                </el-tab-pane>
            </el-tabs>
            <span slot="footer" class="dialog-footer">
                <el-button
                    type="primary"
                    @click="handleSubmit"
                    round
                    style="padding:13px 35px;border:none"
                >确 定</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import TRTC from "trtc-js-sdk";
import webim from "webim";
import EventBus from "../utils/eventBus";
import { settingMediaDevice,createTrtcStream,getTransportStats } from "../utils/SDKInstanceMethods/TRTCInstanceMethod";
import screenfull from "screenfull";
import { mapState,mapMutations } from "vuex";
import { livieStart,livieStop } from '../api/liveStatus/index'

var voiceTimer;

export default {
  data() {
    return {
      ownGroupProfile:{  //群资料（own）
        avatar: "", 
        joinTime: 0,
        lastSendMsgTime: "",
        memberCustomField: [],
        muteUntil: 0,
        nameCard: "",
        nick: "",
        role: "",
        userID: "",
      },
      groupProfile:{},
      timer: null,
      hour: 0,
      minutes: 0,
      seconds: 0,
      cr: "",
      loading: true,
      drawer: false,
      dialogVisible: false,
      LocStream: {}, //本地音视频对象
      deviceInputOption: [],
      selectedValue: "", //设备选项
      deviceId: "", //设备ID
      level: 0,
      voice: 0,
      currentTab: "摄像头",
      currentAudioId: "",
      currentVideoId: "",
      currentSpeakerId: "",
      systemInfo:[],
      raiseHands:[],
      raiseHandsTip:false,
      tooltipDisabled:false
    };
  },

  props:{
    delayed:{
      type:String,
      default:'27ms'
    }
  },

  computed: {
    ...mapState(["USER_INFO", "CURRENT_USE_DEVICE",'LIVING'])
  },

  watch: {
    //setting弹窗打开关闭监听
    dialogVisible(status) {
      if (status) {
        this.createLocStream();
      } else {
        // 清楚定时器
        clearInterval(voiceTimer);
        this.LocStream.stop()
        this.loading = true
      }
    },
    // 监听麦克风声音
    level(value) {
      // console.log(value)
      if (value >= 200 && value <= 400) {
        // 显示一格音谱
        this.voice = 1;
      } else if (value >= 401 && value <= 600) {
        this.voice = 2;
        // 显示二格音谱
      } else if (value >= 601 && value <= 800) {
        this.voice = 3;
        // 显示三格音谱
      } else if (value >= 801 && value <= 1000) {
        this.voice = 4;
        // 显示四格音谱
      } else if (value >= 1001 && value <= 1200) {
        this.voice = 5;
        // 显示五格音谱
      } else if (value >= 1201 && value <= 1400) {
        this.voice = 6;
        // 显示六格音谱
      } else if (value >= 1401 && value <= 1600) {
        this.voice = 7;
        // 显示七格音谱
      } else if (value >= 1601 && value <= 1800) {
        this.voice = 8;
        // 显示八格音谱
      } else if (value >= 1801 && value <= 2000) {
        this.voice = 9;
        // 显示九格音谱
      } else if (value > 2001) {
        this.voice = 10;
        // 显示全部音谱
      } else {
        this.voice = 0;
      }
    }
  },

  created() {
    this.systemInfo = [
      {title:'当前用户',content:this.USER_INFO.nickname || this.USER_INFO.userId},
      {title:'房间号',content:this.USER_INFO.roomId},
      {title:'浏览器',content:webim.BROWSER_INFO.type+'/' + webim.BROWSER_INFO.ver},
      {title:'媒体服务器',content:'西安博源学府BCP T'},
      {title:'版本号',content:'1.1.0'},
    ]

    // 摄像头设备检测
    this.checkEnvCamera("摄像头");

    // 接收群资料（own）
    EventBus.$on('transmit-own-profile', profile =>{
      this.ownGroupProfile = profile

      TimInstance.getGroupProfile({ groupID: this.USER_INFO.roomId }).then( res=> this.groupProfile = res.data.group )
    })

    // 接收到同学举手监听回调
    EventBus.$on('raise-hands-listener', raiseHandsUser =>{
        if(this.raiseHands.length){

            let checkRepeat = this.raiseHands.find(item=> item.userID == raiseHandsUser.userID)
            
            if(!checkRepeat) this.raiseHands.unshift(raiseHandsUser)
        }else{
            this.raiseHands.unshift(raiseHandsUser)
        }

        this.SET_RAISE_HANDS_USER(this.raiseHands)
        this.raiseHandsTip = true
    })

    // 接收到讲师已处理完‘我的’举手事件回调
    EventBus.$on('acceptance-hands-listener',currentStudentInfo =>{
        this.tooltipDisabled = false
    })

    // 计时
    this.handlerTimerStart()
  },

  methods: {
    ...mapMutations(['SET_RAISE_HANDS_USER','SET_LIVING']),
    startTimer() {
      this.seconds += 1;
      if (this.seconds >= 60) {
        this.seconds = 0;
        this.minutes = this.minutes + 1;
      }

      if (this.minutes >= 60) {
        this.minutes = 0;
        this.hour = this.hour + 1;
      }
      this.$refs.startTimer.innerHTML =
        (this.hour < 10 ? "0" + this.hour : this.hour) +
        ":" +
        (this.minutes < 10 ? "0" + this.minutes : this.minutes) +
        ":" +
        (this.seconds < 10 ? "0" + this.seconds : this.seconds);
      this.cr = this.seconds;
    },
    handlerTimerStop() {
      clearInterval(this.timer);
    },
    handlerTimerStart() {
      this.timer = setInterval(this.startTimer, 1000);
    },
    handlerDrawer(text) {
        this.raiseHandsTip = false
        this.$parent.$parent.$parent.handlerOpenDrawer(text);
    },

    // 上/下课 (publish/unpublish)
    handleLivingStatus(){
        // LIVING 直播状态 1:直播中 3:未开始
        if(this.LIVING == 3 || this.LIVING == 2){
          
          // 开始直播
          livieStart({reserveId:SITE_CONFIG['RESERVE_ID']}).then(res=>{
            this.SET_LIVING(1)
          })
        }else if(this.LIVING == 1){
          // 结束直播
          livieStop({reserveId:SITE_CONFIG['RESERVE_ID']}).then(res=>{
            this.SET_LIVING(3)
          })
        }else if(this.LIVING == 4){
          this.$message.warning('操作受限，该课堂已通过后台强制关闭！')
        }
    },

    // 屏幕分享
    handlerScreenShare(){
        // 从麦克风和摄像头采集本地音视频流
        let screenShareStream = TRTC.createStream({
            audio: true,
            screen: true,
            userId: this.USER_INFO.userId,
            microphoneId:this.CURRENT_USE_DEVICE[2].audioId
        });
    
        // 设置视频分辨率等参数
        screenShareStream.setScreenProfile({
            width: 1920,
            height: 1080,
            frameRate: 15,
            bitrate: 1600 /* kbps */
        });

        EventBus.$emit('pushScreen',screenShareStream)
    },
    // 帮助
    handlerHelpJump(){
        let routeHelp = this.$router.resolve('help');
        window.open(routeHelp.href, '_blank');
    },
    removeLocStream(){
        this.LocStream.stop()
    },
    // 全屏
    handlerFullScreen() {
      if (!screenfull.isEnabled) {
        this.$message({
          message: "不支持全屏",
          type: "warning"
        });
        return false;
      }
      screenfull.toggle();
    },
    //根据用户设备检测参数重新创建一个新的本地流
    async createLocStream() {
        
      //创建本地流 根据用户选择校验
      this.checkSelectLive(localStream => {
        this.LocStream = localStream;
        // 播放本地流音频
        localStream
          .play("cameras")
          .then(() => {
              this.loading = false;
          })
          .catch(e => {
            console.error(e);
            //   if (e.getCode() === 0x4043) {
            //     // PLAY_NOT_ALLOWED,引导用户手势操作恢复音视频播放
            //     // stream.resume()
            //   }
          });
      });
    },

    //校验用户选择 创建新的本地流
    checkSelectLive(callback) {
        let checkResult = this.CURRENT_USE_DEVICE;
        let deviceIdObj = {
            cameraId: checkResult[0].videoId,
            microphoneId: checkResult[2].audioId,
        };

        createTrtcStream(deviceIdObj, localStream => {
            callback(localStream)
        });
    },
    // 弹窗tab切换事件
    handleTabClick(tab) {
      switch (tab.label) {
        case "视频检测":
          this.currentTab = "摄像头";
          this.checkEnvCamera("摄像头");
          break;
        case "扬声器检测":
          this.currentTab = "扬声器";
          this.checkEnvCamera("扬声器");
          break;
        case "麦克风检测":
          this.currentTab = "麦克风";
          this.checkEnvCamera("麦克风");
          break;
        case "系统信息":
          break;
      }
    },

    // 切换媒体录入设备
    handleSelectChange(deviceId) {
      this.loading = true
      switch (this.currentTab) {
        case "摄像头":
          this.LocStream.switchDevice("video", deviceId).then(() => {
            this.currentVideoId = deviceId;
            this.loading = false
          });
          break;
        case "扬声器":
          this.LocStream.setAudioOutput(deviceId).then(() => {
            this.currentSpeakerId = deviceId;
          });
          break;
        case "麦克风":
          this.LocStream.switchDevice("audio", deviceId).then(() => {
            this.currentAudioId = deviceId;
          });
          break;
      }
    },

    //切换tab时检测媒体设备回调
    checkEnvCamera(deviceName) {
      settingMediaDevice(deviceName).then(async result => {
        this.deviceInputOption = result;
        this.selectedValue = result[0].deviceId;
        this.deviceId = result[0].deviceId;

        if (deviceName === "扬声器") {
          this.LocStream.setAudioOutput(result[0].deviceId).then(() => {
            this.currentSpeakerId = result[0].deviceId;
          });
        }

        if (deviceName === "麦克风") {
          this.LocStream.switchDevice("audio", this.selectedValue).then(() => {
            //音频采集
            this.macPhoneStreamVolume();
          });
        }
      });
    },

    // 音频采集 获取音频流麦克风输出音量
    macPhoneStreamVolume() {
      voiceTimer = setInterval(() => {
        const level = this.LocStream.getAudioLevel();
        this.level = parseInt(level * 10000);
      }, 200);
    },

    // 确然 提交设置
    handleSubmit(done) {
        let options = {
            videoId:this.currentVideoId,
            speakerId:this.currentSpeakerId,
            audioId:this.currentAudioId
        }

        this.$store.dispatch('updateCheckResult',options).then(()=>{

            if(this.USER_INFO.identity === 'teacher'){
                EventBus.$emit("setting-loc-stream", this.LocStream);
            }else{
                EventBus.$emit("setting-loc-stream-other", this.LocStream);
            }

            this.dialogVisible = false;
        })
    },
    // 举手
    handleRaiseHands(){
        // 发送自定义消息通知举手事件
        this.sendCustomMsg(this.USER_INFO.AnchorId)
    },

    // 发送自定义消息至指定用户(老师)
    sendCustomMsg(targetUserID){
        // 创建自定义消息
        let options = {
            to: targetUserID,
            conversationType: window.TIM.TYPES.CONV_C2C, //端到端会话
            payload: {
                data: JSON.stringify({
                    userId: this.USER_INFO.userId,
                    msgType:'raiseHands'
                })
            }
        };
        let message = TimInstance.createCustomMessage(options)
        
        // 发送消息
        let sendMsg = TimInstance.sendMessage(message);
        sendMsg.then((imResponse) => {
            // 发送成功
            this.tooltipDisabled = true
        }).catch(function (imError) {
            // 发送失败
            console.warn('sendMessage error:', imError);
        });
    }
  }
};
</script>

<style lang='less' scoped>
.nav {
  height: 50px;
  background-color: #2C2B30;
  display: flex;
  align-content: center;
  justify-content: space-between;
  padding: 0 25px;
  .nav-left-box {
    display: flex;
    align-items: center;
    img {
      width: 135px;
      height: 19px;
    }
    .rom-id {
      color: #fff;
      font-size: 13px;
      margin: 0 15px;
    }
    .timer {
      color: #fff;
      font-size: 14px;
    }
  }
  .nav-right-box {
    display: flex;
    align-items: center;
    .icon-bg {
      background-color: #37363B;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 33px;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      &:hover{
        background-color: #409EFF;
        // color: #FF4500;
      }
    }
    .icon-hmc{
        position: relative;
        .raise-hands-tip{
            z-index: -1;
            position: absolute;
            top: 0;
            bottom: 0;
            margin: auto;
            left: 0px;
            width: 90px;
            height: 25px;
            color: #fff;
            font-size: 12px;
            line-height: 25px;
            text-align: center;
            border-radius: 10px;
            background-color: #409EFF;
        }
        .raise-hands-tip:before{
            position: absolute;
            top: 0;
            bottom: 0;
            margin: auto;
            right: -4px;
            content: '';
            width:0;
            height:0;
            border-top:5px solid transparent;
            border-bottom:5px solid transparent;
            border-left:5px solid #409EFF;

        }
        .tip-show{
            z-index: 1 !important;
            left: -105px !important;
            transition: left .4s ease-in .1s;
        }
        .item{
            display: flex;
            align-content: center;
            justify-content: center;
        }
    }
    .el-button {
      width: 100px;
      height: 37px;
      margin-left: 33px;
      box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
      padding: 0;
      letter-spacing: 2px;
      font-size: 15px;
      background-color: #409EFF;
      border-color: #409EFF;
    }
    /deep/.raise-hands-btn{
        .el-icon-loading{
            font-size: 15px;
            margin-bottom: 0 !important;
        }
    }
  }

  /deep/.setting-dialog {
    background-color: #1D1D22;
    border-radius: 10px;
    .el-dialog__title,
    .el-icon-close {
      color: #C3C3C3;
    }
    .el-dialog__body {
      padding: 10px 20px;
      .el-tabs__header,
      .is-left {
        border: none;
        .el-tabs__item {
          position: relative;
          background-color: #2E2E31;
          border: none;
          border-radius: 25px;
          margin-bottom: 25px;
          text-align: center;
          color: #fff;
          padding: 0 25px;
          height: 45px;
          line-height: 45px;
        }
        .is-active {
          background-color: #3E3E40;
          color: #fff;
        }
        .is-active::before {
          content: "";
          width: 4px;
          height: 4px;
          position: absolute;
          top: 0;
          bottom: 0;
          margin: auto;
          left: 15px;
          border-radius: 50%;
          background: #409EFF;
        }
      }
      .el-tabs__content {
        background-color: #fff;
        border-radius: 15px;
        padding: 20px;
        height: 525px;
        .device-option-box {
          display: flex;
          align-items: center;
          .option-title {
            font-size: 16px;
            margin-right: 15px;
          }
          .el-select {
            flex: 1;
          }
        }
        #cameras,
        .cameras {
          width: 200px;
          height: 150px;
          margin-left: 95px;
          margin-top: 40px;
        }
        .mirror-box {
          display: flex;
          align-items: center;
          margin-top: 25px;
          .title {
            font-size: 16px;
            margin-right: 40px;
          }
          .el-checkbox__input.is-checked .el-checkbox__inner,
          .el-checkbox__input.is-indeterminate .el-checkbox__inner {
            background-color: #f1633a;
            border-color: #f1633a;
          }
          .el-checkbox__input.is-checked + .el-checkbox__label {
            color: #f1633a;
          }
          .el-checkbox__input.is-focus .el-checkbox__inner {
            border-color: #f1633a;
          }
        }
        .text-prompt {
          color: #acacac;
          font-size: 13px;
          margin-top: 30px;
        }

        .spectrum {
          margin-top: 35px;
          margin-bottom: 62px;
          .spectrum-item {
            span {
              display: inline-block;
              width: 13px;
              height: 40px;
              border-radius: 10px;
              margin-right: 10px;
              background-color: #cacaca;
            }
          }
        }

        .system-info-item{
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            padding: 13px 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            div:nth-child(1){
                width: 130px;
            }
            div:nth-child(2){
                font-weight: 500;
                color: #333;
            }
        }
      }
    }
  }
}

/deep/.el-button--primary,.el-button--primary:hover{
    background-color: #409EFF !important;
    border-color: #409EFF !important;
}

/deep/ .el-select .el-input__inner:focus,.el-input__inner{
  border-color: #409EFF;
}

/deep/ .el-select-dropdown__item,.selected{
  color: #409EFF;
}

/deep/ .el-loading-spinner .path{
  stroke: #409EFF
}

.green {
  background-color:#37AC4F !important;
}
</style>