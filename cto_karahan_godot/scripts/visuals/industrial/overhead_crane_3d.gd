class_name OverheadCrane3D
extends Node3D

## OverheadCrane3D: Self-contained overhead crane for the armored hangar.
## Manages its own meshes, materials, and real-time translation logic.

var _trolley: MeshInstance3D = null
var _time: float = 0.0

func _ready() -> void:
	# 1. Beams Material
	var crane_mat := StandardMaterial3D.new()
	crane_mat.albedo_color = Color(0.9, 0.72, 0.08) # Safety yellow
	crane_mat.roughness = 0.4
	crane_mat.metallic = 0.6
	
	# 2. Main horizontal double girders
	var g_mesh := BoxMesh.new()
	g_mesh.size = Vector3(0.5, 0.4, 60.0)
	
	var girder1 := MeshInstance3D.new()
	girder1.mesh = g_mesh
	girder1.material_override = crane_mat
	girder1.position = Vector3(-0.4, 0.0, 0.0)
	add_child(girder1)
	
	var girder2 := MeshInstance3D.new()
	girder2.mesh = g_mesh
	girder2.material_override = crane_mat
	girder2.position = Vector3(0.4, 0.0, 0.0)
	add_child(girder2)
	
	# 3. Crane Trolley
	_trolley = MeshInstance3D.new()
	var t_mesh := BoxMesh.new()
	t_mesh.size = Vector3(1.6, 0.8, 1.6)
	_trolley.mesh = t_mesh
	_trolley.material_override = crane_mat
	_trolley.position = Vector3(0.0, 0.2, 0.0)
	add_child(_trolley)
	
	# 4. Steel cable
	var cable := MeshInstance3D.new()
	var cb_mesh := CylinderMesh.new()
	cb_mesh.top_radius = 0.03
	cb_mesh.bottom_radius = 0.03
	cb_mesh.height = 8.0
	cable.mesh = cb_mesh
	
	var cb_mat := StandardMaterial3D.new()
	cb_mat.albedo_color = Color(0.2, 0.2, 0.2)
	cable.material_override = cb_mat
	cable.position = Vector3(0.0, -4.0, 0.0)
	_trolley.add_child(cable)
	
	# 5. Heavy hook block
	var hook := MeshInstance3D.new()
	var h_mesh := BoxMesh.new()
	h_mesh.size = Vector3(0.6, 0.6, 0.6)
	hook.mesh = h_mesh
	
	var h_mat := StandardMaterial3D.new()
	h_mat.albedo_color = Color(0.5, 0.5, 0.5)
	h_mat.metallic = 0.9
	h_mat.roughness = 0.4
	hook.material_override = h_mat
	hook.position = Vector3(0.0, -8.0, 0.0)
	_trolley.add_child(hook)

func _process(delta: float) -> void:
	_time += delta
	# X bridge translation: Move whole crane back/forth [15.0, 105.0] globally.
	# We are placed at X = 60.0 in factory_3d.gd, so local translation is from -45 to +45.
	position.x = 60.0 + sin(_time * 0.15) * 45.0
	
	# Z trolley translation: Move along local Z axis [-25.0, 25.0]
	if is_instance_valid(_trolley):
		_trolley.position.z = sin(_time * 0.25) * 25.0
