<template>
    <div class="container">
        <!-- title -->
        <div class="top-title-box">
            <div>花名册</div>
            <div>
                <el-radio-group v-model="radio" size='medium' @change='handlerRadioSwitch'>
                    <el-radio label="全部">全部
                        <p style="display:inline-block;margin-left:4px;">({{onLineUser.length}})</p>
                    </el-radio>
                    <el-radio label="举手">举手
                        <p style="display:inline-block;margin-left:4px;">({{raiseHandsUser.length}})</p>
                    </el-radio>
                </el-radio-group>
            </div>
        </div>
        <!-- content -->
        <div class="content-box">
            <!-- 房间内所有学生列表 -->
            <div class="all-student-list-box" v-if="radio==='全部'">
                <div v-for="(item,index) in onLineUser" :key="item+index" class="stutent-item-box">
                    <div class="student-list-left-box">
                        <div><img :src="item.avatar ? item.avatar:require('../assets/img/studentIcon.png')" :class="{'headImg-style': item.avatar != ''}"/></div>
                        <div>{{item.nick || item.userID}}</div>
                    </div>
                    <div class="student-list-right-box">
                        <img :src="item.alreadyLive?require('../assets/img/hmc-out.png'):require('../assets/img/hmc-sm.png')" :title="item.alreadyLive?'下麦':'上发言席'" @click="handleOpenLive(item.userID,item.alreadyLive)">
                        <img :src="item.videoMuteDisable?require('../assets/img/hmc-close-sxt.png'):require('../assets/img/hmc-open-sxt.png')" :title="item.videoMuteDisable?'打开视频':'关闭视频'" :class="{'disable':!item.alreadyLive}" @click="handlerVideoSwitch(item.userID,item.alreadyLive,item.videoMuteDisable)">
                        <img :src="item.audioMuteDisable?require('../assets/img/hmc-close-maciphone.png'):require('../assets/img/hmc-open-maciphone.png')" :title="item.audioMuteDisable?'打开麦克风':'关闭麦克风'" :class="{'disable':!item.alreadyLive}" @click="handlerAudioSwitch(item.userID,item.alreadyLive,item.audioMuteDisable)">
                        <img :src="item.boardAuthority?require('../assets/img/hmc-hb.png'):require('../assets/img/hmc-close-hb.png')" :title="item.boardAuthority?'已授权涂鸦':'已取消涂鸦'" @click="handlerBoardAuthority(item.userID,item.boardAuthority)">
                        <img :src="item.estoppel?require('../assets/img/hmc-jy.png'):require('../assets/img/hmc-msg.png')" :title="item.estoppel?'已禁言':'未禁言'" @click="handleEstoppel(item.userID,item.estoppel)">
                    </div>
                </div>
            </div>
            <!-- 房间内举手学生列表 -->
            <div class="ask-student-list-box" v-if="radio==='举手'">
                <div v-for="(item,index) in raiseHandsUser" :key="item+index" class="stutent-item-box">
                    <div class="student-list-left-box">
                        <div><img :src="item.avatar ? item.avatar:require('../assets/img/studentIcon.png')" :class="{'headImg-style': item.avatar != ''}"/></div>
                        <div>{{item.nick ||item.userId}}</div>
                    </div>
                    <div class="student-list-right-box">
                        <img :src="item.boardAuthority?require('../assets/img/hmc-hb.png'):require('../assets/img/hmc-close-hb.png')" :title="item.boardAuthority?'已授权涂鸦':'已取消涂鸦'" @click="handlerAcceptanceRaiseHands(item.userID,item.boardAuthority,'涂鸦')">
                        <img :src="item.estoppel?require('../assets/img/hmc-jy.png'):require('../assets/img/hmc-msg.png')" :title="item.estoppel?'已禁言':'未禁言'" @click="handlerAcceptanceRaiseHands(item.userID,item.estoppel,'禁言')">
                        <img :src="item.alreadyLive?require('../assets/img/hmc-out.png'):require('../assets/img/hmc-sm.png')" :title="item.alreadyLive?'下麦':'上发言席'"  @click="handlerAcceptanceRaiseHands(item.userID,item.alreadyLive,'上下麦')">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { createCustomMessage } from "../utils/SDKInstanceMethods/TIMInstanceMethod";
