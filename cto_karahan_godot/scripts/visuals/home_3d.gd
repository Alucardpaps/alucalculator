class_name Home3D
extends Node3D

## Home3D: Programmatically builds a cozy 3D bedroom for the player at Vector3(300, 0, 300).
## Renders upgrade items (Bed, TV, Espresso Machine, Kitchen, Gaming PC) in real-time.

var _bed_node: Node3D
var _tv_node: Node3D
var _coffee_node: Node3D
var _kitchen_node: Node3D
var _pc_node: Node3D
var _pc_light: OmniLight3D
var _time_elapsed: float = 0.0

func _ready() -> void:
	# Build the room shell (16m x 16m) centered at Vector3(-25, 0, 10)
	var center = Vector3(-25.0, 0.05, 10.0)
	
	# Create materials
	var floor_mat = StandardMaterial3D.new()
	floor_mat.albedo_color = Color(0.35, 0.2, 0.1) # Wood brown
	floor_mat.roughness = 0.4
	
	var wall_mat = StandardMaterial3D.new()
	wall_mat.albedo_color = Color(0.2, 0.22, 0.26) # Grey-blue paint
	wall_mat.roughness = 0.8
	
	var ceiling_mat = StandardMaterial3D.new()
	ceiling_mat.albedo_color = Color(0.85, 0.85, 0.85) # Off-white
	
	var wood_mat = StandardMaterial3D.new()
	wood_mat.albedo_color = Color(0.25, 0.12, 0.05)
	wood_mat.roughness = 0.5
	
	var mattress_mat = StandardMaterial3D.new()
	mattress_mat.albedo_color = Color(0.95, 0.95, 0.95)
	mattress_mat.roughness = 0.9
	
	var blanket_mat = StandardMaterial3D.new()
	blanket_mat.albedo_color = Color(0.8, 0.15, 0.15) # Red blanket
	blanket_mat.roughness = 0.7
	
	var black_plastic = StandardMaterial3D.new()
	black_plastic.albedo_color = Color(0.05, 0.05, 0.05)
	black_plastic.roughness = 0.2
	
	var metal_mat = StandardMaterial3D.new()
	metal_mat.albedo_color = Color(0.7, 0.72, 0.75)
	metal_mat.roughness = 0.1
	metal_mat.metallic = 0.95
	
	# 1. Floor
	var floor_mesh = BoxMesh.new()
	floor_mesh.size = Vector3(16.0, 0.2, 16.0)
	var floor_inst = MeshInstance3D.new()
	floor_inst.mesh = floor_mesh
	floor_inst.material_override = floor_mat
	floor_inst.position = center + Vector3(0.0, -0.1, 0.0)
	add_child(floor_inst)
	
	# 2. Ceiling
	var ceil_mesh = BoxMesh.new()
	ceil_mesh.size = Vector3(16.0, 0.2, 16.0)
	var ceil_inst = MeshInstance3D.new()
	ceil_inst.mesh = ceil_mesh
	ceil_inst.material_override = ceiling_mat
	ceil_inst.position = center + Vector3(0.0, 4.1, 0.0)
	add_child(ceil_inst)
	
	# 3. Walls (North, South, East, West)
	var walls_data = [
		{"pos": Vector3(0.0, 2.0, -8.0), "size": Vector3(16.0, 4.0, 0.2)}, # North
		{"pos": Vector3(-8.0, 2.0, 0.0), "size": Vector3(0.2, 4.0, 16.0)}, # West
		{"pos": Vector3(8.0, 2.0, 0.0), "size": Vector3(0.2, 4.0, 16.0)},  # East
		# Split South wall to leave 2.0m doorway at center
		{"pos": Vector3(-4.5, 2.0, 8.0), "size": Vector3(7.0, 4.0, 0.2)},  # South Left
		{"pos": Vector3(4.5, 2.0, 8.0), "size": Vector3(7.0, 4.0, 0.2)},   # South Right
		{"pos": Vector3(0.0, 3.2, 8.0), "size": Vector3(2.0, 1.6, 0.2)}    # South Top (Above Door)
	]
	
	for w_data in walls_data:
		var wall_mesh = BoxMesh.new()
		wall_mesh.size = w_data["size"]
		var wall_inst = MeshInstance3D.new()
		wall_inst.mesh = wall_mesh
		wall_inst.material_override = wall_mat
		wall_inst.position = center + w_data["pos"]
		add_child(wall_inst)
		
	# 4. Bed Upgrade Node
	_bed_node = Node3D.new()
	_bed_node.position = center + Vector3(-5.0, 0.0, -5.0)
	add_child(_bed_node)
	
	# Bed wood frame
	var bed_frame = BoxMesh.new()
	bed_frame.size = Vector3(2.2, 0.4, 1.8)
	var bed_frame_inst = MeshInstance3D.new()
	bed_frame_inst.mesh = bed_frame
	bed_frame_inst.material_override = wood_mat
	bed_frame_inst.position = Vector3(0.0, 0.2, 0.0)
	_bed_node.add_child(bed_frame_inst)
	
	# Mattress
	var bed_mattress = BoxMesh.new()
	bed_mattress.size = Vector3(2.0, 0.3, 1.6)
	var bed_mattress_inst = MeshInstance3D.new()
	bed_mattress_inst.mesh = bed_mattress
	bed_mattress_inst.material_override = mattress_mat
	bed_mattress_inst.position = Vector3(0.0, 0.5, 0.0)
	_bed_node.add_child(bed_mattress_inst)
	
	# Pillow
	var pillow = BoxMesh.new()
	pillow.size = Vector3(0.4, 0.1, 0.7)
	var pillow_inst = MeshInstance3D.new()
	pillow_inst.mesh = pillow
	pillow_inst.material_override = mattress_mat
	pillow_inst.position = Vector3(-0.7, 0.65, 0.0)
	_bed_node.add_child(pillow_inst)
	
	# Blanket
	var blanket = BoxMesh.new()
	blanket.size = Vector3(1.2, 0.31, 1.62)
	var blanket_inst = MeshInstance3D.new()
	blanket_inst.mesh = blanket
	blanket_inst.material_override = blanket_mat
	blanket_inst.position = Vector3(0.4, 0.51, 0.0)
	_bed_node.add_child(blanket_inst)
	
	# 5. Smart TV Node
	_tv_node = Node3D.new()
	_tv_node.position = center + Vector3(0.0, 1.8, -7.8)
	add_child(_tv_node)
	
	var tv_frame = BoxMesh.new()
	tv_frame.size = Vector3(2.5, 1.5, 0.1)
	var tv_frame_inst = MeshInstance3D.new()
	tv_frame_inst.mesh = tv_frame
	tv_frame_inst.material_override = black_plastic
	_tv_node.add_child(tv_frame_inst)
	
	var tv_screen = BoxMesh.new()
	tv_screen.size = Vector3(2.4, 1.4, 0.12)
	var tv_screen_inst = MeshInstance3D.new()
	tv_screen_inst.mesh = tv_screen
	var screen_glow = StandardMaterial3D.new()
	screen_glow.albedo_color = Color(0.0, 0.02, 0.1)
	screen_glow.emission_enabled = true
	screen_glow.emission = Color(0.18, 0.45, 0.7, 0.4)
	tv_screen_inst.material_override = screen_glow
	_tv_node.add_child(tv_screen_inst)
	
	# 6. Desk & PC Node
	_pc_node = Node3D.new()
	_pc_node.position = center + Vector3(-5.0, 0.0, 4.0)
	add_child(_pc_node)
	
	# Desk
	var desk_mesh = BoxMesh.new()
	desk_mesh.size = Vector3(1.4, 0.75, 2.0)
	var desk_inst = MeshInstance3D.new()
	desk_inst.mesh = desk_mesh
	desk_inst.material_override = wood_mat
	desk_inst.position = Vector3(0.0, 0.375, 0.0)
	_pc_node.add_child(desk_inst)
	
	# Monitor
	var monitor_mesh = BoxMesh.new()
	monitor_mesh.size = Vector3(0.1, 0.5, 0.8)
	var monitor_inst = MeshInstance3D.new()
	monitor_inst.mesh = monitor_mesh
	monitor_inst.material_override = black_plastic
	monitor_inst.position = Vector3(0.4, 1.0, 0.0)
	_pc_node.add_child(monitor_inst)
	
	# PC Tower Case
	var case_mesh = BoxMesh.new()
	case_mesh.size = Vector3(0.4, 0.5, 0.5)
	var case_inst = MeshInstance3D.new()
	case_inst.mesh = case_mesh
	case_inst.material_override = black_plastic
	case_inst.position = Vector3(-0.4, 0.25, 0.7)
	_pc_node.add_child(case_inst)
	
	# Neon RGB Light
	_pc_light = OmniLight3D.new()
	_pc_light.light_color = Color(0.0, 1.0, 1.0)
	_pc_light.light_energy = 2.0
	_pc_light.omni_range = 3.0
	_pc_light.position = Vector3(-0.4, 0.25, 0.7)
	_pc_node.add_child(_pc_light)
	
	# Keyboard
	var kbd_mesh = BoxMesh.new()
	kbd_mesh.size = Vector3(0.2, 0.02, 0.5)
	var kbd_inst = MeshInstance3D.new()
	kbd_inst.mesh = kbd_mesh
	kbd_inst.material_override = black_plastic
	kbd_inst.position = Vector3(0.0, 0.76, 0.0)
	_pc_node.add_child(kbd_inst)
	
	# 7. Coffee counter & Espresso Machine
	_coffee_node = Node3D.new()
	_coffee_node.position = center + Vector3(5.0, 0.0, 4.0)
	add_child(_coffee_node)
	
	# Small table
	var coffee_table = BoxMesh.new()
	coffee_table.size = Vector3(1.0, 0.75, 1.0)
	var ct_inst = MeshInstance3D.new()
	ct_inst.mesh = coffee_table
	ct_inst.material_override = wood_mat
	ct_inst.position = Vector3(0.0, 0.375, 0.0)
	_coffee_node.add_child(ct_inst)
	
	# Chrome espresso machine
	var machine_mesh = BoxMesh.new()
	machine_mesh.size = Vector3(0.4, 0.4, 0.4)
	var machine_inst = MeshInstance3D.new()
	machine_inst.mesh = machine_mesh
	machine_inst.material_override = metal_mat
	machine_inst.position = Vector3(0.0, 0.95, 0.0)
	_coffee_node.add_child(machine_inst)
	
	var filter_holder = CylinderMesh.new()
	filter_holder.top_radius = 0.03
	filter_holder.bottom_radius = 0.03
	filter_holder.height = 0.25
	var fh_inst = MeshInstance3D.new()
	fh_inst.mesh = filter_holder
	fh_inst.material_override = black_plastic
	fh_inst.rotation_degrees = Vector3(0, 0, 90)
	fh_inst.position = Vector3(0.2, 0.9, 0.0)
	_coffee_node.add_child(fh_inst)
	
	# 8. Modern Kitchen Counter Node
	_kitchen_node = Node3D.new()
	_kitchen_node.position = center + Vector3(5.0, 0.0, -4.0)
	add_child(_kitchen_node)
	
	# Kitchen cabinet
	var kitchen_cabinet = BoxMesh.new()
	kitchen_cabinet.size = Vector3(1.2, 0.9, 2.5)
	var kc_inst = MeshInstance3D.new()
	kc_inst.mesh = kitchen_cabinet
	kc_inst.material_override = black_plastic
	kc_inst.position = Vector3(0.0, 0.45, 0.0)
	_kitchen_node.add_child(kc_inst)
	
	# White Marble Top
	var marble_top = BoxMesh.new()
	marble_top.size = Vector3(1.2, 0.08, 2.52)
	var mt_inst = MeshInstance3D.new()
	mt_inst.mesh = marble_top
	var marble_mat = StandardMaterial3D.new()
	marble_mat.albedo_color = Color(0.9, 0.92, 0.95)
	marble_mat.roughness = 0.1
	mt_inst.material_override = marble_mat
	mt_inst.position = Vector3(0.0, 0.94, 0.0)
	_kitchen_node.add_child(mt_inst)
	
	# 9. Simple bedroom warm lights
	var light1 = OmniLight3D.new()
	light1.light_color = Color(1.0, 0.85, 0.6) # Warm orange
	light1.light_energy = 2.0
	light1.omni_range = 8.0
	light1.position = center + Vector3(-4.0, 3.5, -4.0)
	add_child(light1)
	
	var light2 = OmniLight3D.new()
	light2.light_color = Color(1.0, 0.85, 0.6)
	light2.light_energy = 1.5
	light2.omni_range = 8.0
	light2.position = center + Vector3(4.0, 3.5, 4.0)
	add_child(light2)
	
	# Static door frame indicator (Visual exit helper on South wall)
	var door_frame = BoxMesh.new()
	door_frame.size = Vector3(1.2, 2.4, 0.1)
	var df_inst = MeshInstance3D.new()
	df_inst.mesh = door_frame
	df_inst.material_override = wood_mat
	df_inst.position = center + Vector3(0.0, 1.2, 7.9)
	add_child(df_inst)
	
	var door_panel = BoxMesh.new()
	door_panel.size = Vector3(1.1, 2.3, 0.05)
	var dp_inst = MeshInstance3D.new()
	dp_inst.mesh = door_panel
	var exit_glow = StandardMaterial3D.new()
	exit_glow.albedo_color = Color(0.1, 0.3, 0.1)
	exit_glow.emission_enabled = true
	exit_glow.emission = Color(0.2, 0.8, 0.2, 0.3)
	dp_inst.material_override = exit_glow
	dp_inst.position = center + Vector3(0.0, 1.15, 7.88)
	add_child(dp_inst)
	
	# Set initial visibility of upgrades
	update_furnishing()

func update_furnishing() -> void:
	# Show or hide models based on GameManager upgrades dictionary
	var upgrades = GameManager.home_upgrades
	
	if _bed_node:
		_bed_node.visible = upgrades.get("bed", false)
	if _tv_node:
		_tv_node.visible = upgrades.get("tv", false)
	if _coffee_node:
		_coffee_node.visible = upgrades.get("coffee", false)
	if _kitchen_node:
		_kitchen_node.visible = upgrades.get("kitchen", false)
	if _pc_node:
		_pc_node.visible = upgrades.get("pc", false)

func _process(delta: float) -> void:
	# Rotate Gaming PC RGB Light colors if active
	if _pc_node and _pc_node.visible and _pc_light:
		_time_elapsed += delta * 2.0
		# Hue shift mapping
		var r = sin(_time_elapsed) * 0.5 + 0.5
		var g = sin(_time_elapsed + PI * 2.0 / 3.0) * 0.5 + 0.5
		var b = sin(_time_elapsed + PI * 4.0 / 3.0) * 0.5 + 0.5
		_pc_light.light_color = Color(r, g, b)
