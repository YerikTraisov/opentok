import Vue from 'vue'
import Router from 'vue-router'

/*components*/
import Main from '../views/Main'

Vue.use(Router)

let router = new Router({
    routes: [
        { path: '/home', name: 'home', component: Main },
    ]
})

export default router
