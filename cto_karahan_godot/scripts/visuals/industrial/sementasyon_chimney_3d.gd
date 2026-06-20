class_name SementasyonChimney3D
extends Node3D

## SementasyonChimney3D: Handles individual chimneys and their respective smoking particle systems.
## Decouples the particle parameters and materials from the main building generator.

func _ready() -> void:
	# 1. Metallic chimney pipe mesh
	var pipe := MeshInstance3D.new()
	var c_mesh := CylinderMesh.new()
	c_mesh.top_radius = 0.3
	c_mesh.bottom_radius = 0.3
	c_mesh.height = 2.0
	pipe.mesh = c_mesh
	
	var pipe_mat := StandardMaterial3D.new()
	pipe_mat.albedo_color = Color(0.4, 0.4, 0.45)
	pipe_mat.metallic = 0.8
	pipe_mat.roughness = 0.4
	pipe.material_override = pipe_mat
	add_child(pipe)
	pipe.position = Vector3(0.0, 1.0, 0.0) # height is 2.0, so center it offset Y = 1.0
	
	# 2. Smoke CPUParticles3D
	var smoke := CPUParticles3D.new()
	smoke.emitting = true
	smoke.amount = 15
	smoke.lifetime = 2.5
	smoke.direction = Vector3(0.3, 1, 0)
	smoke.spread = 15.0
	smoke.gravity = Vector3(0, 0.5, 0)
	smoke.initial_velocity_min = 1.0
	smoke.initial_velocity_max = 2.5
	
	var smoke_sphere := SphereMesh.new()
	smoke_sphere.radius = 0.25
	smoke_sphere.height = 0.5
	smoke.mesh = smoke_sphere
	
	var smoke_mat := StandardMaterial3D.new()
	smoke_mat.albedo_color = Color(0.2, 0.2, 0.2, 0.4)
	smoke_mat.transparency = StandardMaterial3D.TRANSPARENCY_ALPHA
	smoke_mat.roughness = 0.9
	smoke.material_override = smoke_mat
	
	add_child(smoke)
	smoke.position = Vector3(0.0, 2.1, 0.0) # offset Y above the pipe top
