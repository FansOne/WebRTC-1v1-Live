import $store from '../../store/index'
import EventBus from "../eventBus";
// 互动白板实例方法

// 白板事件监听
export const TEduBoardListener = function(callback,self){
    // 新增白板
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ADDBOARD, (boardIds, fid) => {
        // console.log('======================:  ', 'TEB_ADDBOARD', ' boardIds:', boardIds, ' fid:', fid);
        _proBoardData(callback);
    });

    // 白板同步数据回调(收到该回调时需要将回调数据通过信令通道发送给房间内其他人，接受者收到后调用AddSyncData接口将数据添加到白板以实现数据同步)
    // TIC已经处理好了，可忽略该事件
    teduBoardInstance.on(TEduBoard.EVENT.TEB_SYNCDATA, (data) => {
        // console.log('======================:  ', 'TEB_SYNCDATA');
    });

    // 收到白板初始化完成事件后，表示白板已处于正常工作状态（此时白板为空白白板，历史数据尚未拉取完成）
    teduBoardInstance.on(TEduBoard.EVENT.TEB_INIT, () => {
        if($store.state.USER_INFO.identity === 'teacher') teduBoardInstance.setDrawEnable(true);

        // 自定义白板工具橡皮擦鼠标样式
        teduBoardInstance.setCursorIcon(TEduBoard.TOOL_TYPE.TEDU_BOARD_TOOL_TYPE_ERASER,{
            cursor: 'url',
            url: "https://xfky-1255765740.cos.ap-beijing.myqcloud.com/h5pptlive/upload/786c829c29c1529e71494f80de6c818f.png",
            offsetX: 8,
            offsetY: 40
        })
    });

    teduBoardInstance.on(TEduBoard.EVENT.TEB_HISTROYDATA_SYNCCOMPLETED, () => {
        // console.log('======================:  ', 'TEB_HISTROYDATA_SYNCCOMPLETED');
    });

    // 白板错误回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ERROR, (code, msg) => {
        // console.error('======================:  ', 'TEB_ERROR', ' code:', code, ' msg:', msg);
        self.$confirm(`${msg}（CODE:${code}）`, 'TEBE通知', {
            confirmButtonText: '知道了',
            type: 'warning',
            showCancelButton:false
          });
          
        _showMessageInBox('TEBE通知', "onTEBError code=" + code + " msg:" + msg);
    });

    // 白板警告回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_WARNING, (code, msg) => {
        // console.error('======================:  ', 'TEB_WARNING', ' code:', code, ' msg:', msg);
        _showMessageInBox('TEBE通知', "onTEBWarning code=" + code + " msg:" + msg);
    });

    // 图片状态加载回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_IMAGE_STATUS_CHANGED, (status, data) => {
        // console.log('======================:  ', 'TEB_IMAGE_STATUS_CHANGED', ' status:', status, ' data:', data);
        _proBoardData(callback);
    });

    // 删除白板页回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_DELETEBOARD, (boardIds, fid) => {
        // console.log('======================:  ', 'TEB_DELETEBOARD', ' boardIds:', boardIds, ' fid:', fid);
        _proBoardData(callback);
    });

    // 跳转白板页回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_GOTOBOARD, (boardId, fid) => {
        // console.log('======================:  ', 'TEB_GOTOBOARD', ' boardId:', boardId, ' fid:', fid);
        _proBoardData(callback);
    });

    // ppt动画步数改变回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_GOTOSTEP, (step, count) => {
        // console.log('======================:  ', 'TEB_GOTOSTEP', ' step:', step, ' count:', count);
    });

    // 增加H5动画PPT文件回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ADDH5PPTFILE, (fid) => {
        // console.log('======================:  ', 'TEB_ADDH5PPTFILE', ' fid:', fid);
        _proBoardData(callback);
    });

    // 增加文件回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ADDFILE, (fid) => {
        // console.log('======================:  ', 'TEB_ADDFILE', ' fid:', fid);
        _proBoardData(callback);
    });

    // 增加转码文件回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ADDTRANSCODEFILE, (fid) => {
        // console.log('======================:  ', 'TEB_ADDTRANSCODEFILE', ' fid:', fid);
        _proBoardData(callback);
    });
    // 增加Images文件回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ADDIMAGESFILE, (fid) => {
        // console.log('======================:  ', 'TEB_ADDIMAGESFILE', ' fid:', fid);
        _proBoardData(callback);
    });

    // 删除文件回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_DELETEFILE, (fid) => {
        // console.log('======================:  ', 'TEB_DELETEFILE', ' fid:', fid);
        _proBoardData(callback);
    });

    // 文件上传状态
    teduBoardInstance.on(TEduBoard.EVENT.TEB_FILEUPLOADSTATUS, (status, data) => {
        // console.log('======================:  ', 'TEB_FILEUPLOADSTATUS', status, data);
        if (status === 1) {
            _showTip('上传成功',self);
        } else {
            _showTip('上传失败',self);
        }
        // document.getElementById('file_input').value = '';
    });

    // 切换文件回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_SWITCHFILE, (fid) => {
        // console.log('======================:  ', 'TEB_SWITCHFILE', ' fid:', fid);
        _proBoardData(callback);
    });

    // 上传背景图片的回调
    teduBoardInstance.on(TEduBoard.EVENT.TEB_SETBACKGROUNDIMAGE, (fileName, fileUrl, userData) => {
        // console.log('======================:  ', '上传背景图片回调', '  fileName:', fileName, '  fileUrl:', fileUrl, ' userData:', userData);
    });

    // 增加图片元素
    teduBoardInstance.on(TEduBoard.EVENT.TEB_ADDIMAGEELEMENT, (fileName, fileUrl, userData) => {
        // console.log('======================:  ', '增加图片元素', '  fileName:', fileName, '  fileUrl:', fileUrl, ' userData:', userData);
    });

    // 文件上传进度
    teduBoardInstance.on(TEduBoard.EVENT.TEB_FILEUPLOADPROGRESS, (data) => {
        // console.log('======================:  ', 'TEB_FILEUPLOADPROGRESS:: ', data);
        _showTip('上传进度:' + parseInt(data.percent * 100) + '%',self);
    });

    // H5背景加载状态
    teduBoardInstance.on(TEduBoard.EVENT.TEB_H5BACKGROUND_STATUS_CHANGED, (status, data) => {
        // console.log('======================:  ', 'TEB_H5BACKGROUND_STATUS_CHANGED:: status:', status, '  data:', data);
    });

    // 转码进度
    teduBoardInstance.on(TEduBoard.EVENT.TEB_TRANSCODEPROGRESS, res => {
        // console.log('=======  TEB_TRANSCODEPROGRESS 转码进度：', JSON.parse(JSON.stringify(res)));
        if (res.code) {
            self.$message('转码失败code:' + res.code + ' message:' + res.message);
        } else {
            let status = res.status;
            if (status === 'ERROR') {
                self.$message('转码失败');
                EventBus.$emit("upload-end");
            } else if (status === 'UPLOADING') {
                // _showTip('上传中，当前进度:' + parseInt(res.progress) + '%',self);
            } else if (status === 'CREATED') {
                // _showTip('创建转码任务',self);
            } else if (status === 'QUEUED') {
                _showTip('正在排队等待转码',self);
            } else if (status === 'PROCESSING') {
                // _showTip('转码中，当前进度:' + res.progress + '%');
            } else if (status === 'FINISHED') {
                _showTip('转码完成',self);
                EventBus.$emit("upload-end");
                let config = {
                    url: res.resultUrl,
                    title: res.title,
                    pages: res.pages,
                    resolution: res.resolution,
                }
                // console.log('transcodeFile:', config);
                teduBoardInstance.addTranscodeFile(config);
            }
        }
    });
}

