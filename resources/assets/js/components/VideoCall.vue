<template>
<div class='video-panel'>
    <div class='receiver-video-area'>
        <div class='receiver-name'>User {{!!userId ? userId : ''}}</div>
        <div class='receiver-video-content-wrapper'>
            <div id='receiver-video-content'></div>
        </div>
        <div class='sender-video-area'>
            <div class='sender-video-content-wrapper'>
                <div id='sender-video-content'></div>
            </div>
        </div>
    </div>
    <div class='btn-group'>
        <button class='btn btn-control' :class="[!!session ? 'btn-red' : 'btn-white']" @click='toggleConnection' :disabled='!sessionId || !userToken'>
            <i class='fa fa-phone'></i>
        </button>
        <button class='btn btn-control btn-white' @click='toggleMicrophone' :disabled='!sessionId'>
            <i class='fa' :class="[publishAudio ? 'fa-microphone' : 'fa-microphone-slash']"></i>
        </button>
        <button class='btn btn-control btn-white' @click='toggleCamera' :disabled='!sessionId'>
            <i class='fa' :class="[publishVideo ? 'fa-video-camera' : 'fa-video-camera-slash']"></i>
        </button>
        <button class='btn btn-control btn-white' :class="[screenSharing?'active':'']" @click='toggleScreen' :disabled='!sessionId'>
            <i class='fa fa-desktop'></i>
        </button>
        <button class='btn btn-control btn-white' @click="changeSetting" :disabled='!sessionId'>
            <i class='fa fa-cog'></i>
        </button>
    </div>

    <setting @deviceChanged='deviceChanged'></setting>
</div>
</template>

<script>
/* eslint-disable */ 
import Setting from './Setting'
import { mapState } from 'vuex'
import axios from 'axios';

