<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
  protected $fillable = [
    'session_id', 'is_active'
  ];

  public $timestamps = false; 
}
