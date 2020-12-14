<!-- 
    此页面操作用于用户(讲师/线下站外学员)登录获取对应TOKEN 
-->
<template>
    <div class="container">
        <el-row>
            <el-col :span="24">
                <div class="login-bg-box">
                    <div class="grid-content">
                        <el-form
                            :model="ruleForm"
                            label-position="top"
                            status-icon
                            :rules="rules"
                            ref="ruleForm"
                            label-width="100px"
                            class="demo-ruleForm"
                        >
                            <div class="title"><span>考试点在线教育课堂</span><span>®</span></div>
                            <el-form-item label="" prop="phoneNumber" v-if="USER_ROLE === 'STUDENT'">
                                <el-input v-model="ruleForm.phoneNumber" type="tel" placeholder="请输入手机号"></el-input>
                            </el-form-item>
                            <el-form-item label="" prop="password">
                                <el-input v-model="ruleForm.password" placeholder="请输入登录密码"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="submitForm('ruleForm')">进入教室</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";
import { login } from "../api/login/index";
export default {
    name: "login",

    data() {
        var checkUserPassword = (rule, value, callback) => {
            if (!value ||　value.split(" ").join("").length　=== 0) {
                callback(new Error("请输入登录密码"));
                this.ruleForm['password'] = ''
            } else {
                this.ruleForm['password'] = value.replace(/\s/g, "");
                callback();
            }
        };

        var checkUserNikeName = (rule, value, callback) => {
            if (!value ||　value.split(" ").join("").length　=== 0) {
                callback(new Error("请输入访问直播室登记的手机号"));
                this.ruleForm['phoneNumber'] = ''
            } else {
                this.ruleForm['phoneNumber'] = value.replace(/\s/g, "");
                callback();
            }
        };

        return {
            USER_ROLE:'',
            ruleForm: {
                password: "",
                phoneNumber: ""
            },
            rules: {
                password: [{ validator: checkUserPassword, trigger: "blur" }],
                phoneNumber: [{ validator: checkUserNikeName, trigger: "blur" }],
            }
        };
    },
    created(){
        this.USER_ROLE = SITE_CONFIG['USER_ROLE']
    },
    methods: {
        ...mapMutations(["SET_USER_INFO"]),

        submitForm(formName) {
            this.$refs[formName].validate(async valid => {
                if (valid) {
                    let params = {
                        role: SITE_CONFIG['USER_ROLE'],
                        roomId: SITE_CONFIG['RESERVE_ID'],
                        roomPwd: this.ruleForm['password'],
                        type: "ONE_V_X"
                    };

                    if(this.ruleForm['phoneNumber']) params.mobile = this.ruleForm['phoneNumber'];

                    login(params).then(async res=>{
                        SITE_CONFIG['TOKEN'] = res.token;
                        await sessionStorage.setItem('SITE_CONFIG',JSON.stringify(SITE_CONFIG))

                        this.$router.replace('/');
                    })
                } else {
                    return false;
                }
            });
        }
    }
};
</script>

<style lang="less" scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .login-bg-box {
    padding-top: 160px;
    margin-top: 90px;
    width: 100%;
    height: 330px;
    background: url("https://classedu.qq.com/Public/img/huiyi.jpg") no-repeat
      center;
    background-size: 100%;
  }
}
.grid-content {
  display: flex;
  justify-content: center;
  align-items: center;
  .demo-ruleForm {
    box-sizing: border-box;
    background-color: #fff;
    width: 460px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 30px;
    box-shadow: 0 0 10px rgb(224, 224, 224);
    .title {
      margin-bottom: 40px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      span{
          display: inline-block;
      }
      span:nth-child(1){
        font-size: 21px;
      }
      span:nth-child(2){
        font-size: 14px;
        margin-left: 3px
      }
    }
    button {
      width: 70%;
    }
  }
}

/deep/ .el-form-item__content{
    display: flex;
    justify-content: center;
}
</style>
