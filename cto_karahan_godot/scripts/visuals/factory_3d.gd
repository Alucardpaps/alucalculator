class_name Factory3D
extends SubViewport

## Manages the 3D rendering representation of the factory, mirroring 2D simulation state.
## Handles Player (Manager3D) WASD movement, 3D camera controls, and proximity worker interaction.

var workstations_3d: Node3D
var workers_3d: Node3D
var manager_3d: CharacterBody3D
var camera_3d: Camera3D
var light_3d: DirectionalLight3D
var env_3d: WorldEnvironment
var tablet_3d: Node3D
var tablet_screen_material: StandardMaterial3D
var home_3d_node: Home3D


var active: bool = false:
	set(val):
		active = val
		if manager_3d:
			manager_3d.set_physics_process(val)
			manager_3d.set_process_unhandled_input(val)
			if manager_3d.has_method("set_active"):
				manager_3d.set_active(val)
		if camera_3d:
			camera_3d.current = val

var _ws_nodes: Dictionary = {}
var _worker_nodes: Dictionary = {}
var _path_indicators: Array[MeshInstance3D] = []
var _vehicles: Array[Dictionary] = []
var _personal_vehicles_container: Node3D = null

# Ceiling lights and car headlights collections for day-night toggle
var _ceiling_lights: Array[OmniLight3D] = []
var _headlights: Array[SpotLight3D] = []

# Procedural Materials Cache
var _ground_mat: StandardMaterial3D
var _wall_mat: StandardMaterial3D
var _fence_mat: StandardMaterial3D
var _glass_mat: StandardMaterial3D
var _wood_mat: StandardMaterial3D
var _metal_mat: StandardMaterial3D
var _gold_mat: StandardMaterial3D
var _tile_mat: StandardMaterial3D
var _asphalt_mat: StandardMaterial3D
var _yellow_line_mat: StandardMaterial3D
var _roof_mat: StandardMaterial3D
var _skylight_mat: StandardMaterial3D
var _sandwich_panel_mat: StandardMaterial3D
var _brick_mat: StandardMaterial3D
var _white_panel_mat: StandardMaterial3D
var _lead_wall_mat: StandardMaterial3D
var _thick_concrete_mat: StandardMaterial3D


# Delivery Truck State
var _delivery_truck: Node3D = null
var _truck_state: String = "none" # "none", "entering", "loading", "exiting"
var _truck_path: Array[Vector3] = []
var _truck_path_idx: int = 0
var _truck_timer: float = 0.0
var _last_completed_orders: int = 0

var _factory_structure: Node3D = null

