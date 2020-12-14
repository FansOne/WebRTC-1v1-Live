/***
 * 加入TIC房间 SDK接入顺序!!!
 * 初始化 TIC
 * 获取IM实例
 * 监听IM sdk ready事件 (在调用 TIC登录前调用此接口监听事件，防止漏掉 SDK 派发的事件)
 * TIC 登录 
 * TIC创建房间（需监听im sdk ready） 
 * TIC加入房间（需监听im sdk ready）。sync——>同步监听TIC事件(tic.addTICEventListener); next——>调用im相关api(群消息、成员、资料等)
 * ...
 */
import TIC from 'TIC'

import $store from '../store/index'
import EventBus from "../utils/eventBus";
import { groupMemberProfile_,createCustomMessage,updateMyProfile } from '../utils/SDKInstanceMethods/TIMInstanceMethod'

export default class TicClass {
    constructor(options,self) {
        this.self = self
        this.sdkAppId = options.sdkAppId;
        this.userSig = options.userSig;
        this.userId = options.userId;
        this.tic = null; //互动课堂引擎对象
    }

    // 初始化SDK
    async init(callback) {
        this.tic = new TIC({});
        this.tic.init(this.sdkAppId, res => {
            if (res.code) {
                console.error('初始化失败，code:' + res.code + ' msg:' + res.desc);
            } else {
                window.TimInstance = this.tim = this.tic.getImInstance(); //获取im实例
                this.tim.on(TIM.EVENT.SDK_READY, function imReadyHandler(){
                    // im 已经准备好了
                    this.imReady = true;
                    $store.commit('SET_IM_IS_READY',true)

                    // 更新个人群组资料
                    updateMyProfile($store.state.USER_INFO.nickname,$store.state.USER_INFO.avatar,this)
                }.bind(this));
                
                this.login(this.userSig, callback);

                process.env.NODE_ENV ==='production'? this.tim.setLogLevel(4) : this.tim.setLogLevel(0);
            }
        });
    }

    // 登录
    login(userSig, callback) {
        this.tic.login({
            userId: this.userId,
            userSig: userSig
        }, (res) => {
            if (res.code) {
                console.error('登录失败',res.code);
            } else {

                console.warn(`用户${this.userId}登录成功`)

                // 监听IM 消息回调
                this._addTICMessageListener();
                // 课堂事件监听回调
                this._addTICEventListener()
                // IM状态监听回调
                this._addTICStatusListener()

                callback()
            }
        })
    }

    // 监听课堂事件回调
    _addTICEventListener() {
        this.tic.addTICEventListener({
            /**
             * 用户进入房间
             * @param {Array} members     进入房间的用户 ID
            */
            onTICMemberJoin: (members) => {
                // console.log(`用户${members}进入房间`)
                
                // 更新当前房间在线人数
                members.forEach( elementUserId => {

                    groupMemberProfile_([elementUserId], Profile=>{

                        if(Profile[0].userID.indexOf("tic_record_user_") != -1) return; //过滤掉开始录制时加入到房间的(后端服务设置)用户
                        
                        if(elementUserId !== $store.state.USER_INFO.AnchorId) $store.dispatch('updateJoinRomUser',Profile);// 仅学生存入花名册
                        this.showMessageInBox('prompt',elementUserId === $store.state.USER_INFO.userId ? '您已进入课堂' : `${Profile[0].nick || Profile[0].userID} 进入课堂`)

                        // 学生监听讲师进入房间后发送C2C消息至讲师,讲师更新在线人数列表
                        if(Profile[0].userID === $store.state.USER_INFO.AnchorId && $store.state.USER_INFO.identity === 'student'){
                            createCustomMessage({ userId: $store.state.USER_INFO.AnchorId,msgType:'updateJoinRomUser'},'C2C')
                        }
                    })
                });

            },

            /**
             * 用户退出房间
             * @param {Array} members     退出房间的用户 ID
            */
            onTICMemberQuit: (members) => {
                // console.log(`用户${members}退出房间`)
                
                if(members[0].indexOf("tic_record_user_") != -1) return; //过滤掉开始录制时加入到房间的(后端服务设置)用户

                // 更新当前房间在线人数
                members.forEach( elementUserId => {

                    $store.dispatch('updateLeaveRomUser',elementUserId) // 将退出学生从花名册移除

                    TimInstance.getUserProfile({ userIDList: [elementUserId]}).then((imResponse)=>{
                        this.showMessageInBox('prompt',`${imResponse.data[0].nick || imResponse.data[0].userID} 退出课堂`)
                    })
                });
            },

            /**
             * 课堂被销毁解散
            */
            onTICClassroomDestroy: () => {
                // this.quitClassroom();
            },

            /**
             * trtcClient 被创建触发
            */
            onTICTrtcClientCreated: () => {
                $store.commit('SET_TRTC_CLIENT_CREATED_SUCCESS',true)
            }
        });
    }
    
