import $store from '../../store/index'

// 获取群成员列表 拉取群成员禁言截止时间戳
export const getGroupMemberList = function(callback) {
    let promise = TimInstance.getGroupMemberList({
        groupID: $store.state.USER_INFO.roomId,
        count: 25, // 从0开始最多拉取25个群成员
        offset: 0
    });
    promise.then(function (imResponse) {
        console.log(JSON.parse(JSON.stringify(imResponse.data.memberList))); // 群成员列表
        callback(imResponse.data.memberList)
        for (let groupMember of imResponse.data.memberList) {
            if (groupMember.muteUntil * 1000 > Date.now()) {
                console.log(`${groupMember.userID} 禁言中`);
            } else {
                console.log(`${groupMember.userID} 未被禁言`);
            }
        }
    }).catch(function (imError) {
        console.warn('getGroupMemberProfile error:', imError);
    });
}

// 群组禁言/解除禁言
export const eventGroupEstoppel = function(behavior, callbck,self) {
    // 1.调用 getGroupProfile 接口查看所在群组类型，确认是否支持禁言/取消禁言操作。
    let getGroupProfile = TimInstance.getGroupProfile({
        groupID: $store.state.USER_INFO.roomId,
        groupCustomFieldFilter: []
    });
    getGroupProfile.then(imResponse => {
        let groupData = imResponse.data.group;
        if (groupData.type != 'Private' && groupData.type != 'Work') {
            // 2.调用 getGroupMemberProfile 接口查看指定的 userID 在当前群的成员角色，确认是否有权限进行禁言/取消禁言操作。
            let userGroup = [$store.state.USER_INFO.userId];
            groupMemberProfile_(userGroup, userInfo => {
                let ordinaryDentity = TIM.TYPES.GRP_MBR_ROLE_MEMBER; //普通身份
                if (userInfo[0].role === ordinaryDentity) {
                    _warnPrompt('操作权限不足，仅管理员才有该权限！',self)
                } else {
                    _speechControlApi(behavior, callbck,self)
                }
            })
        } else {
            _warnPrompt('抱歉，该群组类型暂不支持禁言操作',self)
        }
    }).catch((imError) => {
        _errPrompt(imError)
    });
}

// 获取群在线人数(仅直播群可用)
export const groupOnlineMember = function(callback) {
    let promise = TimInstance.getGroupOnlineMemberCount($store.state.USER_INFO.roomId);

    promise.then(function(imResponse) {
        callback(imResponse);
    }).catch(function(imError) {
        console.warn('获取直播群在线人数失败 error:', imError); // 获取直播群在线人数失败的相关信息
    });
}

// 查看指定的 userID 在当前群的资料信息
export const groupMemberProfile_ = function(userId, callbck) {
    let promise = TimInstance.getGroupMemberProfile({
        groupID: $store.state.USER_INFO.roomId,
        userIDList: [...userId],
        memberCustomFieldFilter: [],
    });
    promise.then( (imResponse)=> {
        callbck(imResponse.data.memberList)
    }).catch(function (imError) {
        console.warn('查看指定的 userID 在当前群的资料信息 error:', imError);
    });
}

// 禁言/取消禁言全体成员
const _speechControlApi = function(muteAllMembers, callbck,self) {
    let promise = TimInstance.updateGroupProfile({
        groupID: $store.state.USER_INFO.roomId,
        muteAllMembers: muteAllMembers, // true 全体禁言，false 取消全体禁言
    });
    promise.then((imResponse) => {
        console.log(imResponse.data.group) // 修改成功后的群组详细资料
        // 禁言/取消禁言成功后创建自定义消息实例并发送通知给其他群成员
        HinweisOtherMitglied(muteAllMembers, callbck,self)

    }).catch(function (imError) {
        console.warn('禁言失败 error:', imError); // 修改群组资料失败的相关信息
        self.$message.error(`${imError}`)
    });
}

/**
 * 创建自定义消息并发送（全体/单人禁言相关）
 * muteAllMembers : true 禁言 false 取消禁言
 * SingleEstoppel:是否单人禁言 true单人
 * estoppelStudentID：被单独禁言的用户id
 */
