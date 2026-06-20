class_name Prey
extends CharacterBody2D

## Prey entity: Represents dead mice or birds dropped by domesticated animals.
## Workers refuse to work at stations containing prey until clicked and cleaned.

var prey_id: String = ""
var prey_type: String = "" # "mouse", "bird"
var ws_id: String = ""
var age: int = 0

@onready var icon_label: Label = $Visual/IconLabel

func _ready() -> void:
	input_pickable = true
	update_visuals()

func setup(p_id: String, p_type: String, p_ws: String, p_age: int) -> void:
	prey_id = p_id
	prey_type = p_type
	ws_id = p_ws
	age = p_age
	
	# Position directly at the workstation with a slight random offset
	var ws_node: Node2D = GameManager.get_workstation_node(ws_id)
	if ws_node:
		var offset: Vector2 = Vector2(randf_range(-40, 40), randf_range(-10, 10))
		global_position = ws_node.global_position + offset
		
	update_visuals()

func update_visuals() -> void:
	if not is_node_ready():
		return
	if icon_label:
		match prey_type:
			"mouse": icon_label.text = "💀🐀"
			"bird": icon_label.text = "💀🐦"
			_: icon_label.text = "💀"

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if not GameManager.selected_factory_type.is_empty():
		return
	# Clean on click
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		GameManager.clean_prey(prey_id)