func _create_procedural_material(colors: Array[Color], frequency: float = 0.05, roughness: float = 0.8, metallic: float = 0.0, normal_strength: float = 1.0, triplanar: bool = false, scale: float = 1.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	
	var noise := FastNoiseLite.new()
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	# Set highly detailed FBM fractal noise parameters
	noise.frequency = frequency
	noise.fractal_type = FastNoiseLite.FRACTAL_FBM
	noise.fractal_octaves = 4
	noise.fractal_lacunarity = 2.0
	noise.fractal_gain = 0.5
	noise.seed = randi()
	
	var grad := Gradient.new()
	grad.offsets = [0.0, 1.0]
	grad.colors = colors
	
	# High-detail 512x512 resolution for fine grains and micro-detail bumpiness
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
		mat.uv1_scale = Vector3(scale, scale, scale)
	else:
		mat.uv1_scale = Vector3(scale, scale, scale)
		
	return mat

func _load_world_material(albedo_path: String, normal_path: String = "", roughness: float = 0.8, metallic: float = 0.0, triplanar: bool = false, scale: float = 1.0) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	if ResourceLoader.exists(albedo_path):
		mat.albedo_texture = load(albedo_path)
	if not normal_path.is_empty() and ResourceLoader.exists(normal_path):
		mat.normal_enabled = true
		mat.normal_texture = load(normal_path)
	mat.roughness = roughness
	mat.metallic = metallic
	if triplanar:
		mat.uv1_triplanar = true
	mat.uv1_scale = Vector3(scale, scale, scale)
	return mat

func _ready() -> void:
	# Build 3D structure procedurally
	var world := Node3D.new()
	add_child(world)
	
	home_3d_node = Home3D.new()
	world.add_child(home_3d_node)
	
	# Light
	light_3d = DirectionalLight3D.new()
	world.add_child(light_3d)
	light_3d.rotation_degrees = Vector3(-55, 45, 0)
	light_3d.shadow_enabled = true
	
	# Environment (setup Procedural Sky for rich day/night rendering)
	env_3d = WorldEnvironment.new()
	world.add_child(env_3d)
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.15, 0.25, 0.45)
	sky_mat.sky_horizon_color = Color(0.45, 0.55, 0.7)
	sky_mat.ground_bottom_color = Color(0.08, 0.09, 0.12)
	sky_mat.ground_horizon_color = Color(0.12, 0.14, 0.17)
	sky.sky_material = sky_mat
	env.sky = sky
	
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env_3d.environment = env
	
	# Generate premium procedural noise materials or load from disk if available
	if ResourceLoader.exists("res://assets/textures/world/epoxy_floor_albedo.png"):
		_ground_mat = _load_world_material("res://assets/textures/world/epoxy_floor_albedo.png", "res://assets/textures/world/epoxy_floor_normal.png", 0.25, 0.1, true, 0.2)
	else:
		_ground_mat = _create_procedural_material([Color(0.08, 0.1, 0.13), Color(0.14, 0.17, 0.22)], 0.04, 0.25, 0.1, 1.2, true, 0.5)

	if ResourceLoader.exists("res://assets/textures/world/brut_concrete_albedo.png"):
		_wall_mat = _load_world_material("res://assets/textures/world/brut_concrete_albedo.png", "res://assets/textures/world/brut_concrete_normal.png", 0.85, 0.0, true, 0.2)
	else:
		_wall_mat = _create_procedural_material([Color(0.2, 0.22, 0.26), Color(0.28, 0.3, 0.35)], 0.06, 0.85, 0.0, 2.5, true, 0.5)

	_fence_mat = _create_procedural_material([Color(0.08, 0.09, 0.11), Color(0.15, 0.16, 0.19)], 0.1, 0.35, 0.85, 1.0, false, 1.0)
	_wood_mat = _create_procedural_material([Color(0.25, 0.12, 0.05), Color(0.45, 0.22, 0.1)], 0.02, 0.4, 0.0, 0.5, false, 1.0)
	_metal_mat = _create_procedural_material([Color(0.6, 0.62, 0.65), Color(0.75, 0.77, 0.8)], 0.12, 0.2, 0.95, 0.8, false, 1.0)
	_gold_mat = _create_procedural_material([Color(0.7, 0.5, 0.15), Color(0.9, 0.7, 0.25)], 0.05, 0.15, 0.95, 1.0, false, 1.0)
	_tile_mat = _create_procedural_material([Color(0.85, 0.85, 0.87), Color(0.95, 0.95, 0.97)], 0.08, 0.18, 0.0, 0.6, true, 2.0)

	if ResourceLoader.exists("res://assets/textures/world/asphalt_road_albedo.png"):
		_asphalt_mat = _load_world_material("res://assets/textures/world/asphalt_road_albedo.png", "res://assets/textures/world/asphalt_road_normal.png", 0.95, 0.0, true, 0.2)
	else:
		_asphalt_mat = _create_procedural_material([Color(0.05, 0.05, 0.06), Color(0.1, 0.1, 0.12)], 0.22, 0.95, 0.0, 3.0, true, 1.5)

	_yellow_line_mat = _create_procedural_material([Color(0.85, 0.7, 0.05), Color(0.95, 0.8, 0.1)], 0.1, 0.8, 0.0, 1.5, false, 1.0)

	if ResourceLoader.exists("res://assets/textures/world/concrete_roof_albedo.png"):
		_roof_mat = _load_world_material("res://assets/textures/world/concrete_roof_albedo.png", "res://assets/textures/world/concrete_roof_normal.png", 0.9, 0.0, true, 0.2)
	else:
		_roof_mat = _create_procedural_material([Color(0.18, 0.2, 0.24), Color(0.25, 0.28, 0.32)], 0.08, 0.9, 0.0, 2.0, true, 0.5)

	if ResourceLoader.exists("res://assets/textures/world/glass_skylight_albedo.png"):
		_skylight_mat = _load_world_material("res://assets/textures/world/glass_skylight_albedo.png", "", 0.1, 0.3, true, 0.5)
		_skylight_mat.transparency = StandardMaterial3D.TRANSPARENCY_ALPHA
		_skylight_mat.albedo_color = Color(1.0, 1.0, 1.0, 0.7)
	else:
		_skylight_mat = _glass_mat
	
	_glass_mat = StandardMaterial3D.new()
	_glass_mat.albedo_color = Color(0.18, 0.55, 0.75, 0.3)
	_glass_mat.transparency = StandardMaterial3D.TRANSPARENCY_ALPHA
	_glass_mat.roughness = 0.1
	_glass_mat.metallic = 0.5
	
	_sandwich_panel_mat = _create_procedural_material([Color(0.3, 0.4, 0.5), Color(0.25, 0.35, 0.45)], 0.15, 0.6, 0.4, 1.0, false, 1.0)
	_brick_mat = _create_procedural_material([Color(0.55, 0.22, 0.16), Color(0.45, 0.18, 0.12)], 0.12, 0.9, 0.0, 1.5, true, 2.0)
	_white_panel_mat = _create_procedural_material([Color(0.92, 0.92, 0.95), Color(0.85, 0.87, 0.9)], 0.05, 0.2, 0.1, 0.5, false, 1.0)
	_lead_wall_mat = _create_procedural_material([Color(0.24, 0.26, 0.3), Color(0.18, 0.2, 0.24)], 0.08, 0.5, 0.85, 1.0, false, 1.0)
	_thick_concrete_mat = _create_procedural_material([Color(0.15, 0.16, 0.18), Color(0.22, 0.24, 0.26)], 0.15, 0.95, 0.0, 3.0, true, 0.5)
	
	# Ground
	var ground := StaticBody3D.new()
	world.add_child(ground)
	
	var col_shape := CollisionShape3D.new()
	var box_col := BoxShape3D.new()
	box_col.size = Vector3(300, 1, 300)
	col_shape.shape = box_col
	col_shape.position = Vector3(0, -0.5, 0)
	ground.add_child(col_shape)
	
	var mesh_inst := MeshInstance3D.new()
	var plane_mesh := PlaneMesh.new()
	plane_mesh.size = Vector2(300, 300)
	mesh_inst.mesh = plane_mesh
	mesh_inst.material_override = _ground_mat
	ground.add_child(mesh_inst)
	
	# Factory structure container
	_factory_structure = Node3D.new()
	_factory_structure.name = "FactoryStructure"
	world.add_child(_factory_structure)
		
	# Build static pool of path indicators to prevent allocation in _process
	var trail_container := Node3D.new()
	world.add_child(trail_container)
	
	var sphere := SphereMesh.new()
	sphere.radius = 0.08
	sphere.height = 0.16
	
	var trail_mat := StandardMaterial3D.new()
	trail_mat.albedo_color = Color(0.24, 0.82, 0.93)
	trail_mat.emission_enabled = true
	trail_mat.emission = Color(0.24, 0.82, 0.93)
	
	for i in range(120):
		var mi := MeshInstance3D.new()
		mi.mesh = sphere
		mi.material_override = trail_mat
		mi.visible = false
		trail_container.add_child(mi)
		_path_indicators.append(mi)
	
	# Workstations Container
	workstations_3d = Node3D.new()
	world.add_child(workstations_3d)
	
	# Workers Container
	workers_3d = Node3D.new()
	world.add_child(workers_3d)
	
	# Setup Manager
	manager_3d = CharacterBody3D.new()
	world.add_child(manager_3d)
	manager_3d.name = "Manager3D"
	var start_pos := FactoryFloor.screen_to_3d(FactoryFloor.iso_to_screen(15.0, 2.5))
	manager_3d.global_position = start_pos + Vector3(0, 1.0, 0)
	
	var p_shape := CollisionShape3D.new()
	var cap_shape := CapsuleShape3D.new()
	cap_shape.radius = 0.4
	cap_shape.height = 1.8
	p_shape.shape = cap_shape
	p_shape.position = Vector3(0, 0.9, 0)
	manager_3d.add_child(p_shape)
	
	var p_mesh := MeshInstance3D.new()
	var cap_mesh := CapsuleMesh.new()
	cap_mesh.radius = 0.4
	cap_mesh.height = 1.8
	p_mesh.mesh = cap_mesh
	p_mesh.material_override = _metal_mat
	p_mesh.position = Vector3(0, 0.9, 0)
	p_mesh.visible = false
	manager_3d.add_child(p_mesh)
	
	# Camera (First-person eye level)
	camera_3d = Camera3D.new()
	camera_3d.name = "Camera3D"
	manager_3d.add_child(camera_3d)
	camera_3d.position = Vector3(0, 1.6, 0)
	camera_3d.rotation = Vector3.ZERO
	camera_3d.fov = 75.0
	
	# 3D Tablet Viewmodel (held in hand)
	tablet_3d = Node3D.new()
	tablet_3d.name = "Tablet3D"
	camera_3d.add_child(tablet_3d)
	tablet_3d.position = Vector3(0.22, -0.22, -0.32)
	tablet_3d.rotation = Vector3(deg_to_rad(15), deg_to_rad(-25), deg_to_rad(10))
	
	# Tablet body mesh
	var body_mi := MeshInstance3D.new()
	var body_mesh := BoxMesh.new()
	body_mesh.size = Vector3(0.26, 0.17, 0.01)
	body_mi.mesh = body_mesh
	
	var body_mat := StandardMaterial3D.new()
	body_mat.albedo_color = Color(0.08, 0.09, 0.12)
	body_mat.metallic = 0.6
	body_mat.roughness = 0.4
	body_mi.material_override = body_mat
	tablet_3d.add_child(body_mi)
	
	# Tablet screen mesh
	var screen_mi := MeshInstance3D.new()
	var screen_mesh := BoxMesh.new()
	screen_mesh.size = Vector3(0.24, 0.15, 0.002)
	screen_mi.mesh = screen_mesh
	screen_mi.position = Vector3(0, 0, 0.005) # Slightly in front of body
	
	tablet_screen_material = StandardMaterial3D.new()
	tablet_screen_material.albedo_color = Color.WHITE # Reset albedo color to white to correctly display viewport textures without tinting
	tablet_screen_material.metallic = 0.0 # Non-metallic screen to prevent flat grey environment reflections
	tablet_screen_material.roughness = 0.4 # Slightly glossy glass but not a mirror reflection
	tablet_screen_material.emission_enabled = true
	tablet_screen_material.emission = Color(0.0, 0.15, 0.35) # Deep high-tech blue glow
	screen_mi.material_override = tablet_screen_material
	tablet_3d.add_child(screen_mi)
	
	# Add controller script
	manager_3d.set_script(load("res://scripts/visuals/manager_3d_controller.gd"))
	
	# Connect events
	EventBus.factory_selected.connect(_on_factory_selected)
	EventBus.masters_updated.connect(_sync_workers)
	EventBus.time_changed.connect(_on_time_changed)
	
	_last_completed_orders = GameManager.completed_orders
	active = false

