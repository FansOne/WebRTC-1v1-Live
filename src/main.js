import Vue from 'vue'
import App from './App.vue'

import TRTC from "trtc-js-sdk";
import TIM from 'tim-js-sdk';
import 'normalize.css/normalize.css'
import 'lib-flexible'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import Viewer from 'v-viewer'
import 'viewerjs/dist/viewer.css'
import store from './store'
import router from './router'
import './assets/iconfont/iconfont.css';


window.TRTC = TRTC
window.TIM = TIM
Vue.use(ElementUI);
Vue.use(Viewer)
Viewer.setDefaults({
  Options: { "inline": true, "button": true, "navbar": true, "title": true, "toolbar": true, "tooltip": true, "movable": true, "zoomable": true, "rotatable": true, "scalable": true, "transition": true, "fullscreen": true, "keyboard": true, "url": "data-source" }
});

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
