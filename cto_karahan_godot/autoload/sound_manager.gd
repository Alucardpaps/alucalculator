extends Node

## SoundManager: Manages SFX playback with automated programmatic fallback if sound files are missing.

var sounds: Dictionary = {}
var active_players: Dictionary = {}

# Paths to asset files
const SFX_PATHS = {
	"machine_work": "res://assets/sounds/machine_work.ogg",
	"tea_pour": "res://assets/sounds/tea_pour.ogg",
	"dog_bark": "res://assets/sounds/dog_bark.ogg",
	"cat_meow": "res://assets/sounds/cat_meow.ogg",
	"bird_chirp": "res://assets/sounds/bird_chirp.ogg",
	"alarm_crunch": "res://assets/sounds/alarm_crunch.ogg",
	"cash_register": "res://assets/sounds/cash_register.ogg",
	"notification": "res://assets/sounds/notification.ogg",
	"day_end": "res://assets/sounds/day_end.ogg"
}

func _ready() -> void:
	# Attempt to load sound files from disk, or set up synthetic fallback templates
	for sound_name in SFX_PATHS:
		var path = SFX_PATHS[sound_name]
		if ResourceLoader.exists(path):
			sounds[sound_name] = load(path)
		else:
			print("🔊 Sound file '%s' not found. Using synthetic fallback." % path)
			sounds[sound_name] = null # Marks it for synth playback

## Plays a sound effect once. If the file is missing, synthesizes a sound.
func play(sound_name: String) -> void:
	if not sounds.has(sound_name):
		print("❌ Unknown sound: ", sound_name)
		return
		
	var stream = sounds[sound_name]
	var player = AudioStreamPlayer.new()
	add_child(player)
	
	if stream != null:
		player.stream = stream
		player.finished.connect(player.queue_free)
		player.play()
	else:
		# Synthesize a fallback beep/sfx programmatically so the game is not silent!
		synthesize_sound(player, sound_name)

## Plays a looped sound effect and returns a player ID to stop it later.
func play_loop(sound_name: String) -> String:
	if not sounds.has(sound_name):
		return ""
		
	var loop_id = sound_name + "_" + str(Time.get_ticks_msec())
	var player = AudioStreamPlayer.new()
	add_child(player)
	
	var stream = sounds[sound_name]
	if stream != null:
		player.stream = stream
		# Loop handling for stream
		# In Godot 4, OGG loop is usually configured in the import settings,
		# but we can also handle it manually via finished signal
		player.finished.connect(func(): if is_instance_valid(player): player.play())
		player.play()
	else:
		# For synth loop, we will play a short repeating synth sound
		var timer = Timer.new()
		player.add_child(timer)
		timer.wait_time = 1.0 if sound_name == "machine_work" else 2.0
		timer.timeout.connect(func(): if is_instance_valid(player): synthesize_sound(player, sound_name, false))
		timer.start()
		synthesize_sound(player, sound_name, false)
		
	active_players[loop_id] = player
	return loop_id

## Stops a looped sound effect.
func stop_loop(loop_id: String) -> void:
	if active_players.has(loop_id):
		var player = active_players[loop_id]
		if is_instance_valid(player):
			player.stop()
			player.queue_free()
		active_players.erase(loop_id)

## Programmatic Sound Synthesizer using AudioStreamGenerator
func synthesize_sound(player: AudioStreamPlayer, sound_name: String, auto_free: bool = true) -> void:
	var generator = AudioStreamGenerator.new()
	generator.mix_rate = 22050
	generator.buffer_length = 0.5
	player.stream = generator
	player.play()
	
	var playback = player.get_stream_playback()
	if playback == null:
		player.queue_free()
		return
	var sample_rate = generator.mix_rate
	
	# Design tones for different sound names
	var tone_freq = 440.0
	var duration = 0.2
	var type = "sine"
	
	match sound_name:
		"notification":
			tone_freq = 880.0
			duration = 0.15
		"cash_register":
			tone_freq = 1200.0
			duration = 0.25
			type = "square"
		"alarm_crunch":
			tone_freq = 220.0
			duration = 0.4
			type = "sawtooth"
		"dog_bark":
			tone_freq = 150.0
			duration = 0.18
			type = "noise"
		"cat_meow":
			tone_freq = 600.0
			duration = 0.3
			type = "sine"
		"bird_chirp":
			tone_freq = 1500.0
			duration = 0.1
		"machine_work":
			tone_freq = 100.0
			duration = 0.5
			type = "sawtooth"
		"tea_pour":
			tone_freq = 800.0
			duration = 0.4
			type = "noise"
		"day_end":
			tone_freq = 554.37 # C#5
			duration = 0.6
			
	var frames_needed = int(sample_rate * duration)
	var phase = 0.0
	
	var points = PackedVector2Array()
	points.resize(frames_needed)
	
	for i in range(frames_needed):
		var t = float(i) / sample_rate
		var val = 0.0
		
		# Fade out envelope
		var envelope = 1.0 - (t / duration)
		
		if type == "sine":
			val = sin(phase * TAU)
		elif type == "square":
			val = 1.0 if sin(phase * TAU) >= 0 else -1.0
		elif type == "sawtooth":
			val = (phase * 2.0) - 1.0
		elif type == "noise":
			val = randf_range(-1.0, 1.0)
			
		# Apply frequency slide for meow and bark
		var current_freq = tone_freq
		if sound_name == "cat_meow":
			current_freq = tone_freq + (t * 400.0) # sliding up
		elif sound_name == "dog_bark":
			current_freq = tone_freq - (t * 300.0) # sliding down
			
		phase = fmod(phase + current_freq / sample_rate, 1.0)
		
		var sample = val * 0.15 * envelope
		points[i] = Vector2(sample, sample)
		
	# Push the generated buffer
	playback.push_buffer(points)
	
	if auto_free:
		var timer = Timer.new()
		player.add_child(timer)
		timer.wait_time = duration + 0.1
		timer.one_shot = true
		timer.timeout.connect(player.queue_free)
		timer.start()
