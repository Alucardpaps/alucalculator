extends Node

## GameManager Singleton: Controls simulation logic, global state, and time cycle.

# Container nodes set by the main game scene
var workers_container: Node2D
var animals_container: Node2D
var preys_container: Node2D
var workstations_container: Node2D
var factory_floor: FactoryFloor

# Global Game State
var day: int = 1
var hour: int = FactoryData.DAY_START_HOUR
var minute: int = 0
var money: int = 75000
var rating: int = 100
var paused: bool = false
var completed_orders: int = 0
var personal_balance: int = 0
var home_upgrades: Dictionary = {
	"bed": false,
	"tv": false,
	"coffee": false,
	"kitchen": false,
	"pc": false
}
var personal_vehicles: Dictionary = {
	"blue_sedan": true,
	"red_hatchback": false,
	"yellow_suv": false,
	"black_sport": false
}
var orders_completed_today: int = 0
var day_ended_and_slept: bool = false
var boss_trust: int = 0
var cat_trust: int = 0
var dog_trust: int = 0
var crunch_time: bool = false
var crunch_timer: int = 0
var crunch_fails: int = 0

var selected_factory_type: String = ""
var active_factory: Dictionary = {}
var inventory: Dictionary = {}
var mat_costs: Dictionary = {}

var logs: Array[Dictionary] = []
var masters: Array[Worker] = []
var orders: Array[Dictionary] = []
var animals: Array[Animal] = []
var preys: Array[Prey] = []
var pending_notifications: Array[Dictionary] = []

var workstation_upgrades: Dictionary = {
	"ws-lazer": 0,
	"ws-abkant": 0,
	"ws-dokuma": 0,
	"ws-firin": 0,
	"ws-lehim": 0,
	"ws-test": 0,
	"ws-boya": 0,
	"ws-montaj": 0
}
var worker_levels: Dictionary = {}
var coffee_machine_owned: bool = false
var order_software_owned: bool = false
var auto_loader_owned: bool = false
var max_orders_limit: int = 3


var tick_timer: Timer

func _ready() -> void:
	# Configure the tick timer
	tick_timer = Timer.new()
	tick_timer.wait_time = FactoryData.TICK_MS
	tick_timer.autostart = false
	tick_timer.timeout.connect(game_tick)
	add_child(tick_timer)

func set_paused(val: bool) -> void:
	paused = val
	if tick_timer:
		tick_timer.paused = val

func select_factory(type: String) -> void:
	active_factory = FactoryData.FACTORY_TEMPLATES[type]
	selected_factory_type = type
	
	TaskScheduler.reset()
	# Reset states
	day = 1
	hour = FactoryData.DAY_START_HOUR
	minute = 0
	money = 75000
	rating = 100
	boss_trust = 0
	cat_trust = 0
	dog_trust = 0
	crunch_time = false
	crunch_timer = 0
	crunch_fails = 0
	completed_orders = 0
	
	workstation_upgrades = {
		"ws-lazer": 0,
		"ws-abkant": 0,
		"ws-dokuma": 0,
		"ws-firin": 0,
		"ws-lehim": 0,
		"ws-test": 0,
		"ws-boya": 0,
		"ws-montaj": 0
	}
	worker_levels.clear()
	coffee_machine_owned = false
	order_software_owned = false
	auto_loader_owned = false
	max_orders_limit = 3

	
	inventory.clear()
	mat_costs.clear()
	for mat in active_factory["materials"]:
		inventory[mat] = active_factory["startInventory"].get(mat, 10)
		mat_costs[mat] = active_factory["matCosts"].get(mat, 1000)
		
	logs.clear()
	
	# Rebuild workstations on the map
	if workstations_container:
		for child in workstations_container.get_children():
			child.queue_free()
			
		var ws_scene = load("res://scenes/entities/workstation.tscn")
		
		for ws_key in active_factory["workstations"]:
			var ws_data = active_factory["workstations"][ws_key]
			var ws_node = ws_scene.instantiate() as Workstation
			ws_node.name = ws_key
			workstations_container.add_child(ws_node)
			ws_node.setup(ws_key, ws_data)
			
			ws_node.global_position = FactoryFloor.get_ws_screen_pos(ws_key)
			
	# Rebuild workers
	if workers_container:
		for child in workers_container.get_children():
			child.queue_free()
		masters.clear()
		
		var worker_scene = load("res://scenes/entities/worker.tscn")
		for m_data in active_factory["masters"]:
			var w_node = worker_scene.instantiate() as Worker
			workers_container.add_child(w_node)
			w_node.setup(m_data)
			masters.append(w_node)
			# Spawn workers near the corridor center
			w_node.global_position = FactoryFloor.iso_to_screen(15.0, 2.5) + Vector2(randf_range(-60, 60), randf_range(-20, 20))
			
	# Spawn starting orders
	orders.clear()
	for i in range(2):
		var t = active_factory["orderTemplates"][i % active_factory["orderTemplates"].size()]
		var order = {
			"id": "Baslangic_%d" % (i + 1),
			"desc": t["desc"],
			"due": t["due"] + 1,
			"reward": t["reward"],
			"penalty": t["penalty"],
			"designed": true,
			"rnd_days": 0,
			"blueprints": []
		}
		for bp in t["blueprints"]:
			order["blueprints"].append({
				"name": bp["name"],
				"stages": bp["stages"],
				"stage": 0,
				"need": bp["need"],
				"dependencies": bp["dependencies"],
				"workers": [],
				"done": false,
				"faulty": false,
				"progress": 0
			})
		orders.append(order)
		
	# Auto-assign starting workers to start-of-game blueprints
	# First pass: Assign experts (workers with matching skills)
	for o in orders:
		for bp in o["blueprints"]:
			if bp["dependencies"].size() == 0 and not bp["done"]:
				var req_skill = bp["stages"][bp["stage"]]
				var bp_need = bp.get("need", 1)
				
				var experts_found: Array[Worker] = []
				for m in masters:
					if m.worker_name != "Sevkiyatçı Selo" and m.status == "idle" and m.skill == req_skill:
						experts_found.append(m)
						
				for expert in experts_found:
					if bp["workers"].size() < bp_need:
						do_assign(o["id"], bp["name"], expert.worker_name)
						
	# Second pass: Assign helpers (idle workers whose skill doesn't match, but who are idle)
	for o in orders:
		for bp in o["blueprints"]:
			if bp["dependencies"].size() == 0 and not bp["done"]:
				var bp_need = bp.get("need", 1)
				
				var helpers_found: Array[Worker] = []
				for m in masters:
					if m.worker_name != "Sevkiyatçı Selo" and m.status == "idle":
						helpers_found.append(m)
						
				for helper in helpers_found:
					if bp["workers"].size() < bp_need:
						do_assign(o["id"], bp["name"], helper.worker_name)

	add_log("🏭 %s yönetimi devralındı!" % active_factory["name"])
	add_log("📋 Üretime hazır 2 başlangıç siparişi depoya eklendi.")
	
	schedule_notifications()
	
	# Emit signals
	EventBus.factory_selected.emit(type)
	EventBus.money_changed.emit(money)
	EventBus.rating_changed.emit(rating)
	EventBus.boss_trust_changed.emit(boss_trust)
	EventBus.time_changed.emit(day, hour, minute)
	EventBus.masters_updated.emit()
	EventBus.orders_updated.emit()
	
	set_paused(false)
	tick_timer.start()

