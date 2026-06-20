class_name Vehicle3D
extends Possessable3D

## Vehicle3D: Decoupled vehicle entity. 
## Programmatically builds its own 3D mesh (Sedan, Hatchback, SUV, Sport, Cargo Truck).
## Handles self-contained driving physics, steering, headlights, and boundary limits.

@export var data: VehicleData = null

@export var vehicle_name: String = "Kişisel Sedan"
@export var vehicle_type: String = "sedan" # "sedan", "hatchback", "suv", "sport", "truck"
@export var top_speed: float = 20.0
@export var color: Color = Color(0.18, 0.52, 0.88)
@export var current_speed: float = 0.0

var headlights: Array[SpotLight3D] = []

func _ready() -> void:
	if data:
		possessable_name = data.vehicle_name
		vehicle_name = data.vehicle_name
		vehicle_type = data.vehicle_type
		top_speed = data.top_speed
		color = data.color
	else:
		possessable_name = vehicle_name
		
	# Build the procedural 3D model on startup
	build_mesh()

func possession_enter(_player: CharacterBody3D) -> void:
	set_lights_energy(3.0)

func possession_exit(_player: CharacterBody3D) -> void:
	var lights_energy = 0.0
	if GameManager.hour >= 17 or GameManager.hour < 7:
		lights_energy = 2.0
	set_lights_energy(lights_energy)

func possession_physics_process(_player: CharacterBody3D, delta: float) -> void:
	var steer_input = 0.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		steer_input += 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		steer_input -= 1.0
		
	var accel_input = 0.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		accel_input += 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		accel_input -= 1.0
		
	drive(steer_input, accel_input, delta)

func get_camera_target_position() -> Vector3:
	var forward = global_transform.basis.z.normalized()
	return global_position - forward * 5.5 + Vector3(0, 2.5, 0)

func get_camera_look_target() -> Vector3:
	return global_position + Vector3(0, 0.8, 0)

func get_player_exit_position(_player: CharacterBody3D) -> Vector3:
	var left_dir = -global_transform.basis.x.normalized()
	return global_position + left_dir * 2.0 + Vector3(0, 1.0, 0)

func set_lights_energy(energy: float) -> void:
	for spot in headlights:
		if is_instance_valid(spot):
			spot.light_energy = energy


func get_driver_seat_offset() -> Vector3:
	if vehicle_type == "truck":
		return Vector3(-0.5, 1.3, 1.5)
	elif vehicle_type == "suv":
		return Vector3(-0.4, 1.1, 0.3)
	elif vehicle_type == "sport":
		return Vector3(-0.4, 0.75, 0.1)
	elif vehicle_type == "hatchback":
		return Vector3(-0.4, 0.85, -0.1)
	else: # sedan
		return Vector3(-0.4, 0.95, 0.1)

func drive(steer_input: float, accel_input: float, delta: float) -> void:
	# WASD/Arrows Steering
	if steer_input != 0.0:
		rotate_y(steer_input * 2.5 * delta)
		
	# Throttle / Reverse
	var accel_rate = 12.0
	if accel_input != 0.0:
		current_speed = clamp(current_speed + accel_input * accel_rate * delta, -6.0, top_speed)
	else:
		current_speed = lerp(current_speed, 0.0, 4.0 * delta)
		
	# Motion with collision sliding
	var forward = global_transform.basis.z.normalized()
	var motion = forward * current_speed * delta
	var collision = move_and_collide(motion)
	if collision:
		# Slide response along the collision normal
		var remaining_motion = collision.get_remainder()
		var slide_motion = remaining_motion.slide(collision.get_normal())
		move_and_collide(slide_motion)
		# Absorb speed on impact
		current_speed *= 0.5
	
	# Clamp vehicle position boundaries to keep them outside the building
	# Building front wall is at Z = 12.0 (for all factories).
	# Side driveway allows driving down to Z = -20.0 (near the loading dock).
	var is_armored = GameManager.selected_factory_type == "armored"
	var x_max: float = 148.0 if is_armored else 138.0
	global_position.x = clamp(global_position.x, -38.0, x_max)
	
	var side_x_min: float = 125.0 if is_armored else 95.0
	var side_x_max: float = 145.0 if is_armored else 115.0
	
	if global_position.x >= side_x_min and global_position.x <= side_x_max:
		global_position.z = clamp(global_position.z, -20.0, 73.0)
	else:
		# Keep vehicle safely in the yard/road (Z >= 15.0), preventing clipping into front wall (Z = 12.0)
		global_position.z = clamp(global_position.z, 15.0, 73.0)

