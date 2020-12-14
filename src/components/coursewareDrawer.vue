<template>
    <div class="container">
        <div class="nav-title-box">
            <div class="left-sort">
                <!--课件排序-->
                <template v-if="modulesSwitch">
                    <div class="sort-item">
                        <!--
                        <div>时间</div>
                        <div>
                            <div class="triangle-up"></div>
                            <div class="triangle-down"></div>
                        </div>
                        -->
                    </div>
                    <div class="sort-item">
                        <!--
                        <div>类型</div>
                        <div>
                            <div class="triangle-up"></div>
                            <div class="triangle-down"></div>
                        </div>
                        -->
                    </div>
                    <div class="sort-item">
                        <!--
                        <div>名称</div>
                        <div>
                            <div class="triangle-up"></div>
                            <div class="triangle-down"></div>
                        </div>
                        -->
                    </div>
                </template>
                <!--上传课件标题-->
                <template v-else>
                    <div class="upload-title" @click="modulesSwitch = true">
                        <div><</div>
                        <div>课件库</div>
                    </div>
                </template>
            </div>
            <el-button
                v-if="modulesSwitch"
                icon="el-icon-plus"
                plain
                round
                @click="modulesSwitch = false,userSelectFile = {},fileName=''"
                style="color:#fff"
            >添加课件</el-button>
        </div>
        <div class="content-box">
            <!--课件库内容-->
            <div class="courseware-data-content-box" v-if="modulesSwitch">
                <div
                    class="files-item-box"
                    v-for="item in boardFiles.fileInfoList"
                    :key="item.timestamp"
                >
                    <div class="files-left" @click="switchBoard(item.fid)">
                        <div
                            class="files-icon"
                            :class="{'is-default-bg': isDefault(item.title),'is-PPT-bg':isPPT(item.title)}"
                        >
                            <img :src="item.title | filesLogoFilter">
                        </div>
                        <div class="files-title-box">
                            <div>{{item.title != '#DEFAULT'?item.title:'白板'}}</div>
                        </div>
                    </div>
                    <div class="files-right">
                        <img
                            :src="boardFiles.currentBoardId===item.fid?require('../assets/img/eye-show.png'):require('../assets/img/eye-hiden.png')"
                            @click="switchBoard(item.fid)"
                        >
                        <img src="../assets/img/delete-board.png" v-if="item.title != '#DEFAULT'" @click="deleteBoard(item.fid,item.title)">
                    </div>
                </div>
            </div>
            <!--选择上传课件内容--->
            <div class="upload-data-content-box" v-else>
                <div class="upload-box">
                    <div class="upload-content-box">
                        <i v-if="!fileName" class="iconfont icon-shangchuanwenjian"/>
                        <p v-else class="file-name">{{fileName}}</p>
                        <input
                            style="display:none"
                            ref="file_input"
                            id="file_input"
                            type="file"
                            multiple
                            accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.ms-powerpoint, application/vnd.ms-excel, .ppt, .pptx"
                            @change="fileInfo()"
                        >
                        <el-button
                            round
                            style="color:#fff"
                            icon="el-icon-folder-opened"
                            @click="handlerSelectLocFile"
                        >{{fileName?'重新选择':'选择本地文件'}}</el-button>
                    </div>
                    <div class="instructions">
                        <p>1. 教室里支持上传*.xls;*.xlsx;*.ppt;*.pptx;*.doc;*.docx;*.txt;*.pdf;*.jpg; *.gif;*.jpeg;*.png;*.bmp;格式的课件;</p>
                        <p>2. 上传的单个文件不允许超过300M;</p>
                        <p>3. 上传的PPT如果有动画、音视频、触发器等，请勾选“动态PPT”;</p>
                        <p>4. 教室内不支持WPS格式的课件上传，如果有请将其转成PDF后上传;</p>
                        <p>5. 动态PPT上传后需要转换，如果转换完成后自动播放，请勾选“转换完 成自动播放”;</p>
                    </div>
                </div>
                <div class="ppt-attribute-box" v-if="isPPTFiles">
                    <div>文件属性：</div>
                    <el-switch v-model="isStaticPPT" active-text="静态PPT" inactive-text="动态PPT"></el-switch>
                </div>
                <el-button
                    class="upload-btn"
                    :icon="transcoding ? 'el-icon-loading' : 'el-icon-upload'"
                    round
                    type="primary"
                    @click="handlerUploadFile"
                    :disabled="transcoding ? true : false"
                >{{transcoding?'课件转码中...':'上传'}}</el-button>
                <p class="upload-prompt">选择课件后，请点击“上传”完成课件添加</p>
            </div>
        </div>
    </div>
</template>

