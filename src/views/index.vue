<template>
    <div class="layout">
        <!-- 顶部导航 -->
        <el-row>
            <el-col :span="24">
                <Nav ref="nav" :delayed='delayed'/>
            </el-col>
        </el-row>

        <!-- 内容区 -->
        <el-row>
            <el-col :span="24">
                <div class="content-flex-box">
                    <!-- 白板区 -->
                    <VueDragResize
                        class="board"
                        ref="dragResize"
                        :h='winHeight-50' 
                        :w='winWidth*0.68' 
                        :parentLimitation='true' 
                        :parentW='winWidth*0.68' 
                        :minw='winWidth/2'
                        :isDraggable='false'
                        :isActive="true"
                        :sticks="sticks"
                        @resizing='handleResizing($event)'>
                        <DrawingBoard ref='board'/>
                        <!--拖拽遮罩-->
                        <div class="drag-mask" @mouseover="mouseover" @mouseout="mouseleave"></div>
                    </VueDragResize>
                    <!-- 老师/学生音视频窗口 -->
                    <div class="live-viewports">
                        <!-- 老师视频视口 -->
                        <div class="teacher-viewport-box">
                            <TeacherLiveViewport ref="teacherLiveCom" @getTransportStats='transportStats'/>
                        </div>
                        <!-- 学生视频视口 -->
                        <div class="student-viewport-box" :class="{'small-viewport':switchViewport,'hide-viewport':!hideStudentView}">
                            <StudentLiveViewport ref='studentLiveCom'/>
                            <div class="left-hiden" v-if="switchViewport" @click="hideStudentView = !hideStudentView">
                                <i class="el-icon-arrow-left" v-if="!hideStudentView"></i>
                                <i class="el-icon-arrow-right" v-else></i>
                            </div>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- 右侧抽屉（花名册、课件库） -->
        <el-drawer :visible.sync="drawer" :withHeader='false' :append-to-body='true' custom-class='drawer-style' :modal='false' :size="drawerType==='花名册'?'30%':'25%'" @close='drawerCloseEvent'>
            <!--课件库管理-->
            <CoursewareDrawer v-if="drawerType==='课件库'" ref="CoursewareDrawer"/>
            <!--花名册-->
            <UserDrawer v-if="drawerType==='花名册'"/>
        </el-drawer>
        <!-- 消息 -->
        <div class="im-chat-box" ref="imChatBox">
            <ChatGroup ref="chatGroup"/>
        </div>
        <div class="chat-mask" ref="imChatMaskBox" @click="handleMask"></div>
    </div>
</template>

