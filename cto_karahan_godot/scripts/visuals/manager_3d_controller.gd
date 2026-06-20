extends CharacterBody3D

## Manager3DController: Coordinates player FSM (WalkingState, DrivingState).
## Delegates looking, physics processing, and coordinate clamping to current state.

@onready var camera: Camera3D = get_node_or_null("Camera3D") as Camera3D

# State Machine
var current_state: PlayerState

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var _rotation_x: float = 0.0
var is_active: bool = false
var _last_paused_state: bool = false
var current_zone: String = "factory"
func _ready() -> void:
	# Register in "player" group so proximity doors (SlidingGlassDoor3D, SlidingArmoredDoor3D) can detect us
	add_to_group("player")
	
	# Keep input processing matching active state
	set_process_unhandled_input(is_active)
	set_physics_process(is_active)
	set_process(is_active)
	_update_mouse_mode()
	
	_initialize_controller()

func _initialize_controller() -> void:
	# Connect to possession signals (safely checking if already connected)
	if not EventBus.possession_requested.is_connected(enter_vehicle):
		EventBus.possession_requested.connect(enter_vehicle)
	if not EventBus.possession_released.is_connected(exit_vehicle):
		EventBus.possession_released.connect(exit_vehicle)
	
	# Initialize default WalkingState if no state is active yet
	if current_state == null:
		change_state(WalkingState.new())

func change_state(new_state: PlayerState) -> void:
	if current_state:
		current_state.exit(self)
	current_state = new_state
	current_state.enter(self)

func enter_vehicle(possessable: Possessable3D) -> void:
	change_state(DrivingState.new(possessable))

func exit_vehicle() -> void:
	change_state(WalkingState.new())

func is_driving() -> bool:
	return current_state is DrivingState

func get_current_vehicle() -> Node3D:
	if current_state is DrivingState:
		return current_state.active_possessable
	return null


func set_active(val: bool) -> void:
	is_active = val
	set_process_unhandled_input(val)
	set_physics_process(val)
	set_process(val)
	if is_active:
		_initialize_controller()
		if camera == null or not is_instance_valid(camera):
			camera = get_node_or_null("Camera3D") as Camera3D
	_last_paused_state = GameManager.paused
	_update_mouse_mode()

func _update_mouse_mode() -> void:
	if is_active:
		if GameManager.paused:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		else:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	else:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func rotate_look(relative: Vector2) -> void:
	if not is_active:
		return
	if current_state and current_state.has_method("rotate_look"):
		current_state.rotate_look(self, relative)

func look_at_target(target_pos: Vector3) -> void:
	# Keep helper look function on body/camera for worker dialogue focusing
	var dir = (target_pos - global_position).normalized()
	var target_yaw = atan2(-dir.x, -dir.z)
	
	var camera_world_pos = camera.global_position if camera else global_position + Vector3(0, 1.6, 0)
	var to_target = target_pos - camera_world_pos
	var flat_dist = Vector2(to_target.x, to_target.z).length()
	var target_pitch = atan2(to_target.y, flat_dist)
	
	var tween = create_tween().set_parallel(true)
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "global_rotation:y", target_yaw, 0.4)
	if camera and is_instance_valid(camera):
		tween.tween_property(camera, "rotation:x", clamp(target_pitch, -deg_to_rad(45), deg_to_rad(45)), 0.4)
		tween.chain().tween_callback(func():
			_rotation_x = camera.rotation.x
		)

func _process(delta: float) -> void:
	if not is_active:
		return
		
	# Check pause state transitions dynamically to toggle mouse visibility
	if GameManager.paused != _last_paused_state:
		_last_paused_state = GameManager.paused
		_update_mouse_mode()
		
	if current_state:
		current_state.process(self, delta)

func _physics_process(delta: float) -> void:
	if not is_active:
		return
		
	if current_state:
		current_state.physics_process(self, delta)