    // 监听IM 消息回调 **注意以下三个监听回调用户加入直播间才会触发！
    _addTICMessageListener() {
        this.tic.addTICMessageListener({
            /**
             * 收到C2C文本消息
             * @param fromUserId		发送此消息的用户id
             * @param text				收到消息的内容
             * @param textLen			收到消息的长度
             */
            onTICRecvTextMessage: (fromUserId, text, textLen) => {
                this.showMessageInBox(fromUserId, text);
            },
    
            /**
             * 收到C2C自定义消息
             * @param fromUserId		发送此消息的用户id
             * @param data				收到消息的内容
             * @param dataLen			收到消息的长度
             */
            onTICRecvCustomMessage: (fromUserId, data, textLen) => {
                let jsonData = JSON.parse(data.data)

                if(jsonData.msgType ==='raiseHands'){

                    groupMemberProfile_([fromUserId],profile=>{
                        EventBus.$emit('raise-hands-listener',profile[0])
                    })
                }else if(jsonData.msgType ==='teacherAcceptanceRaiseHands'){

                    //讲师已受理学生举手 通知其用户
                    EventBus.$emit('acceptance-hands-listener',jsonData)
                }else if(jsonData.msgType ==='boardAuthority'){

                    //讲师对画板权限操作 通知其用户调取接口修改自己画板权限
                    EventBus.$emit('board-authority-listener',jsonData)
                }else if(jsonData.msgType === 'individualSepakControl'){

                    // 个人禁言控制
                    if(jsonData.status)$store.commit('SET_STOP_SPEAK',true);
                    else $store.commit('SET_STOP_SPEAK',false)
                }else if(jsonData.msgType === 'updateJoinRomUser'){

                    // 讲师更新在线人列表
                    groupMemberProfile_([fromUserId], Profile=>{
                        $store.dispatch('updateJoinRomUser',Profile);// 学生存入花名册
                    })
                }
            },
    
            /**
             * 收到群文本消息
             * @param fromUserId		发送此消息的用户id
             * @param text				收到消息的内容
             * @param textLen			收到消息的长度
             */
            onTICRecvGroupTextMessage: (fromUserId, text, textLen) => {
                this.showMessageInBox(fromUserId, text);
            },
    
            /**
             * 收到群自定义消息
             * @param fromUserId		发送此消息的用户id
             * @param data				收到消息的内容
             * @param dataLen			收到消息的长度
             */
            onTICRecvGroupCustomMessage: (fromUserId, data, textLen) => {
                if(data.indexOf("msgType")!= -1){
                    let jsonData = JSON.parse(data);
                    if(jsonData.msgType === 'streamPlay'){
                        // 老师控制学生上麦 学生视口组件播放自己的音频流
                        winHandleOpenLive(jsonData.userId,jsonData.status)
    
                    }else if(jsonData.msgType === 'teacherAudioCotrol'||jsonData.msgType === 'teacherVideoControl'){
                        //老师音频/视频状态改变 非讲师端 老师视口同步ui
                        if(jsonData.msgType === 'teacherVideoControl'){
                            EventBus.$emit('teacher-video-control',jsonData)
                        }else{
                            EventBus.$emit('teacher-audio-control',jsonData)
                        }
                    }else if(jsonData.msgType ==='videoMuteDisable' || jsonData.msgType ==='audioMuteDisable'){
                        if(jsonData.msgType ==='videoMuteDisable'){
                            //讲师控制学生端视频开关状态
                            //data.data --> {"userId":"简灯笼","msgType":"videoMuteDisable",status:false/true}
                            EventBus.$emit('video-switch-listener',jsonData)
                        }else{
                            //讲师控制学生端音频开关状态
                            EventBus.$emit('audio-switch-listener',jsonData)
                        }
                    }else if(jsonData.msgType === 'speakControl'){
                        // 全体禁言控制
                        if(jsonData.muteAllMembers) this.showMessageInBox('prompt','管理员已开启全员禁言'),$store.commit('SET_STOP_SPEAK',true);
                        else this.showMessageInBox('prompt','管理员已解除全员禁言'),$store.commit('SET_STOP_SPEAK',false)
                    }
                }else{
                    this.showMessageInBox(fromUserId, data);
                }
            },
    
            /**
             * 所有消息
             * @param msg	IM消息体
             * @note 所有收到的消息都会在此回调进行通知，包括前面已经封装的文本和自定义消息（白板信令消息除外）
             */
            onTICRecvMessage:(msg)=> {
                // 接收处理图片消息
                if (msg.payload.imageInfoArray[0].imageUrl) {
                    this.showMessageInBox(msg.from,msg.payload.imageInfoArray[0].imageUrl,"img");
                }
            }
        });

        //群提示消息监听(禁言/解除禁言监听处理)
        TimInstance.on(TIM.EVENT.MESSAGE_RECEIVED, function groupMsg(event) {
            // 收到推送的单聊、群聊、群提示、群系统通知的新消息，可通过遍历 event.data 获取消息列表数据并渲染到页面
            let message;
            for (let i = 0; i < event.data.length; i++) {
                message = event.data[i];
                switch (message.type) {
                    case TIM.TYPES.MSG_GRP_TIP: // 群提示消息
                        switch (message.payload.operationType) {
                            case TIM.TYPES.GRP_TIP_MBR_PROFILE_UPDATED: // 群成员资料变更 更多操作类型https://imsdk-1252463788.file.myqcloud.com/IM_DOC/Web/Message.html?_ga=1.9627189.1003778293.1591234998#.GroupTipPayload
                                const memberList = message.payload.memberList;
                                for (let member of memberList) {
                                    // console.log(`${member.userID} 被禁言${member.muteTime}秒`); //***仅适用于单个群成员禁言 全体禁言无相关消息下发

                                    // 单个群成员禁言控制 发送C2C自定义消息
                                    createCustomMessage({ userId:member.userID,msgType:'individualSepakControl',status: Number(member.muteTime)>0?true:false },'C2C')

                                    groupMemberProfile_([member.userID],Profile=>{
                                        this.showMessageInBox('prompt',Number(member.muteTime)>0?`${Profile[0].nick || member.userID} 已被禁止发言`:`管理员已解除 ${Profile[0].nick || member.userID} 禁言`);
                                    })
                                }
                                break;
                            default:
                                break;
                        }
                        break;
                    case TIM.TYPES.MSG_GRP_SYS_NOTICE: // 群系统通知消息
                        if(message.payload.userDefinedField === "FORCE_FINISH"){ //中台控制下播事件消息通知
                            this.self.$notify({
                                title: '直播关闭提示',
                                message: '管理员已通过后台进行停止直播操作，讲师将立即停止直播推流，且不可重复开启此次直播！',
                                type: 'warning'
                            });

                            $store.commit('SET_LIVING',4);
                        }
                        break;
                    default:
                        break;
                }
            }
        }.bind(this));
    }

