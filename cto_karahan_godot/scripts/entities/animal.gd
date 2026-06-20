class_name Animal
extends CharacterBody2D

## Animal entity: Represents cats, dogs, and birds visiting the factory.
## Can be clicked to feed/interact, which increases trust and domestication.

@export var speed: float = 120.0

var animal_id: String = ""
var animal_type: String = "" # "kedi", "kopek", "kus"
var ws_id: String = ""
var duration: int = 40

var target_pos: Vector2 = Vector2.ZERO

@onready var sprite: Sprite2D = $Visual/Sprite2D
@onready var icon_label: Label = $Visual/IconLabel

func _ready() -> void:
	input_pickable = true
	target_pos = global_position
	update_visuals()

func setup(p_id: String, p_type: String, p_ws: String, p_duration: int) -> void:
	animal_id = p_id
	animal_type = p_type
	ws_id = p_ws
	duration = p_duration
	
	# Position near the target workstation
	var ws_node: Node2D = GameManager.get_workstation_node(ws_id)
	if ws_node:
		# Add a slight random offset so they don't stack directly on top of workers
		var offset: Vector2 = Vector2(randf_range(-30, 30), randf_range(20, 50))
		target_pos = ws_node.global_position + offset
		global_position = ws_node.global_position + Vector2(randf_range(-150, -100), 0) # Spawn off-center
	else:
		target_pos = global_position
		
	update_visuals()
 
func _physics_process(_delta: float) -> void:
	if global_position.distance_to(target_pos) > 5.0:
		var dir: Vector2 = (target_pos - global_position).normalized()
		velocity = dir * speed
		move_and_slide()
	else:
		velocity = Vector2.ZERO

func update_visuals() -> void:
	if not is_node_ready():
		return
	if icon_label:
		match animal_type:
			"kedi": icon_label.text = "🐱"
			"kopek": icon_label.text = "🐶"
			"kus": icon_label.text = "🐦"
			_: icon_label.text = "🐾"

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if not GameManager.selected_factory_type.is_empty():
		return
	# Feed/interact on click
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		GameManager.interact_animal(animal_id)