export const HinweisOtherMitglied = function(muteAllMembers, callbck,self,SingleEstoppel=false,estoppelStudentID) {
    let options = {
        to: $store.state.USER_INFO.roomId,
        conversationType: window.TIM.TYPES.CONV_GROUP, //群组会话
        payload: {
            data: JSON.stringify({
                groupID: $store.state.USER_INFO.roomId,
                userID: estoppelStudentID ? estoppelStudentID : $store.state.USER_INFO.userId,
                muteAllMembers: muteAllMembers,  // true禁言 false取消禁言
                msgType:'speakControl'
            })
        }
    };
    let message = TimInstance.createCustomMessage(options)

    let sendMsg = TimInstance.sendMessage(message);
    sendMsg.then((imResponse) => {
        // 发送成功
        // console.log(imResponse);
        if(!SingleEstoppel){
            let promptText = muteAllMembers ? '全体禁言中' : '已解除禁言'
            _successPrompt(promptText,self)
        }
        callbck()
    }).catch(function (imError) {
        // 发送失败
        console.warn('sendMessage error:', imError);
    });
}

// 指定用户禁言（花名册）
export const userEstoppel = function(userId,muteTime,callbck,self){
    TimInstance.setGroupMemberMuteTime({
        groupID: $store.state.USER_INFO.roomId,
        userID: userId,
        muteTime: muteTime
    }).then(res=>{
        callbck(res.data.member.userID)
    }).catch(err=>{
        self && self.$message.warning('操作权限不足，仅管理员才有该权限！')
    })
}

// 创建图片消息并发送
export const sendImgMsg = function(file,callbck) {
    // 1. 创建消息实例，接口返回的实例可以上屏
    let message = TimInstance.createImageMessage({
        to: $store.state.USER_INFO.roomId,
        conversationType: TIM.TYPES.CONV_GROUP,
        payload: {
            file: file
        }
    });

    // 2. 发送消息
    let promise = TimInstance.sendMessage(message);
    promise.then( (imResponse)=> {
        // 发送成功
        // console.log(imResponse);
        let url = imResponse.data.message.payload.imageInfoArray[0].imageUrl;
        callbck(url)
    }).catch(function (imError) {
        // 发送失败
        console.warn('sendMessage error:', imError);
    });
}

// 创建群组/C2C 自定义消息
export const createCustomMessage = function(){
    let options = arguments[0];
    let msgType = arguments[1] || 'groupMsg';
    let callbck = arguments[2];
    let params = {
        to: msgType==='groupMsg'? $store.state.USER_INFO.roomId : options.userId,
        conversationType: msgType==='groupMsg'? TIM.TYPES.CONV_GROUP : TIM.TYPES.CONV_C2C, //群组会话
        payload: {
            data: JSON.stringify(options)
        }
    };
    let message = TimInstance.createCustomMessage(params)

    let sendMsg = TimInstance.sendMessage(message);
    sendMsg.then((imResponse) => {
        // 发送成功
        callbck && callbck(imResponse)
    }).catch(function (imError) {
        // 发送失败
        console.warn('sendMessage error:', imError);
    });
}

// 更新个人资料
export const updateMyProfile = function(nick,avatar,self){
    // 修改个人标配资料
    let promise = TimInstance.updateMyProfile({
        nick: nick,
        avatar: avatar
    });
    promise.then((imResponse)=> {
        // console.log('更新资料成功',imResponse.data); // 更新资料成功
    }).catch((imError)=> {
        // console.warn('updateMyProfile error:', imError); // 更新资料失败的相关信息
        self.$message.error('更新个人资料失败'+imError)
    });
}

// 成功提示
const _successPrompt = function(text,self) {
    self.$message({
        message: text,
        type: 'success'
    })
}

// 错误提示
const _errPrompt = function(text,self) {
    self.$message({
        message: text,
        type: 'error'
    })
}

// 警告提示
const _warnPrompt = function(text,self) {
    self.$message({
        message: text,
        type: 'warning'
    })
}