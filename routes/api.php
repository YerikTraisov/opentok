<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('room', 'RoomController@createRoom');
Route::post('token', 'RoomController@generateToken');
Route::post('history', 'RoomController@addChatHistory');
Route::post('send-file', 'RoomController@uploadFile');