export default {
    name: 'VideoCall',
    components: {
      Setting,
    },
    data() {
        return {
            session: null,
            publisher: null,
            publisherInitialized: false,
            publishAudio: true,
            publishVideo: true,
            screenSharing: false
        }
    },
    computed: mapState({
        browser: state => state.browser,
        userId: state => state.userId,
        sessionId: state => state.sessionId,
        sessionConnected: state => state.sessionConnected,
        userToken: state => state.userToken,
        audioInputDevice: state => state.audioInputDevice,
        audioOutputDevice: state => state.audioOutputDevice,
        videoInputDevice: state => state.videoInputDevice,
        histories: state => state.histories,
    }),
    mounted() {
        var self = this;
        var userId = self.$route.query.user;
        var browserInfo = navigator.userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

        self.$store.dispatch('setUserId', userId);
        self.$store.dispatch('setBrowser', browserInfo[1]);

        Fire.$on("addChatHistory", (history, timestamp) => {
            self.session.signal({ type: 'chat', data: { history:history, timestamp:timestamp } });
        });

        self.createRoom();
    },
    methods: {
        createRoom() {
            var self = this;
            axios.post(self.apiUrl + 'room')
            .then(response => {
                if (!!response.data && response.data.room.length) {
                    var sessionId = response.data.room[0].session_id;
                    self.$store.dispatch('setSessionId', sessionId);
                    self.getToken();
                }
            })
            .catch(error => {
                console.log('failed to create chat room');
            });
        },
        getToken() {
            var self = this;
            axios.post(self.apiUrl + 'token', {
                userId: self.userId
            })
            .then(response => {
                if (!!response.data && response.data.token) {
                    var userToken = response.data.token;
                    self.$store.dispatch('setUserToken', userToken);
                    self.toggleConnection();
                }
            })
            .catch(error => {
                console.log('failed to login room.');
            });
        },
        checkStatus() {
            var self = this;
            if (!self.sessionId) {
                alert('Invalid Session Id');
                return;
            }
            if (!self.userToken) {
                alert('Invalid User Token.');
                return;
            }
            if (!self.audioInputDevice) {
                alert('please select Audio Input Device.');
                return false;
            }
            if (self.browser != 'Firefox' && !self.audioOutputDevice) {
                alert('please select Audio Output Device.');
                return false;
            }
            if (!self.videoInputDevice) {
                alert('please select Video Source.');
                return false;
            }
            return true;
        },
        getSetting() {
            var self = this;
            var settings = {
                insertMode: "replace",
                width: "100%",
                height: "100%",
                showControls: false,
                publishAudio: self.publishAudio,
                publishVideo: self.screenSharing ? true : self.publishVideo,
                audioSource: self.audioInputDevice,
                videoSource: self.screenSharing ? 'screen' : self.videoInputDevice
            };

            return settings;
        },
        initPublisher() {
            var self = this;
            var settings = self.getSetting();

            if (!!self.publisher) {
                if (!!self.session) {
                    self.session.unpublish(self.publisher);
                }
                self.publisher.destroy();
                self.publisher = null;
            }

            self.checkPubSubBlock('sender-video-content');
            self.publisher = OT.initPublisher('sender-video-content', settings, function(error) {
                if (error) {
                    if (error.name === 'OT_USER_MEDIA_ACCESS_DENIED') {
                        console.log('Please allow access to the Camera and Microphone and try publishing again.');
                    } else {
                        console.log('Failed to get access to your Camera or Microphone. Please check that your webcam is connected and not being used by another application and try again.');
                    }
                    self.publisher.destroy();
                    self.publisher = null;
                } else {
                    self.publisherInitialized = true;
                    self.publish();
                }
            });

            self.publisher.on({
                streamCreated: function (event) {                    
                    console.log("Publisher started streaming.");
                    // self.publishAudio = event.stream.hasAudio;
                    // self.publishVideo = self.screenSharing ? self.publishVideo : event.stream.hasVideo;
                },
                streamDestroyed: function (event) {
                    event.preventDefault();
                    if (event.reason === 'networkDisconnected') {
                        console.log('Your publisher lost its connection. Please check your internet connection and try publishing again.');
                    }
                    else if (event.reason === 'mediaStopped' || event.reason === 'forceUnpublished') {
                        if(!!event.stream && event.stream.videoType === 'screen') {
                            self.toggleScreen();
                        }
                    }
                }
            });
        },
        initSession() {
            var self = this;
            var settings = self.getSetting();

            if (OT.checkSystemRequirements() == 1) {
                self.session = OT.initSession(self.opentokApiKey, self.sessionId);
                if (!self.session) return;

                // Connect to the session
                self.session.connect(self.userToken, function(error) {
                    if (error) {
                        console.log("Error connecting: ", error.name, error.message);
                    } else {
                        if (!!self.session && self.session.capabilities.publish == 1) {
                            self.$store.dispatch('setSessionConnected', true);
                            self.publish();
                        } else {
                            console.log("You cannot publish an audio-video stream.");
                        }
                    }
                });

                self.session.on({
                    sessionReconnecting: function(event) {
                        console.log("Reconnecting now...");
                    },
                    sessionReconnected: function(event) {
                        console.log("Your network connection has been reconnected.");
                    },
                    sessionDisconnected: function(event) {
                        if (event.reason == "networkDisconnected") {
                            self.$store.dispatch('setSessionConnected', false);
                            console.log("Your network connection has been terminated.");
                        }
                    },
                    connectionCreated: function (event) {
                        if (!!self.session && event.connection.connectionId != self.session.connection.connectionId) {
                            var data = JSON.parse(event.connection.data);
                            if (!!data) {
                                console.log(data.userId + " has joined in this rooom.");
                            }
                        }
                    },
                    connectionDestroyed: function(event) {
                        if (!!self.session && event.connection.connectionId != self.session.connection.connectionId) {
                            var data = JSON.parse(event.connection.data);
                            if (!!data) {
                                console.log(data.userId + " has left from this rooom.");
                            }
                        }
                    },
                    streamCreated: function(event) {
                        self.checkPubSubBlock('receiver-video-content');
                        self.session.subscribe(event.stream, 'receiver-video-content', settings, function(error) {
                            if (error) {
                                console.log(error);
                            }
                        });
                    },
                    streamDestroyed: function (event) {
                        event.preventDefault();        
                        if (event.reason === 'networkDisconnected') {
                            console.log('Lost connection. This could be due to your internet connection');
                        }
                    },
                    signal: function(event) {
                        var data = JSON.parse(event.from.data);
                        if (event.type == 'signal:chat') {
                            var classes = data.userId == self.userId ? 'chat-username sender' : 'chat-username receiver';
                            var history = event.data.history.replace(/chat-username/, classes);
                            var timestamp = event.data.timestamp;
                            self.$store.dispatch('addChatHistory', {history:history, timestamp:timestamp});		
                        }
                    }
                });
            }
            else {
                console.log('Your browser does not support WebRTC.');
            }
        },
        publish() {
            var self = this;
            if (!self.session || !self.publisher || !self.sessionConnected || !self.publisherInitialized) {
                return;
            }

            self.session.publish(self.publisher, function(error) {
                if (error) {
                    switch (error.name) {
                        case "OT_NOT_CONNECTED":
                            console.log("Publishing your video failed. You are not connected to the internet.");
                            break;
                        case "OT_CREATE_PEER_CONNECTION_FAILED":
                            console.log("Publishing your video failed. This could be due to a restrictive firewall.");
                            break;
                        default:
                            console.log("An unknown error occurred while trying to publish your video. Please try again later.");
                    }
                    self.publisher.destroy();
                    self.publisher = null;
                }
            });
        },
        toggleConnection() {
            var self = this;
            if (!!self.session) {  // terminate
                if (!!self.publisher) {
                    self.session.unpublish(self.publisher);
                    self.publisher.destroy();
                    self.publisher = null;
                }
                self.$store.dispatch('setSessionConnected', false);
                self.session.disconnect();
                self.session = null;
            }
            else { // connect
                if (!self.checkStatus()) 
                    return;

                self.initSession();
                self.initPublisher();
            }
        },
        toggleMicrophone() {
            var self = this;
            self.publishAudio = !self.publishAudio;
            if (!!self.session && !!self.publisher) {
                self.publisher.publishAudio(self.publishAudio);
            }
        },
        toggleCamera() {
            var self = this;
            self.publishVideo = !self.publishVideo;
            if (!!self.session && !!self.publisher) {
                self.publisher.publishVideo(self.publishVideo);
            }
        },
        toggleScreen() {
            var self = this;
            var canPublish = true;
            self.screenSharing = !self.screenSharing;
            OT.checkScreenSharingCapability(function(response) {
                if(!response.supported || response.extensionRegistered === false) {
                    canPublish = false;
                    alert('This browser does not support screen sharing.');
                } else if (response.extensionRequired && !response.extensionInstalled) {
                    canPublish = false;
                    alert('Please install the screen-sharing extension and load this page over HTTPS.');
                }
            });

            if(!!self.session && canPublish) {
                self.initPublisher();
            }
        },
        changeSetting() {
            Fire.$emit('openSetting')
        },
        checkPubSubBlock(pubsubId) {
            var pubsubBlock = "<div id='" + pubsubId + "'></div>";
            var pubsubWrapper = $("."+pubsubId+"-wrapper");
            if (!pubsubWrapper.find("#"+pubsubId).length) {
                pubsubWrapper.append(pubsubBlock);
            }
        },
        deviceChanged() {
            var self = this;
            if (!!self.session && !!self.publisher) {
                self.initPublisher();
            }
        }
    },
};

</script>