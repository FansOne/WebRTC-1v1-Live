<template>
    <div class="container">
        <el-row v-if="!stepShow">
            <el-col :span="24">
                <div class="check-box">
                    <div>欢迎使用在线教室</div>
                    <div class="prompt-text">为了保证更好的授课效果，请先完成设备检测</div>
                    <el-button type='primary' :disabled="btnDisabled" round @click="stepShow = true">开始检测</el-button>
                </div>
            </el-col>
        </el-row>

        <!--设备检测-->
        <CheckClientEnv :stepShow='stepShow' @enterCheck='enterCheck'/>
    </div>
</template>

<script>
    import CheckClientEnv from '../components/checkClientEnvStep'

    export default {
        components: {
            CheckClientEnv
        },
        data() {
            return {
                btnDisabled:true,
                stepShow:false,
            };
        },
        methods:{
            enterCheck(status){
                this.btnDisabled = status
            }
        }
    };
</script>

<style lang='less' scoped>
    .container{
        min-height: 100vh;
        background-color: #2C2B30;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-bottom: 100px;
        .el-row{
            display: flex;
            justify-content: center;
            text-align: center;
        }
        .check-box{
            color: #fff;
            div:nth-child(1){
                font-size: 30px;
            }
            .prompt-text{
                font-size: 19px;
                margin-top: 50px;
                margin-bottom: 70px;
                color: gray;
            }
            .el-button {
                width: 323px;
            }
        }
    }
</style>