func _add_ceiling_light(parent: Node3D, pos: Vector3) -> void:
	var fixture := MeshInstance3D.new()
	fixture.name = "CeilingFixture"
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.15
	cyl.bottom_radius = 0.15
	cyl.height = 0.05
	fixture.mesh = cyl
	
	var fixture_mat := StandardMaterial3D.new()
	fixture_mat.albedo_color = Color(0.9, 0.9, 0.95)
	fixture_mat.emission_enabled = true
	fixture_mat.emission = Color(1.0, 1.0, 0.95)
	fixture_mat.emission_energy_multiplier = 2.0
	fixture.material_override = fixture_mat
	parent.add_child(fixture)
	fixture.global_position = pos
	
	var light := OmniLight3D.new()
	light.light_energy = 0.0
	light.light_color = Color(1.0, 0.95, 0.88) # Warm domestic/industrial white
	light.omni_range = 10.0
	light.shadow_enabled = true
	parent.add_child(light)
	light.global_position = pos - Vector3(0, 0.06, 0)
	
	_ceiling_lights.append(light)

func _on_time_changed(_day: int, hour: int, minute: int) -> void:
	var time_in_hours = hour + (minute / 60.0)
	
	# 1. Rotate Sun (DirectionalLight3D)
	if is_instance_valid(light_3d):
		var angle = -((time_in_hours - 6.0) / 24.0) * TAU
		light_3d.rotation.x = angle
		light_3d.rotation.y = deg_to_rad(45.0)
		
	# 2. Day/Night sky and ambient interpolation
	var sun_energy := 0.0
	var sun_color := Color(1.0, 0.95, 0.85)
	var sky_top := Color(0.15, 0.25, 0.45)
	var sky_horiz := Color(0.45, 0.55, 0.7)
	var ground_horiz := Color(0.12, 0.14, 0.17)
	var ambient_color := Color(0.2, 0.22, 0.28)
	var lights_energy := 0.0
	
	if time_in_hours >= 5.0 and time_in_hours < 7.0:
		# Sunrise
		var factor = (time_in_hours - 5.0) / 2.0
		sun_energy = factor * 1.2
		sun_color = Color(1.0, 0.45, 0.2).lerp(Color(1.0, 0.95, 0.85), factor)
		sky_top = Color(0.01, 0.01, 0.03).lerp(Color(0.15, 0.25, 0.45), factor)
		sky_horiz = Color(0.02, 0.02, 0.05).lerp(Color(0.85, 0.45, 0.25), factor)
		ground_horiz = Color(0.01, 0.01, 0.02).lerp(Color(0.12, 0.14, 0.17), factor)
		ambient_color = Color(0.02, 0.02, 0.03).lerp(Color(0.2, 0.22, 0.28), factor)
		lights_energy = (1.0 - factor) * 1.5
	elif time_in_hours >= 7.0 and time_in_hours < 17.0:
		# Mid-day
		sun_energy = 1.2
		sun_color = Color(1.0, 0.98, 0.9)
		sky_top = Color(0.15, 0.25, 0.45)
		sky_horiz = Color(0.45, 0.55, 0.7)
		ground_horiz = Color(0.12, 0.14, 0.17)
		ambient_color = Color(0.2, 0.22, 0.28)
		lights_energy = 0.0
	elif time_in_hours >= 17.0 and time_in_hours < 19.0:
		# Sunset
		var factor = (time_in_hours - 17.0) / 2.0
		sun_energy = (1.0 - factor) * 1.2
		sun_color = Color(1.0, 0.98, 0.9).lerp(Color(0.9, 0.25, 0.1), factor)
		sky_top = Color(0.15, 0.25, 0.45).lerp(Color(0.05, 0.05, 0.1), factor)
		sky_horiz = Color(0.45, 0.55, 0.7).lerp(Color(0.9, 0.35, 0.15), factor)
		ground_horiz = Color(0.12, 0.14, 0.17).lerp(Color(0.2, 0.08, 0.05), factor)
		ambient_color = Color(0.2, 0.22, 0.28).lerp(Color(0.05, 0.05, 0.08), factor)
		lights_energy = factor * 1.5
	else:
		# Night
		sun_energy = 0.15
		sun_color = Color(0.45, 0.55, 0.8)
		sky_top = Color(0.01, 0.01, 0.03)
		sky_horiz = Color(0.02, 0.02, 0.05)
		ground_horiz = Color(0.01, 0.01, 0.02)
		ambient_color = Color(0.02, 0.02, 0.04)
		lights_energy = 1.5
		
	if is_instance_valid(light_3d):
		light_3d.light_energy = sun_energy
		light_3d.light_color = sun_color
		
	if is_instance_valid(env_3d) and env_3d.environment:
		env_3d.environment.ambient_light_color = ambient_color
		var sky_mat = env_3d.environment.sky.sky_material as ProceduralSkyMaterial
		if sky_mat:
			sky_mat.sky_top_color = sky_top
			sky_mat.sky_horizon_color = sky_horiz
			sky_mat.ground_horizon_color = ground_horiz
			
	for light in _ceiling_lights:
		if is_instance_valid(light):
			light.light_energy = lights_energy
			
	var p_is_driving = manager_3d.is_driving() if is_instance_valid(manager_3d) else false
	var p_vehicle = manager_3d.get_current_vehicle() if is_instance_valid(manager_3d) else null
	for light in _headlights:
		if is_instance_valid(light) and not (p_is_driving and p_vehicle == light.get_parent()):
			light.light_energy = 2.0 if lights_energy > 0 else 0.0