func game_tick() -> void:
	if paused:
		return
		
	# Advance time
	minute += FactoryData.MINUTES_PER_TICK
	if minute >= 60:
		hour += int(minute / 60.0)
		minute = minute % 60
		
	if hour >= FactoryData.DAY_END_HOUR:
		end_of_day()
		return
		
	EventBus.time_changed.emit(day, hour, minute)
	
	# Tick FSM on each worker
	for m in masters:
		m.tick()
		
	process_production()
	check_notifications()
	
	# Verify question deadlines
	for m in masters:
		if not m.active_question.is_empty():
			var q = m.active_question
			if hour > q["expires_at_hour"] or (hour == q["expires_at_hour"] and minute >= q["expires_at_min"]):
				m.active_question.clear()
				m.morale = clampi(m.morale - 8, 0, 100)
				m.trust = clampi(m.trust - 5, 0, 100)
				add_log("⚠️ %s'in sorusunu zamanında yanıtlamadınız! Güven ve moral azaldı." % m.worker_name)
				if m.current_state is AnxiousState:
					m.change_state(IdleState.new(m))
				EventBus.masters_updated.emit()
				
	# Crunch Time tick
	if crunch_time:
		crunch_timer -= FactoryData.MINUTES_PER_TICK
		if crunch_timer <= 0:
			crunch_time = false
			EventBus.crunch_time_toggled.emit(false)
			if crunch_fails == 0:
				modify_boss_trust(1)
				money += 5000
				add_log("🎉 Tebrikler! Yoğun çalışma dönemini SIFIR hatayla tamamladınız! Kasa +5.000₺, Patron Güveni +1")
			else:
				modify_boss_trust(-2)
				add_log("⚠️ Yoğun çalışma dönemini %d adet teknik hatayla kapattınız! Patron Güveni düştü." % crunch_fails)
			EventBus.money_changed.emit(money)
		else:
			# Crunch has a high chance (10%) to trigger technical questions
			if randf() < 0.10:
				var working_masters = masters.filter(func(m): return m.status == "working" and m.active_question.is_empty() and m.worker_name != "Sevkiyatçı Selo")
				if working_masters.size() > 0:
					var w = working_masters[randi() % working_masters.size()]
					spawn_technical_question(w)
	else:
		# 0.3% chance of trigger crunch time between 9:00 and 15:00
		if hour >= 9 and hour <= 15 and randf() < 0.003:
			trigger_crunch_time()
			
	# Animal spawn check (2% chance)
	if randf() < 0.02:
		spawn_animal()
		
	# Update animals durations
	var remaining_animals: Array[Animal] = []
	for a in animals:
		a.duration -= 1
		if a.duration <= 0:
			add_log("🐾 %s fabrikadan çıktı." % ("Kedi" if a.animal_type == "kedi" else "Köpek" if a.animal_type == "kopek" else "Kuş"))
			a.queue_free()
		else:
			remaining_animals.append(a)
	animals = remaining_animals
	EventBus.animals_updated.emit()
	
	# Animal prey drop (1.5% chance if trust is high)
	if dog_trust >= 80 or cat_trust >= 80:
		if randf() < 0.015:
			spawn_prey()
			
	# Update prey age and check hygiene
	for p in preys:
		p.age += 1
		if p.age > 15: # 45 minutes of game time
			for m in masters:
				m.morale = clampi(m.morale - 6, 0, 100)
			add_log("⚠️ Fabrikadaki leş temizlenmediği için hijyen problemi yaratıyor! Ustaların morali düştü.")
			p.age = 0 # Reset warning timer
			EventBus.masters_updated.emit()
			
	# Bottleneck check for hiring (1.5% chance)
	if randf() < 0.015:
		check_bottlenecks()
		
	# General updates
	EventBus.masters_updated.emit()

func process_production() -> void:
	for m in masters:
		if m.status != "working" or m.slacking or m.bp.is_empty():
			continue
		if m.bp.get("done", false):
			continue
			
		# Feud check
		var co_worker_feud = false
		for co_w in masters:
			if co_w.bp == m.bp and co_w != m:
				if m.feuds.has(co_w.worker_name):
					m.status = "feud"
					co_worker_feud = true
					break
		if co_worker_feud:
			continue
			
		# Workers count check
		var bp_workers = m.bp.get("workers", [])
		var bp_need = m.bp.get("need", 1)
		if bp_workers.size() < bp_need:
			continue
			
		var stages = m.bp.get("stages", [])
		if m.stage_idx >= stages.size():
			continue
		var req_skill = stages[m.stage_idx]
		
		# Progress calculation
		var speed = 5 if m.skill == req_skill else 2
		
		# Apply worker level bonus (+15% speed per level) and training bonus
		var w_lvl = worker_levels.get(m.worker_name, 1)
		var worker_mult = 1.0 + (w_lvl - 1) * 0.15 + m.training_speed_bonus
		
		# Apply workstation level bonus (+20% speed per level)
		var ws_lvl = workstation_upgrades.get(m.current_ws, 0)
		var ws_mult = 1.0 + ws_lvl * 0.20
		
		var final_speed = int(round(speed * worker_mult * ws_mult * m.speed_modifier))
		if crunch_time:
			final_speed *= 2
			
		m.bp["progress"] = m.bp.get("progress", 0) + final_speed
		
		var target_prog = m.bp.get("target_progress", 100)
		if m.bp["progress"] >= target_prog:
			var old_bp = m.bp
			old_bp["stage"] = old_bp.get("stage", 0) + 1
			old_bp["progress"] = 0
			
			# Free workers
			var workers_copy = old_bp.get("workers", []).duplicate()
			old_bp["workers"] = []
			
			for wn in workers_copy:
				var w = find_master_by_name(wn)
				if w:
					w.bp = {}
					w.status = "idle"
					w.stage_idx = 0
					w.change_state(IdleState.new(w))
					
			if old_bp["stage"] >= old_bp["stages"].size():
				old_bp["done"] = true
				add_log("✅ \"%s\" üretimi başarıyla tamamlandı!" % old_bp.get("name", ""))
				check_order_completion()
			else:
				var next_stage_skill = old_bp["stages"][old_bp["stage"]]
				add_log("🔧 \"%s\" bir sonraki aşamaya geçti: %s. Yeni ustaların atanması gerekiyor." % [old_bp.get("name", ""), next_stage_skill])
				
			EventBus.masters_updated.emit()
			EventBus.orders_updated.emit()
			
	EventBus.orders_updated.emit()

func check_order_completion() -> void:
	var remaining_orders: Array[Dictionary] = []
	for order in orders:
		var all_done = true
		for b in order["blueprints"]:
			if not b.get("done", false):
				all_done = false
				break
		if all_done:
			var has_fault = false
			for b in order["blueprints"]:
				if b.get("faulty", false):
					has_fault = true
					break
			if has_fault:
				money -= order["penalty"]
				rating = clampi(rating - 15, 0, get_max_rating())
				modify_boss_trust(-2)
				add_log("⚠️ %s hatalı imalat ile teslim edildi! -%d₺ ceza." % [order["id"], order["penalty"]])
			else:
				money += order["reward"]
				rating = clampi(rating + 5, 0, get_max_rating())
				modify_boss_trust(1)
				add_log("🎉 %s başarıyla sevk edildi! +%d₺ kasaya girdi." % [order["id"], order["reward"]])
			completed_orders += 1
			orders_completed_today += 1
		else:
			remaining_orders.append(order)
	orders.clear()
	for o in remaining_orders:
		orders.append(o)
	EventBus.orders_updated.emit()
	EventBus.money_changed.emit(money)
	EventBus.rating_changed.emit(rating)

