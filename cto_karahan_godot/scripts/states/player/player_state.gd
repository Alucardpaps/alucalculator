class_name PlayerState
extends RefCounted

## PlayerState: Abstract base class for all player controller states.

func enter(_controller: CharacterBody3D) -> void:
	pass

func exit(_controller: CharacterBody3D) -> void:
	pass

func process(_controller: CharacterBody3D, _delta: float) -> void:
	pass

func physics_process(_controller: CharacterBody3D, _delta: float) -> void:
	pass