import eventBus from '../utils/eventBus'

export default {
  components: {},
  data() {
    return {
      liveMode:'',
      radio: "全部",
      onLineUser:[],
      raiseHandsUser:[]
    };
  },
  computed: {
      ...mapState(['USER_INFO','CURRENT_ROOM_USER','ALL_USER_MUTED','RAISE_HANDS_USER'])
  },
  watch: {
    'CURRENT_ROOM_USER'(){
        let onLineUser = []
        this.CURRENT_ROOM_USER.forEach(element => {
           let conditionObj = {alreadyLive:true,estoppel:(element.muteUntil)*1000>Date.parse(new Date())?true:false,videoMuteDisable:false,audioMuteDisable:false,boardAuthority:false};
           onLineUser.push(Object.assign({},element,conditionObj))
        });

        this.onLineUser = onLineUser
    },

    'RAISE_HANDS_USER'(val){
        if(!this.RAISE_HANDS_USER.length){
            this.raiseHandsUser = []
        }else{
            let currentRaiseUser = val[0];
            let raiseHandsUser = []
            this.onLineUser.forEach(item=>{
                if(item.userID === currentRaiseUser.userID){
                    raiseHandsUser.push(item)
                }
            })
            this.raiseHandsUser = raiseHandsUser
        }
    }
  },
  async created() {
    var onLineUser = [];
    var raiseHandsUser = [];
    //获取在线人数
    await this.CURRENT_ROOM_USER.forEach(element => {
        let conditionObj = {alreadyLive:true,estoppel:(element.muteUntil)*1000>Date.parse(new Date())?true:false,videoMuteDisable:false,audioMuteDisable:false,boardAuthority:false}
        onLineUser.push(Object.assign({},element,conditionObj))
    });
    
    // 获取举手用户
    await this.RAISE_HANDS_USER.forEach(element => {
        let conditionObj = {alreadyLive:true,estoppel:(element.muteUntil)*1000>Date.parse(new Date())?true:false,videoMuteDisable:false,audioMuteDisable:false,boardAuthority:false}
        raiseHandsUser.push(Object.assign({},element,conditionObj))
    });

    this.onLineUser = onLineUser;
    this.raiseHandsUser = raiseHandsUser;

    // 学生上麦/下麦成功回调
    eventBus.$on('studentLiveSucc',(userId,state)=>{
        if(state==='top'){
            // 用户上麦成功
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.alreadyLive = true
                }
            })
        }else{
            // 用户下麦成功
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.alreadyLive = false
                }
            })

        }
        
    })

    // 学生视频禁用/启用成功回调
    eventBus.$on('student-video-status',(userId,status) =>{
        if(status){
            // 视频禁用成功
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.videoMuteDisable = true
                }
            })
        }else{
            // 视频启用成功
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.videoMuteDisable = false
                }
            })
        }
    })

    // 学生音频禁用/启用成功回调
    eventBus.$on('student-audio-status',(userId,status) =>{
        if(status){
            // 音频禁用成功
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.audioMuteDisable = true
                }
            })
        }else{
            // 音频启用成功
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.audioMuteDisable = false
                }
            })
        }
    })

    //学生禁言/取消禁言成功回调
    eventBus.$on('user-estoppel',(userId,status) =>{
        if(status){
            // 成功禁言处理
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.estoppel = true
                }
            })
        }else{
            // 取消禁言成功处理
            this.onLineUser.forEach(element => {
                if(element.userID === userId){
                    element.estoppel = false
                }
            })
        }
    })
  },
  methods: {
    ...mapMutations(['SET_RAISE_HANDS_USER']),
    handlerRadioSwitch(value){
        this.radio = value
    },

    //上麦/下麦
    handleOpenLive(userId,status){
        // 先通知父组件 再通过父组件调student组件中方法
        this.$parent.$parent.handleOpenLive(userId,status)
        // 发送群组自定义消息
        createCustomMessage({msgType:'streamPlay',userId:userId,status:status})
    },
    // 受理学生举手
    handlerAcceptanceRaiseHands(userId,status,type){
        if(type === '上下麦'){
            this.handleOpenLive(userId,status)
        }else if(type ==='禁言'){
            this.handleEstoppel(userId,status)
        }else if(type === '涂鸦'){
            this.handlerBoardAuthority(userId,status)
        }
        let currentIdx = this.raiseHandsUser.findIndex(function(item){
            return item.userID === userId;
        })
        this.raiseHandsUser.splice(currentIdx,1)
        this.radio = '全部'
        this.SET_RAISE_HANDS_USER(this.raiseHandsUser)
        // 发送c2c自定义消息通知学生老师已经受理举手
        createCustomMessage({msgType:'teacherAcceptanceRaiseHands',userId:userId,status:status},'c2cMsg')
    },

    // 视频关闭/打开
    handlerVideoSwitch(userId,status,videoStatus){
        // 先通知父组件 再通过父组件调student组件中方法
        this.$parent.$parent.handlerVideoSwitch(userId,status,videoStatus)
        // 发送群组自定义消息
        createCustomMessage({msgType:'videoMuteDisable',userId:userId,status:videoStatus})
    },

    // 音频关闭/打开
    handlerAudioSwitch(userId,status,audioStatus){
        this.$parent.$parent.handlerAudioSwitch(userId,status,audioStatus)
        // 发送群组自定义消息
        createCustomMessage({msgType:'audioMuteDisable',userId:userId,status:audioStatus})
    },

    // 画板涂鸦授权/取消权限
    handlerBoardAuthority(userId,status){
        // 发送C2C自定义消息
        createCustomMessage({msgType:'boardAuthority',userId:userId,status:status},'c2cMsg')

        this.onLineUser.forEach(item =>{
            if(item.userID === userId){
                item.boardAuthority = !status
            }
        })
    },

    // 禁言/取消禁言
    handleEstoppel(userId,status){
        TimInstance.getGroupProfile({ groupID: this.USER_INFO.roomId }).then( res=> {
            if(res.data.group.muteAllMembers) return this.$message.warning('请解除全员禁言后再进行此操作！');
            else this.$parent.$parent.handleEstoppel(userId,status); //先通知父组件 再通过父组件调chatGroup组件中方法执行操作
        })
    },
  },
};
</script>