func end_of_day() -> void:
	set_paused(true)
	day_ended_and_slept = false
	
	# Wages
	var wages = masters.size() * 280
	money -= wages
	add_log("💰 Günlük usta yevmiyeleri ödendi: -%d₺" % wages)
	
	# Overdue orders
	var remaining_orders: Array[Dictionary] = []
	var overdue_penalty = 0
	var overdue_count = 0
	for o in orders:
		o["due"] = o.get("due", 1) - 1
		if o["due"] <= 0:
			money -= o["penalty"]
			overdue_penalty += o["penalty"]
			overdue_count += 1
			rating = clampi(rating - 20, 0, get_max_rating())
			modify_boss_trust(-3)
			add_log("🚨 %s teslim süresi aşıldı! -%d₺ gecikme cezası." % [o["id"], o["penalty"]])
		else:
			remaining_orders.append(o)
	orders.clear()
	for o in remaining_orders:
		orders.append(o)
	
	# R&D Design progress
	for o in orders:
		if not o.get("designed", false):
			o["rnd_days"] = o.get("rnd_days", 1) - 1
			if o["rnd_days"] <= 0:
				o["designed"] = true
				add_log("📐 %s tasarımı onaylandı ve üretime açıldı." % o["id"])
				
	# Spawn a new order occasionally (60% chance)
	var max_orders = max_orders_limit
	if orders.size() < max_orders and randf() < 0.60:
		generate_new_order()
		
	# Ticking and cleaning up worker event durations
	for m in masters:
		if m.event_days_remaining > 0:
			m.event_days_remaining -= 1
			if m.event_days_remaining <= 0:
				var was_training = (m.event_status == "training")
				m.event_status = ""
				m.speed_modifier = 1.0
				m.event_description = ""
				if was_training:
					m.training_speed_bonus += 0.15
					add_log("🌟 %s eğitim seminerinden döndü! Hızı kalıcı olarak +%%15 arttı." % m.worker_name)
				else:
					add_log("ℹ️ %s üzerindeki geçici durum sona erdi." % m.worker_name)
				
				if m.status in ["leave", "sick", "injured", "offsite"]:
					m.status = "idle"
					m.change_state(IdleState.new(m))
					
		if m.event_status in ["leave", "sick", "injured", "offsite"]:
			m.active_question.clear()
			m.anxious_requests_today = 0
		else:
			if m.slacking:
				m.slacking = false
				m.status = "working" if not m.bp.is_empty() else "idle"
				m.return_to_work_or_idle()
			m.active_question.clear()
			m.anxious_requests_today = 0
		
	# Clear temporary map entities
	for a in animals:
		a.queue_free()
	animals.clear()
	for p in preys:
		p.queue_free()
	preys.clear()
	
	# Score and Payout Calculation
	var base_score = 100
	var completed_today_points = orders_completed_today * 50
	var avg_morale = 0
	var avg_trust = 0
	if masters.size() > 0:
		var sum_m = 0
		var sum_t = 0
		for m in masters:
			sum_m += m.morale
			sum_t += m.trust
		avg_morale = roundi(float(sum_m) / masters.size())
		avg_trust = roundi(float(sum_t) / masters.size())

		
	var warning_penalty = 0
	for m in masters:
		warning_penalty += m.warnings * 15
		
	var daily_score = base_score + completed_today_points + avg_morale + avg_trust - warning_penalty - (overdue_count * 25)
	daily_score = clampi(daily_score, 10, 500)
	
	# Update max_orders_limit based on daily performance (>= 250 is Good)
	var performance_good = daily_score >= 250
	var max_cap = 8 if order_software_owned else 6
	if performance_good:
		max_orders_limit = clampi(max_orders_limit + 1, 1, max_cap)
		add_log("📈 Günlük performans iyi olduğu için aktif sipariş limiti 1 artırıldı! Yeni Limit: %d" % max_orders_limit)
	else:
		max_orders_limit = clampi(max_orders_limit - 1, 1, max_cap)
		add_log("📉 Günlük performans yetersiz olduğu için aktif sipariş limiti 1 azaltıldı. Yeni Limit: %d" % max_orders_limit)
	
	var personal_earned = daily_score * 10
	personal_balance += personal_earned
	
	var summary_data = {
		"day": day,
		"orders_completed": orders_completed_today,
		"wages": wages,
		"overdue_penalty": overdue_penalty,
		"daily_score": daily_score,
		"personal_earned": personal_earned,
		"personal_balance": personal_balance,
		"home_upgrades": home_upgrades,
		"max_orders_limit": max_orders_limit,
		"performance_good": performance_good
	}
	
	add_log("🌙 Gün %d sona erdi. Puan ve Ev Geliştirme ekranı açılıyor..." % day)
	
	# Emit signal to show EndOfDay UI
	EventBus.emit_signal("show_end_of_day_summary", summary_data)

func generate_new_order() -> void:
	if active_factory.is_empty():
		return
	var max_orders = max_orders_limit
	if orders.size() >= max_orders:
		add_log("⚠️ Aktif sipariş limiti (%d) dolu olduğundan yeni sipariş talebi reddedildi." % max_orders)
		return
	var templates = active_factory["orderTemplates"]
	var t = templates[randi() % templates.size()]
	var order_id = "Sipariş_%s" % str(completed_orders + orders.size() + 1).pad_zeros(3)
	
	var reward = t["reward"]
	if order_software_owned:
		reward = int(round(reward * 1.10))
		
	var order = {
		"id": order_id,
		"desc": t["desc"],
		"story": t.get("story", ""),
		"due": t["due"],
		"reward": reward,
		"penalty": t["penalty"],
		"designed": false,
		"rnd_days": t.get("rndDays", t.get("rnd_days", 1)),
		"blueprints": []
	}
	for bp in t["blueprints"]:
		order["blueprints"].append({
			"name": bp["name"],
			"stages": bp["stages"],
			"stage": 0,
			"need": bp["need"],
			"dependencies": bp["dependencies"],
			"workers": [],
			"done": false,
			"faulty": false,
			"progress": 0
		})
	orders.append(order)
	add_log("📣 Yeni sipariş talebi geldi: %s" % t["desc"])
	EventBus.orders_updated.emit()

func schedule_notifications() -> void:
	pending_notifications.clear()
	if active_factory.is_empty():
		return
		
	var pool = active_factory["questionPool"]
	if pool.size() == 0:
		return
		
	# Schedule 2-3 notifications today
	var count = 2 + (randi() % 2)
	
	# Base employee requests
	var base_questions = [
		{
			"body": "Şefim, elime kıymık/metal çapağı battı. 15 dakika revire gidip pansuman yaptırsam olur mu?",
			"actions": [
				{
					"label": "Tabii usta, hemen git (+3 moral)",
					"cmd": "allow_clinic"
				},
				{
					"label": "Hafif sıyrık o, çalışmaya devam!",
					"cmd": "deny_clinic"
				}
			]
		},
		{
			"body": "Şefim, depoda malzeme stoklarımız az gözüküyor. Tedarik edelim mi?",
			"actions": [
				{
					"label": "Evet, malzeme satın al",
					"cmd": "open_purchase"
				},
				{
					"label": "İdare ederiz şimdilik",
					"cmd": "close_dialog"
				}
			]
		},
		{
			"body": "Şefim, bu parçanın takım uçları çok yıpranmış. Değiştirmezsek yüzey pürüzlülüğü artar.",
			"actions": [
				{
					"label": "Değiştir (2500₺)",
					"cmd": "replace_tooling"
				},
				{
					"label": "Bu parti bitsin, öyle",
					"cmd": "keep_tooling"
				}
			]
		}
	]
	
	for i in range(count):
		var trigger_hour = 9 + (randi() % 7)
		var trigger_min = randi() % 60
		
		# Find a random worker who isn't Selo and is not busy with a narrative event
		var worker_candidates = masters.filter(func(w): 
			return w.worker_name != "Sevkiyatçı Selo" and w.event_status == ""
		)
		if worker_candidates.size() == 0:
			continue
		var w_node = worker_candidates[randi() % worker_candidates.size()]
		
		var is_tech = randf() < 0.50
		var q_data = {}
		if is_tech:
			var rand_q = pool[randi() % pool.size()]
			q_data = {
				"type": "technical",
				"worker": w_node,
				"body": rand_q["body"],
				"actions": rand_q["actions"]
			}
		else:
			var rand_q = base_questions[randi() % base_questions.size()]
			q_data = {
				"type": "general",
				"worker": w_node,
				"body": rand_q["body"],
				"actions": rand_q["actions"]
			}
			
		pending_notifications.append({
			"hour": trigger_hour,
			"minute": trigger_min,
			"fired": false,
			"data": q_data
		})

func check_notifications() -> void:
	for n in pending_notifications:
		if not n["fired"] and (hour > n["hour"] or (hour == n["hour"] and minute >= n["minute"])):
			n["fired"] = true
			var data = n["data"]
			var w_node = data["worker"]
			# Ensure worker exists and has no active question
			if is_instance_valid(w_node) and w_node.active_question.is_empty():
				var exp_hour = hour
				var exp_min = minute + (45 if data["type"] == "technical" else 60)
				if exp_min >= 60:
					exp_hour += int(exp_min / 60.0)
					exp_min = exp_min % 60
					
				var actions = []
				if data["type"] == "technical":
					for act in data["actions"]:
						actions.append({
							"label": act["label"],
							"cmd": "answer_tech",
							"args": [act["correct"]]
						})
				else:
					for act in data["actions"]:
						actions.append({
							"label": act["label"],
							"cmd": act["cmd"],
							"args": act.get("args", [])
						})
						
				w_node.active_question = {
					"body": data["body"],
					"actions": actions,
					"expires_at_hour": exp_hour,
					"expires_at_min": exp_min
				}
				add_log("📣 %s bir konuda fikrinizi soruyor! (Üzerine tıklayın)" % w_node.worker_name)
				EventBus.masters_updated.emit()