func _build_boundary_walls(parent: Node3D, type: String) -> void:
	# Load the custom layout resource
	var layout_path := "res://resources/factories/%s_layout.tres" % type
	var layout: Resource = null
	if ResourceLoader.exists(layout_path):
		layout = load(layout_path)
		
	if not layout:
		push_error("Failed to load factory layout resource: " + layout_path)
		return

	# --- 1. Outer Yard Fence (Z: -20 to 75, X: -40 to 140) ---
	_create_box_obstacle(parent, Vector3(50, 2.5, -20), Vector3(180, 5, 2), _fence_mat)
	_create_box_obstacle(parent, Vector3(-40, 2.5, 27.5), Vector3(2, 5, 95), _fence_mat)
	_create_box_obstacle(parent, Vector3(140, 2.5, 27.5), Vector3(2, 5, 95), _fence_mat)
	_create_box_obstacle(parent, Vector3(10, 2.5, 75), Vector3(100, 5, 2), _fence_mat)
	_create_box_obstacle(parent, Vector3(110, 2.5, 75), Vector3(60, 5, 2), _fence_mat)

	# --- 2. Factory Building Walls & Roof ---
	var length: float = layout.get("length")
	var width: float = layout.get("width")
	var height: float = layout.get("height")
	var z_offset: float = layout.get("z_offset")
	var wall_material_type: String = layout.get("wall_material_type")

	var x_min: float = 0.0
	var x_max: float = length
	var z_min: float = 0.0
	var z_max: float = width
		
	z_min += z_offset
	z_max += z_offset
	
	var z_center: float = (z_min + z_max) / 2.0
	var w_mat = _sandwich_panel_mat if wall_material_type == "sandwich" else _wall_mat
	
	# Back Wall (Z = z_min)
	_create_box_obstacle(parent, Vector3(length / 2.0, height / 2.0, z_min), Vector3(length, height, 0.4), w_mat)
	# Left Wall (X = x_min)
	_create_box_obstacle(parent, Vector3(x_min, height / 2.0, z_center), Vector3(0.4, height, width), w_mat)
	
	# Right Wall (X = x_max) (leave a doorway gap on the right for deliveries)
	_create_box_obstacle(parent, Vector3(x_max, height / 2.0, z_min + width * 0.25), Vector3(0.4, height, width * 0.5), w_mat)
	_create_box_obstacle(parent, Vector3(x_max, height / 2.0, z_max - width * 0.25), Vector3(0.4, height, width * 0.5), w_mat)
	
	# Front Wall (Z = z_max)
	# Split front wall to leave an entrance lobby door gap (X = 15.0 to 25.0)
	var front_segment_left_w := 15.0
	_create_box_obstacle(parent, Vector3(front_segment_left_w / 2.0, height / 2.0, z_max), Vector3(front_segment_left_w, height, 0.4), w_mat)
	
	var front_segment_right_w := length - 25.0
	_create_box_obstacle(parent, Vector3(25.0 + front_segment_right_w / 2.0, height / 2.0, z_max), Vector3(front_segment_right_w, height, 0.4), w_mat)
	
	# Lobby Entrance Sliding glass door (X = 20.0, Z = z_max)
	var door := SlidingGlassDoor3D.new()
	door.name = "LobbySlidingDoor"
	door.door_height = height
	parent.add_child(door)
	door.global_position = Vector3(20.0, 0.0, z_max)

	# --- 3. Roof & Glass Skylights ---
	# Left Roof segment
	_create_box_obstacle(parent, Vector3(front_segment_left_w / 2.0, height, z_center), Vector3(front_segment_left_w, 0.2, width), _roof_mat)
	# Right Roof segment
	_create_box_obstacle(parent, Vector3(25.0 + front_segment_right_w / 2.0, height, z_center), Vector3(front_segment_right_w, 0.2, width), _roof_mat)
	# Glass Skylight over the Lobby (X: 15.0 to 25.0)
	_create_box_obstacle(parent, Vector3(20.0, height, z_center), Vector3(10.0, 0.2, width), _skylight_mat)

func _on_factory_selected(type: String) -> void:
	# Clear old workstations
	for child in workstations_3d.get_children():
		child.queue_free()
	_ws_nodes.clear()
	
	# Clear old factory structure
	if is_instance_valid(_factory_structure):
		for child in _factory_structure.get_children():
			child.queue_free()
			
	# Clear old lights
	_ceiling_lights.clear()
	
	# Clear normal vehicles, keep personal vehicles
	for i in range(_vehicles.size() - 1, -1, -1):
		var v = _vehicles[i]
		if is_instance_valid(v["node"]):
			var parent_node = v["node"].get_parent()
			if parent_node != _personal_vehicles_container:
				# Clear headlights references
				for spot in v["node"].headlights:
					_headlights.erase(spot)
				v["node"].queue_free()
				_vehicles.remove_at(i)
	# Build dynamic parts
	if is_instance_valid(_factory_structure):
		_build_boundary_walls(_factory_structure, type)
		_build_rooms_and_furniture(_factory_structure, type)
		_build_outdoor_area(_factory_structure, type)
		_build_special_features(_factory_structure, type)
		
	# Rebuild personal vehicles (if any)
	rebuild_personal_vehicles()
	
	# Spawn 3D Workstations
	if is_instance_valid(GameManager.workstations_container):
		for ws2d in GameManager.workstations_container.get_children():
			var ws_key = ws2d.name
			var pos3d = FactoryFloor.screen_to_3d(ws2d.global_position)
			
			var ws_node := Node3D.new()
			workstations_3d.add_child(ws_node)
			ws_node.global_position = pos3d
			
			# Cylinder base visual
			var base_mesh := MeshInstance3D.new()
			var cyl := CylinderMesh.new()
			cyl.top_radius = 1.2
			cyl.bottom_radius = 1.2
			cyl.height = 0.4
			base_mesh.mesh = cyl
			base_mesh.material_override = _wall_mat # Concrete base
			base_mesh.position = Vector3(0, 0.2, 0)
			ws_node.add_child(base_mesh)
			
			# Workstation physical obstacle collider
			var col_body := StaticBody3D.new()
			ws_node.add_child(col_body)
			var ws_shape := CollisionShape3D.new()
			var cyl_shape := CylinderShape3D.new()
			cyl_shape.radius = 1.2
			cyl_shape.height = 1.5
			ws_shape.shape = cyl_shape
			ws_shape.position = Vector3(0, 0.75, 0)
			col_body.add_child(ws_shape)
			
			# Rotating gear mesh cogs
			var gear_base := Node3D.new()
			ws_node.add_child(gear_base)
			gear_base.position = Vector3(0, 0.45, 0)
			
			var gear_mesh := MeshInstance3D.new()
			var gear_cyl := CylinderMesh.new()
			gear_cyl.top_radius = 0.5
			gear_cyl.bottom_radius = 0.5
			gear_cyl.height = 0.15
			gear_cyl.radial_segments = 6 # Low segments act like teeth
			gear_mesh.mesh = gear_cyl
			gear_mesh.material_override = _gold_mat # Procedural gold/bronze metallic gear
			gear_base.add_child(gear_mesh)
			
			# CPUParticles3D Emitters for active indicators
			var particles := CPUParticles3D.new()
			ws_node.add_child(particles)
			particles.position = Vector3(0, 0.5, 0)
			particles.emitting = false
			particles.amount = 8
			particles.lifetime = 0.6
			particles.direction = Vector3(0, 1, 0)
			particles.spread = 45.0
			particles.gravity = Vector3(0, -9.8, 0)
			particles.initial_velocity_min = 2.0
			particles.initial_velocity_max = 4.0
			
			var p_mesh := SphereMesh.new()
			p_mesh.radius = 0.04
			p_mesh.height = 0.08
			particles.mesh = p_mesh
			
			var p_mat := StandardMaterial3D.new()
			p_mat.albedo_color = Color(1.0, 0.8, 0.2)
			p_mat.emission_enabled = true
			p_mat.emission = Color(1.0, 0.8, 0.2)
			particles.material_override = p_mat
			
			var lbl := Label3D.new()
			lbl.text = "%s\n[%s]" % [ws2d.station_name, ws2d.required_skill]
			lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			lbl.font_size = 18
			lbl.outline_size = 6
			lbl.position = Vector3(0, 1.8, 0)
			ws_node.add_child(lbl)
			
			_ws_nodes[ws_key] = {
				"node": ws_node,
				"gear": gear_base,
				"particles": particles
			}
			
	_sync_workers()

