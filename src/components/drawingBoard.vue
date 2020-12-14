<template>
    <div class="container">
        <div id="paint_box" ref="paint_box"></div>
        <!--新增画板操作-->
        <div id="paint-operate" v-drag v-if="isBoardAuthority">
            <div class="pages-control">
                <i class="iconfont icon-jiantou-copy" title="上一页" @click="prevBoard" :style="{'color':boardData.current === 1?'gray':''}"/>
                <div class="pages-num">
                    <div>{{boardData.current}}</div>
                    <div>/</div>
                    <div>{{boardData.total}}</div>
                </div>
                <i
                    class="iconfont icon-jiantou"
                    :style="{'color':boardData.current === boardData.total&&boardData.currentBoardId!='#DEFAULT'?'gray':''}"
                    title="下一页or新增白板"
                    @click="handlerNexBoard"
                />
            </div>
            <i class="iconfont icon-fangda" :style="{'color':boardNarrowEnd?'gray':''}" title="放大" @click="handlerEnlargeBoard"/>
            <i class="iconfont icon-suoxiao" :style="{'color':boardEnlargeEnd?'gray':''}" title="缩小" @click="handlerNarrowBoard"/>
            <i class="iconfont icon-quanping" title="全屏控制" @click="handlerFullScreen" style="font-size:23px"/>
            <!-- <img src="../assets/img/screenshot.png" title="截屏" @click="handlerScreenShot"> -->
            <i
                v-if="USER_INFO.identity === 'teacher'"
                class="iconfont icon-iconfontshanchu5"
                style="font-size:26px"
                title="删除当前白板"
                @click="handlerDeleteBoard(boardData.boardIdlist[boardData.current-1])"
            />
        </div>
        <!--画笔工具-->
        <div class="tools-box" :style="{'padding': boardToolsShow?'5px 0':'5px 8px'}" v-if="isBoardAuthority">
            <i
                class="iconfont icon-yumao"
                @click="boardToolsShow = !boardToolsShow"
            />
            <!--工具区域-->
            <div class="tools-region-box" v-if="boardToolsShow">
                <div class="tool-item" @click="onSetToolType(0)" :style="{'color':currentToolType === 0 ? '#409EFF' : ''}">
                    <i class="iconfont icon-shubiaozhizhen" title="鼠标指针" style="font-size:28px"/>
                </div>
                <div class="tool-item" @click="onSetToolType(3)" :style="{'color':currentToolType === 3 ? '#409EFF' : ''}">
                    <i class="iconfont icon-jiguangbi" title="激光笔"/>
                </div>
                <div class="tool-item" @click="onSetToolType(1)" :style="{'color':currentToolType === 1 || currentToolType === 4 ||currentToolType === 'dotted'||currentToolType === 'arrow' ? '#409EFF' : ''}">
                    <el-popover
                        placement="left"
                        width="200"
                        trigger="click"
                        popper-class="popover-bg"
                    >
                        <div class="popover-tools-select">
                            <div class="tools-top">
                                <i
                                    class="iconfont icon-bi"
                                    title="笔"
                                    @click="onSetToolType(1)"
                                    :style="{'color':currentToolType === 1 ? '#409EFF' : ''}"
                                />
                                <i
                                    class="iconfont icon-zhixian"
                                    title="直线"
                                    @click="onSetToolType(4)"
                                    :style="{'color':currentToolType === 4 ? '#409EFF' : ''}"
                                />
                                <i
                                    class="iconfont icon-xuxian"
                                    title="虚线"
                                    @click="setLineType('dotted')"
                                    :style="{'color':currentToolType === 'dotted' ? '#409EFF' : ''}"
                                />
                                <i
                                    class="iconfont icon-jiang-copy-copy"
                                    title="箭头"
                                    @click="setLineType('arrow')"
                                    :style="{'color':currentToolType === 'arrow' ? '#409EFF' : ''}"
                                    style="font-size:27px"
                                />
                            </div>
                            <div class="color-picker-box">
                                <el-form>
                                    <el-form-item label="画笔颜色：">
                                        <el-color-picker
                                            @active-change="onSetBrushColor"
                                            v-model="brushColor"
                                            size="medium"
                                        ></el-color-picker>
                                    </el-form-item>
                                </el-form>
                            </div>
                            <div class="block">
                                <span class="demonstration" style="color:#fff">涂鸦粗细</span>
                                <el-slider
                                    v-model="penThickness"
                                    :step="10"
                                    :max="500"
                                    @change="onSetThin"
                                    show-stops
                                ></el-slider>
                            </div>
                        </div>
                        <i class="iconfont icon-bi" title="笔" slot="reference" />
                    </el-popover>
                </div>
                <div class="tool-item" @click="onSetToolType(11)" :style="{'color':currentToolType === 11 ? '#409EFF' : ''}">
                    <el-popover
                        placement="left"
                        width="200"
                        trigger="click"
                        popper-class="popover-bg"
                    >
                        <div class="popover-tools-select">
                            <div class="color-picker-box">
                                <el-form label-position="top">
                                    <el-form-item label="字体颜色">
                                        <button
                                            type="button"
                                            style="padding:0;background: #000000;border:none;margin-bottom:10px;"
                                            @mousedown.prevent="onSetTextColor('#000000')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #ff0000;border:none;margin-bottom:10px;"
                                            @mousedown.prevent="onSetTextColor('#ff0000')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #00ff00;border:none;margin-bottom:10px;"
                                            @mousedown.prevent="onSetTextColor('#00ff00')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #0000ff;border:none;margin-bottom:10px;"
                                            @mousedown.prevent="onSetTextColor('#0000ff')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #ffff00;border:none;margin-bottom:10px;"
                                            @mousedown.prevent="onSetTextColor('#ffff00')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #FF7EA1;border:none;"
                                            @mousedown.prevent="onSetTextColor('#FF7EA1')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #9B9B9B;border:none;"
                                            @mousedown.prevent="onSetTextColor('#9B9B9B')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #412088;border:none;"
                                            @mousedown.prevent="onSetTextColor('#412088')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #8F4200;border:none;"
                                            @mousedown.prevent="onSetTextColor('#8F4200')"
                                        ></button>
                                        <button
                                            type="button"
                                            style="padding:0;background: #FFD100;border:none;"
                                            @mousedown.prevent="onSetTextColor('#FFD100')"
                                        ></button>
                                    </el-form-item>
                                </el-form>
                            </div>
                            <div class="block">
                                <span class="demonstration" style="color:#fff">字体大小</span>
                                <el-slider
                                    v-model="textSize"
                                    :step="10"
                                    :max="500"
                                    @change="onSetTextSize"
                                    show-stops
                                ></el-slider>
                            </div>
                        </div>
                        <i class="iconfont icon-wenzi" title="文本" slot="reference"/>
                    </el-popover>
                </div>
                <div class="tool-item" @click="onSetToolType(6)" :style="{'color':currentToolType === 6||currentToolType === 8||currentToolType === 5||currentToolType === 7 ? '#409EFF' : ''}">
                    <el-popover
                        placement="left"
                        width="200"
                        trigger="click"
                        popper-class="popover-bg"
                    >
                        <div class="popover-tools-select">
                            <div class="tools-top">
                                <i
                                    class="iconfont icon-icon-kongxinjuxing"
                                    title="空心矩形"
                                    @click="onSetToolType(6)"
                                    :style="{'color':currentToolType === 6 ? '#409EFF' : ''}"
                                />
                                <i
                                    class="iconfont icon-icon-shixinjuxing"
                                    title="矩形"
                                    @click="onSetToolType(8)"
                                    :style="{'color':currentToolType === 8 ? '#409EFF' : ''}"
                                />
                                <i
                                    class="iconfont icon-kongxinyuan"
                                    title="椭圆"
                                    @click="onSetToolType(5)"
                                    :style="{'color':currentToolType === 5 ? '#409EFF' : ''}"
                                    style="font-size:25px"
                                />
                                <i
                                    class="iconfont icon-circle"
                                    title="武大郎烧饼"
                                    @click="onSetToolType(7)"
                                    :style="{'color':currentToolType === 7 ? '#409EFF' : ''}"
                                    style="font-size:25px"
                                />
                            </div>
                            <div class="color-picker-box">
                                <el-form>
                                    <el-form-item label="形状颜色：">
                                        <el-color-picker
                                            @active-change="onSetBrushColor"
                                            v-model="brushColor"
                                            size="medium"
                                        ></el-color-picker>
                                    </el-form-item>
                                </el-form>
                            </div>
                            <div class="block">
                                <span class="demonstration" style="color:#fff">涂鸦粗细</span>
                                <el-slider
                                    v-model="penThickness"
                                    :step="10"
                                    :max="500"
                                    @change="onSetThin"
                                    show-stops
                                ></el-slider>
                            </div>
                        </div>
                        <i class="iconfont icon-xingzhuangcopy" title="形状" slot="reference"/>
                    </el-popover>
                </div>
                <div class="tool-item" @click="onSetToolType(9) " :style="{'color':currentToolType === 9 ? '#409EFF' : ''}">
                    <i
                        class="iconfont icon-kuangxuan"
                        title="点选拖移"
                    />
                </div>
                <div class="tool-item"  @click="onSetToolType(2)" :style="{'color':currentToolType === 2 ? '#409EFF' : ''}">
                    <i class="iconfont icon-xiangpica" title="橡皮擦"/>
                </div>
                <div class="tool-item" :class="{'canUndo':!canUndo}">
                    <i
                        class="iconfont icon-chexiao"
                        :title="!canUndo?'当前不可用':'撤销'"
                        style="font-size:26px"
                        @click="onUndo"
                    />
                </div>
                <div class="tool-item" :class="{'canUndo':!canRedo}">
                    <i
                        class="iconfont icon-huifu"
                        :title="!canRedo?'当前不可用':'恢复'"
                        style="font-size:26px"
                        @click="onRedo"
                    />
                </div>
                <div class="tool-item" @click="onclearDraws">
                    <i class="iconfont icon-qingkong1" title="清空涂鸦"/>
                </div>
            </div>
            <i
                class="iconfont"
                :class="boardToolsShow?'icon-arrow-up':'icon-botton'"
                @click="boardToolsShow = !boardToolsShow"
            />
        </div>
    </div>