func build_mesh() -> void:
	# Metadata
	set_meta("vehicle_type", vehicle_type)
	set_meta("top_speed", top_speed)
	
	# 1. Collision Shape
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	var col_size = Vector3(1.8, 1.4, 4.0)
	if vehicle_type == "truck":
		col_size = Vector3(2.2, 2.0, 5.0)
	elif vehicle_type == "suv":
		col_size = Vector3(2.0, 1.8, 4.2)
	elif vehicle_type == "hatchback":
		col_size = Vector3(1.7, 1.4, 3.2)
	elif vehicle_type == "sport":
		col_size = Vector3(1.9, 1.2, 4.4)
	box.size = col_size
	cs.shape = box
	cs.position = Vector3(0, col_size.y / 2.0, 0)
	add_child(cs)
	
	# 2. Materials
	var body_mat: StandardMaterial3D
	if vehicle_type == "truck" and ResourceLoader.exists("res://assets/textures/world/truck_albedo.png"):
		body_mat = StandardMaterial3D.new()
		body_mat.albedo_texture = load("res://assets/textures/world/truck_albedo.png")
		body_mat.roughness = 0.4
		body_mat.metallic = 0.5
	elif vehicle_type == "sedan" and ResourceLoader.exists("res://assets/textures/world/car_sedan_albedo.png"):
		body_mat = StandardMaterial3D.new()
		body_mat.albedo_texture = load("res://assets/textures/world/car_sedan_albedo.png")
		body_mat.roughness = 0.3
		body_mat.metallic = 0.8
	else:
		body_mat = _create_procedural_material([color * 0.8, color], 0.05, 0.2, 0.8, 0.5)
		
	var glass_mat := StandardMaterial3D.new()
	glass_mat.albedo_color = Color(0.08, 0.09, 0.12)
	glass_mat.roughness = 0.1
	glass_mat.metallic = 0.5
	
	var wheel_mat := _create_procedural_material([Color(0.04, 0.04, 0.04), Color(0.08, 0.08, 0.08)], 0.1, 0.9, 0.0, 1.2)
	
	var light_mat := StandardMaterial3D.new()
	light_mat.albedo_color = Color(1.0, 1.0, 0.8)
	light_mat.emission_enabled = true
	light_mat.emission = Color(1.0, 1.0, 0.8)
	
	var metal_mat := _create_procedural_material([Color(0.6, 0.62, 0.65), Color(0.75, 0.77, 0.8)], 0.12, 0.2, 0.95, 0.8)
	
	# 3. Model construction
	if vehicle_type == "truck":
		# Cabin (front part)
		var cabin_mi := MeshInstance3D.new()
		var cabin_mesh := BoxMesh.new()
		cabin_mesh.size = Vector3(2.0, 1.6, 1.8)
		cabin_mi.mesh = cabin_mesh
		cabin_mi.material_override = body_mat
		cabin_mi.position = Vector3(0, 0.8, 1.6)
		add_child(cabin_mi)
		
		# Windshield
		var ws_mi := MeshInstance3D.new()
		var ws_mesh := BoxMesh.new()
		ws_mesh.size = Vector3(1.8, 0.8, 0.1)
		ws_mi.mesh = ws_mesh
		ws_mi.material_override = glass_mat
		ws_mi.position = Vector3(0, 1.2, 2.51)
		add_child(ws_mi)
		
		# Cargo Bed (back part)
		var cargo_mi := MeshInstance3D.new()
		var cargo_mesh := BoxMesh.new()
		cargo_mesh.size = Vector3(2.2, 2.0, 3.2)
		cargo_mi.mesh = cargo_mesh
		cargo_mi.material_override = metal_mat
		cargo_mi.position = Vector3(0, 1.0, -0.9)
		add_child(cargo_mi)
		
	else:
		# Custom Chassis/Cabin sizes per car type
		var chassis_w = 1.8
		var chassis_h = 0.6
		var chassis_l = 4.0
		
		var cabin_w = 1.6
		var cabin_h = 0.7
		var cabin_l = 2.0
		var cabin_z = -0.2
		
		if vehicle_type == "hatchback":
			chassis_w = 1.7
			chassis_h = 0.65
			chassis_l = 3.2
			cabin_w = 1.5
			cabin_h = 0.7
			cabin_l = 1.8
			cabin_z = -0.4
		elif vehicle_type == "suv":
			chassis_w = 2.0
			chassis_h = 0.8
			chassis_l = 4.2
			cabin_w = 1.8
			cabin_h = 1.0
			cabin_l = 2.6
			cabin_z = -0.2
		elif vehicle_type == "sport":
			chassis_w = 1.9
			chassis_h = 0.45
			chassis_l = 4.4
			cabin_w = 1.65
			cabin_h = 0.55
			cabin_l = 1.8
			cabin_z = -0.3
			
		# Chassis
		var body_mi := MeshInstance3D.new()
		var body_mesh := BoxMesh.new()
		body_mesh.size = Vector3(chassis_w, chassis_h, chassis_l)
		body_mi.mesh = body_mesh
		body_mi.material_override = body_mat
		body_mi.position = Vector3(0, chassis_h / 2.0, 0)
		add_child(body_mi)
		
		# Cabin
		var cabin_mi := MeshInstance3D.new()
		var cabin_mesh := BoxMesh.new()
		cabin_mesh.size = Vector3(cabin_w, cabin_h, cabin_l)
		cabin_mi.mesh = cabin_mesh
		cabin_mi.material_override = glass_mat
		cabin_mi.position = Vector3(0, chassis_h + cabin_h / 2.0, cabin_z)
		add_child(cabin_mi)
		
		# Sport Spoiler
		if vehicle_type == "sport":
			var spoiler_root = Node3D.new()
			spoiler_root.position = Vector3(0.0, chassis_h, -chassis_l / 2.0 + 0.2)
			add_child(spoiler_root)
			
			var leg_l = MeshInstance3D.new()
			var leg_mesh = BoxMesh.new()
			leg_mesh.size = Vector3(0.05, 0.25, 0.1)
			leg_l.mesh = leg_mesh
			leg_l.material_override = body_mat
			leg_l.position = Vector3(-chassis_w / 2.0 + 0.3, 0.125, 0.0)
			spoiler_root.add_child(leg_l)
			
			var leg_r = MeshInstance3D.new()
			leg_r.mesh = leg_mesh
			leg_r.material_override = body_mat
			leg_r.position = Vector3(chassis_w / 2.0 - 0.3, 0.125, 0.0)
			spoiler_root.add_child(leg_r)
			
			var wing = MeshInstance3D.new()
			var wing_mesh = BoxMesh.new()
			wing_mesh.size = Vector3(chassis_w + 0.1, 0.03, 0.3)
			wing.mesh = wing_mesh
			wing.material_override = body_mat
			wing.position = Vector3(0.0, 0.25, 0.0)
			spoiler_root.add_child(wing)
			
	# Wheels (4 wheels)
	var wheel_radius := 0.45 if vehicle_type == "truck" or vehicle_type == "suv" else 0.35
	var wheel_width := 0.35 if vehicle_type == "truck" or vehicle_type == "suv" else 0.25
	var wheel_y := 0.22 if vehicle_type == "truck" else 0.15
	var wheel_x := 1.0 if vehicle_type == "truck" or vehicle_type == "suv" else 0.85
	var wheel_z_front := 1.8 if vehicle_type == "truck" else 1.4
	var wheel_z_back := -1.8 if vehicle_type == "truck" else -1.4
	
	if vehicle_type == "suv":
		wheel_z_front = 1.6
		wheel_z_back = -1.6
	elif vehicle_type == "hatchback":
		wheel_z_front = 1.1
		wheel_z_back = -1.1
	elif vehicle_type == "sport":
		wheel_z_front = 1.7
		wheel_z_back = -1.7
		
	var wheel_positions := [
		Vector3(-wheel_x, wheel_y, wheel_z_front),
		Vector3(wheel_x, wheel_y, wheel_z_front),
		Vector3(-wheel_x, wheel_y, wheel_z_back),
		Vector3(wheel_x, wheel_y, wheel_z_back)
	]
	
	for w_pos in wheel_positions:
		var w_mi := MeshInstance3D.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = wheel_radius
		cyl.bottom_radius = wheel_radius
		cyl.height = wheel_width
		w_mi.mesh = cyl
		w_mi.material_override = wheel_mat
		w_mi.position = w_pos
		w_mi.rotation_degrees = Vector3(0, 0, 90)
		add_child(w_mi)
		
	# Headlights (2 small spheres) and SpotLight3D cones
	var hl_z := 2.51 if vehicle_type == "truck" else 2.01 if vehicle_type == "sedan" or vehicle_type == "suv" else 1.61 if vehicle_type == "hatchback" else 2.21
	var hl_x := 0.8 if vehicle_type == "truck" or vehicle_type == "suv" else 0.7
	var hl_y := 0.6 if vehicle_type == "truck" else 0.45 if vehicle_type == "suv" else 0.3
	var hl_positions := [
		Vector3(-hl_x, hl_y, hl_z),
		Vector3(hl_x, hl_y, hl_z)
	]
	
	for h_pos in hl_positions:
		var hl_mi := MeshInstance3D.new()
		var sph := SphereMesh.new()
		sph.radius = 0.12 if vehicle_type == "truck" else 0.08
		sph.height = 0.24 if vehicle_type == "truck" else 0.16
		hl_mi.mesh = sph
		hl_mi.material_override = light_mat
		hl_mi.position = h_pos
		add_child(hl_mi)
		
		# Headlight spotlight cone pointing forward (+Z direction)
		var spot := SpotLight3D.new()
		spot.light_energy = 0.0
		spot.light_color = Color(1.0, 1.0, 0.9)
		spot.spot_range = 25.0
		spot.spot_angle = 35.0
		spot.shadow_enabled = true
		spot.position = h_pos
		spot.rotation_degrees = Vector3(0, 180, 0)
		add_child(spot)
		
		headlights.append(spot)

