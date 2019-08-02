<template>
<div v-show='showModal' class="modal fade" :class="[showModal? 'show': '']" tabindex="-1" role="dialog" aria-labelledby="settingModalLabel" ref="idModal" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">Settings</div>
            </div>
            <div class="modal-body">
                <div v-if="audioInputDevices.length" class="row">
                    <label>Microphone:</label>
                    <select class="form-control" id="audio-input-device" @change='initAudioInputMeter'>
                        <option value=null>— Select One —</option>
                        <option v-for="(device, index) in audioInputDevices" :key="index" :value="device.deviceId" :selected="!!audioInputDevice && audioInputDevice==device.deviceId">{{!!device.label ? device.label : 'Microphone ' + (index+1)}}</option>
                    </select>
                </div>
                <div v-if="audioInputDevices.length" class="row">
                    <label>Audio Level:</label>
                    <canvas class='level-meter' id="audio-input-meter" height='15'></canvas>
                </div>
                <div v-if="audioOutputDevices.length" class="row">
                    <label>Speakers:</label>
                    <select class="form-control" id="audio-output-device" @change='initAudioOutputMeter'>
                        <option value=null>— Select One —</option>
                        <option v-for="(device, index) in audioOutputDevices" :key="index" :value="device.deviceId" :selected="!!audioOutputDevice && audioOutputDevice==device.deviceId">{{!!device.label ? device.label : 'Speaker ' + (index+1)}}</option>
                    </select>
                </div>
                <div v-if="audioOutputDevices.length" class="row">
                    <label>Speaker Level:</label>
                    <audio src="@/../sounds/test.wav" id="audio-player" controls></audio>
                    <canvas class='level-meter' id="audio-output-meter" height='15' style='display:none;'></canvas>
                </div>

                <div v-if="videoInputDevices.length" class="row">
                    <label>Video Source:</label>
                    <select class="form-control" id="video-input-device">
                        <option value=null>— Select One —</option>
                        <option v-for="(device, index) in videoInputDevices" :key="index" :value="device.deviceId" :selected="!!videoInputDevice && videoInputDevice==device.deviceId">{{!!device.label ? device.label : 'Camera ' + (index+1)}}</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" id="btn-save-setting" class="btn btn-primary" @click="saveSettings">Save</button>
                <button type="button" id="btn-save-setting" class="btn btn-primary" @click="closeModal">Close</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
/* eslint-disable */ 
import Vue from 'vue'
import { mapState } from 'vuex'
import axios from "axios";
import volumeMixin from '../mixins/volume'