func _sync_workers() -> void:
	var active_names = []
	for m in GameManager.masters:
		active_names.append(m.worker_name)
		
		if not _worker_nodes.has(m.worker_name):
			var w_node := Node3D.new()
			workers_3d.add_child(w_node)
			w_node.name = "W3D_" + m.worker_name
			
			var body_mesh := MeshInstance3D.new()
			var cap := CapsuleMesh.new()
			cap.radius = 0.35
			cap.height = 1.6
			body_mesh.mesh = cap
			body_mesh.position = Vector3(0, 0.8, 0)
			w_node.add_child(body_mesh)
			
			var w_mat := StandardMaterial3D.new()
			body_mesh.material_override = w_mat
			
			var lbl := Label3D.new()
			lbl.text = m.worker_name
			lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			lbl.font_size = 14
			lbl.outline_size = 6
			lbl.position = Vector3(0, 2.0, 0)
			w_node.add_child(lbl)
			
			var q_lbl := Label3D.new()
			q_lbl.text = "?"
			q_lbl.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			q_lbl.font_size = 28
			q_lbl.modulate = Color(1.0, 0.82, 0.22)
			q_lbl.outline_size = 8
			q_lbl.position = Vector3(0, 2.5, 0)
			q_lbl.visible = false
			w_node.add_child(q_lbl)
			
			_worker_nodes[m.worker_name] = {
				"node": w_node,
				"mesh": body_mesh,
				"mat": w_mat,
				"label": lbl,
				"q_label": q_lbl,
				"expert_skill": m.skill
			}
			
	for w_name in _worker_nodes.keys():
		if not active_names.has(w_name):
			_worker_nodes[w_name]["node"].queue_free()
			_worker_nodes.erase(w_name)

func _process(delta: float) -> void:
	# 1. Update active workstations (gears & particles)
	var active_workstations = {}
	for m in GameManager.masters:
		if m.status == "working" and not m.current_ws.is_empty():
			active_workstations[m.current_ws] = true
			
	for ws_key in _ws_nodes.keys():
		var ws_data = _ws_nodes[ws_key]
		var gear: Node3D = ws_data["gear"]
		var particles: CPUParticles3D = ws_data["particles"]
		
		if active_workstations.has(ws_key):
			gear.rotate_y(5.0 * delta)
			particles.emitting = true
		else:
			particles.emitting = false

	# 2. Update 3D worker positions and materials
	for m in GameManager.masters:
		if _worker_nodes.has(m.worker_name):
			var data = _worker_nodes[m.worker_name]
			var w_node: Node3D = data["node"]
			var target_pos3d = FactoryFloor.screen_to_3d(m.global_position)
			
			w_node.global_position = w_node.global_position.lerp(target_pos3d, 12.0 * delta)
			
			var color = Color(0.7, 0.7, 0.7)
			match m.status:
				"idle": color = Color(0.6, 0.6, 0.6)
				"working": color = Color(0.24, 0.81, 0.45)
				"slacking": color = Color(0.9, 0.5, 0.2)
				"feud": color = Color(0.9, 0.2, 0.2)
			
			data["mat"].albedo_color = color
			
			var has_question = not m.active_question.is_empty()
			data["q_label"].visible = has_question
			
			if has_question:
				data["q_label"].position.y = 2.5 + sin(Time.get_ticks_msec() * 0.005) * 0.15
				
	# 3. Update worker path trails (Zero-allocation pool)
	var active_idx := 0
	for m in GameManager.masters:
		# If the worker is walking/has path points
		if m.path_points.size() > 0:
			for pt in m.path_points:
				if active_idx < _path_indicators.size():
					var pos3d = FactoryFloor.screen_to_3d(pt) + Vector3(0, 0.05, 0)
					var mi = _path_indicators[active_idx]
					mi.global_position = pos3d
					mi.visible = true
					active_idx += 1
					
	# Hide remaining unused indicators in the pool
	for i in range(active_idx, _path_indicators.size()):
		_path_indicators[i].visible = false

	# 4. Proximity Checks & Car Driving logic
	var run_proximity_check = active and is_instance_valid(manager_3d)
	if run_proximity_check:
		var current_zone = "factory"
		if manager_3d.get("current_zone") != null:
			current_zone = manager_3d.current_zone
			
		if current_zone == "home":
			_handle_home_proximity_checks()
		elif manager_3d.is_driving():
			pass
		else:
			# Check worker proximity
			var nearest_worker_idx := -1
			var min_dist := 3.0
			if manager_3d.is_active:
				for i in range(GameManager.masters.size()):
					var m = GameManager.masters[i]
					if _worker_nodes.has(m.worker_name):
						var w3d: Node3D = _worker_nodes[m.worker_name]["node"]
						var dist = manager_3d.global_position.distance_to(w3d.global_position)
						if dist < min_dist:
							min_dist = dist
							nearest_worker_idx = i
							
			if nearest_worker_idx != -1:
				var nearest_w = GameManager.masters[nearest_worker_idx]
				EventBus.toast_notified.emit("🗣️ [E] Tuşuna Basarak %s ile Konuş" % nearest_w.worker_name, "info_persistent")
			else:
				# Check vehicle proximity
				var nearest_vehicle_idx := -1
				var min_v_dist := 3.5
				if manager_3d.is_active:
					for i in range(_vehicles.size()):
						var v = _vehicles[i]
						if is_instance_valid(v["node"]):
							var dist = manager_3d.global_position.distance_to(v["node"].global_position)
							if dist < min_v_dist:
								min_v_dist = dist
								nearest_vehicle_idx = i
								
				if nearest_vehicle_idx != -1:
					var nearest_v = _vehicles[nearest_vehicle_idx]
					EventBus.toast_notified.emit("🚗 [E] Tuşuna Basarak %s Bin ve Sür" % nearest_v["name"], "info_persistent")
				else:
					EventBus.toast_notified.emit("", "info_clear")
	else:
		EventBus.toast_notified.emit("", "info_clear")

	# 5. Delivery Truck Trigger Check
	if GameManager.completed_orders > _last_completed_orders:
		_last_completed_orders = GameManager.completed_orders
		_spawn_delivery_truck()
		
	# 6. Delivery Truck Animation State Machine
	if _truck_state != "none" and is_instance_valid(_delivery_truck):
		if _truck_state == "entering":
			var target = _truck_path[_truck_path_idx]
			var dir = target - _delivery_truck.global_position
			if dir.length() > 0.5:
				_delivery_truck.global_position += dir.normalized() * 10.0 * delta
				var target_rot = atan2(-dir.x, -dir.z)
				_delivery_truck.global_rotation.y = lerp_angle(_delivery_truck.global_rotation.y, target_rot, 5.0 * delta)
			else:
				_truck_path_idx += 1
				if _truck_path_idx >= _truck_path.size():
					_truck_state = "loading"
					_truck_timer = 2.0 if GameManager.auto_loader_owned else 5.0
					GameManager.add_log("📦 Sevkiyat Tırı yükleme alanında durdu. Tamamlanan ürünler yükleniyor...")
		elif _truck_state == "loading":
			_truck_timer -= delta
			if _truck_timer <= 0:
				_truck_state = "exiting"
				_truck_path = [Vector3(105.0, 0.0, 52.5), Vector3(-20.0, 0.0, 52.5)]
				_truck_path_idx = 0
				GameManager.add_log("🚚 Yükleme bitti. Tır sevkiyat için yola çıktı, ürünler fabrikadan gönderildi!")
		elif _truck_state == "exiting":
			var target = _truck_path[_truck_path_idx]
			var dir = target - _delivery_truck.global_position
			if dir.length() > 0.5:
				_delivery_truck.global_position += dir.normalized() * 10.0 * delta
				var target_rot = atan2(-dir.x, -dir.z)
				_delivery_truck.global_rotation.y = lerp_angle(_delivery_truck.global_rotation.y, target_rot, 5.0 * delta)
			else:
				_truck_path_idx += 1
				if _truck_path_idx >= _truck_path.size():
					_truck_state = "none"
					_delivery_truck.queue_free()
					_delivery_truck = null
