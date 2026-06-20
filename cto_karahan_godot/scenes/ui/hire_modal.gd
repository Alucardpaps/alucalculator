extends Panel

## HireModal UI Controller: Manually hire new workers with a selected skill from the active factory.

@onready var list_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/ListContainer
@onready var money_label: Label = $MarginContainer/VBoxContainer/HeaderContainer/MoneyLabel
@onready var close_button: Button = $MarginContainer/VBoxContainer/CloseButton

func _ready() -> void:
	# Add local signal in EventBus or use a direct call
	if not EventBus.has_user_signal("open_hire_modal"):
		EventBus.add_user_signal("open_hire_modal")
	EventBus.connect("open_hire_modal", _on_open)
	close_button.pressed.connect(_on_close)
	visible = false

func _on_open() -> void:
	GameManager.set_paused(true)
	refresh_dialog()
	visible = true

func refresh_dialog() -> void:
	money_label.text = "💰 Kasa: %s ₺" % _format_money(GameManager.money)
	
	# Clear list
	for child in list_container.get_children():
		child.queue_free()
		
	if GameManager.active_factory.is_empty():
		return
		
	# Gather all active skills from workstations
	var active_skills: Array[String] = []
	for ws_key in GameManager.active_factory["workstations"]:
		var ws = GameManager.active_factory["workstations"][ws_key]
		var skill = ws["requiredSkill"]
		if not skill in ["İdari", "RessamWC", "Shipment", "Break", "Medical"] and not skill in active_skills:
			active_skills.append(skill)
			
	# Populate skills to hire
	for skill in active_skills:
		var item = PanelContainer.new()
		item.custom_minimum_size = Vector2(0, 60)
		
		var sb = StyleBoxFlat.new()
		sb.bg_color = Color(0.12, 0.14, 0.18, 0.9)
		sb.border_width_left = 2
		sb.border_width_top = 2
		sb.border_width_right = 2
		sb.border_width_bottom = 2
		sb.border_color = Color(0.18, 0.22, 0.28)
		sb.corner_radius_top_left = 6
		sb.corner_radius_top_right = 6
		sb.corner_radius_bottom_right = 6
		sb.corner_radius_bottom_left = 6
		item.add_theme_stylebox_override("panel", sb)
		list_container.add_child(item)
		
		var margin = MarginContainer.new()
		margin.add_theme_constant_override("margin_left", 12)
		margin.add_theme_constant_override("margin_right", 12)
		item.add_child(margin)
		
		var hbox = HBoxContainer.new()
		margin.add_child(hbox)
		
		# Info label
		var info_lbl = Label.new()
		# Count current workers with this skill
		var count = 0
		for m in GameManager.masters:
			if m.skill == skill:
				count += 1
		info_lbl.text = "👷 %s Branşı\nMevcut Usta: %d • İşe Alım Maliyeti: 4.000 ₺" % [skill, count]
		info_lbl.add_theme_font_size_override("font_size", 12)
		info_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		hbox.add_child(info_lbl)
		
		# Hire button
		var hire_btn = Button.new()
		hire_btn.text = "İşe Al"
		hire_btn.add_theme_font_size_override("font_size", 11)
		hire_btn.custom_minimum_size = Vector2(100, 32)
		hire_btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		hire_btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		
		var btn_style = StyleBoxFlat.new()
		btn_style.bg_color = Color(0.18, 0.44, 0.7)
		btn_style.corner_radius_top_left = 6
		btn_style.corner_radius_top_right = 6
		btn_style.corner_radius_bottom_right = 6
		btn_style.corner_radius_bottom_left = 6
		hire_btn.add_theme_stylebox_override("normal", btn_style)
		
		# Disable if not enough money
		if GameManager.money < 4000:
			hire_btn.disabled = true
			
		hire_btn.pressed.connect(func():
			if GameManager.hire_worker(skill):
				SoundManager.play("cash_register")
				refresh_dialog()
		)
		hbox.add_child(hire_btn)

func _on_close() -> void:
	GameManager.set_paused(false)
	visible = false

func _format_money(val: int) -> String:
	var s = str(val)
	var result = ""
	var count = 0
	for i in range(s.length() - 1, -1, -1):
		result = s[i] + result
		count += 1
		if count == 3 and i > 0 and s[i-1] != '-':
			result = "." + result
			count = 0
	return result
