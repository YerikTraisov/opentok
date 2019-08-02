import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)
const debug = process.env.NODE_ENV !== "production"

export default new Vuex.Store({
    state: {
        browser: null,
        sessionId: null,
        sessionConnected: null,
        userId: null,
        userToken: null,
        audioInputDevice: null,
        audioOutputDevice: null,
        videoInputDevice: null,
        histories: []
    },
    mutations: {
        setBrowser(state, browser) {
            state.browser = browser;
        },
        setSessionId(state, sessionId) {
            state.sessionId = sessionId;
        },
        setSessionConnected(state, sessionConnected) {
            state.sessionConnected = sessionConnected;
        },
        setUserId(state, userId) {
            state.userId = userId;
        },
        setUserToken(state, userToken) {
            state.userToken = userToken;
        },
        setAudioInputDevice(state, audioInputDevice) {
            state.audioInputDevice = audioInputDevice;
        },
        setAudioOutputDevice(state, audioOutputDevice) {
            state.audioOutputDevice = audioOutputDevice;
        },
        setVideoInputDevice(state, videoInputDevice) {
            state.videoInputDevice = videoInputDevice;
        },
        addChatHistory(state, data) {
            var shouldAppend = true;
            if (state.histories.length) {
                var last = state.histories[state.histories.length - 1];
                shouldAppend = last.timestamp != data.timestamp;
            }
            if (shouldAppend) {
                state.histories.push(data);
            }
        }
    },
    actions: {
        setBrowser({ commit }, browser) {
            commit('setBrowser', browser);
        },
        setSessionId({ commit }, sessionId) {
            commit('setSessionId', sessionId);
        },
        setSessionConnected({ commit }, sessionConnected) {
            commit('setSessionConnected', sessionConnected);
        },
        setUserId({ commit }, userId) {
            commit('setUserId', userId);
        },
        setUserToken({ commit }, userToken) {
            commit('setUserToken', userToken);
        },
        setAudioInputDevice({ commit }, audioInputDevice) {
            commit('setAudioInputDevice', audioInputDevice);
        },
        setAudioOutputDevice({ commit }, sessionId) {
            commit('setAudioOutputDevice', sessionId);
        },
        setVideoInputDevice({ commit }, videoInputDevice) {
            commit('setVideoInputDevice', videoInputDevice);
        },
        addChatHistory({ commit }, data) {
            commit('addChatHistory', data);
        }
    },
    strict: debug
})