func _input(event: InputEvent) -> void:
	if not active or not is_instance_valid(manager_3d):
		return
		
	if event is InputEventKey and event.pressed and event.keycode == KEY_E:
		if manager_3d.is_driving():
			# Exit vehicle with fade transition animation
			EventBus.request_fade.emit(func():
				EventBus.possession_released.emit()
			)
			get_viewport().set_input_as_handled()
		else:
			_try_interact_3d_with_fade()

func _try_interact_3d_with_fade() -> void:
	if not manager_3d.is_active:
		return
		
	var current_zone = "factory"
	if manager_3d.get("current_zone") != null:
		current_zone = manager_3d.current_zone
		
	if current_zone == "home":
		_try_interact_home()
		return
		
	# 1. Try talking to the nearest worker first
	var nearest_worker_idx := -1
	var min_dist := 3.0
	for i in range(GameManager.masters.size()):
		var m = GameManager.masters[i]
		if _worker_nodes.has(m.worker_name):
			var w3d: Node3D = _worker_nodes[m.worker_name]["node"]
			var dist = manager_3d.global_position.distance_to(w3d.global_position)
			if dist < min_dist:
				min_dist = dist
				nearest_worker_idx = i
				
	if nearest_worker_idx != -1:
		SoundManager.play("notification")
		EventBus.open_chat.emit(nearest_worker_idx)
		get_viewport().set_input_as_handled()
		return
		
	# 2. Fallback: try entering nearest vehicle (increased distance to 5.0m)
	var nearest_vehicle_idx := -1
	var min_v_dist := 5.0
	
	for i in range(_vehicles.size()):
		var v = _vehicles[i]
		if is_instance_valid(v["node"]):
			var dist = manager_3d.global_position.distance_to(v["node"].global_position)
			if dist < min_v_dist:
				min_v_dist = dist
				nearest_vehicle_idx = i
				
	if nearest_vehicle_idx != -1:
		var nearest_v = _vehicles[nearest_vehicle_idx]
		get_viewport().set_input_as_handled()
		# Play fade transition on enter
		EventBus.request_fade.emit(func():
			SoundManager.play("notification")
			EventBus.possession_requested.emit(nearest_v["node"])
		)

func _spawn_delivery_truck() -> void:
	if is_instance_valid(_delivery_truck):
		return # Already delivering
		
	var truck = Vehicle3D.new()
	truck.data = load("res://resources/vehicles/delivery_truck.tres")
	get_child(0).add_child(truck)
	
	truck.global_position = Vector3(-20.0, 0.0, 52.5)
	truck.global_rotation.y = deg_to_rad(-90)
	
	_delivery_truck = truck
	_truck_state = "entering"
	_truck_path = [Vector3(105.0, 0.0, 52.5), Vector3(105.0, 0.0, 12.0)]
	_truck_path_idx = 0
	
	# Turn on truck lights
	_delivery_truck.set_lights_energy(3.0)
	
	GameManager.add_log("🚚 Sevkiyat Tırı fabrikaya giriş yaptı! Siparişi yüklemek için depoya yanaşıyor.")


func set_tablet_screen_texture(tex: Texture2D) -> void:
	if tablet_screen_material:
		tablet_screen_material.albedo_texture = tex
		tablet_screen_material.emission_texture = tex
		tablet_screen_material.emission_enabled = true
		tablet_screen_material.emission = Color(1.2, 1.2, 1.2) # Self-illuminating glow using the viewport colors

func _create_box_obstacle(parent: Node3D, pos: Vector3, box_size: Vector3, material: Material) -> StaticBody3D:
	var sb := StaticBody3D.new()
	parent.add_child(sb)
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