func _create_procedural_material(colors: Array[Color], frequency: float = 0.05, roughness: float = 0.8, metallic: float = 0.0, normal_strength: float = 1.0, triplanar: bool = false, uv_scale: float = 1.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	
	var noise := FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	noise.frequency = frequency
	noise.fractal_type = FastNoiseLite.FRACTAL_FBM
	noise.fractal_octaves = 4
	noise.fractal_lacunarity = 2.0
	noise.fractal_gain = 0.5
	noise.seed = randi()
	
	var grad := Gradient.new()
	grad.offsets = [0.0, 1.0]
	grad.colors = colors
	
	var albedo_tex := NoiseTexture2D.new()
	albedo_tex.width = 512
	albedo_tex.height = 512
	albedo_tex.seamless = true
	albedo_tex.color_ramp = grad
	albedo_tex.noise = noise
	
	var normal_tex := NoiseTexture2D.new()
	normal_tex.width = 512
	normal_tex.height = 512
	normal_tex.seamless = true
	normal_tex.as_normal_map = true
	normal_tex.bump_strength = normal_strength
	normal_tex.noise = noise
	
	mat.albedo_texture = albedo_tex
	mat.normal_enabled = true
	mat.normal_texture = normal_tex
	mat.roughness = roughness
	mat.metallic = metallic
	
	if triplanar:
		mat.uv1_triplanar = true
	mat.uv1_scale = Vector3(uv_scale, uv_scale, uv_scale)
	
	return mat