<script>
    import VueDragResize from 'vue-drag-resize' //缩放、拖拽

    import { mapState,mapMutations } from "vuex";
    import { createTrtcStream,subscribedRemoteStream,subscribedRemoteMute,remoteRemoveStream  } from '../utils/SDKInstanceMethods/TRTCInstanceMethod';
    import { groupMemberProfile_ } from '../utils/SDKInstanceMethods/TIMInstanceMethod';

    import Nav from "../components/romLiveNav";
    import ChatGroup from "../components/chatGroup";
    import CoursewareDrawer from '../components/coursewareDrawer';
    import UserDrawer from '../components/userDrawer';
    import DrawingBoard from "../components/drawingBoard";
    import StudentLiveViewport from "../components/studentLiveViewport";
    import TeacherLiveViewport from "../components/teacherLiveViewport";

    export default {
        components: {},
        data() {
            return {
              delayed:'',
              winWidth:0,
              winHeight:0,
              sticks:['mr'],//元素缩放的节点定义
              drawer: false,
              drawerType:'',
              switchViewport:false,
              hideStudentView:false,//隐藏学生音频流播放视口 
            };
        },
        components: {
            Nav,
            VueDragResize,
            ChatGroup,
            CoursewareDrawer,
            UserDrawer,
            DrawingBoard,
            StudentLiveViewport,
            TeacherLiveViewport
        },

        computed: {
            ...mapState(['CURRENT_USE_DEVICE','USER_INFO','CURRENT_ROOM_USER'])
        },

        mounted(){
            window.winHandleOpenLive = this.handleOpenLive
        },

        created() {
          // 获取窗口尺寸
          this.clientSize()
        },

        methods: {
          ...mapMutations(['SET_CURRENT_ROOM_USER']),

          clientSize(){
            //获取窗口宽度
            if (window.innerWidth)
            this.winWidth = window.innerWidth;
            else if ((document.body) && (document.body.clientWidth))
            this.winWidth = document.body.clientWidth;
            //获取窗口高度
            if (window.innerHeight)
            this.winHeight = window.innerHeight;
            else if ((document.body) && (document.body.clientHeight))
            this.winHeight = document.body.clientHeight;
            //通过深入Document内部对body进行检测，获取窗口大小
            if (document.documentElement  && document.documentElement.clientHeight && document.documentElement.clientWidth){
                this.winHeight = document.documentElement.clientHeight;
                this.winWidth = document.documentElement.clientWidth;
            }
          },

          handleResizing(event){
            let originalWidth = this.winWidth*0.68;
            this.$refs.board.setBoardScale()
            if(event.width<originalWidth){
                this.switchViewport = true
            }else{
                this.switchViewport = false
                this.hideStudentView = true
            }
          },

          handlerOpenDrawer(text){  
            if(text === '消息'){
                if(this.$refs.imChatBox.style.display==='block'){
                    this.$refs.imChatBox.style.display='none'
                    this.$refs.imChatMaskBox.style.display='none'
                }else{
                    this.$refs.imChatBox.style.display='block'
                    this.$refs.imChatMaskBox.style.display='block'
                    this.$refs.chatGroup.settingScrollBottom()
                }
                
            }else{
                this.drawerType = text
                this.drawer = true
                
                if(this.$refs.imChatBox.style.display==='block'){
                    this.$refs.imChatBox.style.display='none'
                    this.$refs.imChatMaskBox.style.display='none'
                }
            }
          },

          handleMask(){
            this.$refs.imChatBox.style.display='none'
            this.$refs.imChatMaskBox.style.display='none'
          },

          //   抽屉关闭回调
          drawerCloseEvent(){
            // 清除已选择的课件文件
            if(this.drawerType==='课件库') this.$refs.CoursewareDrawer.clearFiles()
          },

          //通知setting(nav)组件销毁创建的本地流
          unpublishSetLocStream(){
            this.$refs.nav.removeLocStream()
          },

          // 通知指定学生上麦/下麦
          handleOpenLive(userId,status){
            this.$refs.studentLiveCom.handleOpenLive(userId,status)
          },

          // 控制学生视频状态
          handlerVideoSwitch(userId,status,videoStatus){
            this.$refs.studentLiveCom.handlerVideoSwitch(userId,status,videoStatus)
          },

          // 控制学生音频状态
          handlerAudioSwitch(userId,status,audioStatus){
            this.$refs.studentLiveCom.handlerAudioSwitch(userId,status,audioStatus)
          },

          // 花名册禁言/取消禁言
          handleEstoppel(userId,status){
            this.$refs.chatGroup.handleEstoppel(userId,status)
          },

          mouseover(){
            this.$refs.dragResize.$el.children[2].style.display = 'block'
          },

          mouseleave(){
            this.$refs.dragResize.$el.children[2].addEventListener('mouseover',event =>{
                event.currentTarget.style.display = 'block'
            })
            this.$refs.dragResize.$el.children[2].style.display = 'none'
          },

          //创建并播放音视频流 & 订阅远端流(加入直播房间后)
          CreatePlayStream(){
            // 创建播放音视频流
            this.initCreateStream(localStream=>{
                // 判断是否为老师登录
                if(this.USER_INFO.identity === 'teacher'){
                    // 是主讲老师登录 *老师视口 组件播放 *本地流
                    this.$refs.teacherLiveCom.play(localStream)
                }else{
                    // 非主讲老师登录 *学生视口 组件播放 *本地流
                    this.$refs.studentLiveCom.sendRemoteStream(localStream,'pushStream')
                }
                    
            })

            // 订阅远端流
            subscribedRemoteStream(remoteStream=>{
                if(this.USER_INFO.identity === 'teacher'){ //老师
                    //学生视口组件接收远端流
                    this.$refs.studentLiveCom.sendRemoteStream(remoteStream)
                }else{ // 学生
                    // *老师视口 组件播放 *捕获到的远端流
                    this.$refs.teacherLiveCom.play(remoteStream)
                }

                
                //更新当前房间在线人数(此处操作目的是防止中途掉线(重新登录)时不能通过TIC addTICEventListener事件监听到在掉线(重新登录)期间退出或进入房间的用户)
                let currentRoomUser= []
                let uiserId = remoteStream.getUserId();

                if(uiserId === this.USER_INFO.AnchorId) return;
                else groupMemberProfile_([uiserId],Profile=>{
                        let arrIndex = currentRoomUser.findIndex(element => element.userID === Profile[0].userID);
                        if(arrIndex === -1) currentRoomUser.push(...Profile)
                })

                this.SET_CURRENT_ROOM_USER(currentRoomUser)
            })

            //监听远端流音视频禁用开启状态
            subscribedRemoteMute((userId,eventName)=>{
                this.$refs.studentLiveCom.muteState(userId,eventName)
            })

            // 监听远端流移除
            remoteRemoveStream(currentDeleteStream => {
                this.$refs.teacherLiveCom.deleteStream(currentDeleteStream)
                this.$refs.studentLiveCom.deleteStream(currentDeleteStream)
            })
          },

          // 根据用户选择(检测设备结果)初始化创建音视频流
          initCreateStream(callback){
            let userCheckDeviceResult = this.CURRENT_USE_DEVICE;
            let deviceIdObj = {
                cameraId: userCheckDeviceResult[0].videoId,
                microphoneId: userCheckDeviceResult[2].audioId
            };
            createTrtcStream(deviceIdObj,localStream=>{
                callback(localStream)
            })
          },

          //开播后获取当前网络传输状况统计数据
          transportStats(delayed){
            this.delayed = delayed
          }
        },
    };
