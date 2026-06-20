class_name SlidingArmoredDoor3D
extends Node3D

## SlidingArmoredDoor3D: Heavy sliding armored shield door for the ballistic bunker.
## Detects player proximity and slides open/closed smoothly along the Z axis (or X axis) using physics-safe AnimatableBody3D.

var _door_pane: AnimatableBody3D = null
var _closed_z: float = -12.5
var _open_z: float = -18.5
var _target_z: float = -12.5

# Reference to the player (manager_3d)
var _player: Node3D = null

func _ready() -> void:
	# Heavy steel texture/material
	var d_mat := StandardMaterial3D.new()
	d_mat.albedo_color = Color(0.18, 0.2, 0.22)
	d_mat.metallic = 0.9
	d_mat.roughness = 0.5
	
	# Build sliding pane
	_door_pane = AnimatableBody3D.new()
	add_child(_door_pane)
	_door_pane.position = Vector3(0.0, 2.9, 0.0) # local offset Y = 2.9 (center height of 5.8m door)
	
	var col := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(0.3, 5.8, 5.8)
	col.shape = box
	_door_pane.add_child(col)
	
	var mesh := MeshInstance3D.new()
	var b_mesh := BoxMesh.new()
	b_mesh.size = Vector3(0.3, 5.8, 5.8)
	mesh.mesh = b_mesh
	mesh.material_override = d_mat
	_door_pane.add_child(mesh)
	
	# Add rivet/bolts detail on the heavy sliding door
	for y_off in [-2.0, 2.0]:
		for z_off in [-2.0, 0.0, 2.0]:
			var bolt := MeshInstance3D.new()
			var bolt_mesh := CylinderMesh.new()
			bolt_mesh.top_radius = 0.08
			bolt_mesh.bottom_radius = 0.08
			bolt_mesh.height = 0.35
			bolt.mesh = bolt_mesh
			bolt.material_override = d_mat
			bolt.position = Vector3(0.16, y_off, z_off)
			bolt.rotation_degrees = Vector3(0, 0, 90)
			_door_pane.add_child(bolt)

func _process(delta: float) -> void:
	if not is_instance_valid(_player):
		var players = get_tree().get_nodes_in_group("player")
		if players.size() > 0:
			_player = players[0]
			
	var is_open := false
	if is_instance_valid(_player):
		# Distance to the global door position
		var dist = global_position.distance_to(_player.global_position)
		if dist < 6.0: # Heavy door opens from slightly further
			is_open = true
			
	if is_open:
		_target_z = _open_z - global_position.z
	else:
		_target_z = _closed_z - global_position.z
		
	if is_instance_valid(_door_pane):
		_door_pane.position.z = lerp(_door_pane.position.z, _target_z, 4.0 * delta) # slides a bit slower/heavier
