class_name WeldingStation3D
extends Node3D

## WeldingStation3D: Robotic welding positioner station.
## Handles robotic arms, spark generators, and random strobe/flash lighting.

var _light: OmniLight3D = null
var _spark_timer: float = 0.0

func _ready() -> void:
	# 1. Base Materials
	var metal_mat := StandardMaterial3D.new()
	metal_mat.albedo_color = Color(0.35, 0.35, 0.38)
	metal_mat.metallic = 0.8
	metal_mat.roughness = 0.5
	
	# 2. Main welding base block
	var base := MeshInstance3D.new()
	var wb_mesh := BoxMesh.new()
	wb_mesh.size = Vector3(4.0, 0.8, 3.0)
	base.mesh = wb_mesh
	base.material_override = metal_mat
	add_child(base)
	base.position = Vector3(0.0, 0.4, 0.0) # centered at Y = 0.4
	
	# 3. Robotic arms (KUKA-style orange manipulators)
	# Relocated relative to our station center
	for x_off in [-2.0, 2.0]:
		var arm := MeshInstance3D.new()
		var a_mesh := CylinderMesh.new()
		a_mesh.top_radius = 0.15
		a_mesh.bottom_radius = 0.25
		a_mesh.height = 2.0
		arm.mesh = a_mesh
		
		var arm_mat := StandardMaterial3D.new()
		arm_mat.albedo_color = Color(0.85, 0.35, 0.05)
		arm_mat.roughness = 0.4
		arm.material_override = arm_mat
		
		add_child(arm)
		arm.position = Vector3(x_off, 1.8, 0.0)
		arm.rotation_degrees = Vector3(0, 0, 45 if x_off == -2.0 else -45)
		
	# 4. Flashing Blue-White strobe light
	_light = OmniLight3D.new()
	_light.light_color = Color(0.65, 0.85, 1.0)
	_light.light_energy = 0.0
	_light.omni_range = 10.0
	add_child(_light)
	_light.position = Vector3(0.0, 1.2, 0.0)
	
	# 5. Sparks particle emitter (CPUParticles3D)
	var sparks := CPUParticles3D.new()
	sparks.emitting = true
	sparks.amount = 30
	sparks.lifetime = 0.5
	sparks.direction = Vector3(0, 1, 0)
	sparks.spread = 75.0
	sparks.gravity = Vector3(0, -9.8, 0)
	sparks.initial_velocity_min = 3.5
	sparks.initial_velocity_max = 7.0
	
	var spm := SphereMesh.new()
	spm.radius = 0.025
	spm.height = 0.05
	sparks.mesh = spm
	
	var sparks_mat := StandardMaterial3D.new()
	sparks_mat.albedo_color = Color(0.7, 0.9, 1.0)
	sparks_mat.emission_enabled = true
	sparks_mat.emission = Color(0.7, 0.9, 1.0)
	sparks_mat.emission_energy_multiplier = 4.0
	sparks.material_override = sparks_mat
	
	add_child(sparks)
	sparks.position = Vector3(0.0, 1.0, 0.0)

func _process(delta: float) -> void:
	_spark_timer -= delta
	if _spark_timer <= 0.0:
		# Rapid flash cycles (0.05s to 0.15s duration)
		_spark_timer = randf_range(0.05, 0.15)
		if is_instance_valid(_light):
			if randf() < 0.8:
				_light.light_energy = randf_range(4.0, 10.0)
			else:
				_light.light_energy = 0.0