<style lang='less' scoped>
.top-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid gray;
  div:nth-child(1) {
    color: #fff;
    font-size: 14px;
    text-align: left;
  }
}

.content-box{
    padding: 5px 10px;
    .all-student-list-box,.ask-student-list-box{
        .stutent-item-box{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 5px 7px;
            border-radius: 7px;
            margin-bottom: 15px;
            .student-list-left-box{
                display: flex;
                align-items: center;
                color: #fff;
                font-size: 16px;
                div:nth-child(1){
                    margin-right: 15px;
                    border-radius: 25px;
                    overflow: hidden;
                    background-color: rgb(248, 190, 29);
                    width: 37px;
                    height: 37px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    img{
                        width: 25px;
                        height: 25px;
                    }
                }
                .headImg-style{
                    width: 37px !important;
                    height: 37px !important;
                }
            }
            .student-list-right-box{
                display: flex;
                align-items: center;
                img{
                    cursor: pointer;
                    width: 18px;
                    height: 18px;
                    margin-left: 30px;
                }
            }
        }
        .stutent-item-box:hover{
            background-color: rgba(0, 0, 0, .6)
        }
    }
}

/deep/ .el-radio__label {
    padding-top: 20px;
    color: rgb(206, 206, 206);
}
.disable{
    cursor: not-allowed !important;
}

/deep/ .el-radio__inner:hover {
    border-color: #409EFF;
}

/deep/ .el-radio__input.is-checked .el-radio__inner{
    border-color: #409EFF;
    background: #409EFF
}

/deep/ .el-radio__input.is-checked+.el-radio__label{
    color: #409EFF;
}

/deep/ .el-radio__input,.is-checked{
    .el-radio__inner{
        box-shadow: none !important;
    }
}
</style>