</script>

<style lang='less' scoped>
    .layout{
        height: 100vh;
        background-color: #1D1D22;
        color: #fff;
        .content-flex-box{
            height: calc(100vh - 50px);
            display: flex;
            .vdr,.active:before{
                outline:none
            }
            /deep/.vdr-stick{
                display: none;
                z-index: 889;
                height: 60px !important;
                width: 60px !important;
                border-radius: 50%;
                right: -30px !important;
                margin-top: -30px !important;
                background-color:rgba(64,158,255,.7);
                border: 2px solid rgba(255, 255, 255, .6);
            }
            /deep/ .vdr-stick:before{
                content: '';
                display: block;
                height: 60px;
                width: 60px;
                background:url('../assets/img/leftRightMove.png') no-repeat;
                background-size: 28px 25px;
                background-position: 15px 16px;
            }
            .board{
                position: relative;
                background-color: #39393D;
                display: flex;
                align-items: center;
                justify-content: center;
                width: calc(100vw - 38%);
                margin-right: 2px;
                .drag-mask{
                    cursor: pointer;
                    z-index: 889;
                    position: absolute;
                    top: 0;
                    right: -73px;
                    height: 100%;
                    width: 90px;
                }
            }
            .live-viewports{
                flex: 1;
                position: relative;
                display: flex;
                flex-direction: column;
                .teacher-viewport-box{
                    flex: 1;
                    display: flex;
                    background-color: #2E2E30;
                    align-items: center;
                    justify-content: center;
                    min-height: 50%;
                }
                .teacher-viewport-box:before{
                    content: '';
                    display: block;
                    position: absolute;
                    height: 130px;
                    width: 130px;
                    background:url('../assets/img/teacher-icon.png') no-repeat;
                    background-size: 130px 130px;
                }
                .student-viewport-box{
                    z-index: 888;
                    flex: 1;
                    background-color: #e3e3e3;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 50%;
                    .left-hiden{
                        cursor: pointer;
                        height: 262.4px;
                        width: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background-color: #000;
                        position: absolute;
                        left: -30px;
                        border-radius: 10px 0 0 10px;
                        animation: leftControl .4s linear 0s;
                    }
                }
                .student-viewport-box:before{
                    content: '';
                    display: block;
                    position: absolute;
                    height: 155px;
                    width: 130px;
                    background:url('../assets/img/student-icon.png') no-repeat;
                    background-size: 130px 155px;
                }
                .small-viewport{
                   position: absolute;
                   right: 0;
                   top: 0;
                   width: 352px;
                   height: 262.4px;
                   animation: studentViewZoom .4s linear 0s;
                   transition: right .6s;
                }
                .hide-viewport{
                    right: -352px;
                }
            }
        }
    }

    /deep/ .drawer-style{
      top: 50px;
      bottom: 0;
      background-color: rgba(0, 0, 0, .8);
      overflow-x: hidden;
      overflow-y: scroll;
    }

    /deep/ .drawer-style::-webkit-scrollbar {display:none}

    .im-chat-box{
        z-index: 999;
        width: 32%;
        height: calc(100% - 50px);
        display: none;
        background-color: #2C2B30;
        position: absolute;
        right: 0;
        top: 50px;
    }
    .chat-mask{
        z-index: 900;
        width:100vw;
        height: calc(100% - 50px);
        position: fixed;
        left: 0;
        top: 50px;
        display: none;
        background-color: rgba(0, 0, 0, 0);
    }

    @keyframes studentViewZoom {
        from {
            width: 653px;
            height: 477px;
        }
        to{
            width: 352px;
            height: 262.4px;
        }
    }

    @keyframes leftControl {
        from {
            height: 477px;
        }
        to{
            height: 262.4px;
        }
    }
</style>