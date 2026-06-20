class_name WalkingState
extends PlayerState

## WalkingState: Player walking state (first-person). Handles normal movement, gravity, and coordinate boundary limits.

const SPEED = 5.0
const LERP_VAL = 0.20
const MOUSE_SENSITIVITY = 0.003

func enter(controller: CharacterBody3D) -> void:
	# Reset camera to first-person view
	if controller.camera and is_instance_valid(controller.camera):
		controller.camera.position = Vector3(0, 1.6, 0)
		controller.camera.rotation = Vector3.ZERO
		
	controller._rotation_x = 0.0
	controller._update_mouse_mode()

func process(controller: CharacterBody3D, _delta: float) -> void:
	if GameManager.paused != controller._last_paused_state:
		controller._last_paused_state = GameManager.paused
		controller._update_mouse_mode()

func physics_process(controller: CharacterBody3D, delta: float) -> void:
	# Apply gravity
	if not controller.is_on_floor():
		controller.velocity.y -= controller.gravity * delta

	# Pause constraint (except home)
	if GameManager.paused and controller.current_zone != "home":
		controller.velocity.x = lerp(controller.velocity.x, 0.0, LERP_VAL)
		controller.velocity.z = lerp(controller.velocity.z, 0.0, LERP_VAL)
		controller.move_and_slide()
		return

	# WASD / Arrow movement keys check
	var input_dir := Vector2.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		input_dir.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		input_dir.y += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		input_dir.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		input_dir.x += 1.0
		
	if input_dir.length_squared() > 0:
		input_dir = input_dir.normalized()
		
	var global_basis := controller.global_transform.basis
	var direction := (global_basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	if direction:
		controller.velocity.x = lerp(controller.velocity.x, direction.x * SPEED, LERP_VAL)
		controller.velocity.z = lerp(controller.velocity.z, direction.z * SPEED, LERP_VAL)
	else:
		controller.velocity.x = lerp(controller.velocity.x, 0.0, LERP_VAL)
		controller.velocity.z = lerp(controller.velocity.z, 0.0, LERP_VAL)

	controller.move_and_slide()
	
	# Clamp manager position within factory boundaries or home boundaries
	if controller.current_zone == "home":
		controller.global_position.x = clamp(controller.global_position.x, -33.0, -17.0)
		controller.global_position.z = clamp(controller.global_position.z, 2.0, 18.0)
	else:
		controller.global_position.x = clamp(controller.global_position.x, -40.0, 140.0)
		controller.global_position.z = clamp(controller.global_position.z, -20.0, 75.0)

func rotate_look(controller: CharacterBody3D, relative: Vector2) -> void:
	if GameManager.paused:
		return
		
	# Horizonal rotation (Yaw)
	controller.rotate_y(-relative.x * MOUSE_SENSITIVITY)
	
	# Vertical rotation (Pitch)
	if controller.camera and is_instance_valid(controller.camera):
		controller._rotation_x = clamp(controller._rotation_x - relative.y * MOUSE_SENSITIVITY, -deg_to_rad(80), deg_to_rad(80))
		controller.camera.rotation.x = controller._rotation_x
