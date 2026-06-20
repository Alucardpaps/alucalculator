class_name WorkerState
extends RefCounted

## Base class for Worker Finite State Machine (FSM) states.
## Concrete states must inherit from this class and override lifecycle methods.

var worker: Worker

func _init(p_worker: Worker) -> void:
	worker = p_worker

## Called when entering the state.
func enter() -> void:
	pass

## Called on every game tick (discrete simulation step).
func execute() -> void:
	pass

## Called when leaving the state.
func exit() -> void:
	pass
