<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
  export default {
    name: "App",
    created() {
      if (sessionStorage.getItem("store")) {
        this.$store.replaceState(Object.assign({},this.$store.state,JSON.parse(sessionStorage.getItem("store"))));
      }

      window.addEventListener("beforeunload", () => {
          sessionStorage.setItem("store", JSON.stringify(this.$store.state));
          window.TicExample.tic.quitClassroom();
          window.TicExample.tic.logout();
      })
    }
  };
</script>

<style lang='less'>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 16px;
    color: #2c3e50;
    overflow: hidden;
  }
  div{
    box-sizing: border-box;
  }
  video {
  position: relative !important;
}

audio:focus {
  border: none;
  outline: none;
  outline: 0;
}

.popover-bg {
  background: rgba(0, 0, 0, 0.6) !important;
  margin-right: 25px !important;
  .el-form-item__label {
    color: #fff !important;
  }
  .popover-tools-select {
    .tools-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid gray;
      padding-bottom: 10px;
      img {
        cursor: pointer;
        width: 30px;
        height: 30px;
      }
      img:nth-child(3) {
        transform: rotate(-45deg);
      }
    }
  }
  .color-picker-box{
      padding-top: 10px;
  }
}
.popper__arrow::after {
  border-left-color: rgba(0, 0, 0, 0.6) !important;
  transform: translateX(4px);
}

.quickly-replay,.emoji-replay{
    background-color: #414145 !important;
    border: none !important;
    .fast-replay{
        color: #c3c3c3;
    }
    .popper__arrow{
        border-top-color:#414145 !important;
    }
}
.quickly-replay{
    padding: 10px 0!important;
}
.fast-replay{
    padding: 0 10px;
}
.quickly-replay .fast-replay:hover{
    background-color: rgb(233, 233, 233);
    padding: 2px 10px;
    color: #409eff;
    font-size: 16px;
}

.emoji-replay{
    top:3rem !important;
    display: flex;
    flex-wrap: wrap;
    padding: 10px 0 0 0 !important;
    div{
        width: 35px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 25px;
        margin-bottom: 10px;
    }
    div:hover{
        font-size: 33px;
    }
}

.emoji-replay .fast-replay:hover{
    background-color: rgba(0, 0, 0,0);
    font-size: 33px;
}

.popper__arrow::after {
  content: none !important;
}
.el-icon-loading{
    font-size: 20px;
    margin-bottom: 5px;
}

.create-isLoading{
    .el-loading-spinner{
        .circular{
            display: none;
        }
        background: url(./assets/img/vloading.gif) no-repeat;
        background-size: 135px 135px;
        width: 100%;
        height: 100%;
        position: relative;
        top: 40% !important;
        left: 42%;
    }
    .el-loading-spinner:after{
        content: '连接教室中...';
        color: #fff;
        position: absolute;
        left: 35px;
        top: 135px;
    }
}

.el-notification__title,.el-notification__content p{
  text-align: left;
}
</style>