export default {
  	name: 'Setting',
    mixins: [volumeMixin],
  	data() {
		return {
            showModal: false,
            levelMeterLength: 0,
            audio: null,
            audioInputstream: null,
            audioInputContext: null,
            audioInputCanvasContext: null,
            audioInputStreamSource: null,
            audioInputMeter: null,
            videoInputDevices: [],
            audioInputDevices: [],
            audioOutputDevices: []
		}
	},
    computed: mapState({
        browser: state => state.browser,
        audioInputDevice: state => state.audioInputDevice,
        audioOutputDevice: state => state.audioOutputDevice,
        videoInputDevice: state => state.videoInputDevice,
    }),
    mounted() {
        var self = this;
        self.initDevices();

        Fire.$on("openSetting", () => {
            self.showModal = true;
            self.initAudioInputMeter();
            self.initAudioOutputMeter();
        });
    },
    methods: {
        initDevices() {
            var self = this;
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.log("enumerateDevices() not supported.");
                return;
            }

            self.videoInputDevices = [];
            self.audioInputDevices = [];
            self.audioOutputDevices = [];

            // List cameras and microphones.
            navigator.mediaDevices.enumerateDevices().then(function(devices) {
                for (var i = 0; i < devices.length; i++) {
                    if (devices[i].kind === 'videoinput') {
                        self.videoInputDevices.push(devices[i]);
                    }
                    if (devices[i].kind === 'audioinput') {
                        self.audioInputDevices.push(devices[i]);
                    }
                    if (devices[i].kind === 'audiooutput') {
                        self.audioOutputDevices.push(devices[i]);
                    }
                }

                if (!self.audioInputDevice && self.audioInputDevices.length) {
                    self.$store.dispatch('setAudioInputDevice', self.audioInputDevices[0].deviceId);
                }
                if (!self.audioOutputDevice && self.audioOutputDevices.length) {
                    self.$store.dispatch('setAudioOutputDevice', self.audioOutputDevices[0].deviceId);
                }
                if (!self.videoInputDevice && self.videoInputDevices.length) {
                    self.$store.dispatch('setVideoInputDevice', self.videoInputDevices[0].deviceId);
                }
            })
            .catch(function(err) {
                console.log(err.name + ": " + err.message);
            });
        },
        initAudioInputMeter() {
            var self = this;
            if (!!self.audioInputCanvasContext) {
                self.audioInputCanvasContext.clearRect(0, 0, self.levelMeterLength, 15);
            } else {
                self.audioInputCanvasContext = $("#audio-input-meter")[0].getContext("2d");
            }

            if (!self.audioInputContext) {
                self.audioInputContext = new AudioContext();
            }
            
            var audioInputDevice = $('#audio-input-device').val();
            if (!audioInputDevice) 
                return;

            if (!!self.audioInputstream) {
                self.audioInputstream.getTracks().forEach(function(track) {
                    track.stop();
                });
                self.audioInputstream = null;
            }

            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            navigator.getUserMedia({
                audio: {
                    deviceId: { exact: audioInputDevice }
                },
            }, self.audioInputDeviceGranted, self.audioInputDeviceDenied);
        },
        audioInputDeviceGranted(stream) {
            var self = this;
            self.audioInputStreamSource = self.audioInputContext.createMediaStreamSource(stream);
            self.audioInputMeter = self.createAudioMeter(self.audioInputContext);
            self.audioInputStreamSource.connect(self.audioInputMeter);
            self.audioInputstream = stream;

            self.checkAudioInputLevel();
        },
        audioInputDeviceDenied(error) {
            alert("Could not access the selected audio input.");
        },
        getLevelMeterLength() {
            var self = this;
            var meter = $('#audio-input-meter'); 
            if (!!meter) {
                self.levelMeterLength = $('#audio-input-meter').width();
            }
        },
        checkAudioInputLevel() {
            var self = this;
            if (!self.showModal)
                return;

            self.getLevelMeterLength();
            self.audioInputCanvasContext.clearRect(0, 0, self.levelMeterLength, 15);
            self.audioInputCanvasContext.fillStyle = "green";
            self.audioInputCanvasContext.fillRect(0, 0, self.audioInputMeter.volume * self.levelMeterLength * 1.4, 15);

            requestAnimationFrame(self.checkAudioInputLevel);
        },
        initAudioOutputMeter() {
            var self = this;
            if (!!self.audioOutputCanvasContext) {
                self.audioOutputCanvasContext.clearRect(0, 0, self.levelMeterLength, 15);
            } else {
                self.audioOutputCanvasContext = $("#audio-output-meter")[0].getContext("2d");
            }

            if (!self.audio) {
                self.audio = document.getElementById("audio-player");
            }

            self.audio.pause();
            self.audio.currentTime = 0;
            self.audio.setSinkId(self.audioOutputDevice).then(() => {
                self.checkAudioOutputLevel();
            });
        },
        checkAudioOutputLevel() {
            var self = this;
            if (!self.audio || !self.showModal)
                return;

            self.getLevelMeterLength();
            self.audioOutputCanvasContext.clearRect(0, 0, self.levelMeterLength, 15);
            self.audioOutputCanvasContext.fillStyle = "green";
            self.audioOutputCanvasContext.fillRect(0, 0, self.audio.volume * self.levelMeterLength * 1.4, 15);

            requestAnimationFrame(self.checkAudioOutputLevel);
        },
        saveSettings() {
            var self = this;

            var audioInputDevice = null;
            if (self.audioInputDevices.length) {
                audioInputDevice = $('#audio-input-device').val();
                if (audioInputDevice == 'null') {
                    alert('Please select Audio Input Device.');
                    return;
                }
            }

            var audioOutputDevice = null;
            if (self.audioOutputDevices.length) {
                audioOutputDevice = $('#audio-output-device').val();
                if (audioOutputDevice == 'null') {
                    alert('Please select Audio Output Device.');
                    return;
                }
            }

            var videoInputDevice = null;
            if (self.videoInputDevices.length) {
                videoInputDevice = $('#video-input-device').val();
                if (videoInputDevice == 'null') {
                    alert('Please select Video Input Device.');
                    return;
                }
            }
            
            var isChanged = self.audioInputDevice != audioInputDevice || 
                            self.audioOutputDevice != audioOutputDevice || 
                            self.videoInputDevice != videoInputDevice;

            self.$store.dispatch('setAudioInputDevice', audioInputDevice);
            self.$store.dispatch('setAudioOutputDevice', audioOutputDevice);
            self.$store.dispatch('setVideoInputDevice', videoInputDevice);

            self.showModal = false;
            self.freeAudioResources();

            self.$emit('deviceChanged');
        },
        closeModal() {
            var self = this;
            self.showModal = false;
            self.freeAudioResources();
        },
        freeAudioResources() {
            var self = this;
            if (!!self.audioInputContext) {
                if (!!self.audioInputstream) {
                    self.audioInputstream.getTracks().forEach(function(track) {
                        track.stop();
                    });
                    self.audioInputstream = null;
                }
                self.audioInputContext.close();
                self.audioInputContext = null;
            }

            if (!!self.audio) {
                self.audio.pause();
                self.audio.currentTime = 0;
            }
        }
    }
}
</script>