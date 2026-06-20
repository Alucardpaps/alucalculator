class_name IdleState
extends WorkerState

## Idle state: Worker wanders around workstations and may become anxious for work.

func _init(p_worker: Worker) -> void:
	super(p_worker)

func enter() -> void:
	worker.status = "idle"
	worker.idle_ticks = 0
	TaskScheduler.release_all_for_worker(worker.worker_name)
	
	# Move to preferred workstation if available, otherwise wander
	var pref_ws = worker.get_preferred_workstation()
	if not pref_ws.is_empty():
		worker.set_workstation(pref_ws)
	else:
		_wander_to_random_station()

func execute() -> void:
	# If we have a blueprint assigned, try to return to work
	if not worker.bp.is_empty():
		worker.change_state(WorkingState.new(worker))
		return
		
	worker.idle_ticks += 1
	
	# Small chance (2%) to go to a slacking / restroom break if idle
	if randf() < 0.02 and worker.worker_name != "Sevkiyatçı Selo":
		worker.change_state(SlackingState.new(worker))
		return
		
	# If idle for a long time, 20% chance to automatically receive a new order (capped at 2 times per day per worker)
	# Checked every 5 ticks
	if worker.idle_ticks % 5 == 0:
		if worker.idle_ticks >= 12 and randf() < 0.20 and worker.active_question.is_empty():
			if worker.worker_name != "Sevkiyatçı Selo" and worker.anxious_requests_today < 2:
				worker.anxious_requests_today += 1
				worker.idle_ticks = 0
				if GameManager.orders.size() < GameManager.max_orders_limit:
					GameManager.generate_new_order()
					GameManager.add_log("📣 %s iş beklerken yeni bir sipariş sisteme otomatik olarak düştü." % worker.worker_name)

func exit() -> void:
	pass

func _wander_to_random_station() -> void:
	var factory = GameManager.active_factory
	if factory.is_empty() or not factory.has("workstations"):
		return
	var ws_keys = factory["workstations"].keys()
	
	# Filter only available/not-full stations (excluding break rooms or wc for idle wandering)
	var available_keys = ws_keys.filter(func(k):
		return k != "ws-cay" and k != "ws-wc" and TaskScheduler.is_station_available(k)
	)
	
	if available_keys.size() == 0:
		available_keys = ws_keys # Fallback to all if none is available
		
	if available_keys.size() > 0:
		var rand_ws = available_keys[randi() % available_keys.size()]
		worker.set_workstation(rand_ws)