    // IM状态监听回调
    _addTICStatusListener() {
        this.tic.addTICStatusListener({
          onTICForceOffline: (event) => {
            if (event.data) {
              if(event.data.type) {
                if(event.data.type == window.TIM.TYPES.KICKED_OUT_MULT_ACCOUNT) {
                    this.self.$message.error(`同一账号，多页面登录被踢`);
                } else if(event.data.type == window.TIM.TYPES.KICKED_OUT_MULT_DEVICE){
                    this.self.$message.error(`同一账号，多端登录被踢`);
                } else if(event.data.type == window.TIM.TYPES.KICKED_OUT_USERSIG_EXPIRED){
                    this.self.$message.error(`userSig过期`);
                } else {
                    this.self.$message.error(`帐号其他地方登录，被踢了`);
                }
              } else {
                this.self.$message.error(`帐号其他地方登录，被踢了`);
              }
            } else {
                this.self.$message.error(`帐号其他地方登录，被踢了`);
            }

            this.self.$router.replace("/")
            window.localStorage.clear()
          }
        });
    }

    // 登录成功后进入房间 创建teduBoard
    joinClassroom(funObj,self) {
        // 需要监听im的状态，如果不是ready状态，创建群，加群，发消息等操作都会失败
        this.tic.joinClassroom({
            classId: $store.state.USER_INFO.roomId
        }, {
            mode: TIC.CONSTANT.TICClassScene.TIC_CLASS_SCENE_VIDEO_CALL, //实时通话模式，支持1000人以下场景，低延时
        }, {
            id: 'paint_box',
            ratio: '16:9',
            smoothLevel: 0,
            drawEnable:false,
            boardContentFitMode: 1,
            brushThin:45,
            toolType: 1,
            progressEnable: true,
            progressBarUrl: 'https://resources-tiw.qcloudtrtc.com/board/icons/Gear-0.2s-48px.png'
        }, res => {
            if (res.code) {
                // console.error('加入课堂失败',res);
                self.$message.error(res.desc)
                funObj.error()
            } else {
                // 获取并设置白板实例
                window.teduBoardInstance = this.tic.getBoardInstance();

                // 获取全体禁言状态
                TimInstance.getGroupProfile({groupID:$store.state.USER_INFO.roomId}).then(res=>{
                    $store.commit('SET_STOP_SPEAK',res.data.group.muteAllMembers)
                })
                
                funObj.success()
            }
        });
    }

