class_name EventState
extends WorkerState

## EventState: Active when a worker has an ongoing story event (leave, injured, offsite, training).
## Unassigns them from work and places them at a temporary break or clinical area.

func _init(p_worker: Worker) -> void:
	super(p_worker)

func enter() -> void:
	worker.slacking = false
	
	# Clear any active blueprint stages they were working on
	if not worker.bp.is_empty():
		worker.bp.get("workers", []).erase(worker.worker_name)
		worker.bp = {}
		
	# Release all booked workstation slots
	TaskScheduler.release_all_for_worker(worker.worker_name)
	
	# Position them based on status
	match worker.status:
		"sick", "injured":
			worker.set_workstation("ws-revir") # Send to Health/Clinic room
		"leave", "training":
			worker.set_workstation("ws-cay") # Send to tea / break room
		"offsite":
			worker.set_workstation("ws-depo") # Send to delivery/shipment dock
		_:
			worker.set_workstation("ws-cay")

func execute() -> void:
	# Keep them at the event workstation; no wandering or idle ticks
	pass

func exit() -> void:
	pass