func _build_rooms_and_furniture(parent: Node3D, type: String) -> void:
	# Load the custom layout resource
	var layout_path := "res://resources/factories/%s_layout.tres" % type
	var layout: Resource = null
	if ResourceLoader.exists(layout_path):
		layout = load(layout_path)
		
	if not layout:
		push_error("Failed to load factory layout resource: " + layout_path)
		return

	# Material mappings
	var materials := {
		"wood": _wood_mat,
		"glass": _glass_mat,
		"metal": _metal_mat,
		"tile": _tile_mat,
		"sandwich": _sandwich_panel_mat,
		"brick": _brick_mat,
		"white_panel": _white_panel_mat,
		"lead_wall": _lead_wall_mat,
		"thick_concrete": _thick_concrete_mat,
		"wall": _wall_mat
	}

	var length: float = layout.get("length")
	var width: float = layout.get("width")
	var height: float = layout.get("height")
	var z_offset: float = layout.get("z_offset")
	var partition_material_type: String = layout.get("partition_material_type")
	var partition_corridor_gap: float = layout.get("partition_corridor_gap")
	var partition_boundaries: Array = layout.get("partition_boundaries")
	var custom_decorations: Array = layout.get("custom_decorations")
	var ceiling_lights: Array = layout.get("ceiling_lights")

	var z_min: float = z_offset
	var z_max: float = z_offset + width
	var z_center: float = (z_min + z_max) / 2.0

	# 1. Spawn ceiling lights
	var light_y: float = height - 0.2
	for light_pos in ceiling_lights:
		var pos = Vector3(light_pos.x, light_y, light_pos.z)
		_add_ceiling_light(parent, pos)

	# 2. Spawn partition walls
	var partition_mat: Material = materials.get(partition_material_type, _wall_mat)
	var gap: float = partition_corridor_gap

	for boundary_u in partition_boundaries:
		var x_pos := float(boundary_u * 2.0)
		var wall_m = partition_mat
		if partition_material_type == "gearbox_mix":
			wall_m = _brick_mat if (boundary_u == 10 or boundary_u == 15) else _wall_mat
			
		# Back segment (room) (Z = z_min to 4.0)
		var back_pos = Vector3(x_pos, height / 2.0, (z_min + 4.0) / 2.0)
		var back_size = Vector3(0.3 if type != "armored" else 0.4, height, 4.0 - z_min)
		_create_box_obstacle(parent, back_pos, back_size, wall_m)
		
		# Front segment (room) (Z = 8.0 to z_max)
		var front_pos = Vector3(x_pos, height / 2.0, (8.0 + z_max) / 2.0)
		var front_size = Vector3(0.3 if type != "armored" else 0.4, height, z_max - 8.0)
		_create_box_obstacle(parent, front_pos, front_size, _wall_mat if partition_material_type == "gearbox_mix" else wall_m)

	# 3. Spawn extra structural steel column pillars for armored factory
	if type == "armored":
		for x_pos in [0.0, 20.0, 40.0, 60.0, 80.0]:
			_create_box_obstacle(parent, Vector3(x_pos, height / 2.0, z_min + 0.5), Vector3(0.6, height, 0.6), _metal_mat)
			_create_box_obstacle(parent, Vector3(x_pos, height / 2.0, z_max - 0.5), Vector3(0.6, height, 0.6), _metal_mat)

	# 4. Spawn custom decorations
	for decor in custom_decorations:
		var pos: Vector3 = decor.get("pos", Vector3.ZERO)
		var size: Vector3 = decor.get("size", Vector3.ZERO)
		var mat_type: String = decor.get("mat_type", "wall")
		var mat = materials.get(mat_type, _wall_mat)
		_create_box_obstacle(parent, pos, size, mat)

	# 5. Spawn cleanroom sliding airlock door for gearbox
	if type == "gearbox":
		var cleanroom_door := SlidingGlassDoor3D.new()
		cleanroom_door.name = "CleanRoomAirlockDoor"
		cleanroom_door.door_height = height
		parent.add_child(cleanroom_door)
		cleanroom_door.global_position = Vector3(45.0, 0.0, 6.0)

	# 6. Build Manager Office next to R&D (Decoupled Node component)
	var office := ManagerOffice3D.new()
	office.name = "ManagerOffice"
	parent.add_child(office)
	office.setup(z_min, z_center, height, _glass_mat, _wood_mat)
	
	# 7. Unified R&D Engineer Desk next to manager's office
	var screen_on_mat := StandardMaterial3D.new()
	screen_on_mat.albedo_color = Color(0.0, 0.8, 0.4)
	screen_on_mat.emission_enabled = true
	screen_on_mat.emission = Color(0.0, 0.8, 0.4)
	_create_box_obstacle(parent, Vector3(12.0, 0.4, -4.5), Vector3(2.0, 0.8, 1.2), _wood_mat)
	_create_box_obstacle(parent, Vector3(12.0, 1.0, -4.5), Vector3(0.1, 0.5, 0.8), screen_on_mat)

func _build_outdoor_area(parent: Node3D, _type: String) -> void:
	var road_x_center := 50.0
	var road_width := 180.0
	
	# Front Road (Z = 45 to 60)
	var front_road := MeshInstance3D.new()
	var road_mesh := PlaneMesh.new()
	road_mesh.size = Vector2(road_width, 15)
	front_road.mesh = road_mesh
	front_road.material_override = _asphalt_mat
	front_road.position = Vector3(road_x_center, 0.01, 52.5)
	parent.add_child(front_road)
	
	# Side Driveway
	var side_x_center := 105.0
	var side_road := MeshInstance3D.new()
	var side_mesh := PlaneMesh.new()
	side_mesh.size = Vector2(20, 95)
	side_road.mesh = side_mesh
	side_road.material_override = _asphalt_mat
	side_road.position = Vector3(side_x_center, 0.01, 27.5)
	parent.add_child(side_road)
	
	# --- 2. Yellow Parking Lines ---
	for x_offset in [10.0, 20.0, 30.0, 40.0, 50.0]:
		_create_box_obstacle(parent, Vector3(x_offset, 0.02, 42.0), Vector3(0.1, 0.01, 5.0), _yellow_line_mat)

	# --- 3. Parked Vehicles (Sedans, Hatchbacks, Sports Cars, Cargo Truck) ---
	var car1 = Vehicle3D.new()
	car1.data = load("res://resources/vehicles/red_sedan.tres")
	parent.add_child(car1)
	car1.global_position = Vector3(25.0, 0.0, 42.0)
	car1.global_rotation.y = 0.0
	_vehicles.append({"node": car1, "name": car1.possessable_name})
	for spot in car1.headlights:
		_headlights.append(spot)
	
	var car2 = Vehicle3D.new()
	car2.data = load("res://resources/vehicles/blue_sedan_parked.tres")
	parent.add_child(car2)
	car2.global_position = Vector3(35.0, 0.0, 42.0)
	car2.global_rotation.y = deg_to_rad(5) # Slightly angled park for realism
	_vehicles.append({"node": car2, "name": car2.possessable_name})
	for spot in car2.headlights:
		_headlights.append(spot)
		
	var car3 = Vehicle3D.new()
	car3.data = load("res://resources/vehicles/green_sedan.tres")
	parent.add_child(car3)
	car3.global_position = Vector3(15.0, 0.0, 42.0)
	car3.global_rotation.y = 0.0
	_vehicles.append({"node": car3, "name": car3.possessable_name})
	for spot in car3.headlights:
		_headlights.append(spot)
		
	var car4 = Vehicle3D.new()
	car4.data = load("res://resources/vehicles/black_sport.tres")
	parent.add_child(car4)
	car4.global_position = Vector3(45.0, 0.0, 42.0)
	car4.global_rotation.y = deg_to_rad(-3) # Slightly angled park
	_vehicles.append({"node": car4, "name": car4.possessable_name})
	for spot in car4.headlights:
		_headlights.append(spot)

	# Heavy cargo/logistics truck parked at the side loading dock
	var truck = Vehicle3D.new()
	truck.data = load("res://resources/vehicles/cargo_truck.tres")
	parent.add_child(truck)
	truck.global_position = Vector3(side_x_center, 0.0, 15.0) # centered at the warehouse loading dock
	truck.global_rotation.y = deg_to_rad(-90) # Facing outwards from the loading bay
	_vehicles.append({"node": truck, "name": truck.possessable_name})
	for spot in truck.headlights:
		_headlights.append(spot)
	# Set up container for personal vehicles (driveway next to house)
	_personal_vehicles_container = Node3D.new()
	_personal_vehicles_container.name = "PersonalVehicles"
	parent.add_child(_personal_vehicles_container)

