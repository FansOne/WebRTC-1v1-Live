import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 用户信息
    USER_INFO:{
      // sdkAppId:'',
      // roomId:"",
      // userId:'',
      // AnchorId:'', //主讲人ID
      // identity:'',//当前用户身份 teacher/student/assistant（讲师、学生、助教）
      // userSig:'',
      // liveStatus:''//直播状态1:直播中 2：已结束 3:未开始 4:强制关闭
      // nickname:'',
      // avatar:''
    },

    // IM SDK Ready
    IM_IS_READY:false,
    
    //监听trtcClient 被创建成功状态
    TRTC_CLIENT_CREATED_SUCCESS:false,

    // 记录用户在设备检测环节中使用的设备信息
    CURRENT_USE_DEVICE:[],

    //直播状态1:直播中 2：已结束 3:未开始 4:强制关闭
    LIVING:3,

    //当前房在线用户列表
    CURRENT_ROOM_USER: [], 

    //已上麦（正在播放）音频流
    PLAYING_STREAM:[],

    // 课件
    COURSEWARE_FILES: {},

    //举手同学列表
    RAISE_HANDS_USER:[],

    //聊天消息
    CHAT_MSG:[],

    // 禁言状态
    STOP_SPEAK:false,
  },

  mutations: {
    SET_USER_INFO(state,status){
      state.USER_INFO = status
    },

    SET_IM_IS_READY(state,status){
      state.IM_IS_READY = status
    },
    
    SET_TRTC_CLIENT_CREATED_SUCCESS(state,status){
      state.TRTC_CLIENT_CREATED_SUCCESS = status
    },

    SET_CURRENT_USE_DEVICE(state,status){
      state.CURRENT_USE_DEVICE = status
    },

    SET_LIVING(state,status){
      state.LIVING = status
    },

    SET_CURRENT_ROOM_USER(state, options) {
      state.CURRENT_ROOM_USER = options
    },
    
    SET_PLAYING_STREAM(state, options) {
      state.PLAYING_STREAM = options
    },

    SET_COURSEWARE_FILES(state, options) {
      state.COURSEWARE_FILES = options
    },

    SET_RAISE_HANDS_USER(state, options) {
        state.RAISE_HANDS_USER = options
    },

    SET_CHAT_MSG(state, options) {
        state.CHAT_MSG.push(options)
        
        const queenLen = 100 //内存里面放100条消息，以免观看直播太久撑爆内存
        if (state.CHAT_MSG.length > queenLen) {
          const vl = state.CHAT_MSG.length - queenLen
          for (let i = 0; i < vl; i++) {
            state.CHAT_MSG.shift()
          }
        }
    },

    SET_STOP_SPEAK(state, options) {
        state.STOP_SPEAK = options
    },
  },

  actions:{
    updateCheckResult({commit,rootState}, options) {
      return new Promise(resolve => {
        if (options.videoId) rootState.CURRENT_USE_DEVICE[0].videoId = options.videoId;
        if (options.speakerId) rootState.CURRENT_USE_DEVICE[1].speakerId = options.speakerId;
        if (options.audioId) rootState.CURRENT_USE_DEVICE[2].audioId = options.audioId;
        resolve();
      });
    },

    updateJoinRomUser(context,options){
      let currentArr = context.state.CURRENT_ROOM_USER;

      let arrIndex = currentArr.findIndex(item => item.userID === options[0].userID);
      if(arrIndex != -1) return;

      let cancatArr = currentArr.concat(options);
      let newArr = Array.from(new Set(cancatArr))

      context.commit('SET_CURRENT_ROOM_USER',newArr)

    },

    updateLeaveRomUser(context,userID){
        let currentArr = context.state.CURRENT_ROOM_USER;

        let arrIndex = currentArr.findIndex(item => item.userID === userID)
        if(arrIndex!=-1) currentArr.splice(arrIndex,1)
        context.commit('SET_CURRENT_ROOM_USER',currentArr)

    },

    updateAddPlayingStream(context,options){
        let currentArr = context.state.PLAYING_STREAM;
        let cancatArr = currentArr.concat(options);
        let newArr = Array.from(new Set(cancatArr))

        context.commit('SET_PLAYING_STREAM',newArr)

    },

    updateRemovePlayingStream(context,options){
        let currentArr = context.state.PLAYING_STREAM;
        let currentIdx = currentArr.findIndex(function(item) {
            return item.userId === options.userId;
        })
        currentArr.splice(currentIdx,1)

        context.commit('SET_PLAYING_STREAM',currentArr)

    },
  }
})
