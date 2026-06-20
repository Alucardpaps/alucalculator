class_name WorkingState
extends WorkerState

## Working state: Worker performs production tasks, checks for pests, and manages morale.

func _init(p_worker: Worker) -> void:
	super(p_worker)

func enter() -> void:
	worker.status = "working"
	worker.slacking = false
	_acquire_workstation_slot()

func execute() -> void:
	if worker.bp.is_empty():
		worker.change_state(IdleState.new(worker))
		return
		
	var has_slot = _acquire_workstation_slot()
	if not has_slot:
		# Go idle and wait for the station to clear up
		worker.change_state(IdleState.new(worker))
		return
	
	# 1. Hygiene check: refuse to work if there is prey at this workstation
	if not worker.current_ws.is_empty():
		for prey in GameManager.preys:
			if prey.ws_id == worker.current_ws:
				var ws_name = GameManager.get_workstation_name(worker.current_ws)
				GameManager.add_log("🤢 %s: \"Şefim, %s bölgesinde leş var! Burası temizlenene kadar çalışmam!\"" % [worker.worker_name, ws_name])
				worker.change_state(SlackingState.new(worker))
				return

	# 2. Cat interaction check (boosts morale, slows work slightly)
	if not worker.current_ws.is_empty():
		for animal in GameManager.animals:
			if animal.animal_type == "kedi" and animal.ws_id == worker.current_ws:
				if randf() < 0.20:
					worker.morale = clampi(worker.morale + 3, 0, 100)
					if randf() < 0.10:
						GameManager.add_log("🐱 %s istasyondaki kediyi seviyor. Çalışma yavaşladı ama moral tavan!" % worker.worker_name)
	
	# 3. Natural morale decay (3% chance per tick to lose 1 morale)
	if randf() < 0.03:
		worker.morale = clampi(worker.morale - 1, 0, 100)
		
	# 4. Slacking trigger check
	if worker.worker_name != "Sevkiyatçı Selo":
		var slacking_chance = 0.04 if worker.morale < 60 else 0.012
		if randf() < slacking_chance:
			worker.change_state(SlackingState.new(worker))

func exit() -> void:
	TaskScheduler.release_all_for_worker(worker.worker_name)

func _acquire_workstation_slot() -> bool:
	if worker.bp.is_empty():
		return false
		
	var stages = worker.bp["stages"]
	var current_stage_idx = worker.stage_idx
	var req_skill = stages[current_stage_idx] if current_stage_idx < stages.size() else ""
	var ws_key = GameManager.get_workstation_for_skill(req_skill)
	if ws_key.is_empty():
		ws_key = "ws-depo"
		
	if worker.current_ws == ws_key:
		return true
		
	var booked = TaskScheduler.book_workstation(worker.worker_name, ws_key)
	if booked:
		worker.set_workstation(ws_key)
		return true
		
	var ws_name = GameManager.get_workstation_name(ws_key)
	GameManager.add_log("⏳ %s: \"%s tezgahı dolu, kuyrukta bekliyorum.\"" % [worker.worker_name, ws_name])
	return false
