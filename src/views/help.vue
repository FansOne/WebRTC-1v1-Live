<template>
    <div class="main">
        <div id="right-meun">
            <ul id="right_html">
                <!-- 学生使用手册 -->
                <li>
                    <div class="downKAA">
                        <p>博源学府在线教育为学生提供优质的在线学习平台，在这里，我们希望学生更多的去参与课堂，与同学老师互动，体验更加真实的学习环境。</p>
                        <p>学生进入学府在线教育之后，系统默认为聊天频道，学生可以进入班级和教室交流学习。</p>
                    </div>
                    <h1>学生课堂上的状态</h1>
                    <div class="downKAA">
                        <p>台上：当学生处于台上的时候，老师和同学皆可看见视频头像；</p>
                        <p>台下：当学生处于台下的时候，学生无法跟老师进行视频互动，同时也无法被其他人看见视频头像上的内容；</p>
                        <p>授权：学生得到授权后，可以使用课堂上的工具跟老师进行互动，互动内容会被其他同学看见。</p>
                    </div>
                    <h1>教室里供学生使用的工具</h1>
                    <div class="downKAA">
                        <p>移动工具：点击移动按钮，便可操作黑板上的课件等等内容；</p>
                        <p>画笔工具：画笔拥有众多颜色，可以对指定内容进行标记；</p>
                        <p>文字工具：可以使用文字工具在黑板上的内容位置打字；</p>
                        <p>截图工具：截图工具可以截课堂上的图像，同时也支持截电脑端桌面以及其他的图像；</p>
                        <p>删除工具：操作不当？没有关系，删除工具可以快速删除你在黑板上留下的文字以及图片；</p>
                        <p>举手发言：单击此功能便可引起老师注意力，快速向老师提问；</p>
                        <p>聊天框：学生可以在聊天框中和同学老师进行交流，如果学生有问题，也可以在聊天框中向老师求助。</p>
                        <div class="equ-tool">
                            <!---<img src="https://www.51btl.cn/help/tools.png">-->
                        </div>
                    </div>
                    <h1>课后评价</h1>
                    <div class="downKAA">
                        <p>每一节课程结束后，学生都可以对该节课老师的授课进行评价，收到学生的反馈后，老师可以对教学方式进行相应的调整。</p>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
export default {
  name: "help",
  components: {},
  data() {
    return {};
  }
};
</script>
<style lang='less' scoped>
.main {
  width: 100%;
  min-height: 100%;
  overflow-y: scroll;
  display: flex;
  background-color: #f1f1f1;
}

#right-meun {
  width: 100%;
}

#right_html {
  width: 90%;
  margin-top: 54px;
}

#right_html h1 {
  font-size: 24px;
  font-weight: bold;
  padding: 20px 0;
  text-align: left;
}

/* 课前准备 */
.class-ready > div {
  min-width: 700px;
  display: flex;
  align-items: center;
  margin-bottom: 40px;
}

.class-ready > div > img {
  width: 246px;
  height: 160px;
  margin-right: 50px;
}

.class-ready > div p {
  font-size: 20px;
  line-height: 20px;
}

.class-ready > div:first-child > img {
  height: 196px;
}

.downKAA > div {
  display: flex;
}

.downKAA > p {
  font-size: 22px;
  line-height: 40px;
}

.downKAA > p > a {
  color: #6095de;
  text-decoration: none;
}

.downKAA > div {
  margin-top: 20px;
  margin-bottom: 30px;
}
</style>