func spawn_technical_question(worker: Worker) -> void:
	if active_factory.is_empty() or not is_instance_valid(worker):
		return
	var pool = active_factory["questionPool"]
	if pool.size() == 0:
		return
		
	var q = pool[randi() % pool.size()]
	var exp_hour = hour
	var exp_min = minute + 30 # urgent during crunch time
	if exp_min >= 60:
		exp_hour += int(exp_min / 60.0)
		exp_min = exp_min % 60
		
	var actions = []
	for act in q["actions"]:
		actions.append({
			"label": act["label"],
			"cmd": "answer_tech",
			"args": [act["correct"]]
		})
		
	worker.active_question = {
		"body": q["body"],
		"actions": actions,
		"expires_at_hour": exp_hour,
		"expires_at_min": exp_min
	}
	add_log("📣 %s acil bir teknik soru sordu! El kitabından değerleri kontrol edin." % worker.worker_name)
	EventBus.masters_updated.emit()

func trigger_crunch_time() -> void:
	crunch_time = true
	crunch_timer = 180
	crunch_fails = 0
	EventBus.crunch_time_toggled.emit(true)
	add_log("🚨 ACİL ALARM! Yoğun çalışma (Crunch) başladı! Üretim hızı 2x, ancak teknik sorular peş peşe gelecektir!")

func modify_boss_trust(val: int) -> void:
	boss_trust = clampi(boss_trust + val, -15, 10)
	EventBus.boss_trust_changed.emit(boss_trust)
	if boss_trust < -10:
		trigger_game_over("Patron Güveni -10 seviyesinin altına düştü. Fabrika yönetiminiz başarısız bulundu ve kovuldunuz!")

func trigger_game_over(reason: String) -> void:
	set_paused(true)
	if tick_timer:
		tick_timer.stop()
	EventBus.game_over.emit(reason)

func check_bottlenecks() -> void:
	if active_factory.is_empty():
		return
		
	for o in orders:
		if not o.get("designed", false):
			continue
		for bp in o["blueprints"]:
			if bp.get("done", false) or bp.get("workers", []).size() >= bp.get("need", 1):
				continue
				
			# Check dependencies
			var is_bp_ready = true
			for dep in bp.get("dependencies", []):
				var dep_bp = null
				for b in o["blueprints"]:
					if b["name"] == dep:
						dep_bp = b
						break
				if not dep_bp or not dep_bp.get("done", false):
					is_bp_ready = false
					break
			if not is_bp_ready:
				continue
				
			var stages = bp["stages"]
			var stage = bp["stage"]
			if stage >= stages.size():
				continue
			var req_skill = stages[stage]
			
			var skill_workers = masters.filter(func(w): return w.skill == req_skill)
			if skill_workers.size() == 0:
				continue
				
			var all_busy = skill_workers.filter(func(w): return w.status != "idle").size() == skill_workers.size()
			if all_busy:
				# Find a worker of this skill who has no active questions to request hire
				var active_candidates = skill_workers.filter(func(w): return w.active_question.is_empty() and w.worker_name != "Sevkiyatçı Selo")
				if active_candidates.size() > 0:
					var worker = active_candidates[randi() % active_candidates.size()]
					var exp_hour = hour
					var exp_min = minute + 50
					if exp_min >= 60:
						exp_hour += int(exp_min / 60.0)
						exp_min = exp_min % 60
						
					worker.active_question = {
						"body": "Şefim, %s bölümünde siparişler birikti ve hepimiz doluyuz! İşlerin gecikmemesi için yanımıza yeni bir usta alalım mı? (Maliyet: 4.000 ₺, Yevmiye: 280 ₺)" % req_skill,
						"actions": [
							{
								"label": "Evet, usta işe al (-4.000 ₺)",
								"cmd": "approve_hire",
								"args": [req_skill]
							},
							{
								"label": "Hayır, böyle devam edelim",
								"cmd": "deny_hire",
								"args": [req_skill]
							}
						],
						"expires_at_hour": exp_hour,
						"expires_at_min": exp_min
					}
					add_log("📣 %s: \"%s departmanı çok sıkıştı, eleman lazım!\" (Ustanın üzerine tıklayarak yanıtlayın)" % [worker.worker_name, req_skill])
					EventBus.masters_updated.emit()
					return # Spawn one request at a time

func spawn_animal() -> void:
	if active_factory.is_empty() or not animals_container:
		return
		
	var types = ["kedi", "kopek", "kus"]
	var type = types[randi() % types.size()]
	var ws_keys = active_factory["workstations"].keys()
	if ws_keys.size() == 0:
		return
	var ws = ws_keys[randi() % ws_keys.size()]
	var id = "animal_%d_%d" % [Time.get_ticks_msec(), randi() % 100]
	
	var animal_scene = load("res://scenes/entities/animal.tscn")
	var animal_node = animal_scene.instantiate() as Animal
	animals_container.add_child(animal_node)
	animal_node.setup(id, type, ws, 40)
	animals.append(animal_node)
	
	var ws_name = get_workstation_name(ws)
	var type_emoji = "kedi 🐱" if type == "kedi" else "köpek 🐶" if type == "kopek" else "kuş 🐦"
	add_log("🐾 Sürpriz Misafir! Fabrikayı bir %s ziyaret ediyor. (%s bölgesinde)" % [type_emoji, ws_name])
	EventBus.animals_updated.emit()

func spawn_prey() -> void:
	if active_factory.is_empty() or not preys_container:
		return
		
	var ws_keys = active_factory["workstations"].keys()
	if ws_keys.size() == 0:
		return
	var ws = ws_keys[randi() % ws_keys.size()]
	var id = "prey_%d_%d" % [Time.get_ticks_msec(), randi() % 100]
	var type = "mouse" if randf() < 0.50 else "bird"
	
	var prey_scene = load("res://scenes/entities/prey.tscn")
	var prey_node = prey_scene.instantiate() as Prey
	preys_container.add_child(prey_node)
	prey_node.setup(id, type, ws, 0)
	preys.append(prey_node)
	
	var ws_name = get_workstation_name(ws)
	add_log("🐁 Av Getirildi! Evcilleşen kedi/köpeklerden biri yakaladığı bir %s %s bölgesine bıraktı." % [("fareyi" if type == "mouse" else "kuşu"), ws_name])
	EventBus.preys_updated.emit()

func interact_animal(p_id: String) -> void:
	var animal: Animal = null
	for a in animals:
		if a.animal_id == p_id:
			animal = a
			break
	if not animal:
		return
		
	if animal.animal_type == "kus":
		add_log("🐦 Kuş cıbıldadı, ustaların keyfi yerine geldi!")
		for m in masters:
			m.morale = clampi(m.morale + 2, 0, 100)
		animals.erase(animal)
		animal.queue_free()
		EventBus.animals_updated.emit()
		EventBus.masters_updated.emit()
		return
		
	var cost = 100
	if money < cost:
		EventBus.toast_notified.emit("Hayvanı beslemek için yeterli kasa bakiyesi yok (100 ₺ gerekli).", "warning")
		return
		
	money -= cost
	EventBus.money_changed.emit(money)
	
	if animal.animal_type == "kopek":
		dog_trust = clampi(dog_trust + 15, 0, 100)
		add_log("🐶 Köpeğe mama verdiniz. Fabrikaya alışıyor! Güven: %" + str(dog_trust))
		if dog_trust >= 100:
			add_log("🎉 Fabrikanın kadrolu koruyucusu Karabaş göreve başladı!")
	elif animal.animal_type == "kedi":
		cat_trust = clampi(cat_trust + 15, 0, 100)
		add_log("🐱 Kediye mama verdiniz. Mırıldıyor! Güven: %" + str(cat_trust))
		for m in masters:
			if m.skill == "Ar-Ge" or m.skill == "Tasarım":
				m.morale = clampi(m.morale + 10, 0, 100)
				m.trust = clampi(m.trust + 5, 0, 100)
		add_log("📐 Kedi sevgisi teknik ofisin moralini yükseltti!")
		
	animals.erase(animal)
	animal.queue_free()
	EventBus.animals_updated.emit()
	EventBus.masters_updated.emit()

