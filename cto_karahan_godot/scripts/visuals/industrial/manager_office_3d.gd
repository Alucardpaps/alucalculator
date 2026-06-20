class_name ManagerOffice3D
extends Node3D

## ManagerOffice3D: A decoupled component representing the manager's private office.
## Manages glass partitions, an interactive sliding door, furniture, desk, computer,
## glowing aquarium with swimming fish, and wall-mounted CCTV monitors.
## Handles its own animation frame processing.

var _aquarium_fishes: Array[MeshInstance3D] = []
var _cctv_screen_mat: StandardMaterial3D = null
var _pc_screen_mat: StandardMaterial3D = null

func setup(z_min: float, z_center: float, height: float, glass_mat: Material, wood_mat: Material) -> void:
	# Material configurations
	var plastic_mat := StandardMaterial3D.new()
	plastic_mat.albedo_color = Color(0.15, 0.15, 0.15)
	plastic_mat.roughness = 0.5

	# Executive dark leather material for the chair
	var leather_mat := StandardMaterial3D.new()
	leather_mat.albedo_color = Color(0.12, 0.10, 0.08)
	leather_mat.roughness = 0.65
	leather_mat.metallic = 0.05

	# 1. Build office room dividers next to Ar-Ge (X = 14.5 to 18.5, Z = z_min to z_min + 7.0)
	# Left partition (glass)
	_create_box_obstacle(self, Vector3(14.5, height / 2.0, z_min + 3.5), Vector3(0.2, height, 7.0), glass_mat)
	# Right partition (glass)
	_create_box_obstacle(self, Vector3(18.5, height / 2.0, z_min + 3.5), Vector3(0.2, height, 7.0), glass_mat)
	# Front partition (glass with door gap at X = 15.5 to 17.5)
	_create_box_obstacle(self, Vector3(15.0, height / 2.0, z_min + 7.0), Vector3(1.0, height, 0.2), glass_mat)
	_create_box_obstacle(self, Vector3(18.0, height / 2.0, z_min + 7.0), Vector3(1.0, height, 0.2), glass_mat)
	
	# Proximity Interactive Glass Door at the front (4.0m width, 2.8m proximity trigger)
	var office_door := SlidingGlassDoor3D.new()
	office_door.name = "ManagerOfficeDoor"
	office_door.door_width = 4.0
	office_door.door_height = height
	office_door.proximity_distance = 2.8
	add_child(office_door)
	office_door.global_position = Vector3(16.5, 0.0, z_min + 7.0)
	
	# 2. Executive Desk
	_create_box_obstacle(self, Vector3(16.0, 0.4, z_min + 3.5), Vector3(2.0, 0.8, 1.2), wood_mat)
	
	# 3. Executive Chair
	_create_box_obstacle(self, Vector3(16.0, 0.15, z_min + 2.8), Vector3(0.4, 0.3, 0.4), plastic_mat)
	_create_box_obstacle(self, Vector3(16.0, 0.5, z_min + 2.8), Vector3(0.6, 0.1, 0.6), leather_mat)
	_create_box_obstacle(self, Vector3(16.0, 0.9, z_min + 2.5), Vector3(0.6, 0.8, 0.1), leather_mat)
	
	# 4. Computer on Desk
	# Monitor frame
	_create_box_obstacle(self, Vector3(16.0, 0.95, z_min + 3.6), Vector3(0.6, 0.4, 0.05), plastic_mat)
	# PC Screen
	_pc_screen_mat = StandardMaterial3D.new()
	_pc_screen_mat.albedo_color = Color(0.0, 0.1, 0.2)
	_pc_screen_mat.emission_enabled = true
	_pc_screen_mat.emission = Color(0.0, 0.5, 1.0)
	
	var pc_screen := MeshInstance3D.new()
	var pc_mesh := BoxMesh.new()
	pc_mesh.size = Vector3(0.55, 0.35, 0.01)
	pc_screen.mesh = pc_mesh
	pc_screen.material_override = _pc_screen_mat
	add_child(pc_screen)
	pc_screen.global_position = Vector3(16.0, 0.95, z_min + 3.57)
	
	# Keyboard
	_create_box_obstacle(self, Vector3(16.0, 0.81, z_min + 3.1), Vector3(0.4, 0.02, 0.15), plastic_mat)
	
	# 5. Glowing Aquarium next to Desk
	# Stand
	_create_box_obstacle(self, Vector3(17.8, 0.4, z_min + 2.0), Vector3(0.8, 0.8, 1.2), plastic_mat)
	# Tank
	_create_box_obstacle(self, Vector3(17.8, 1.1, z_min + 2.0), Vector3(0.7, 0.6, 1.0), glass_mat)
	# Translucent Blue Water
	var water_mat := StandardMaterial3D.new()
	water_mat.albedo_color = Color(0.0, 0.5, 1.0, 0.6)
	water_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	water_mat.emission_enabled = true
	water_mat.emission = Color(0.0, 0.3, 0.6)
	_create_box_obstacle(self, Vector3(17.8, 1.05, z_min + 2.0), Vector3(0.65, 0.5, 0.95), water_mat)
	
	# Spawn 3 dynamic animated fishes
	_aquarium_fishes.clear()
	var fish_colors = [
		Color(1.0, 0.4, 0.0), # Orange goldfish
		Color(0.1, 0.8, 1.0), # Neon blue fish
		Color(1.0, 0.8, 0.0)  # Yellow tang
	]
	var fish_mesh := BoxMesh.new()
	fish_mesh.size = Vector3(0.05, 0.04, 0.12)
	
	for i in range(3):
		var f_mat := StandardMaterial3D.new()
		f_mat.albedo_color = fish_colors[i]
		f_mat.emission_enabled = true
		f_mat.emission = fish_colors[i] * 1.5
		
		var f_mesh_inst := MeshInstance3D.new()
		f_mesh_inst.mesh = fish_mesh
		f_mesh_inst.material_override = f_mat
		add_child(f_mesh_inst)
		
		# Position them spread out in the tank
		var local_offset = Vector3(
			randf_range(-0.2, 0.2),
			randf_range(0.9, 1.2),
			randf_range(1.6, 2.4)
		)
		f_mesh_inst.global_position = Vector3(17.8 + local_offset.x, local_offset.y, z_min + local_offset.z)
		f_mesh_inst.set_meta("base_pos", f_mesh_inst.global_position)
		_aquarium_fishes.append(f_mesh_inst)
	
	# 6. Wall-Mounted CCTV Monitor watching the factory
	# Frame
	_create_box_obstacle(self, Vector3(16.0, 2.8, z_min + 0.1), Vector3(2.2, 1.2, 0.1), plastic_mat)
	# Display Screen
	_cctv_screen_mat = StandardMaterial3D.new()
	_cctv_screen_mat.albedo_color = Color(0.05, 0.15, 0.1)
	_cctv_screen_mat.emission_enabled = true
	_cctv_screen_mat.emission = Color(0.0, 0.7, 0.3)
	
	var cctv_screen := MeshInstance3D.new()
	var cctv_mesh := BoxMesh.new()
	cctv_mesh.size = Vector3(2.1, 1.1, 0.02)
	cctv_screen.mesh = cctv_mesh
	cctv_screen.material_override = _cctv_screen_mat
	add_child(cctv_screen)
	cctv_screen.global_position = Vector3(16.0, 2.8, z_min + 0.16)
	
	# Grid Lines (2x2 camera grid layout)
	_create_box_obstacle(self, Vector3(16.0, 2.8, z_min + 0.18), Vector3(2.1, 0.04, 0.03), plastic_mat)
	_create_box_obstacle(self, Vector3(16.0, 2.8, z_min + 0.18), Vector3(0.04, 1.1, 0.03), plastic_mat)

