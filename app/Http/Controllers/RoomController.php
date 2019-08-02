<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Config;

use App\Models\Room;

use OpenTok\OpenTok;

class RoomController extends Controller
{
    public function createRoom()
    {
        $room = Room::where('is_active', true)->get();
        if (!count($room)) {
            $recording = Config::get('const.RECORDING');
            $apiKey = Config::get('const.OPENTOK_API_KEY');
            $apiSecret = Config::get('const.OPENTOK_API_SECRET');

            $options = $recording ? ['archiveMode' => ArchiveMode::ALWAYS, 'mediaMode' => MediaMode::ROUTED] : [];

            $opentok = new OpenTok($apiKey, $apiSecret);
            $session = $opentok->createSession($options);
            $sessionId = $session->getSessionId();

            $room = Room::create(['session_id' => $sessionId]);
        }

        return response()->json(['success' => true, 'message' => 'ok', 'room' => $room], 200);
    }

    public function generateToken(Request $request) {
        $input = $request->input();
        $validator = Validator::make($input, ['userId' => 'required|string']);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'User Id is missed.'], 422);
        }

        $room = Room::where('is_active', true)->get();
        if (!count($room)) {
            return response()->json(['success' => false, 'message' => 'room does not exist.'], 404);
        }
        
        $apiKey = Config::get('const.OPENTOK_API_KEY');
        $apiSecret = Config::get('const.OPENTOK_API_SECRET');

        $opentok = new OpenTok($apiKey, $apiSecret);
        $data = ['userId' => $request->userId];
        $token = $opentok->generateToken($room[0]->session_id, ['data' => json_encode($data)]);

        return response()->json(['success' => true, 'message' => 'ok', 'token' => $token], 200);
    }

    public function addChatHistory(Request $request) {
        // This is where the chat message should be saved to the database
        echo $request->history;
        echo $request->time;
    }

    public function uploadFile(Request $request) {
        $file = $request->file('file');
        $directory = public_path() . "/uploads";
        $filename = $file->getClientOriginalName();
        $fileExtension = pathinfo($filename, PATHINFO_EXTENSION);
        $saveAs = str_replace('.'.$fileExtension, '', $filename);
        $saveAs .= '_'.uniqid().'.'.$fileExtension;
        $file->move($directory, $saveAs);

        $url = url('/').'/uploads/'.$saveAs;
        return response()->json(['success' => true, 'message' => 'ok', 'url' => $url, 'filename' => $filename], 200);
    }
}
