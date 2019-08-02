<template>
<div class="page main">
    <div class="row" style='flex:1 1 0'>
        <video-call class='col-xl-8 col-md-8 col-12'></video-call>
        <chat-history class='col-xl-4 col-md-4 col-12'></chat-history>
    </div>
</div>
</template>

<script>
/* eslint-disable */ 
import axios from "axios";

import VideoCall from '../components/VideoCall'
import ChatHistory from '../components/ChatHistory'

export default {
    name: 'Main',
    components: {
        VideoCall,
        ChatHistory
    },
    methods: {
    }
};

</script>