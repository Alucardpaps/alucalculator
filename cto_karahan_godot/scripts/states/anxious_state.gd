class_name AnxiousState
extends WorkerState

## Anxious state: Worker is bored of being idle and demands work, triggering a request popup.

func _init(p_worker: Worker) -> void:
	super(p_worker)

func enter() -> void:
	worker.status = "idle"
	
	var pref_ws = worker.get_preferred_workstation()
	if not pref_ws.is_empty():
		if TaskScheduler.book_workstation(worker.worker_name, pref_ws):
			worker.set_workstation(pref_ws)
		else:
			worker.set_workstation(pref_ws)
	else:
		var target_ws = "ws-arge"
		if TaskScheduler.book_workstation(worker.worker_name, target_ws):
			worker.set_workstation(target_ws)
		else:
			target_ws = "ws-depo"
			TaskScheduler.book_workstation(worker.worker_name, target_ws)
			worker.set_workstation(target_ws)
	
	# Expiration time is in 60 game minutes (20 simulation ticks)
	var exp_hour = GameManager.hour
	var exp_min = GameManager.minute + 60
	if exp_min >= 60:
		exp_hour += int(exp_min / 60.0)
		exp_min = exp_min % 60
		
	# Setup interactive question structure
	worker.active_question = {
		"body": "Şefim, çok boş kaldım. Kendimi köreltmek istemiyorum. Bana acil yapacak bir iş verin!",
		"actions": [
			{
				"label": "Hemen yeni sipariş alalım (+5 Moral)",
				"cmd": "anxious_accept"
			},
			{
				"label": "Git depoyu düzenle (-3 Güven)",
				"cmd": "anxious_reject"
			}
		],
		"expires_at_hour": exp_hour,
		"expires_at_min": exp_min
	}
	
	GameManager.add_log("📣 %s boş kalmaktan şikayetçi ve iş bekliyor!" % worker.worker_name)
	EventBus.masters_updated.emit()

func execute() -> void:
	# If the question was answered or expired, return to work or idle
	if worker.active_question.is_empty():
		worker.return_to_work_or_idle()

func exit() -> void:
	TaskScheduler.release_all_for_worker(worker.worker_name)