func _build_special_features(parent: Node3D, type: String) -> void:
	if type == "radiator":
		# --- CAB Tunnel Furnace ---
		var furnace := CabFurnace3D.new()
		furnace.name = "CabFurnace"
		parent.add_child(furnace)
		furnace.global_position = Vector3(30.0, 0.6, 7.5)
		
		# Chimneys on the roof
		for x_off in [25.0, 30.0, 35.0]:
			var chimney := MeshInstance3D.new()
			var c_mesh := CylinderMesh.new()
			c_mesh.top_radius = 0.25
			c_mesh.bottom_radius = 0.25
			c_mesh.height = 1.5
			chimney.mesh = c_mesh
			chimney.material_override = _metal_mat
			parent.add_child(chimney)
			chimney.global_position = Vector3(x_off, 6.5, 7.5)
			
		# Flat conveyor belt on floor
		var belt := MeshInstance3D.new()
		var b_mesh := BoxMesh.new()
		b_mesh.size = Vector3(50.0, 0.04, 0.8)
		belt.mesh = b_mesh
		
		var b_mat := StandardMaterial3D.new()
		b_mat.albedo_color = Color(0.1, 0.1, 0.1)
		b_mat.roughness = 0.9
		belt.material_override = b_mat
		
		parent.add_child(belt)
		belt.global_position = Vector3(30.0, 0.02, 7.5)

	elif type == "gearbox":
		# --- Sementasyon (Isıl İşlem) Room ---
		# A thick concrete block representing the room
		_create_box_obstacle(parent, Vector3(31.0, 3.0, -3.0), Vector3(10.0, 6.0, 15.0), _wall_mat)
		
		# Double chimneys on the roof of the factory (roof Y = 8.0)
		for x_off in [28.0, 34.0]:
			var chimney := SementasyonChimney3D.new()
			chimney.name = "SementasyonChimney_%d" % int(x_off)
			parent.add_child(chimney)
			chimney.global_position = Vector3(x_off, 8.0, -3.0)

	elif type == "armored":
		# --- Yellow Overhead Crane ---
		var crane := OverheadCrane3D.new()
		crane.name = "OverheadCrane"
		parent.add_child(crane)
		crane.global_position = Vector3(60.0, 16.0, 7.5)
		
		# --- Robotic Welding Positioners ---
		var welder := WeldingStation3D.new()
		welder.name = "WeldingStation"
		parent.add_child(welder)
		welder.global_position = Vector3(60.0, 0.0, 7.5)
		
		# --- Atış Kabul Tüneli (Bunker Range) ---
		_create_box_obstacle(parent, Vector3(112.0, 3.0, -12.5), Vector3(16.0, 6.0, 12.0), _thick_concrete_mat)
		# Thick sliding armored door
		var door := SlidingArmoredDoor3D.new()
		door.name = "BunkerSlidingDoor"
		parent.add_child(door)
		door.global_position = Vector3(104.0, 0.0, 0.0) # Closed position is Z = -12.5 which is set locally inside component


func rebuild_personal_vehicles() -> void:
	if not is_instance_valid(_personal_vehicles_container):
		return
		
	# Clear old personal vehicles from container and global _vehicles list
	for child in _personal_vehicles_container.get_children():
		if child is Vehicle3D:
			for spot in child.headlights:
				_headlights.erase(spot)
		for i in range(_vehicles.size() - 1, -1, -1):
			if _vehicles[i]["node"] == child:
				_vehicles.remove_at(i)
		child.queue_free()
		
	# Now, spawn owned personal vehicles
	var center = Vector3(-25.0, 0.05, 10.0)
	var slots = {
		"blue_sedan": {"pos": center + Vector3(0.0, -0.05, 18.0), "path": "res://resources/vehicles/blue_sedan.tres"},
		"red_hatchback": {"pos": center + Vector3(-4.0, -0.05, 18.0), "path": "res://resources/vehicles/red_hatchback.tres"},
		"yellow_suv": {"pos": center + Vector3(4.0, -0.05, 18.0), "path": "res://resources/vehicles/yellow_suv.tres"},
		"black_sport": {"pos": center + Vector3(-8.0, -0.05, 18.0), "path": "res://resources/vehicles/black_sport.tres"}
	}
	
	for key in GameManager.personal_vehicles.keys():
		if GameManager.personal_vehicles[key] == true:
			var slot = slots[key]
			var car = Vehicle3D.new()
			car.data = load(slot["path"])
			
			_personal_vehicles_container.add_child(car)
			car.global_position = slot["pos"]
			car.global_rotation.y = deg_to_rad(180)
			
			_vehicles.append({"node": car, "name": car.possessable_name})
			for spot in car.headlights:
				_headlights.append(spot)



func _handle_home_proximity_checks() -> void:
	var center = Vector3(-25.0, 0.0, 10.0)
	var bed_pos = center + Vector3(-5.0, 1.0, -5.0) # -30, 1, 5
	var door_pos = center + Vector3(0.0, 1.0, 7.9)  # -25, 1, 17.9
	
	var p_pos = manager_3d.global_position
	var dist_to_bed = p_pos.distance_to(bed_pos)
	var dist_to_door = p_pos.distance_to(door_pos)
	
	if dist_to_bed < 2.5:
		if GameManager.get("day_ended_and_slept") == true:
			EventBus.toast_notified.emit("🛌 Uykunu aldın, yeni gün başladı. İşe gitmek için kapıdan çık.", "info_persistent")
		else:
			EventBus.toast_notified.emit("🛌 [E] Uyu ve Yeni Güne Başla", "info_persistent")
	elif dist_to_door < 2.2:
		EventBus.toast_notified.emit("🚪 [E] Dışarı Çık", "info_persistent")
	else:
		EventBus.toast_notified.emit("", "info_clear")

func _try_interact_home() -> void:
	var center = Vector3(-25.0, 0.0, 10.0)
	var bed_pos = center + Vector3(-5.0, 1.0, -5.0)
	var door_pos = center + Vector3(0.0, 1.0, 7.9)
	
	var p_pos = manager_3d.global_position
	var dist_to_bed = p_pos.distance_to(bed_pos)
	var dist_to_door = p_pos.distance_to(door_pos)
	
	if dist_to_bed < 2.5:
		if not GameManager.get("day_ended_and_slept") == true:
			var game_node = get_node_or_null("/root/Game")
			if game_node and game_node.has_method("fade_and_sleep"):
				game_node.fade_and_sleep()
			get_viewport().set_input_as_handled()
	elif dist_to_door < 2.2:
		var game_node = get_node_or_null("/root/Game")
		if game_node and game_node.has_method("fade_and_exit_home"):
			game_node.fade_and_exit_home()
		get_viewport().set_input_as_handled()