func clean_prey(p_id: String) -> void:
	var prey: Prey = null
	for p in preys:
		if p.prey_id == p_id:
			prey = p
			break
	if prey:
		preys.erase(prey)
		prey.queue_free()
		add_log("🧹 Av kalıntısı temizlendi. Hijyen sağlandı.")
		EventBus.preys_updated.emit()

func buy_mat(mat: String, qty: int) -> void:
	var cost = mat_costs.get(mat, 1000) * qty
	if money < cost:
		EventBus.toast_notified.emit("Yetersiz bakiye!", "warning")
		return
	money -= cost
	inventory[mat] = inventory.get(mat, 0) + qty
	add_log("%dx %s satın alındı. -%d₺" % [qty, mat, cost])
	EventBus.money_changed.emit(money)
	# Trigger a redraw of purchase menu if open
	EventBus.open_purchase_modal.emit()

func do_assign(order_id: String, bp_name: String, worker_name: String) -> void:
	var order = null
	for o in orders:
		if o["id"] == order_id:
			order = o
			break
	if not order:
		return
		
	var bp = null
	for b in order["blueprints"]:
		if b["name"] == bp_name:
			bp = b
			break
	if not bp:
		return
		
	var m = find_master_by_name(worker_name)
	if not m:
		return
		
	var req_skill = bp["stages"][bp["stage"]]
	
	# Verify raw materials at starting stage 0 and first worker assignment
	var needed_material = ""
	if bp["stage"] == 0 and bp["workers"].size() == 0:
		if selected_factory_type == "radiator":
			if bp_name == "Petek Core Üretimi": needed_material = "Petek Kalıp Şeridi"
			elif bp_name == "Kazan Sac Gövdesi": needed_material = "Alüminyum Rulo Sac"
			elif bp_name == "Radyatör Montaj & Bitiş": needed_material = "Alüminyum Döküm Kazan"
		elif selected_factory_type == "gearbox":
			if bp_name == "Mil Komponenti": needed_material = "AISI 8620 Çelik"
			elif bp_name == "Helisel Dişli Çark": needed_material = "AISI 8620 Çelik"
			elif bp_name == "Şanzıman Montaj Hattı": needed_material = "Döküm Şanzıman Gövdesi"
		elif selected_factory_type == "armored":
			if bp_name == "Alt V-Gövde Sacı": needed_material = "Mil-A-46100 Zırh Çeliği"
			elif bp_name == "Zırh Yan Paneller": needed_material = "Mil-A-46100 Zırh Çeliği"
			elif bp_name == "Gövde Kaynak & Montaj": needed_material = "Zırhlı Balistik Cam"
			
	if not needed_material.is_empty():
		if inventory.get(needed_material, 0) <= 0:
			EventBus.toast_notified.emit("❌ Yetersiz malzeme! Depoda en az 1 adet \"%s\" bulunmalı." % needed_material, "warning")
			return
		inventory[needed_material] -= 1
		add_log("📦 1x %s üretim için depodan çekildi." % needed_material)
		
	# Skill match verification
	if m.skill != req_skill:
		if m.personality_trait == "İnatçı":
			add_log("❌ %s: \"Bu benim işim değil şefim!\" Reddedildi." % m.worker_name)
			return
		elif m.personality_trait == "Yardımsever":
			# Pass to idle worker with correct skill if available
			var correct = masters.filter(func(w): return w.skill == req_skill and w.status == "idle")
			if correct.size() > 0:
				var replacement = correct[0]
				assign_direct(bp, replacement.worker_name)
				add_log("%s: \"Bana verdin ama hayrına %s'e pasladım.\"" % [m.worker_name, replacement.worker_name])
				return
		add_log("⚠️ %s uzmanlığı dışı işe başladı. Hata riski yüksek!" % m.worker_name)
	else:
		add_log("%s: \"%s\" üretimine başlıyorum şefim." % [m.worker_name, bp_name])
		
	m.bp = bp
	m.stage_idx = bp["stage"]
	m.status = "working"
	m.change_state(WorkingState.new(m))
	
	bp["workers"].append(m.worker_name)
	EventBus.masters_updated.emit()
	EventBus.orders_updated.emit()

func assign_direct(bp: Dictionary, w_name: String) -> void:
	var m = find_master_by_name(w_name)
	if m:
		m.bp = bp
		m.stage_idx = bp["stage"]
		m.status = "working"
		m.change_state(WorkingState.new(m))
		bp["workers"].append(w_name)

# ─── HELPER FUNCTIONS ───

func find_master_by_name(p_name: String) -> Worker:
	for m in masters:
		if m.worker_name == p_name:
			return m
	return null

func get_workstation_node(ws_id: String) -> Workstation:
	if is_instance_valid(workstations_container):
		var node = workstations_container.find_child(ws_id, true, false)
		return node as Workstation
	return null

func get_workstation_name(ws_id: String) -> String:
	if active_factory.is_empty():
		return ws_id
	var ws_data = active_factory["workstations"].get(ws_id, {})
	return ws_data.get("name", ws_id)

func get_workstation_for_skill(skill_name: String) -> String:
	if active_factory.is_empty():
		return ""
	for ws_key in active_factory["workstations"]:
		if active_factory["workstations"][ws_key]["requiredSkill"] == skill_name:
			return ws_key
	return ""

func add_log(msg: String) -> void:
	var time_str = "%s:%s" % [str(hour).pad_zeros(2), str(minute).pad_zeros(2)]
	var log_entry = {"time": time_str, "day": day, "text": msg}
	logs.insert(0, log_entry)
	if logs.size() > 50:
		logs.pop_back()
	EventBus.log_added.emit(time_str, day, msg)

## Command history stack storing audit trail of all executive decisions.
var command_history: Array[Dictionary] = []

## Record and execute a UI command, keeping a structured history log
func record_and_dispatch_command(cmd: String, w_node: Worker, args: Array = []) -> void:
	var money_before = money
	var morale_before = w_node.morale if is_instance_valid(w_node) else 0
	var trust_before = w_node.trust if is_instance_valid(w_node) else 0
	var status_before = w_node.status if is_instance_valid(w_node) else ""
	
	# Execute the command
	dispatch_ui_command(cmd, w_node, args)
	
	# Log the command in history
	var w_name = w_node.worker_name if is_instance_valid(w_node) else "Sistem"
	var entry = {
		"day": day,
		"time": "%s:%s" % [str(hour).pad_zeros(2), str(minute).pad_zeros(2)],
		"cmd": cmd,
		"worker": w_name,
		"args": args,
		"money_before": money_before,
		"money_after": money,
		"morale_before": morale_before,
		"morale_after": w_node.morale if is_instance_valid(w_node) else 0,
		"trust_before": trust_before,
		"trust_after": w_node.trust if is_instance_valid(w_node) else 0,
		"status_before": status_before,
		"status_after": w_node.status if is_instance_valid(w_node) else ""
	}
	command_history.append(entry)
	
	# Keep history within reasonable size (e.g. last 100 commands)
	if command_history.size() > 100:
		command_history.remove_at(0)
		
	# Centralized Event-Driven Action Logging
	_log_command_event(entry)

## Internal helper to log command events in the terminal UI
func _log_command_event(entry: Dictionary) -> void:
	var w_name = entry["worker"]
	var cmd = entry["cmd"]
	
	match cmd:
		"allow_clinic":
			add_log("🏥 %s revire pansumana gönderildi." % w_name)
		"deny_clinic":
			add_log("⚠️ %s için revir izni reddedildi. Çalışmaya devam ediyor." % w_name)
		"open_purchase":
			add_log("📦 %s malzeme siparişi için satın alma arayüzünü açtı." % w_name)
		"close_dialog":
			add_log("💬 %s ile konuşma sonlandırıldı." % w_name)

## Undo the last recorded command, restoring money and worker stats if possible.
func undo_last_command() -> bool:
	if command_history.is_empty():
		add_log("🚨 Geri alınacak işlem bulunamadı.")
		return false
		
	var entry = command_history.pop_back()
	
	# Restore money
	money = entry["money_before"]
	EventBus.money_changed.emit(money)
	
	# Find the worker and restore stats/status
	var worker_node: Worker = null
	for m in masters:
		if m.worker_name == entry["worker"]:
			worker_node = m
			break
			
	if is_instance_valid(worker_node):
		worker_node.morale = entry["morale_before"]
		worker_node.trust = entry["trust_before"]
		if entry["status_before"] != "":
			worker_node.status = entry["status_before"]
			worker_node.return_to_work_or_idle()
			
	# Log the undo action
	add_log("↩️ Son işlem geri alındı: %s (%s)" % [entry["cmd"], entry["worker"]])
	EventBus.masters_updated.emit()
	return true

