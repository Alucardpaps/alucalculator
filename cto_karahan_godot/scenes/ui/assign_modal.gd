extends Panel

## AssignModal UI Controller: Handles assigning idle workers to active blueprint stages.

@onready var title_label: Label = $MarginContainer/VBoxContainer/HeaderContainer/TitleLabel
@onready var list_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/ListContainer
@onready var close_button: Button = $MarginContainer/VBoxContainer/CloseButton

var target_order_id: String = ""
var target_bp_name: String = ""

func _ready() -> void:
	EventBus.open_assign_modal.connect(_on_open)
	close_button.pressed.connect(_on_close)
	visible = false

func _on_open(order_id: String, bp_name: String) -> void:
	target_order_id = order_id
	target_bp_name = bp_name
	
	# Pause the game time when assigning workers
	GameManager.set_paused(true)
	refresh_dialog()
	visible = true

func refresh_dialog() -> void:
	title_label.text = "👤 USTA ATAMA: %s" % target_bp_name
	
	# Clear list
	for child in list_container.get_children():
		child.queue_free()
		
	# Find the blueprint to understand the required skill
	var req_skill: String = ""
	var order: Dictionary = {}
	for o in GameManager.orders:
		if o["id"] == target_order_id:
			order = o
			break
			
	if not order.is_empty():
		for bp in order["blueprints"]:
			if bp["name"] == target_bp_name:
				req_skill = str(bp["stages"][bp["stage"]])
				break
				
	# Filter only idle workers
	var idle_workers: Array = GameManager.masters.filter(func(w): return w.status == "idle")
	
	# Sort idle workers: matching skill goes first, then higher morale, then by name
	idle_workers.sort_custom(func(a, b):
		var match_a = a.skill == req_skill
		var match_b = b.skill == req_skill
		if match_a != match_b:
			return match_a # Match goes first
		if a.morale != b.morale:
			return a.morale > b.morale # Higher morale goes first
		return a.worker_name < b.worker_name
	)
	
	if idle_workers.size() == 0:
		var empty_lbl = Label.new()
		empty_lbl.text = "Şu anda boşta usta bulunmamaktadır!"
		empty_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		empty_lbl.size_flags_vertical = Control.SIZE_EXPAND_FILL
		empty_lbl.add_theme_color_override("font_color", Color(0.9, 0.4, 0.4))
		list_container.add_child(empty_lbl)
		return
		
	# Populate based on idle workers list
	for worker in idle_workers:
		var item: PanelContainer = PanelContainer.new()
		item.custom_minimum_size = Vector2(0, 60)
		
		# Visual styling
		var sb: StyleBoxFlat = StyleBoxFlat.new()
		sb.bg_color = Color(0.12, 0.14, 0.18, 0.9)
		sb.border_width_left = 4
		sb.corner_radius_top_right = 6
		sb.corner_radius_bottom_right = 6
		
		var skill_match: bool = worker.skill == req_skill
		if skill_match:
			sb.border_color = Color(0.24, 0.81, 0.45) # Green for match
		else:
			sb.border_color = Color(0.4, 0.4, 0.4) # Dark gray for mismatch
			
		item.add_theme_stylebox_override("panel", sb)
		list_container.add_child(item)
		
		var margin: MarginContainer = MarginContainer.new()
		margin.add_theme_constant_override("margin_left", 12)
		margin.add_theme_constant_override("margin_right", 12)
		item.add_child(margin)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		margin.add_child(hbox)
		
		# Info label
		var info_lbl: Label = Label.new()
		info_lbl.text = "👷 %s\nUzmanlık: %s • Özellik: %s" % [worker.worker_name, worker.skill, worker.personality_trait]
		info_lbl.add_theme_font_size_override("font_size", 12)
		if skill_match:
			info_lbl.add_theme_color_override("font_color", Color(0.9, 1.0, 0.9))
		else:
			info_lbl.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
			
		info_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		hbox.add_child(info_lbl)
		
		# Assign Button
		var assign_btn: Button = Button.new()
		if skill_match:
			assign_btn.text = "Ata (Uzman)"
			var btn_style: StyleBoxFlat = StyleBoxFlat.new()
			btn_style.bg_color = Color(0.18, 0.6, 0.35)
			btn_style.corner_radius_top_left = 6
			btn_style.corner_radius_top_right = 6
			btn_style.corner_radius_bottom_right = 6
			btn_style.corner_radius_bottom_left = 6
			assign_btn.add_theme_stylebox_override("normal", btn_style)
		else:
			assign_btn.text = "Ata (Hata Riski!)"
			var btn_style: StyleBoxFlat = StyleBoxFlat.new()
			btn_style.bg_color = Color(0.8, 0.4, 0.1)
			btn_style.corner_radius_top_left = 6
			btn_style.corner_radius_top_right = 6
			btn_style.corner_radius_bottom_right = 6
			btn_style.corner_radius_bottom_left = 6
			assign_btn.add_theme_stylebox_override("normal", btn_style)
			
		assign_btn.add_theme_font_size_override("font_size", 11)
		assign_btn.custom_minimum_size = Vector2(120, 32)
		assign_btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		assign_btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		
		assign_btn.pressed.connect(func():
			GameManager.do_assign(target_order_id, target_bp_name, worker.worker_name)
			SoundManager.play("notification")
			GameManager.set_paused(false)
			visible = false
		)
		hbox.add_child(assign_btn)

func _on_close() -> void:
	# Resume the game time when closing
	GameManager.set_paused(false)
	visible = false
