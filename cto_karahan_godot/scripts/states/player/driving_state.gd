class_name DrivingState
extends PlayerState

## DrivingState: Player driving state. 
## Reads inputs to drive the active Possessable3D, positions player body on it, 
## and positions the first-person cabin camera with relative mouse look.

var active_possessable: Possessable3D
var _original_layer: int = 1
var _original_mask: int = 1

var relative_yaw: float = 0.0
var relative_pitch: float = 0.0
const MOUSE_SENSITIVITY = 0.003

func _init(possessable: Possessable3D) -> void:
	active_possessable = possessable

func enter(controller: CharacterBody3D) -> void:
	controller.velocity = Vector3.ZERO
	# Cache original layer and mask
	_original_layer = controller.collision_layer
	_original_mask = controller.collision_mask
	# Disable collisions by setting layers to 0
	controller.collision_layer = 0
	controller.collision_mask = 0

	# Turn on headlights/effects for driving
	if is_instance_valid(active_possessable):
		active_possessable.possession_enter(controller)
		
	# Make sure mouse is captured for driving view
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	if is_instance_valid(active_possessable):
		GameManager.add_log("🚗 %s sürülüyor! İnmek için [E] tuşuna basın." % active_possessable.possessable_name)

func exit(controller: CharacterBody3D) -> void:
	if not is_instance_valid(active_possessable):
		return
		
	active_possessable.possession_exit(controller)
	
	# Reposition player body using the possessable's exit point
	controller.global_position = active_possessable.get_player_exit_position(controller)
	controller.velocity = Vector3.ZERO
	
	# Restore collisions
	controller.collision_layer = _original_layer
	controller.collision_mask = _original_mask
	
	# Reset camera to first-person view inside player
	if controller.camera and is_instance_valid(controller.camera):
		controller.camera.position = Vector3(0, 1.6, 0)
		controller.camera.rotation = Vector3.ZERO
		
	GameManager.add_log("Araçtan/Objeden inildi.")
	# Clear persistent notification prompt
	EventBus.toast_notified.emit("", "info_clear")

func process(controller: CharacterBody3D, _delta: float) -> void:
	if not is_instance_valid(active_possessable):
		controller.exit_vehicle()
		return
		
	# Constant toast indicator
	EventBus.toast_notified.emit("🚗 [E] Tuşuna Basarak Araçtan İn", "info_persistent")

func rotate_look(_controller: CharacterBody3D, relative: Vector2) -> void:
	if GameManager.paused:
		return
	relative_yaw = wrapf(relative_yaw - relative.x * MOUSE_SENSITIVITY, -PI, PI)
	relative_pitch = clamp(relative_pitch - relative.y * MOUSE_SENSITIVITY, -deg_to_rad(70), deg_to_rad(70))

func physics_process(controller: CharacterBody3D, delta: float) -> void:
	if not is_instance_valid(active_possessable):
		return
		
	# 1. Drive/process the possessable physics
	active_possessable.possession_physics_process(controller, delta)
	
	# 2. Position player body on possessable coordinates
	controller.global_position = active_possessable.global_position
	
	# 3. First-Person Cabin Camera
	if controller.camera and is_instance_valid(controller.camera):
		var seat_offset: Vector3 = Vector3.ZERO
		if active_possessable.has_method("get_driver_seat_offset"):
			seat_offset = active_possessable.get_driver_seat_offset()
		else:
			seat_offset = Vector3(-0.4, 0.95, 0.1) # default sedan
			
		# Camera position in global space (interpolated for smoothness)
		var target_cam_pos = active_possessable.global_transform * seat_offset
		controller.camera.global_position = controller.camera.global_position.lerp(target_cam_pos, 20.0 * delta)
		
		# Camera rotation (Yaw and Pitch relative to vehicle rotation)
		# Godot camera looks down -Z by default, vehicle front is +Z. So we add PI (180 degrees) around Y.
		var vehicle_yaw = active_possessable.global_rotation.y
		controller.camera.global_rotation.y = vehicle_yaw + PI + relative_yaw
		controller.camera.global_rotation.x = relative_pitch
		controller.camera.global_rotation.z = active_possessable.global_rotation.z