func dispatch_ui_command(cmd: String, w_node: Worker, args: Array = []) -> void:
	match cmd:
		"allow_clinic":
			_on_allow_clinic(w_node)
		"deny_clinic":
			_on_deny_clinic(w_node)
		"open_purchase":
			_on_open_purchase(w_node)
		"close_dialog":
			_on_close_dialog(w_node)
		"replace_tooling":
			_on_replace_tooling(w_node)
		"keep_tooling":
			_on_keep_tooling(w_node)
		"answer_tech":
			var correct: bool = args[0] if args.size() > 0 else false
			_on_answer_tech(w_node, correct)
		"approve_hire":
			var req_skill: String = args[0] if args.size() > 0 else ""
			_on_approve_hire(w_node, req_skill)
		"deny_hire":
			var req_skill: String = args[0] if args.size() > 0 else ""
			_on_deny_hire(w_node, req_skill)
		"anxious_accept":
			if is_instance_valid(w_node):
				w_node.morale = clampi(w_node.morale + 5, 0, 100)
				generate_new_order()
				add_log("📐 %s için yeni sipariş oluşturuldu." % w_node.worker_name)
				w_node.active_question.clear()
				w_node.change_state(IdleState.new(w_node))
		"anxious_reject":
			if is_instance_valid(w_node):
				w_node.trust = clampi(w_node.trust - 3, 0, 100)
				add_log("🔧 %s depoyu düzenlemeye gönderildi." % w_node.worker_name)
				w_node.active_question.clear()
				w_node.change_state(IdleState.new(w_node))
		"paternity_leave_approve":
			_on_paternity_leave_approve(w_node)
		"paternity_leave_deny":
			_on_paternity_leave_deny(w_node)
		"accident_revir":
			_on_accident_revir(w_node)
		"accident_work":
			_on_accident_work(w_node)
		"family_sick_leave":
			_on_family_sick_leave(w_node)
		"family_sick_help":
			_on_family_sick_help(w_node)
		"family_sick_deny":
			_on_family_sick_deny(w_node)
		"offsite_approve":
			_on_offsite_approve(w_node)
		"offsite_deny":
			_on_offsite_deny(w_node)
		"training_approve":
			_on_training_approve(w_node)
		"training_deny":
			_on_training_deny(w_node)
		_:
			push_error("Unknown UI command: " + cmd)

# ─── CALLBACKS FOR CALLABLES ───

func _on_answer_tech(w_node: Worker, correct: bool) -> void:
	w_node.active_question.clear()
	if correct:
		add_log("✅ %s: \"Tamamdır şefim, el kitabına baktım, doğru değer!\"" % w_node.worker_name)
		w_node.morale = clampi(w_node.morale + 12, 0, 100)
		w_node.trust = clampi(w_node.trust + 6, 0, 100)
		modify_boss_trust(1)
	else:
		add_log("❌ Hatalı talimat! %s yanlış teknik işlem yaptı. Parça hatalı üretilebilir!" % w_node.worker_name)
		w_node.morale = clampi(w_node.morale - 18, 0, 100)
		w_node.trust = clampi(w_node.trust - 12, 0, 100)
		if not w_node.bp.is_empty():
			w_node.bp["faulty"] = true
		modify_boss_trust(-1)
		if crunch_time:
			crunch_fails += 1
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

