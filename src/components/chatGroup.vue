<template>
    <div class="chat-group-box">
        <div class="top">
            <div class="no-chat" @click="handlerMuteAllMembers">
                <i :class="['iconfont',STOP_SPEAK === true?'icon-jinyan':'icon-jiechujinyan']"/>
                <div>{{STOP_SPEAK === true?'解除禁言':'全体禁言'}}</div>
            </div>
            <div class="title">聊天</div>
            <div class="font-size-box">
                <i class="iconfont icon-zitidaxiao" />
                <el-select v-model="fontSizeValue" placeholder="请选择">
                    <el-option
                        v-for="item in fontSize"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    ></el-option>
                </el-select>
            </div>
        </div>
        <div class="chat-content-box" id="chat-content-box" ref="chatBox">
            <div
                v-for="(item,index) in CHAT_MSG"
                :key="item.time+index"
                class="user-prompt-box"
                :class="{'own-right':item.send == USER_INFO.userId,'other-left':item.send != USER_INFO.userId &&item.send !='prompt'&&!isSpeakControl(item.content)}"
            >
                <div
                    class="user-prompt"
                    v-if="item.send ==='prompt' || isSpeakControl(item.content)"
                >
                    <span>{{item.time}}</span>
                    <span>{{item.content}}</span>
                </div>
                <!--我的发言-->
                <div class="own-chat" v-if="item.send == USER_INFO.userId">
                    <div>
                        <span>{{item.time}}</span>
                        <span>·我</span>
                    </div>
                    <div v-if="!item.img" :style="{'font-size': computedFontSize(fontSizeValue)}">{{item.content}}</div>
                    <div v-else style="border-radius:0;padding: 3px;">
                        <viewer :images="[item.img]" style="margin-bottom:0">
                            <img :src="item.img" style="cursor: pointer;">
                        </viewer>
                    </div>
                </div>
                <!--其他成员发言-->
                <div
                    class="other-chat"
                    v-if="item.send != USER_INFO.userId && item.send !='prompt'&& !isSpeakControl(item.content)"
                >
                    <div>
                        <span>{{item.sendNickName || item.send}}·</span>
                        <span>{{item.time}}</span>
                    </div>
                    <div v-if="!item.img" :style="{'font-size': computedFontSize(fontSizeValue)}">{{item.content}}</div>
                    <div v-else style="border-radius:0;padding: 3px;">
                        <viewer :images="[item.img]" style="margin-bottom:0">
                            <img :src="item.img" style="cursor: pointer;">
                        </viewer>
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom">
            <div class="emjio">
                <!--发送表情-->
                <el-popover placement="top-start" width="300" trigger="click" ref="emojiPopper" popper-class="emoji-replay">
                    <div
                        v-for="(item,index) in emojiChar"
                        :key="index"
                        class="fast-replay"
                        style="cursor: pointer;line-height:25px;"
                        @click="handlerSendEmojiMsg(item)"
                    >{{item}}</div>
                    <img src="../assets/img/chat3.png" slot="reference" title="发送表情">
                </el-popover>
                
                <!--发送表情-->
                <img src="../assets/img/send-img.png" title="发送图片" @click="handleSendImgMsg">

                <!--快捷回复-->
                <el-popover placement="top-start" width="300" trigger="click" ref="popover" popper-class="quickly-replay">
                    <div
                        v-for="(item,index) in USER_INFO.identity === 'teacher' ? fastReply : fastReplyStudent"
                        :key="index"
                        class="fast-replay"
                        style="cursor: pointer;line-height:25px;"
                        @click="handlerFastReplay(item)"
                    >{{item}}</div>
                    <img src="../assets/img/chat5.png" slot="reference" title="快捷回复">
                </el-popover>

                <input
                    style="display:none"
                    ref="file_input"
                    id="file_input"
                    type="file"
                    multiple
                    accept="image/*"
                    @change="fileInfo()"
                >

            </div>
            <div class="form-box">
                <el-form :model="chatForm" class="demo-form-inline">
                    <el-form-item label="">
                        <el-input
                            type="textarea"
                            ref="sendMsgInput"
                            resize='none'
                            :rows="3"
                            v-model="chatForm.msg"
                            :disabled="STOP_SPEAK&&USER_INFO.identity==='student'?true:false"
                            :placeholder="STOP_SPEAK&&USER_INFO.identity==='student'?'禁言中...':''"
                            @keydown.enter.native='handlerSendMsg'
                        ></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button
                            type="primary"
                            @click="handlerSendMsg"
                            round
                            :disabled="STOP_SPEAK&&USER_INFO.identity==='student'?true:false"
                        >{{STOP_SPEAK&&USER_INFO.identity==='student'?'禁言中':'发送'}}</el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState,mapMutations } from 'vuex'
