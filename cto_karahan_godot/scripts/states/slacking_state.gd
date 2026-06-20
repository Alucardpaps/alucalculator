class_name SlackingState
extends WorkerState

## Slacking state: Worker heads to a break area to recover morale. 
## Can be caught and chased back to work by the dog if trust is high.

func _init(p_worker: Worker) -> void:
	super(p_worker)

func enter() -> void:
	worker.status = "slacking"
	worker.slacking = true
	worker.slack_ticks = 6 + (randi() % 6)
	
	# Determine break spots
	var break_spots = ["ws-cay", "ws-wc", "ws-ik"]
	var factory = GameManager.active_factory
	if factory.has("workstations") and factory["workstations"].has("ws-ressam-wc"):
		break_spots.append("ws-ressam-wc")
		
	# Attempt to book an available break spot
	var target_ws = ""
	for spot in break_spots:
		if TaskScheduler.book_workstation(worker.worker_name, spot):
			target_ws = spot
			break
			
	# Fallback if all slots are full
	if target_ws.is_empty():
		target_ws = "ws-cay"
		TaskScheduler.book_workstation(worker.worker_name, target_ws)
		
	worker.set_workstation(target_ws)
	GameManager.add_log("☕ %s çalışmaktan sıkıldı, dinlenme alanına (%s) kaçtı." % [worker.worker_name, GameManager.get_workstation_name(target_ws)])

func execute() -> void:
	worker.slack_ticks -= 1
	var max_m = 110 if GameManager.coffee_machine_owned else 100
	var recovery = 6 if GameManager.coffee_machine_owned else 4
	worker.morale = clampi(worker.morale + recovery, 0, max_m)
	
	# 1. Dog chase check: if the dog is at this workstation and trust is high, force worker back to work
	if not worker.current_ws.is_empty():
		for animal in GameManager.animals:
			if animal.animal_type == "kopek" and animal.ws_id == worker.current_ws:
				if GameManager.dog_trust >= 50 and not worker.bp.is_empty():
					GameManager.add_log("🐶 Karabaş, %s'i dinlenme alanında yakalayıp havladı ve işinin başına dönmeye zorladı!" % worker.worker_name)
					worker.change_state(WorkingState.new(worker))
					return
					
	# 2. Natural return to work or idle if slack duration finishes
	if worker.slack_ticks <= 0:
		worker.return_to_work_or_idle()

func exit() -> void:
	worker.slacking = false
	TaskScheduler.release_all_for_worker(worker.worker_name)