/**
 * 白板事件回调处理
 * @param {*}  callback
 */
const _proBoardData = function(callback) {
    let fileInfoList = teduBoardInstance.getFileInfoList();
    let currentFileId = teduBoardInstance.getCurrentFile();
    let thumbUrls = teduBoardInstance.getThumbnailImages(currentFileId);
    let fileInfo = teduBoardInstance.getFileInfo(currentFileId);
    if (fileInfo) {
        let boardData = {
            currentBoardId: currentFileId,
            boardIdlist: teduBoardInstance.getFileBoardList(currentFileId),
            current: fileInfo.currentPageIndex + 1,
            total: fileInfo.pageCount,
            fileInfoList: fileInfoList, // 所有文件信息
            thumbUrls: thumbUrls, // 缩略图
        }

        callback(boardData)
    }
}

const _showMessageInBox = function(fromUserId, text) {
    var d = new Date();
    var time = `${('0' + d.getHours()).substr(-2)}:${('0' + d.getMinutes()).substr(-2)}:${('0' + d.getSeconds()).substr(-2)}.${('00' + d.getMilliseconds()).substr(-3)}`

    $store.commit('SET_CHAT_MSG',{
        time: time,
        send: fromUserId + '：',
        content: text
    })
}

const _showTip = function(title,self) {
    self.$message({
        showClose: true,
        message: title,
        type: 'success'
    });
}