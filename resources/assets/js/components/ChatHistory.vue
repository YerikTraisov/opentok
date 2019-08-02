<template>
<div class='chat-history-panel'>
    <div class='logo'><img src="images/logo.png"></div>
	<div class='chat-history'>
		<div v-for="(data, index) in histories" :key="index" v-html='data.history'></div>
	</div>
	<div class='chat-editor-wrapper'>
		<input type="file" id='file-upload' @change='sendFile' hidden>
		<div id='btn-file-upload' class='btn-custom' title="Upload File" unselectable="on">
			<i class="fa fa-paperclip"></i>
		</div>
    	<Vueditor ref='editor' @keyup='sendMessage'></Vueditor>
	</div>
</div>
</template>

<script>
/* eslint-disable */ 
import Vue from 'vue'
import { mapState } from 'vuex'
import axios from "axios";
import moment from 'moment';

export default {
  	name: 'ChatHistory',
  	data() {
		return {
			iframeDoc: null
		}
	},
	computed: mapState({
		browser: state => state.browser,
        userId: state => state.userId,
        sessionConnected: state => state.sessionConnected,
        histories: state => state.histories,
	}),
	mounted() {
		var self = this;
		setTimeout(function() {
			self.addKeyEvent();
		}, 500);

		$('.ve-toolbar').append($('#btn-file-upload'));

		$('#btn-file-upload').on('click', function() {
			$('#file-upload').val('');
			$('#file-upload').click();
		});
	},
	methods: {
		addKeyEvent() {
			var self = this;
			var children = self.$refs.editor.$children;
			for (var i = 0; i < children.length; i++) {
				if ($(children[i].$el).hasClass('ve-design')) {
					self.iframeDoc = children[i].$el.children[0].contentWindow.document;
					break;
				}
			}
			if (!!self.iframeDoc) {
				self.iframeDoc.addEventListener('keyup', function(e) {
					var code = e.keyCode ? e.keyCode : e.which;
					if (!e.shiftKey && code == 13) {
						e.preventDefault();
						self.sendMessage(self.iframeDoc.body.innerHTML);
						self.iframeDoc.body.innerHTML = '';
					}
				});
			}
		},
		sendMessage(message) {
            var self = this;
			if (!self.sessionConnected) {
				alert('You did not conenct to room yet.');
			}

			message = message.replace(/<div><br><\/div>$/, '');
			message = "<div class='chat-message'>" + message + "</div>";

			var userName = "<div class='chat-username'>User" + self.userId + "</div>";
			var chatTime = "<div class='chat-time'>" + moment(new Date()).format("HH:mm") + "</div>";

			var history = userName + "<div class='chat-message-line'>" + message + chatTime + "</div>";
			var timestamp = new Date().getTime();

            axios.post(self.apiUrl + 'history', {
                history: history,
				timestamp: timestamp
            })
            .then(response => {
				console.log('success');
            })
            .catch(error => {
                console.log('failed to login room.');
            });

			Fire.$emit("addChatHistory", history, timestamp);
		},
		sendFile() {
			var self = this;
			if (!self.sessionConnected) {
				alert('You did not conenct to room yet.');
				return;
			}

			var formData = new FormData();
			formData.append('file', $('#file-upload')[0].files[0]);
			axios.post(self.apiUrl + 'send-file', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
            .then(response => {
				var url = response.data.url;
				var filename = response.data.filename;
				var message = "<a href='" + url + "' download>" + filename+"</a>";
				self.sendMessage(message);
            })
            .catch(error => {
                console.log('failed to send file.');
            });
		}
	}
};
</script>