</template>

<script>
import EventBus from "../utils/eventBus";
import TicClass from "../utils/TIC";
import { TEduBoardListener } from "../utils/SDKInstanceMethods/TEduBoardInstanceMethod";
import { uploadMinFile } from "../utils/cosFile";
import { groupMemberProfile_,getGroupMemberList,groupOnlineMember } from "../utils/SDKInstanceMethods/TIMInstanceMethod";
import TEduBoard from "TEduBoard";
import screenfull from "screenfull";
import { mapState,mapMutations } from "vuex";
import { setRole } from "../api/profile/index";

var loading = null;
export default {
  data() {
    return {
      isBoardAuthority:false, //画板权限 涂鸦工具
      boardScale:100,//白板默认缩放比例
      boardNarrowEnd:false,
      boardEnlargeEnd:false,
      positionX: 0,
      positionY: 0,
      boardCurrentPage: 11,
      boardTotalPage: 11,
      boardData: {
        currentBoardId: null, //当前白板ID
        boardIdlist: [], //白板ID列表
        current: 0, //当前白板index
        total: 0, //总页数
        fileInfoList: [], // 所有文件信息
        thumbUrls: [] // 缩略图
      },
      boardToolsShow: true,
      canUndo: "",
      canRedo: "",
      brushColor: "#ff0000", //涂鸦颜色
      penThickness: 45,
      textSize: 320,
      currentToolType:1
    };
  },  
  computed: {
    ...mapState(['USER_INFO',"COURSEWARE_FILES",'IM_IS_READY','TRTC_CLIENT_CREATED_SUCCESS'])
  },
  watch:{
    // 白板缩放操作
    'boardScale'(val){
        teduBoardInstance.setBoardScale(val)
        if(val>=300){
            this.boardNarrowEnd = true
        }else{
            this.boardNarrowEnd = false
        }

        if(val<=0){
            this.boardEnlargeEnd = true
        }else{
            this.boardEnlargeEnd = false
        }
    }
  },
  props: {
    liveMode: {
      type: String,
      default: ''
    }
  },
  created() {
    loading = this.$loading({
      customClass: 'create-isLoading',
      lock: true,
      background: 'rgba(0, 0, 0, .7)'
    });

    // 加入课堂直播间
    if(this.IM_IS_READY){
      try {
        
        TicExample.joinClassroom({
          success: ()=> {
            this.ProcessingJion()
          },
          error: ()=>{
            loading.close()
            this.$router.replace('/')
          }
        },this)

      } catch (error) {
        
        // 页面刷新后重新初始化TIC
        window.TicExample = new TicClass(this.USER_INFO,this);

        TicExample.init(async ()=>{

          TicExample.joinClassroom({
            success: ()=> {
              this.ProcessingJion()
            },
            error: ()=>{
              loading.close()
              this.$router.replace('/')
            }
          },this)
        })
      }
    }

    // 上传课件
    EventBus.$on("upload-files", (files, isStaticPPT) => {
      this.handlerUploadFiles(files, isStaticPPT);
    });

    // 讲师设置学员白板操作权限回调
    EventBus.$on("board-authority-listener",studentInfo=>{
        teduBoardInstance.setDrawEnable(!studentInfo.status)
        this.isBoardAuthority = !studentInfo.status

        // prompt
        if(!studentInfo.status){
            this.$notify({
                title: '白板授权通知',
                message: '讲师已授权您对白板的操作权限，现在可使用白板工具进行相关操作！',
                type: 'success'
            });
        }else{
            this.$notify({
                title: '白板授权通知',
                message: '讲师已取消您的白板操作权限。',
                type: 'warning'
            });
        }
    })
  },

  //自定义指令
  directives: {
    drag: {
      // 指令的定义
      bind: function(el, binding, vnode) {
        let odiv = el; //获取当前元素
        odiv.onmousedown = e => {
          //算出鼠标相对元素的位置
          let disX = e.clientX - odiv.offsetLeft;
          let disY = e.clientY - odiv.offsetTop;

          document.onmousemove = e => {
            //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
            let left = e.clientX - disX;
            let top = e.clientY - disY;
            if (top <= 0) top = 0;
            if (top >= 870) top = 870;


            if (left <= 0) left = 0;
            if (left >= 600) left = 980;
            //绑定元素位置到positionX和positionY上面
            vnode.context.positionX = top;
            vnode.context.positionY = left;

            //移动当前元素
            odiv.style.left = left + "px";
            odiv.style.top = top + "px";
          };
          document.onmouseup = e => {
            document.onmousemove = null;
            document.onmouseup = null;
          };
        };
      }.bind(this)
    }
  },

  methods: {
    ...mapMutations(['SET_COURSEWARE_FILES']),

    // 加入直播间成功后处理事件
    async ProcessingJion(){
      
      if(this.TRTC_CLIENT_CREATED_SUCCESS){ //trtcClient 音视频客户端对象初始化完成
        window.trtcClient = await TicExample.tic.getTrtcClient();
        this.$parent.$parent.$parent.$parent.CreatePlayStream();

        // 设置白板涂鸦权限
        if(this.USER_INFO.identity === 'teacher')  this.isBoardAuthority = true;
        //白板撤销/恢复监听事件处理
        TEduBoardListener(boardData=>{
          this.boardData = boardData;
          this.SET_COURSEWARE_FILES(boardData)

          // 白板撤销状态改变
          teduBoardInstance.on(TEduBoard.EVENT.TEB_OPERATE_CANUNDO_STATUS_CHANGED,enable => {
            this.canUndo = enable ? 1 : 0;
          });

          // 白板恢复状态改变
          teduBoardInstance.on(TEduBoard.EVENT.TEB_OPERATE_CANREDO_STATUS_CHANGED,enable => {
            this.canRedo = enable ? 1 : 0;
          });
        },this)

        // 获取群成员（自己）资料
        groupMemberProfile_([this.USER_INFO.userId],Profile=>{
          // 存储自己在群组中的资料
          let data = JSON.stringify(Profile[0])
          sessionStorage.setItem('ownGroupProfile',data)

          // 传递资料至romliveNav兄弟组件
          EventBus.$emit('transmit-own-profile',Profile[0])
        })

        loading.close()
      }

      // 设置管理
      if(this.USER_INFO.identity === 'teacher') setRole({ reserveId: SITE_CONFIG['RESERVE_ID'] });
    },

    //   上一页
    prevBoard() {
      if(!teduBoardInstance.isDrawEnable()) return this.$message.warning('操作受限，讲师授权您白板权限后方可操作！')
      if (this.COURSEWARE_FILES.currentBoardId === "#DEFAULT") {
        teduBoardInstance.prevBoard();
      } else {
        teduBoardInstance.prevStep();
      }
    },
    //   切换下一个白板or创建新版本
    handlerNexBoard() {
      if(!teduBoardInstance.isDrawEnable()) return this.$message.warning('操作受限，讲师授权您白板权限后方可操作！')
      if (this.COURSEWARE_FILES.currentBoardId === "#DEFAULT") {
        //#DEFAULT 默认白板
        if (this.boardData.current != this.boardData.total) {
          // 切换
          teduBoardInstance.nextBoard();
        } else {
          // 新增
          teduBoardInstance.addBoard();
        }
      } else {
        teduBoardInstance.nextStep();
      }
    },
    // 截屏
    handlerScreenShot() {


      let saveUrl = this.$refs.paint_box.getElementsByTagName("canvas")[0].toDataURL("image/png");
      let a = document.createElement("a");

      document.body.appendChild(a);

      a.href = saveUrl;

      a.download = "西安考试点线上课堂";

      a.click();
    },
    // 放大
    handlerEnlargeBoard(){
        if(this.boardScale>=300){
            return 
        }else{
            this.boardScale+=50
        }
    },
    // 缩小
    handlerNarrowBoard(){
        if(this.boardScale<=0){
            return 
        }else{
            this.boardScale-=50
        }
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
      screenfull.toggle(this.$refs.paint_box);
    },
    // 删除当前白板
    handlerDeleteBoard(boardId) {
      if (this.boardData.current === 1) {
        // 缺省白板页
        this.$alert("缺省白板页不能删除", "说明", {
          confirmButtonText: "确定"
        });
      } else {
        this.$confirm("此操作将永久删除当前白板页, 是否继续?", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        })
          .then(() => {
            teduBoardInstance.deleteBoard(boardId);

            this.$message({
              type: "success",
              message: "删除成功!"
            });
          })
          .catch(() => {
            this.$message({
              type: "info",
              message: "已取消删除"
            });
          });
      }
    },
    //设置书画工具类型
    onSetToolType(toolType) {
      teduBoardInstance.setToolType(toolType);
      this.currentToolType = toolType
      if (toolType === 4) {
        teduBoardInstance.setLineStyle({
          lineType: TEduBoard.LINE_TYPE.TEDU_BOARD_LINE_TYPE_SOLID,
          startArrowType: TEduBoard.ARROW_TYPE.TEDU_BOARD_ARROW_TYPE_NONE,
          endArrowType: TEduBoard.ARROW_TYPE.TEDU_BOARD_ARROW_TYPE_NONE
        });
      }
    },
    /**
     * 设置涂鸦颜色
     * @param {*} color Hex 色值，如 #ff00ff
     */
    onSetBrushColor(color) {
      this.brushColor = this.rgbToHex(color);
      teduBoardInstance.setBrushColor(this.brushColor);
    },
    rgbToHex(color) {
      var arr = [],
        strHex;
      if (/^(rgb|RGB)/.test(color)) {
        arr = color.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
        strHex =
          "#" +
          ((1 << 24) + (arr[0] << 16) + (arr[1] << 8) + parseInt(arr[2]))
            .toString(16)
            .substr(1);
      } else {
        strHex = color;
      }
      return strHex;
    },
    // 撤销
    onUndo() {
      teduBoardInstance.undo();
    },
    // 恢复
    onRedo() {
      teduBoardInstance.redo();
    },
    // 清空涂鸦
    onclearDraws() {
      teduBoardInstance.clear();
    },

    // 设置虚线/箭头
    setLineType(lineStyle) {
      // 设置直线
      teduBoardInstance.setToolType(4);

      // TODO 此处调用方式非官方文档提供方式------提交工单解决.....
      // 设置直线样式(虚线)
      if (lineStyle === "dotted") {
        teduBoardInstance.setLineStyle({
          lineType: TEduBoard.LINE_TYPE.TEDU_BOARD_LINE_TYPE_DOTTED,
          endArrowType: TEduBoard.ARROW_TYPE.TEDU_BOARD_ARROW_TYPE_NONE
        });
        this.currentToolType = 'dotted'
      } else if (lineStyle === "arrow") {
        teduBoardInstance.setLineStyle({
          lineType: TEduBoard.LINE_TYPE.TEDU_BOARD_LINE_TYPE_SOLID,
          startArrowType: TEduBoard.ARROW_TYPE.TEDU_BOARD_ARROW_TYPE_NONE,
          endArrowType: TEduBoard.ARROW_TYPE.TEDU_BOARD_ARROW_TYPE_SOLID
        });
        this.currentToolType = 'arrow'
      }

      let lineStyles = teduBoardInstance.getLineStyle();

      console.log(lineStyles);
    },
    /**
     * 设置涂鸦粗细
     * @param {*} num
     */
    onSetThin(num) {
      teduBoardInstance.setBrushThin(num);
    },
    // 字体颜色
    onSetTextColor(color) {
      let textColor = this.rgbToHex(color);
      teduBoardInstance.setTextColor(textColor);
    },
    // 字体大小
    onSetTextSize(size) {
      teduBoardInstance.setTextSize(size);
    },
    // 上传课件
    handlerUploadFiles(file, isStaticPPT) {
      if (/\.(bmp|jpg|jpeg|png|gif|webp|svg|psd|ai)/i.test(file.name)) {
        // 上传图片至COS
        uploadMinFile(file,(err, data,key)=>{
          if (err) return this.$message.error(`图片上传COS失败，${err}`);
          teduBoardInstance.addImagesFile([`http://xfky-1255765740.cos.ap-beijing.myqcloud.com/${key}`]);
          EventBus.$emit("upload-end");
          console.log(data,'COS uploadMinFile')
        })
        
      } else {
        teduBoardInstance.applyFileTranscode(
          {
            data: file,
            userData: "ppt"
          },
          {
            minResolution: "1000x535",
            isStaticPPT: isStaticPPT,
            thumbnailResolution: "200x200"
          }
        );
      }
    },
    //设置当前白板页缩放比例
    setBoardScale(){
        teduBoardInstance.setBoardScale(100)
    }
  },

  beforeDestroy() {
    EventBus.$off("transmit-own-profile");
  },
};
</script>
<style lang='less' scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
  #paint_box {
    position: relative;
    height: 100%;
    overflow: hidden;
  }
  #paint-operate {
    cursor: move;
    position: absolute;
    left: 360px;
    bottom: 93px;
    width: 450px;
    height: 55px;
    padding: 0 35px;
    border-radius: 50px;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: space-between;
    i {
      display: inline-block;
      cursor: pointer;
      font-size: 26px;
      &:hover{
        color: #409EFF;
      }
    }
    .pages-control {
      display: flex;
      align-items: center;
      .pages-num {
        display: flex;
        align-items: center;
        color: #fff;
        margin: 0 10px;
        div:nth-child(1) {
          border: 1px solid #fff;
          padding: 2px 15px;
          border-radius: 10px;
        }
        div:nth-child(2) {
          margin: 0 10px;
        }
      }
    }
  }
  .tools-box {
    position: absolute;
    top: 0;
    top: 130px;
    right: 10px;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    .icon-yumao {
      display: inline-block;
      cursor: pointer;
      font-size: 27px;
      margin: 5px 0;
    }
    .tools-region-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      .tool-item {
        cursor: pointer;
        padding: 0 10px;
        i{
          display: inline-block;
          font-size: 25px;
          margin: 10px 0;
        }
      }
    }
  }
  /deep/ .el-button {
    position: absolute;
    top: 100px;
    right: 7px;
  }
}

.tool-item:hover {
  background-color:rgba(0, 0, 0, 0.2);
  color: #409EFF;
}
.canUndo {
  z-index: 99;
  cursor: not-allowed !important;
  background-color: #eeeeee;
  border-radius: 0 !important;
  &:hover{
    background-color: #eeeeee !important;
    color: #fff !important;
  }
}

/deep/.el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  // justify-content: space-between;
  button {
    width: 30px;
    height: 30px;
    margin-right: 10px;
  }
}

.tools-top>i{
  cursor: pointer;
  color: #fff;
  font-size: 20px;
  &:hover{
    color: #409EFF;
  }
}

.icon-arrow-up,.icon-botton{
  font-size: 25px;
  cursor: pointer;
}
</style>