    //IM消息监听回调 处理函数
    showMessageInBox(fromUserId, text, msgType) {
        var d = new Date();
        var time = `${("0" + d.getHours()).substr(-2)}:${("0" + d.getMinutes()).substr(-2)}:${("0" + d.getSeconds()).substr(-2)}`;

        if(fromUserId !== 'prompt'){
            groupMemberProfile_([fromUserId],Profile=>{
                $store.commit('SET_CHAT_MSG',{
                    time: time,
                    send: fromUserId,
                    sendNickName: Profile[0].nick, 
                    content: text,
                    img: msgType === "img" ? text : ""
                })
            })
        }else{
            $store.commit('SET_CHAT_MSG',{
                time: time,
                send: fromUserId,
                content: text,
                img: msgType === "img" ? text : ""
            })
        }

        //监听禁言状态
        if (text.indexOf("muteAllMembers") != -1 && text.indexOf("userId") != -1) {
            let contentType = typeof JSON.parse(text);
            if (contentType === "object") {
                if (JSON.parse(text).userId) {
                    if(JSON.parse(text).userId == fromUserId){
                        // 全体禁言/解除禁言处理
                        let promptContent = JSON.parse(text);
                        promptContent.muteAllMembers? ( $store.commit('SET_STOP_SPEAK',true) ): ( $store.commit('SET_STOP_SPEAK',false) );
                    }else{
                        // 单人禁言/解除禁言处理
                        if($store.state.USER_INFO.userId == JSON.parse(text).userId){
                            let promptContent = JSON.parse(text);
                            promptContent.muteAllMembers? ( $store.commit('SET_STOP_SPEAK',true) ): ( $store.commit('SET_STOP_SPEAK',false) );
                        }
                    }
                    
                }
            }
        }
    }
}
