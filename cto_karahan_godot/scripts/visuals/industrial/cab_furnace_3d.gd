class_name CabFurnace3D
extends Node3D

## CabFurnace3D: Represents the dynamic CAB tunnel furnace in the radiator factory.
## Decouples its own visual mesh construction, light pulsating logic, and material effects.

var _light: OmniLight3D = null
var _time: float = 0.0

func _ready() -> void:
	# 1. Main furnace body
	var furnace_mesh := MeshInstance3D.new()
	var f_box := BoxMesh.new()
	f_box.size = Vector3(16.0, 1.2, 1.6)
	furnace_mesh.mesh = f_box
	
	# Safety design material with glowing red emission
	var f_mat := StandardMaterial3D.new()
	f_mat.albedo_color = Color(0.15, 0.15, 0.15)
	f_mat.metallic = 0.8
	f_mat.roughness = 0.3
	f_mat.emission_enabled = true
	f_mat.emission = Color(1.0, 0.3, 0.0) # Warm orange-red glow
	f_mat.emission_energy_multiplier = 2.0
	furnace_mesh.material_override = f_mat
	
	add_child(furnace_mesh)
	furnace_mesh.position = Vector3.ZERO
	
	# 2. Glowing interior heat light
	_light = OmniLight3D.new()
	_light.light_color = Color(1.0, 0.3, 0.0)
	_light.light_energy = 5.0
	_light.omni_range = 8.0
	add_child(_light)
	_light.position = Vector3.ZERO

func _process(delta: float) -> void:
	_time += delta
	if is_instance_valid(_light):
		# Create a gentle heat pulse effect inside the furnace
		_light.light_energy = 4.0 + sin(_time * 3.0) * 1.5