import { sendImgMsg,eventGroupEstoppel,userEstoppel } from "../utils/SDKInstanceMethods/TIMInstanceMethod";
import eventBus from "../utils/eventBus";

export default {
  components: {},

  data() {
    return {
      liveMode:'',
      that:this,
      imMsg: {
        common: {},
        custom: {}
      },

      fontSize: [
        {
          value: 0,
          label: "常规"
        },
        {
          value: 1,
          label: "中等"
        },
        {
          value: 2,
          label: "加大"
        },
        {
          value: 3,
          label: "特大"
        }
      ],
      fontSizeValue: 0,
      chatForm: {
        msg: ""
      },
      fastReply: [
        "大家准备下，今天课程马上开始。",
        "视频卡顿吗？",
        "可以听到老师声音吗？",
        "已授权，可以下一步操作了。"
      ],
      fastReplyStudent: [
        "🌹 🌹 🌹 🌹 🌹",
        "666",
        "懂了 懂了 👍",
        "我有疑问..."
      ],
      emojiChar: [
          "😁", "😋", "😜", "😘","😂","😹","😉", "😌", "😅", "😳", "😊", "😝", "😰", "😠", "😩", "😷","😲", "😞", "😭", "😍", "😖", "😱", "😡", "😚", "😤","👿","👍","🙋","🌹","🍌","☔","🌂","💩","🌈","🌊","🌛","⏰","⏳","👀","🍏"
      ],
    };
  },

  computed: {
    ...mapState(['USER_INFO','CHAT_MSG','STOP_SPEAK']),
    isSpeakControl: function() {
      return function(content) {
        if (
          content.indexOf("muteAllMembers") != -1 &&
          content.indexOf("userId") != -1
        ) {
          let contentType = typeof JSON.parse(content);
          if (contentType === "object") {
            if (JSON.parse(content).userId) {
              return true; //代表禁言
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      };
    },
    // 调整聊天字体大小
    computedFontSize: function() {
      return function(fontLevel) {
        switch (fontLevel) {
            case 0:
                return '14px'
                break;
            case 1:
                return '16px' 
                break;
            case 2:
                return '18px'
                break;
            case 3:
                return '22px'
                break;
        }
      };
    },
  },

  watch:{
    'CHAT_MSG'(status){
      this.$nextTick(() => {
        this.$refs.chatBox.scrollTop = this.$refs.chatBox.scrollHeight
      });
    }
  },

  methods: {
    ...mapMutations(['SET_STOP_SPEAK']),

    settingScrollBottom(){
      this.$refs.sendMsgInput.focus()
      this.$refs.chatBox.scrollTop = this.$refs.chatBox.scrollHeight
    },
    // 发送消息
    handlerSendMsg() {
      if (this.chatForm.msg === '' || this.chatForm.msg.trim().length === 0) {
        this.chatForm.msg = "";
        this.$message.error('不能发送空消息哦！');
        return
      }
      // C2C 文本
      let text = this.chatForm.msg;
      TicExample.tic.sendGroupTextMessage(text, res => {
        if (res.code !== 0) {
          if (res.code === 10017) {
            this.$message.error("禁言中，无法发送消息");
            this.SET_STOP_SPEAK(true)
          }
        } else {
          TicExample.showMessageInBox(this.USER_INFO.userId, text);
        }
        this.chatForm.msg = "";
      });
    },

    // 发送表情消息
    handlerSendEmojiMsg(item){
        this.chatForm.msg = `${this.chatForm.msg}${item}`;
        this.$refs.emojiPopper.showPopper = false
        this.$refs.sendMsgInput.focus()
    },

    // 快捷回复
    handlerFastReplay(text) {
      TicExample.tic.sendGroupTextMessage(text, res => {
        if (res.code !== 0) {
          if (res.code === 10017) {
            this.$message.error("禁言中，无法发送消息");
            this.SET_STOP_SPEAK(true)
          }
        } else {
          TicExample.showMessageInBox(this.USER_INFO.userId, text);
          this.$refs.popover.showPopper = false;
        }
      });
    },

    // 发送图片
    handleSendImgMsg() {
      this.$refs.file_input.click();
    },
    
    // 监听input change事件
    fileInfo() {
      let resultFile = this.$refs.file_input.files[0];
      // 如果文件存在
      if (resultFile) {
        sendImgMsg(resultFile, url => {
          this.$refs.file_input.value  = ''; //重置input file
          TicExample.showMessageInBox(this.USER_INFO.userId, url, "img");
        });
      }
    },

    // 全体禁言/解除禁言
    handlerMuteAllMembers() {
      //true 全体禁言，false 取消全体禁言
      if (this.STOP_SPEAK === false) {
        eventGroupEstoppel(true, () => {
          TicExample.showMessageInBox('prompt','您已开启全员禁言')
          this.SET_STOP_SPEAK(true)
        },this);
      } else if (this.STOP_SPEAK === true) {
        eventGroupEstoppel(false, () => {
          TicExample.showMessageInBox('prompt','您已解除全员禁言')
          this.SET_STOP_SPEAK(false)
        },this);
      }
    },

    // 花名册禁言/解除禁言 userEstoppel函数第二个入参表示禁言时长，单位秒。如设为1000，则表示从现在起禁言该用户1000秒；设为0，则表示取消禁言。
    handleEstoppel(userId,status){
        if(!status){
            // 禁言
            userEstoppel(String(userId),18000,(estoppelStudentID)=>{
                // 禁言成功回调
                
                // 讲师userDrawer组件修改状态
                eventBus.$emit('user-estoppel',userId,true)
            },this)
        }else{
            // 解除禁言
            userEstoppel(String(userId),0,(estoppelStudentID)=>{
                // 解除禁言成功回调

                // 讲师userDrawer组件修改状态
                eventBus.$emit('user-estoppel',userId,false)
            },this)
        }
    }
  },
  
  beforeDestroy(){
      eventBus.$off('user-estoppel')
  }
};
</script>
<style lang='less' scoped>
.chat-group-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #2C2B30;
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 10px;
    border-bottom: 1px solid #3E3E40;
    .no-chat {
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #C3C3C3;
      font-size: 12px;
      div{
          padding-left: 5px;
      }
      &:hover{
        color: #409EFF;
      }
    }
    .title {
      font-size: 14px;
      color: #C3C3C3;
    }
    .font-size-box {
      display: flex;
      align-items: center;
      i {
        display: inline-block;
        margin-right: 5px;
        color:#C3C3C3;
      }
      .el-select {
        width: 83px;
        border-color: none;
        /deep/ .el-input__inner {
          padding-top: 0;
          padding-bottom: 0;
          background-color: #424145;
          border-radius: 25px;
          font-size: 12px;
          border-color: rgba(0, 0, 0, 0);
          color: #C3C3C3;
        }
      }
    }
  }
  .chat-content-box {
    flex: 1;
    overflow-x: hidden;
    overflow-y: scroll;
    padding: 10px 0;
    .user-prompt-box {
      display: flex;
      justify-content: center;
      align-items: center;
      .user-prompt {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 5px 10px;
        border-radius: 10px;
        font-size: 8px;
        color: #fff;
        margin-bottom: 10px;
        span:nth-child(1) {
          display: inline-block;
          margin-right: 5px;
        }
      }
      .own-chat,
      .other-chat {
        font-size: 14px;
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
        div:nth-child(1) {
          color: #fff;
          font-size: 14px;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          span {
            display: inline-block;
          }
          span:nth-child(1) {
            font-size: 11px;
            transform: translateY(-1px);
          }
        }
        div:nth-child(2) {
          background-color: #409EFF;
          color: #fff;
          border-radius: 25px 0 25px 25px;
          padding: 5px 10px;
          img {
            width: 100px;
            object-fit: contain;
          }
        }
      }
      .own-chat{
        align-items: flex-end;
      }
      .other-chat {
        align-items: flex-start;
        div:nth-child(1) {
            justify-content: flex-start;
          span:nth-child(1) {
            font-size: 14px;
          }
          span:nth-child(2) {
            font-size: 11px;
            transform: translateY(-1px);
          }
        }
        div:nth-child(2) {
          background-color: #424145;
          color: #fff;
          border-radius: 0px 25px 25px 25px;
          padding: 5px 10px;
        }
      }
    }
  }
  .chat-content-box::-webkit-scrollbar {
    display: none;
  }
  .bottom {
    padding: 10px 10px;
    border-top: 1px solid #3E3E40;
    background-color: #302f33;
    .emjio {
      display: flex;
      align-items: flex-start;
      span{
        display: inline-block;
      }
      img {
        cursor: pointer;
        width: 20px;
        height: 20px;
        margin-right: 7px;
      }
    }
  }
}
.own-right {
  justify-content: flex-end !important;
  align-items: flex-end !important;
  padding-right: 10px;
}
.other-left {
  justify-content: flex-start !important;
  align-items: flex-start !important;
  padding-left: 10px;
}
/deep/ .el-form,
.demo-form-inline {
  .el-form-item {
    margin-bottom: 0 !important;
    .el-textarea__inner {
      background-color: rgba(0, 0, 0, 0);
      border: none;
      color: #fff;
    }
    .el-textarea__inner:hover {
      border-color: rgba(0, 0, 0, 0);
    }
    .el-form-item__content {
      display: flex;
      justify-content: flex-end;
      .el-button {
        margin-top: 20px;
        width: 80px;
        padding: 10px 0;
      }
    }
  }
}
</style>