func _process(delta: float) -> void:
	var time_ms := Time.get_ticks_msec()
	
	# Animate aquarium fishes (swimming in wave trajectories with correct direction orientation)
	for i in range(_aquarium_fishes.size()):
		var fish = _aquarium_fishes[i]
		if is_instance_valid(fish) and fish.has_meta("base_pos"):
			var base_pos: Vector3 = fish.get_meta("base_pos")
			var speed := 0.8 + i * 0.4
			var offset_x = sin(time_ms * 0.0012 * speed + i * 2.0) * 0.22
			var offset_z = cos(time_ms * 0.001 * speed + i * 1.5) * 0.32
			var offset_y = sin(time_ms * 0.0025 * speed + i) * 0.08
			
			fish.global_position = base_pos + Vector3(offset_x, offset_y, offset_z)
			
			# Orient fish towards swim direction
			var dir := Vector3(
				cos(time_ms * 0.0012 * speed + i * 2.0),
				0.0,
				-sin(time_ms * 0.001 * speed + i * 1.5)
			).normalized()
			if dir.length() > 0.1:
				var target_rot = atan2(dir.x, dir.z)
				fish.global_rotation.y = target_rot

	# Animate wall-mounted CCTV monitor screen (subtle CRT analog scan flicker)
	if is_instance_valid(_cctv_screen_mat):
		var cctv_pulse = sin(time_ms * 0.012) * 0.06 + 0.94
		if randf() < 0.015:
			cctv_pulse *= randf_range(0.8, 1.2) # analog signal jitter
		_cctv_screen_mat.emission = Color(0.0, 0.65, 0.3) * cctv_pulse

	# Animate computer PC monitor screen (interactive brightness updates)
	if is_instance_valid(_pc_screen_mat):
		var pc_pulse = sin(time_ms * 0.006) * 0.05 + 0.95
		if randf() < 0.01:
			pc_pulse = randf_range(0.6, 1.4) # screen refresh change
		_pc_screen_mat.emission = Color(0.0, 0.5, 1.0) * pc_pulse

func _create_box_obstacle(parent_node: Node3D, pos: Vector3, box_size: Vector3, material: Material) -> StaticBody3D:
	var sb := StaticBody3D.new()
	parent_node.add_child(sb)
	sb.global_position = pos
	
	var cs := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = box_size
	cs.shape = box
	sb.add_child(cs)
	
	var mi := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = box_size
	mi.mesh = mesh
	mi.material_override = material
	sb.add_child(mi)
	
	return sb