<script>
import eventBus from "../utils/eventBus";
import { mapState } from "vuex";
export default {
  components: {},
  data() {
    return {
      boardFiles: {},
      modulesSwitch: true,
      uploadBtnText: "选择本地文件",
      fileName: "",
      userSelectFile: {},
      isPPTFiles: false,
      isStaticPPT: true,
      transcoding:false //上传转码loading状态
    };
  },
  computed: {
    ...mapState(["COURSEWARE_FILES","USER_INFO"]),
    isDefault: function() {
      return function(title) {
        if (title.indexOf("DEFAULT") != -1) {
          return true;
        } else {
          return false;
        }
      };
    },
    isPPT: function() {
      return function(title) {
        if (title.indexOf("ppt") != -1) {
          return true;
        } else {
          return false;
        }
      };
    }
  },
  watch: {
      'COURSEWARE_FILES'(){
          this.boardFiles = this.COURSEWARE_FILES
      }
  },
  filters: {
    filesLogoFilter: title => {
      if (title.indexOf("ppt") != -1) {
        return require("../assets/img/ppt.png");
      } else if (title.indexOf("DEFAULT") != -1) {
        return require("../assets/img/bi.png");
      } else {
        return require("../assets/img/chat4.png");
      }
    }
  },
  methods: {
    // 触发input事件
    handlerSelectLocFile() {
      this.$refs.file_input.click();
    },
    // 监听input change事件
    fileInfo() {
      let resultFile = this.$refs.file_input.files[0];
      // 如果文件存在
      if (resultFile) {
        this.userSelectFile = resultFile;
        resultFile.type.indexOf("powerpoint") != -1
          ? (this.isPPTFiles = true)
          : (this.isPPTFiles = false);
        // 获取文件名
        this.fileName = resultFile.name;
      }
    },
    // 上传
    handlerUploadFile() {
      let isStaticPPT = this.isStaticPPT; //指定对于 PPT 文件是否启用静态转码（转为静态图片），默认转为 H5 动画
      if (this.fileName) {
        this.transcoding = true
        eventBus.$emit("upload-files", this.userSelectFile, isStaticPPT);
      } else {
        return;
      }
    },

    clearFiles() {
      this.fileName = "";
      this.userSelectFile = {};
      this.isPPTFiles = false;
      this.isStaticPPT = true;
      this.boardFiles = this.COURSEWARE_FILES
    },

    // 切换白板
    switchBoard(fid){
        if(!teduBoardInstance.isDrawEnable()) return this.$message.warning('操作受限，讲师授权您白板权限后方可操作！')
        teduBoardInstance.switchFile(fid);
    },
    // 删除白板
    deleteBoard(fid,title){
        if(this.USER_INFO.identity !='teacher') return this.$message.warning('抱歉，您无权进行删除课件操作！')
        this.$confirm(`此操作将永久删除「 ${title} 」, 是否继续?`, `删除提示`, {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning"
        }).then(() => {
            teduBoardInstance.deleteFile(fid);
        });
    }
  },

  created() {
    this.boardFiles = this.COURSEWARE_FILES;
    eventBus.$on('upload-end',()=>{
        this.transcoding = false
        this.modulesSwitch = true
    })
  },
  beforeDestroy() {
    eventBus.$off("upload-files");
  }
};
</script>

<style lang='less' scoped>
.nav-title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #3D3D3F;
  .left-sort {
    width: 100%;
    display: flex;
    align-items: center;
    .sort-item {
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-right: 25px;
      width: 50px;
      div:nth-child(1) {
        color: #fff;
      }
      div:nth-child(2) {
        .triangle-up {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid #C3C3C3;
          margin-bottom: 2px;
        }
        .triangle-down {
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #C3C3C3;
        }
      }
    }
    .upload-title {
      font-size: 16px;
      color: #fff;
      cursor: pointer;
      padding: 7px 0;
      display: flex;
      align-items: center;
      div:nth-child(1) {
        font-size: 20px;
        margin-right: 5px;
      }
    }
  }
  /deep/ .el-button {
    background: rgba(0, 0, 0, 0);
  }
}

.content-box {
  padding: 30px 20px;
  .courseware-data-content-box {
    .files-item-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 25px;
      .files-left {
        flex: 1;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        align-items: center;
        .files-icon {
          flex-shrink: 0;
          background-color: #8ddb8f;
          border-radius: 50%;
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          img {
            width: 30px;
            height: 30px;
          }
        }
        .is-default-bg {
          background-color: #8888f1 !important;
        }
        .is-PPT-bg {
          background-color: #DE5E5E !important;
        }
      }
      .files-right {
        display: flex;
        align-items: center;
        img {
          width: 20px;
          height: 20px;
          margin-left: 20px;
          cursor: pointer;
        }
        img:nth-child(2) {
          width: 18px;
          height: 18px;
        }
      }
      .files-title-box {
        flex:1;
        overflow: hidden;      
        text-overflow: ellipsis; 
        white-space: nowrap;   
        color: #fff;
        padding-left: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        div {
          flex:1;
          overflow: hidden;      
          text-overflow: ellipsis; 
          white-space: nowrap;      
          font-size: 16px;
        }
      }
      .files-title-box:hover{
          color: #409EFF;
      }
    }
  }
  .upload-data-content-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    .upload-box {
      width: 100%;
      border: 1px dotted #C3C3C3;
      margin-bottom: 30px;
      .upload-content-box {
        padding-top: 20px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        i {
          color: #fff;
          font-size: 35px;
        }
        .file-name {
          color: #fff;
          font-size: 13px;
          font-weight: bold;
          height: 25px;
        }
        .el-button {
          margin-top: 20px;
          background: rgba(0, 0, 0, 0);
          color: #409eff;
        }
      }
      .instructions {
        padding: 15px;
        color: #fff;
        font-size: 12px;
      }
    }

    .upload-btn {
      width: 274px;
    }

    .ppt-attribute-box {
      font-size: 13px;
      display: flex;
      color: #fff;
      align-items: center;
      padding-bottom: 40px;
      div:nth-child(1) {
        margin-right: 10px;
      }
    }

    .upload-prompt {
      width: 100%;
      color: #fff;
      text-align: center;
    }

    /deep/ .el-switch.is-checked .el-switch__core,.el-button--primary,.is-disabled{
      background-color: #409EFF !important;
      border-color:#409EFF;
    }
  }
}

/deep/ .el-switch__label {
  color: rgb(156, 156, 156);
}

/deep/ .el-icon-loading {
  margin-bottom: 0;
  font-size: 13px;
}

/deep/ .el-button.is-plain:focus{
  border-color: #fff;
}

/deep/ .el-button:focus,.el-button:hover,.el-button:active,.el-button.is-plain:hover{
  border-color: #409EFF;
}

</style>