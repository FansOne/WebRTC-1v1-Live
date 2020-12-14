import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'checkEnv',
    meta:{
      isLogin:true
    },
    component: () => import('../views/checkEnv.vue')
  },
  {
    path: '/index',
    name: 'index',
    meta:{
      isLogin:true
    },
    component: () => import('../views/index.vue')
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('../views/help')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login.vue')
  },
]

const router = new VueRouter({
  routes
})

router.beforeEach((to,from,next)=>{
  if(to.matched.some(res=>res.meta.isLogin)){
      let SITE_CONFIG_ = JSON.parse(sessionStorage.getItem('SITE_CONFIG'));
      if (SITE_CONFIG['TOKEN'] || (SITE_CONFIG_ != null && SITE_CONFIG_['TOKEN'])) {
          next();
      }else{
          next("/login");
      }
  }else{
      next()
  }
});

export default router
