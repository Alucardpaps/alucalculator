extends Control

## MainMenu Controller: Manages opening game screen options.

@onready var start_btn: Button = $MarginContainer/VBoxContainer/StartBtn
@onready var exit_btn: Button = $MarginContainer/VBoxContainer/ExitBtn

func _ready() -> void:
	start_btn.pressed.connect(_on_start_pressed)
	exit_btn.pressed.connect(_on_exit_pressed)

func _on_start_pressed() -> void:
	SoundManager.play("notification")
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_exit_pressed() -> void:
	SoundManager.play("notification")
	get_tree().quit()
