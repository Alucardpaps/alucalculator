class_name SlidingGlassDoor3D
extends Node3D

## SlidingGlassDoor3D: A premium double sliding glass door for the factory lobby.
## Detects the player proximity and slides open/closed smoothly, moving both visual meshes and physics collision shapes.

var door_width: float = 10.0
var door_height: float = 6.0
var proximity_distance: float = 4.0

var _left_pane: AnimatableBody3D = null
var _right_pane: AnimatableBody3D = null

var _left_closed_x: float = -2.5
var _right_closed_x: float = 2.5

var _left_open_x: float = -7.0
var _right_open_x: float = 7.0

var _target_left_x: float = -2.5
var _target_right_x: float = 2.5

# Reference to the player (manager_3d)
var _player: Node3D = null

func _ready() -> void:
	# Calculate targets dynamically based on door_width
	var pane_width := door_width / 2.0
	_left_closed_x = -door_width / 4.0
	_right_closed_x = door_width / 4.0
	_left_open_x = _left_closed_x - pane_width * 0.9
	_right_open_x = _right_closed_x + pane_width * 0.9
	
	_target_left_x = _left_closed_x
	_target_right_x = _right_closed_x

	# 1. Glass Material (Blue tinted transparent glass)
	var glass_mat := StandardMaterial3D.new()
	glass_mat.albedo_color = Color(0.18, 0.55, 0.75, 0.3)
	glass_mat.transparency = StandardMaterial3D.TRANSPARENCY_ALPHA
	glass_mat.roughness = 0.1
	glass_mat.metallic = 0.5
	
	# Metal trim material
	var metal_mat := StandardMaterial3D.new()
	metal_mat.albedo_color = Color(0.2, 0.22, 0.25)
	metal_mat.roughness = 0.4
	metal_mat.metallic = 0.8
	
	# 2. Build Left Pane (size: pane_width wide, door_height, 0.2m thick)
	_left_pane = AnimatableBody3D.new()
	add_child(_left_pane)
	_left_pane.position = Vector3(_left_closed_x, door_height / 2.0, -0.05)
	
	var l_col := CollisionShape3D.new()
	var l_box := BoxShape3D.new()
	l_box.size = Vector3(pane_width, door_height, 0.2)
	l_col.shape = l_box
	_left_pane.add_child(l_col)
	
	var l_mesh := MeshInstance3D.new()
	var l_gm := BoxMesh.new()
	l_gm.size = Vector3(pane_width, door_height, 0.2)
	l_mesh.mesh = l_gm
	l_mesh.material_override = glass_mat
	_left_pane.add_child(l_mesh)
	
	# Left Pane Metal Trim (visual boundary)
	var l_trim := MeshInstance3D.new()
	var l_tm := BoxMesh.new()
	l_tm.size = Vector3(0.15, door_height, 0.22)
	l_trim.mesh = l_tm
	l_trim.material_override = metal_mat
	l_trim.position = Vector3(pane_width / 2.0 - 0.08, 0.0, 0.0)
	_left_pane.add_child(l_trim)
	
	# 3. Build Right Pane
	_right_pane = AnimatableBody3D.new()
	add_child(_right_pane)
	_right_pane.position = Vector3(_right_closed_x, door_height / 2.0, 0.05)
	
	var r_col := CollisionShape3D.new()
	var r_box := BoxShape3D.new()
	r_box.size = Vector3(pane_width, door_height, 0.2)
	r_col.shape = r_box
	_right_pane.add_child(r_col)
	
	var r_mesh := MeshInstance3D.new()
	var r_gm := BoxMesh.new()
	r_gm.size = Vector3(pane_width, door_height, 0.2)
	r_mesh.mesh = r_gm
	r_mesh.material_override = glass_mat
	_right_pane.add_child(r_mesh)
	
	# Right Pane Metal Trim
	var r_trim := MeshInstance3D.new()
	r_trim.mesh = l_tm
	r_trim.material_override = metal_mat
	r_trim.position = Vector3(-pane_width / 2.0 + 0.08, 0.0, 0.0)
	_right_pane.add_child(r_trim)

func _process(delta: float) -> void:
	# Find player if reference is invalid or null
	if not is_instance_valid(_player):
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			_player = players[0]
			
	var is_open := false
	if is_instance_valid(_player):
		var dist = global_position.distance_to(_player.global_position)
		# Open if player is within proximity_distance meters
		if dist < proximity_distance:
			is_open = true
			
	if is_open:
		_target_left_x = _left_open_x
		_target_right_x = _right_open_x
	else:
		_target_left_x = _left_closed_x
		_target_right_x = _right_closed_x
		
	# Smoothly slide panes using lerp
	if is_instance_valid(_left_pane):
		_left_pane.position.x = lerp(_left_pane.position.x, _target_left_x, 8.0 * delta)
	if is_instance_valid(_right_pane):
		_right_pane.position.x = lerp(_right_pane.position.x, _target_right_x, 8.0 * delta)