func _on_allow_clinic(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.morale = clampi(w_node.morale + 5, 0, 100)
	w_node.change_state(SlackingState.new(w_node))
	EventBus.masters_updated.emit()

func _on_deny_clinic(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.morale = clampi(w_node.morale - 8, 0, 100)
	w_node.trust = clampi(w_node.trust - 4, 0, 100)
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

func _on_open_purchase(w_node: Worker) -> void:
	w_node.active_question.clear()
	EventBus.open_purchase_modal.emit()
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

func _on_close_dialog(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

func _on_replace_tooling(w_node: Worker) -> void:
	w_node.active_question.clear()
	var cost = 2500
	if money >= cost:
		money -= cost
		add_log("Yeni kesici uçlar alındı. -2500₺")
		EventBus.money_changed.emit(money)
	else:
		add_log("Yetersiz bakiye - takım değiştirilemedi!")
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

func _on_keep_tooling(w_node: Worker) -> void:
	w_node.active_question.clear()
	add_log("%s eski uçla devam ediyor, hata riski arttı." % w_node.worker_name)
	if not w_node.bp.is_empty():
		w_node.bp["faulty"] = true
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

## Manually hire a new worker with a selected skill
func hire_worker(req_skill: String) -> bool:
	var cost = 4000
	if money < cost:
		add_log("❌ Yetersiz kasa bakiyesi! Yeni usta işe alınamadı.")
		return false
		
	money -= cost
	EventBus.money_changed.emit(money)
	
	var new_name = _generate_candidate_name()
	var new_hometown = _get_random_hometown()
	var new_trait = _get_random_trait()
	
	var new_master_data = {
		"name": new_name,
		"hometown": new_hometown,
		"skill": req_skill,
		"trait": new_trait,
		"bg": _generate_random_bg(new_name, req_skill),
		"warnings": 0,
		"status": "idle",
		"bp": {},
		"stage_idx": 0,
		"slacking": false,
		"active_question": {}
	}
	
	if workers_container:
		var worker_scene = load("res://scenes/entities/worker.tscn")
		var new_w_node = worker_scene.instantiate() as Worker
		workers_container.add_child(new_w_node)
		new_w_node.setup(new_master_data)
		masters.append(new_w_node)
		# Spawn at center of the factory floor
		new_w_node.global_position = FactoryFloor.iso_to_screen(15.0, 2.5)
		
	add_log("👷 %s (%s) başarıyla işe alındı! Kasa -4.000 ₺" % [new_name, req_skill])
	EventBus.masters_updated.emit()
	return true

func _on_approve_hire(w_node: Worker, req_skill: String) -> void:
	w_node.active_question.clear()
	var cost = 4000
	if money < cost:
		add_log("❌ Yetersiz kasa bakiyesi! Usta işe alınamadı.")
		w_node.morale = clampi(w_node.morale - 10, 0, 100)
		w_node.return_to_work_or_idle()
		EventBus.masters_updated.emit()
		return
		
	money -= cost
	EventBus.money_changed.emit(money)
	
	var new_name = _generate_candidate_name()
	var new_hometown = _get_random_hometown()
	var new_trait = _get_random_trait()
	
	var new_master_data = {
		"name": new_name,
		"hometown": new_hometown,
		"skill": req_skill,
		"trait": new_trait,
		"bg": _generate_random_bg(new_name, req_skill),
		"warnings": 0,
		"status": "idle",
		"bp": {},
		"stageIdx": 0,
		"slacking": false,
		"activeQuestion": {}
	}
	
	if workers_container:
		var worker_scene = load("res://scenes/entities/worker.tscn")
		var new_w_node = worker_scene.instantiate() as Worker
		workers_container.add_child(new_w_node)
		new_w_node.setup(new_master_data)
		masters.append(new_w_node)
		new_w_node.global_position = w_node.global_position + Vector2(50, 0)
		
	add_log("👷 %s (%s) başarıyla işe alındı! Kasa -4.000 ₺" % [new_name, req_skill])
	w_node.morale = clampi(w_node.morale + 15, 0, 100)
	w_node.trust = clampi(w_node.trust + 10, 0, 100)
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()
	EventBus.candidate_hired.emit(new_name, req_skill)

func _on_deny_hire(w_node: Worker, req_skill: String) -> void:
	w_node.active_question.clear()
	var skill_workers = masters.filter(func(w): return w.skill == req_skill)
	for w in skill_workers:
		w.morale = clampi(w.morale - 12, 0, 100)
		w.trust = clampi(w.trust - 6, 0, 100)
	add_log("⚠️ %s bölümünde usta alım talebi reddedildi. Çalışan morali düştü." % req_skill)
	w_node.return_to_work_or_idle()
	EventBus.masters_updated.emit()

func _generate_candidate_name() -> String:
	var first_names = ["Usta Selami", "Usta Veli", "Usta Recai", "Usta Fatma", "Usta Şükrü", "Usta Hatice", "Usta Salih", "Usta Bekir", "Usta Kazım", "Usta Niyazi", "Usta İsmail", "Usta Fadime", "Usta Şerife"]
	var existing = []
	for m in masters:
		existing.append(m.worker_name)
	var unused = []
	for n in first_names:
		if not existing.has(n):
			unused.append(n)
	if unused.size() > 0:
		return unused[randi() % unused.size()]
	return "Yardımcı Usta %d" % (randi() % 100)

func _get_random_hometown() -> String:
	var towns = ["Samsun", "Erzurum", "Balıkesir", "Manisa", "Kütahya", "Çanakkale", "Denizli", "Sinop", "Bartın", "Giresun", "Rize", "Ordu"]
	return towns[randi() % towns.size()]

func _get_random_trait() -> String:
	var keys = FactoryData.TRAITS.keys()
	var k = keys[randi() % keys.size()]
	return FactoryData.TRAITS[k]

# ─── NARRATIVE NATIVE HELPERS & CALLBACKS ───

func _generate_random_bg(worker_name: String, _skill_name: String) -> String:
	var bgs = [
		"%s, 15 yıl tersanede çalışmış, kaynak dumanını yutmuş tecrübeli bir ustadır. Hassasiyeti son derece yüksektir.",
		"%s, meslek lisesinden yeni mezun, eli çabuk ve öğrenmeye hevesli genç bir yetenektir.",
		"%s, Almanya'da otomotiv fabrikalarından emekli olup memlekete dönmüş, son derece disiplinli bir ustadır.",
		"%s, eski bir atölye sahibi olup işleri batırdıktan sonra usta olarak çalışmaya başlamış tecrübeli bir ustadır.",
		"%s, sakin mizaçlı, işine sadık ve detaylara son derece önem veren bir aile babasıdır.",
		"%s, daha önce askeri fabrikada çalışmış, milimetrik toleranslara takıntılı titiz bir ustadır."
	]
	return bgs[randi() % bgs.size()] % worker_name

func trigger_weekly_narrative_event() -> void:
	var candidates = masters.filter(func(candidate):
		return candidate.worker_name != "Sevkiyatçı Selo" and candidate.event_status == "" and candidate.active_question.is_empty()
	)

	if candidates.size() == 0:
		return
		
	var w = candidates[randi() % candidates.size()]
	var event_type = randi() % 5
	
	match event_type:
		0:
			w.active_question = {
				"body": "Şefim, müjde! Bugün sabaha karşı bir bebeğimiz dünyaya geldi. Eşimin yanında olmam gerekiyor, 3 gün babalık izni alabilir miyim?",
				"actions": [
					{
						"label": "Tebrikler usta! İzinli sayılırsın (3 gün Maaşlı, Moral +15, Güven +10)",
						"cmd": "paternity_leave_approve"
					},
					{
						"label": "Usta işler çok yoğun, çalışmalısın (Moral -20, Güven -15, %70 Hız)",
						"cmd": "paternity_leave_deny"
					}
				]
			}
			add_log("👶 %s babalık izni talep ediyor! (Görüşmek için üzerine tıklayın)" % w.worker_name)
		1:
			w.active_question = {
				"body": "Şefim, dün akşam eve giderken ufak bir kaza geçirdim, bileğimi burktum. Çalışabilirim ama hızım yarıya düşer. Ya da 2 gün istirahat etmemi önerir misiniz?",
				"actions": [
					{
						"label": "Geçmiş olsun usta, revire geç ve dinlen (2 gün, Moral +10, Güven +5)",
						"cmd": "accident_revir"
					},
					{
						"label": "Sana ihtiyacımız var, hafif tempoda devam et (2 gün %50 Hız, Güven -5)",
						"cmd": "accident_work"
					}
				]
			}
			add_log("🩹 %s bir kaza geçirmiş! (Görüşmek için üzerine tıklayın)" % w.worker_name)
		2:
			w.active_question = {
				"body": "Şefim, ailemden biri aniden hastalandı, hastaneye götürmem ve refakat etmem gerekiyor. 2 gün izin rica edebilir miyim?",
				"actions": [
					{
						"label": "Tabii ki usta, ailen her şeyden önemli (2 gün İzin, Moral +12, Güven +8)",
						"cmd": "family_sick_leave"
					},
					{
						"label": "Sen kal çalış, biz eve özel bakıcı gönderelim (1500₺, %90 Hız, Güven +12)",
						"cmd": "family_sick_help"
					},
					{
						"label": "Şu an izin veremem, işin başında durmalısın (Moral -15, Güven -10, %60 Hız)",
						"cmd": "family_sick_deny"
					}
				]
			}
			add_log("🏥 %s ailevi bir acil durum bildiriyor! (Görüşmek için üzerine tıklayın)" % w.worker_name)
		3:
			w.active_question = {
				"body": "Şefim, organize sanayideki komşu atölyenin ustası rahatsızlanmış. 1 günlüğüne oradaki darboğazı çözmek için benden destek istiyorlar. Gideyim mi? Günlük 2000₺ kasa geliri sağlayacaklar.",
				"actions": [
					{
						"label": "Git usta, komşumuza yardım edelim (+2000₺ Kasa, 1 gün yok)",
						"cmd": "offsite_approve"
					},
					{
						"label": "İşimiz başımızdan aşkın, gidemezsin (Güven -2)",
						"cmd": "offsite_deny"
					}
				]
			}
			add_log("🚚 %s komşu atölyeden destek talebi getirdi! (Görüşmek için üzerine tıklayın)" % w.worker_name)
		4:
			w.active_question = {
				"body": "Şefim, belediyenin düzenlediği 2 günlük yeni nesil sanayi ve üretim teknolojileri semineri var. Katılmamı onaylar mısınız? Hızım kalıcı olarak artabilir.",
				"actions": [
					{
						"label": "Onaylıyorum, kendini geliştir (1000₺ Ücret, 2 gün yok, Kalıcı +15% Hız)",
						"cmd": "training_approve"
					},
					{
						"label": "Fabrikada yapacak iş çok, gidemezsin (Moral -5)",
						"cmd": "training_deny"
					}
				]
			}
			add_log("📚 %s eğitim seminerine katılmak istiyor! (Görüşmek için üzerine tıklayın)" % w.worker_name)
			
	EventBus.masters_updated.emit()

func _on_paternity_leave_approve(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "leave"
	w_node.event_days_remaining = 3
	w_node.speed_modifier = 0.0
	w_node.status = "leave"
	var max_m = 110 if coffee_machine_owned else 100
	w_node.morale = clampi(w_node.morale + 15, 0, max_m)
	w_node.trust = clampi(w_node.trust + 10, 0, 100)
	w_node.event_description = "Babalık izninde (3 gün)"
	w_node.change_state(EventState.new(w_node))
	add_log("👶 %s babalık iznine ayrıldı (3 gün)." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_paternity_leave_deny(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "distracted"
	w_node.event_days_remaining = 3
	w_node.speed_modifier = 0.7
	var max_m = 110 if coffee_machine_owned else 100
	w_node.morale = clampi(w_node.morale - 20, 0, max_m)
	w_node.trust = clampi(w_node.trust - 15, 0, 100)
	w_node.event_description = "Uykusuz ve kafası dağınık (%70 Hız, 3 gün)"
	w_node.return_to_work_or_idle()
	add_log("⚠️ %s babalık izni alamadı. Uykusuz ve moralsiz çalışıyor (%70 Hız)." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_accident_revir(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "injured"
	w_node.event_days_remaining = 2
	w_node.speed_modifier = 0.0
	w_node.status = "injured"
	var max_m = 110 if coffee_machine_owned else 100
	w_node.morale = clampi(w_node.morale + 10, 0, max_m)
	w_node.trust = clampi(w_node.trust + 5, 0, 100)
	w_node.event_description = "Revirde istirahatte (2 gün)"
	w_node.change_state(EventState.new(w_node))
	add_log("🩹 %s revirde dinlenmeye gönderildi (2 gün)." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_accident_work(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "injured_working"
	w_node.event_days_remaining = 2
	w_node.speed_modifier = 0.5
	w_node.trust = clampi(w_node.trust - 5, 0, 100)
	w_node.event_description = "Burkulmuş bilekle çalışıyor (%50 Hız, 2 gün)"
	w_node.return_to_work_or_idle()
	add_log("⚠️ %s burkulmuş bilekle çalışmaya devam ediyor (%50 Hız)." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_family_sick_leave(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "leave"
	w_node.event_days_remaining = 2
	w_node.speed_modifier = 0.0
	w_node.status = "leave"
	var max_m = 110 if coffee_machine_owned else 100
	w_node.morale = clampi(w_node.morale + 12, 0, max_m)
	w_node.trust = clampi(w_node.trust + 8, 0, 100)
	w_node.event_description = "Aile refakat izninde (2 gün)"
	w_node.change_state(EventState.new(w_node))
	add_log("🏥 %s aile refakat iznine ayrıldı (2 gün)." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_family_sick_help(w_node: Worker) -> void:
	w_node.active_question.clear()
	var cost = 1500
	if money >= cost:
		money -= cost
		EventBus.money_changed.emit(money)
		w_node.event_status = "homecare"
		w_node.event_days_remaining = 2
		w_node.speed_modifier = 0.9
		var max_m = 110 if coffee_machine_owned else 100
		w_node.morale = clampi(w_node.morale + 5, 0, max_m)
		w_node.trust = clampi(w_node.trust + 12, 0, 100)
		w_node.event_description = "Aile bakıcısı destekli çalışıyor (%90 Hız, 2 gün)"
		w_node.return_to_work_or_idle()
		add_log("💖 %s ailesine evde bakım desteği sağlandı (-1.500₺). Usta yüksek moralle çalışıyor (%90 Hız)." % w_node.worker_name)
	else:
		add_log("Yetersiz bakiye - aileye nakdi yardım yapılamadı!")
		_on_family_sick_deny(w_node)
	EventBus.masters_updated.emit()

func _on_family_sick_deny(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "worried"
	w_node.event_days_remaining = 2
	w_node.speed_modifier = 0.6
	var max_m = 110 if coffee_machine_owned else 100
	w_node.morale = clampi(w_node.morale - 15, 0, max_m)
	w_node.trust = clampi(w_node.trust - 10, 0, 100)
	w_node.event_description = "Ailesi için endişeli (%60 Hız, 2 gün)"
	w_node.return_to_work_or_idle()
	add_log("⚠️ %s izin talebi reddedildi. Ailesi için endişeli ve yavaş çalışıyor (%60 Hız)." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_offsite_approve(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "offsite"
	w_node.event_days_remaining = 1
	w_node.speed_modifier = 0.0
	w_node.status = "offsite"
	w_node.event_description = "Komşu atölyede geçici görevde (1 gün)"
	w_node.change_state(EventState.new(w_node))
	
	money += 2000
	EventBus.money_changed.emit(money)
	add_log("🚚 %s komşu atölyeye desteğe gönderildi. Kasa +2.000₺" % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_offsite_deny(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.trust = clampi(w_node.trust - 2, 0, 100)
	w_node.return_to_work_or_idle()
	add_log("⚠️ %s komşu atölyeye gönderilmedi." % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_training_approve(w_node: Worker) -> void:
	w_node.active_question.clear()
	w_node.event_status = "training"
	w_node.event_days_remaining = 2
	w_node.speed_modifier = 0.0
	w_node.status = "leave"
	w_node.event_description = "Seminer eğitiminde (2 gün)"
	w_node.change_state(EventState.new(w_node))
	
	money -= 1000
	EventBus.money_changed.emit(money)
	add_log("📚 %s eğitim seminerine gönderildi. Kasa -1.000₺" % w_node.worker_name)
	EventBus.masters_updated.emit()

func _on_training_deny(w_node: Worker) -> void:
	w_node.active_question.clear()
	var max_m = 110 if coffee_machine_owned else 100
	w_node.morale = clampi(w_node.morale - 5, 0, max_m)
	w_node.return_to_work_or_idle()
	add_log("⚠️ %s seminer talebi reddedildi." % w_node.worker_name)
	EventBus.masters_updated.emit()

func get_max_rating() -> int:
	return 110 if home_upgrades.get("pc", false) else 100

func buy_personal_vehicle(vehicle_key: String, cost: int) -> bool:
	if personal_balance >= cost:
		personal_balance -= cost
		personal_vehicles[vehicle_key] = true
		SoundManager.play("cash_register")
		add_log("🚗 Yeni araç satın aldınız: %s! Kalan Kişisel Bakiye: %d₺" % [get_personal_vehicle_name(vehicle_key), personal_balance])
		return true
	return false

func get_personal_vehicle_name(vehicle_key: String) -> String:
	match vehicle_key:
		"blue_sedan": return "Kişisel Sedan (Mavi)"
		"red_hatchback": return "Hızlı Hatchback (Kırmızı)"
		"yellow_suv": return "Heybetli SUV (Sarı)"
		"black_sport": return "Yarış Spor Arabası (Siyah)"
		_: return "Araç"

func buy_home_upgrade(upgrade_key: String, cost: int) -> bool:
	if personal_balance >= cost:
		personal_balance -= cost
		home_upgrades[upgrade_key] = true
		SoundManager.play("cash_register")
		add_log("🏠 Evinizi geliştirdiniz: %s satın alındı! Kalan Kişisel Bakiye: %d₺" % [get_home_upgrade_name(upgrade_key), personal_balance])
		if upgrade_key == "pc":
			add_log("🎮 Hobi Bilgisayarı sayesinde moral/itibar tavan yaptı, maksimum itibar limiti %d seviyesine yükseldi!" % get_max_rating())
		return true
	return false

func get_home_upgrade_name(upgrade_key: String) -> String:
	match upgrade_key:
		"bed": return "Rahat Yatak"
		"tv": return "Akıllı TV"
		"coffee": return "Home Espresso Makinesi"
		"kitchen": return "Modern Mutfak"
		"pc": return "Hobi Bilgisayarı"
		_: return "Geliştirme"

func apply_home_bonuses() -> void:
	var morale_bonus = 5 if home_upgrades.get("tv", false) else 0
	var trust_bonus = 5 if home_upgrades.get("bed", false) else 0
	var rating_bonus = 5 if home_upgrades.get("coffee", false) else 0
	var trust_boss_bonus = 1 if home_upgrades.get("kitchen", false) else 0
	
	if morale_bonus > 0 or trust_bonus > 0 or rating_bonus > 0 or trust_boss_bonus > 0:
		var max_m = 110 if coffee_machine_owned else 100
		for m in masters:
			if morale_bonus > 0:
				m.morale = clampi(m.morale + morale_bonus, 0, max_m)
			if trust_bonus > 0:
				m.trust = clampi(m.trust + trust_bonus, 0, 100)
		if rating_bonus > 0:
			rating = clampi(rating + rating_bonus, 0, get_max_rating())
		if trust_boss_bonus > 0:
			modify_boss_trust(trust_boss_bonus)
		
		add_log("🏠 Ev geliştirmeleri güne zinde başlamanızı sağladı! Aktif bonuslar uygulandı.")
		EventBus.masters_updated.emit()

func start_new_day() -> void:
	# 1. Apply home upgrade starting bonuses
	apply_home_bonuses()
	
	add_log("🛌 Evinizde uyudunuz ve yeni güne dinç başladınız...")
	
	# 2. Increment day
	day += 1
	hour = FactoryData.DAY_START_HOUR
	minute = 0
	orders_completed_today = 0
	
	# 3. 25% chance of starting in crunch time
	if randf() < 0.25:
		trigger_crunch_time()
	else:
		crunch_time = false
		EventBus.crunch_time_toggled.emit(false)
		
	schedule_notifications()
	
	# Trigger weekly narrative event at the start of Day 8, 15, 22...
	if day > 1 and (day - 1) % 7 == 0:
		trigger_weekly_narrative_event()
		
	EventBus.time_changed.emit(day, hour, minute)
	EventBus.money_changed.emit(money)
	EventBus.rating_changed.emit(rating)
	EventBus.masters_updated.emit()
	EventBus.orders_updated.emit()
	EventBus.animals_updated.emit()
	EventBus.preys_updated.emit()
	
	day_ended_and_slept = true
	set_paused(true)
