class_name Possessable3D
extends AnimatableBody3D

## Possessable3D: Base class for entities that can be possessed by the Player controller.
## Defines the interface for possession callbacks, physics loops, and camera targets.

@export var possessable_name: String = ""

func possession_enter(_player: CharacterBody3D) -> void:
	pass

func possession_exit(_player: CharacterBody3D) -> void:
	pass

func possession_physics_process(_player: CharacterBody3D, _delta: float) -> void:
	pass

func get_camera_target_position() -> Vector3:
	return global_position

func get_camera_look_target() -> Vector3:
	return global_position

func get_player_exit_position(_player: CharacterBody3D) -> Vector3:
	var left_dir = -global_transform.basis.x.normalized()
	return global_position + left_dir * 2.0 + Vector3(0, 1.0, 0)
