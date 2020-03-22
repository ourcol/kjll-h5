import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// import Vconsole from 'vconsole'
import { Swipe,SwipeItem,Button,Uploader,PullRefresh,ImagePreview,Lazyload, Grid, GridItem,Image,CountDown,Divider ,Toast,Switch,List} from 'vant';

Vue.use(Button).use(Swipe).use(SwipeItem).use(Uploader).use(PullRefresh).use(ImagePreview).use(Lazyload).use(Grid).use(GridItem).use(Image).use(CountDown).use(Divider).use(Toast).use(Switch).use(List);
Vue.config.productionTip = false
Vue.prototype.toast=Toast

// const vConsole = new Vconsole()
// Vue.use(vConsole)
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
