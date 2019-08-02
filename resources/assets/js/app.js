import 'babel-polyfill'
import Vue from 'vue'
import jQuery from 'jQuery'

import Vueditor from 'vueditor/dist/script/vueditor.min.js'
import Emoji from 'vueditor/dist/plugins/emoji.min.js'
import 'vueditor/dist/style/vueditor.min.css'

import router from './router'
import store from './store'
import App from './views/App'

import '../sass/custom.scss'

window.jQuery = jQuery;
window.Fire = new Vue();
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// const baseURL = 'http://localhost/WebRTC/public/';
const baseURL = 'https://webrtc.rayvensoft.com/';
Vue.mixin({
    data: function () {
        return {
            get apiUrl() {
                return baseURL + 'api/';
            },
            get opentokApiKey() {
                return '46323842';
            }
        }
    }
});

let config = {
    toolbar: [
        'bold', 'italic', 'underline', 'emoji'
    ],
    emoji: ["1f600", "1f601", "1f602", "1f923", "1f603"],
    plugins: [{
        name: 'emoji',
        element: {
            type: 'button',
            lang: { title: 'Emoji' },
            className: 'icon-smile-o'
        },
        component: Emoji
    }]
};
Vue.use(Vueditor, config);

new Vue({
    el: '#app',
    router,
    store,
    components: { App },
    template: '<App/>'
})
