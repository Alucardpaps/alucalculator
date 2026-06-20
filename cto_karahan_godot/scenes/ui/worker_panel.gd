extends Panel

## WorkerPanel UI Controller: Populates a split-view panel listing workers on the left and selected details on the right.

@onready var list_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/ListContainer
@onready var hire_button: Button = $MarginContainer/VBoxContainer/HireButton

var split_view: HBoxContainer
var left_col: VBoxContainer
var right_col: PanelContainer
var detail_vbox: VBoxContainer

var selected_worker_name: String = ""

func _ready() -> void:
	# Restructure layout dynamically for Apple-style split view
	var main_vbox := $MarginContainer/VBoxContainer as VBoxContainer
	
	split_view = HBoxContainer.new()
	split_view.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split_view.add_theme_constant_override("separation", 20)
	main_vbox.add_child(split_view)
	
	left_col = VBoxContainer.new()
	left_col.custom_minimum_size = Vector2(320, 0)
	left_col.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split_view.add_child(left_col)
	
	# Reparent scroll and hire button
	var scroll = main_vbox.get_node("ScrollContainer")
	var sep2 = main_vbox.get_node("HSeparator2")
	var hire_btn = main_vbox.get_node("HireButton")
	
	scroll.reparent(left_col)
	sep2.reparent(left_col)
	hire_btn.reparent(left_col)
	
	# Create Right Detail Card
	right_col = PanelContainer.new()
	right_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_col.size_flags_vertical = Control.SIZE_EXPAND_FILL
	
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.09, 0.11, 0.15, 0.8) # Sleek translucent dark gray background
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(0.2, 0.23, 0.3, 0.3)
	sb.corner_radius_top_left = 14
	sb.corner_radius_top_right = 14
	sb.corner_radius_bottom_right = 14
	sb.corner_radius_bottom_left = 14
	sb.shadow_color = Color(0, 0, 0, 0.2)
	sb.shadow_size = 10
	sb.shadow_offset = Vector2(0, 4)
	right_col.add_theme_stylebox_override("panel", sb)
	split_view.add_child(right_col)
	
	var right_margin = MarginContainer.new()
	right_margin.add_theme_constant_override("margin_left", 20)
	right_margin.add_theme_constant_override("margin_right", 20)
	right_margin.add_theme_constant_override("margin_top", 20)
	right_margin.add_theme_constant_override("margin_bottom", 20)
	right_col.add_child(right_margin)
	
	detail_vbox = VBoxContainer.new()
	detail_vbox.add_theme_constant_override("separation", 14)
	right_margin.add_child(detail_vbox)
	
	EventBus.masters_updated.connect(refresh_list)
	hire_button.pressed.connect(_on_hire_pressed)
	refresh_list()

func _on_hire_pressed() -> void:
	if not EventBus.has_user_signal("open_hire_modal"):
		EventBus.add_user_signal("open_hire_modal")
	EventBus.emit_signal("open_hire_modal")
	SoundManager.play("notification")

func refresh_list() -> void:
	# Store left scroll position
	var left_scroll = list_container.get_parent() as ScrollContainer
	var previous_left_scroll_v: int = 0
	if left_scroll:
		previous_left_scroll_v = left_scroll.scroll_vertical

	# Clear existing children
	for child in list_container.get_children():
		child.queue_free()
		
	# Find currently selected worker node
	var selected_worker: Worker = null
	var valid_masters = GameManager.masters.filter(func(w): return is_instance_valid(w))
	
	if valid_masters.size() > 0:
		# Check if current selection is still in the list
		var current_exists = false
		for w in valid_masters:
			if w.worker_name == selected_worker_name:
				selected_worker = w
				current_exists = true
				break
		# Default to first worker if none selected or selection invalid
		if not current_exists:
			selected_worker = valid_masters[0]
			selected_worker_name = selected_worker.worker_name
			
	# Rebuild left-side list
	for worker in valid_masters:
		var card = PanelContainer.new()
		card.custom_minimum_size = Vector2(0, 96)
		
		# Set card style
		var sb = StyleBoxFlat.new()
		if worker.worker_name == selected_worker_name:
			sb.bg_color = Color(0.18, 0.22, 0.3, 0.95) # Glowing blue active state
			sb.border_width_left = 6
		else:
			sb.bg_color = Color(0.11, 0.13, 0.17, 0.8) # Apple flat slate card
			sb.border_width_left = 4
			
		# Modulate left border color based on status
		match worker.status:
			"working", "homecare": sb.border_color = Color(0.24, 0.81, 0.45) # Green
			"slacking", "distracted", "worried", "injured_working": sb.border_color = Color(0.95, 0.77, 0.25) # Yellow/Orange
			"anxious", "training": sb.border_color = Color(0.85, 0.35, 0.85) # Purple
			"feud": sb.border_color = Color(0.85, 0.15, 0.15) # Red
			"leave", "sick", "injured", "offsite": sb.border_color = Color(0.5, 0.7, 0.9) # Light Blue
			_: sb.border_color = Color(0.5, 0.5, 0.5) # Gray/Idle
			
		sb.corner_radius_top_right = 10
		sb.corner_radius_bottom_right = 10
		sb.corner_radius_top_left = 4
		sb.corner_radius_bottom_left = 4
		card.add_theme_stylebox_override("panel", sb)
		
		var margin = MarginContainer.new()
		margin.add_theme_constant_override("margin_left", 12)
		margin.add_theme_constant_override("margin_top", 8)
		margin.add_theme_constant_override("margin_right", 12)
		margin.add_theme_constant_override("margin_bottom", 8)
		card.add_child(margin)
		
		var vbox = VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 2)
		margin.add_child(vbox)
		
		# Name & Hometown Header
		var header_hbox = HBoxContainer.new()
		vbox.add_child(header_hbox)
		
		var name_lbl = Label.new()
		name_lbl.text = worker.worker_name
		name_lbl.add_theme_font_size_override("font_size", 13)
		name_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
		header_hbox.add_child(name_lbl)
		
		var spacer = Control.new()
		spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		header_hbox.add_child(spacer)
		
		var status_lbl = Label.new()
		status_lbl.text = _get_status_turkish(worker.status, not worker.active_question.is_empty())
		status_lbl.add_theme_font_size_override("font_size", 11)
		status_lbl.add_theme_color_override("font_color", _get_status_color(worker.status))
		header_hbox.add_child(status_lbl)
		
		# Skill & Trait Line
		var info_lbl = Label.new()
		var info_text = "🎯 %s • %s" % [worker.skill, worker.personality_trait]
		info_lbl.text = info_text
		info_lbl.add_theme_font_size_override("font_size", 10)
		info_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.76))
		vbox.add_child(info_lbl)
		
		# Morale indicator line
		var status_bar_hbox = HBoxContainer.new()
		status_bar_hbox.add_theme_constant_override("separation", 10)
		vbox.add_child(status_bar_hbox)
		
		var m_lbl = Label.new()
		m_lbl.text = "Moral: %%%d" % worker.morale
		m_lbl.add_theme_font_size_override("font_size", 9)
		m_lbl.add_theme_color_override("font_color", Color(0.6, 0.8, 0.6))
		status_bar_hbox.add_child(m_lbl)
		
		var t_lbl = Label.new()
		t_lbl.text = "Güven: %%%d" % worker.trust
		t_lbl.add_theme_font_size_override("font_size", 9)
		t_lbl.add_theme_color_override("font_color", Color(0.6, 0.7, 0.9))
		status_bar_hbox.add_child(t_lbl)
		
		# Click overlay button to select worker
		var button = TextureButton.new()
		button.set_anchors_preset(Control.PRESET_FULL_RECT)
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		button.pressed.connect(func():
			selected_worker_name = worker.worker_name
			refresh_list()
			SoundManager.play("notification")
		)
		card.add_child(button)
		
		list_container.add_child(card)
		
	# Update right detail view
	update_detail_view(selected_worker)
	
	# Restore left scroll position deferred
	if left_scroll and previous_left_scroll_v > 0:
		(func(): if is_instance_valid(left_scroll): left_scroll.scroll_vertical = previous_left_scroll_v).call_deferred()

func update_detail_view(worker: Worker) -> void:
	# Clear details
	for child in detail_vbox.get_children():
		child.queue_free()
		
	if not is_instance_valid(worker):
		var placeholder = Label.new()
		placeholder.text = "Detayları görmek için soldan bir usta seçin."
		placeholder.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		placeholder.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		placeholder.size_flags_vertical = Control.SIZE_EXPAND_FILL
		placeholder.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		detail_vbox.add_child(placeholder)
		return
		
	# Title & Hometown
	var name_lbl = Label.new()
	name_lbl.text = "👷 %s" % worker.worker_name
	name_lbl.add_theme_font_size_override("font_size", 18)
	name_lbl.add_theme_color_override("font_color", Color.WHITE)
	detail_vbox.add_child(name_lbl)
	
	# Status Badge & Hometown Row
	var meta_hbox = HBoxContainer.new()
	meta_hbox.add_theme_constant_override("separation", 10)
	detail_vbox.add_child(meta_hbox)
	
	var status_bg = PanelContainer.new()
	var status_sb = StyleBoxFlat.new()
	status_sb.bg_color = _get_status_color(worker.status)
	status_sb.bg_color.a = 0.25 # Semi transparent pill
	status_sb.border_width_left = 1
	status_sb.border_width_top = 1
	status_sb.border_width_right = 1
	status_sb.border_width_bottom = 1
	status_sb.border_color = _get_status_color(worker.status)
	status_sb.corner_radius_top_left = 12
	status_sb.corner_radius_top_right = 12
	status_sb.corner_radius_bottom_right = 12
	status_sb.corner_radius_bottom_left = 12
	status_bg.add_theme_stylebox_override("panel", status_sb)
	meta_hbox.add_child(status_bg)
	
	var status_margin = MarginContainer.new()
	status_margin.add_theme_constant_override("margin_left", 10)
	status_margin.add_theme_constant_override("margin_right", 10)
	status_margin.add_theme_constant_override("margin_top", 4)
	status_margin.add_theme_constant_override("margin_bottom", 4)
	status_bg.add_child(status_margin)
	
	var status_lbl = Label.new()
	status_lbl.text = _get_status_turkish(worker.status, not worker.active_question.is_empty())
	status_lbl.add_theme_font_size_override("font_size", 11)
	status_lbl.add_theme_color_override("font_color", _get_status_color(worker.status))
	status_margin.add_child(status_lbl)
	
	var home_lbl = Label.new()
	home_lbl.text = "📍 %s" % worker.hometown
	home_lbl.add_theme_font_size_override("font_size", 11)
	home_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.76))
	home_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	meta_hbox.add_child(home_lbl)
	
	var skill_lbl = Label.new()
	skill_lbl.text = "🎯 Uzmanlık: %s" % worker.skill
	skill_lbl.add_theme_font_size_override("font_size", 11)
	skill_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.76))
	skill_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	meta_hbox.add_child(skill_lbl)
	
	var trait_lbl = Label.new()
	trait_lbl.text = "⚡ Özellik: %s" % worker.personality_trait
	trait_lbl.add_theme_font_size_override("font_size", 11)
	trait_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.76))
	trait_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	meta_hbox.add_child(trait_lbl)
	
	# Stats Bars Container
	var stats_box = VBoxContainer.new()
	stats_box.add_theme_constant_override("separation", 8)
	detail_vbox.add_child(stats_box)
	
	# Morale
	var morale_hbox = HBoxContainer.new()
	stats_box.add_child(morale_hbox)
	var m_title = Label.new()
	m_title.text = "Moral"
	m_title.custom_minimum_size = Vector2(60, 0)
	m_title.add_theme_font_size_override("font_size", 11)
	morale_hbox.add_child(m_title)
	
	var m_bar = ProgressBar.new()
	m_bar.value = worker.morale
	m_bar.max_value = 110 if GameManager.coffee_machine_owned else 100
	m_bar.show_percentage = false
	m_bar.custom_minimum_size = Vector2(0, 12)
	m_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	m_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var m_sb = StyleBoxFlat.new()
	m_sb.bg_color = Color(0.18, 0.6, 0.35)
	m_sb.corner_radius_top_left = 6
	m_sb.corner_radius_top_right = 6
	m_sb.corner_radius_bottom_right = 6
	m_sb.corner_radius_bottom_left = 6
	m_bar.add_theme_stylebox_override("fill", m_sb)
	morale_hbox.add_child(m_bar)
	
	var m_val = Label.new()
	m_val.text = "%%%d" % worker.morale
	m_val.custom_minimum_size = Vector2(40, 0)
	m_val.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	m_val.add_theme_font_size_override("font_size", 11)
	morale_hbox.add_child(m_val)
	
	# Trust
	var trust_hbox = HBoxContainer.new()
	stats_box.add_child(trust_hbox)
	var t_title = Label.new()
	t_title.text = "Güven"
	t_title.custom_minimum_size = Vector2(60, 0)
	t_title.add_theme_font_size_override("font_size", 11)
	trust_hbox.add_child(t_title)
	
	var t_bar = ProgressBar.new()
	t_bar.value = worker.trust
	t_bar.max_value = 100
	t_bar.show_percentage = false
	t_bar.custom_minimum_size = Vector2(0, 12)
	t_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	t_bar.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var t_sb = StyleBoxFlat.new()
	t_sb.bg_color = Color(0.18, 0.44, 0.7)
	t_sb.corner_radius_top_left = 6
	t_sb.corner_radius_top_right = 6
	t_sb.corner_radius_bottom_right = 6
	t_sb.corner_radius_bottom_left = 6
	t_bar.add_theme_stylebox_override("fill", t_sb)
	trust_hbox.add_child(t_bar)
	
	var t_val = Label.new()
	t_val.text = "%%%d" % worker.trust
	t_val.custom_minimum_size = Vector2(40, 0)
	t_val.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	t_val.add_theme_font_size_override("font_size", 11)
	trust_hbox.add_child(t_val)
	
	# Biography / Backstory Card
	var bio_panel = PanelContainer.new()
	var bio_sb = StyleBoxFlat.new()
	bio_sb.bg_color = Color(0.14, 0.16, 0.2, 0.5)
	bio_sb.corner_radius_top_left = 10
	bio_sb.corner_radius_top_right = 10
	bio_sb.corner_radius_bottom_right = 10
	bio_sb.corner_radius_bottom_left = 10
	bio_sb.border_width_left = 1
	bio_sb.border_color = Color(0.24, 0.51, 0.81, 0.3)
	bio_panel.add_theme_stylebox_override("panel", bio_sb)
	detail_vbox.add_child(bio_panel)
	
	var bio_margin = MarginContainer.new()
	bio_margin.add_theme_constant_override("margin_left", 12)
	bio_margin.add_theme_constant_override("margin_right", 12)
	bio_margin.add_theme_constant_override("margin_top", 10)
	bio_margin.add_theme_constant_override("margin_bottom", 10)
	bio_panel.add_child(bio_margin)
	
	var bio_lbl = Label.new()
	var bio_text = worker.bg
	if bio_text.is_empty():
		bio_text = "Aslen %s'li olan bu ustamız, %s alanında uzmandır. Fabrikamızda %s kişiliğiyle tanınır. İşine sadık, gayretli ve tecrübeli bir çalışma arkadaşımızdır." % [worker.hometown, worker.skill, worker.personality_trait]
	if worker.event_description != "":
		bio_text += "\n\n📣 Güncel Durum: %s" % worker.event_description
	bio_lbl.text = bio_text
	bio_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	bio_lbl.add_theme_font_size_override("font_size", 11)
	bio_lbl.add_theme_color_override("font_color", Color(0.85, 0.87, 0.9))
	bio_margin.add_child(bio_lbl)
	
	# Active Question Alert & Action Button
	if not worker.active_question.is_empty():
		var q_panel = PanelContainer.new()
		var q_sb = StyleBoxFlat.new()
		q_sb.bg_color = Color(0.85, 0.35, 0.15, 0.15) # Translucent iOS Orange alert
		q_sb.border_width_left = 4
		q_sb.border_color = Color(0.85, 0.35, 0.15)
		q_sb.corner_radius_top_right = 8
		q_sb.corner_radius_bottom_right = 8
		q_panel.add_theme_stylebox_override("panel", q_sb)
		detail_vbox.add_child(q_panel)
		
		var q_margin = MarginContainer.new()
		q_margin.add_theme_constant_override("margin_left", 12)
		q_margin.add_theme_constant_override("margin_right", 12)
		q_margin.add_theme_constant_override("margin_top", 10)
		q_margin.add_theme_constant_override("margin_bottom", 10)
		q_panel.add_child(q_margin)
		
		var q_vbox = VBoxContainer.new()
		q_vbox.add_theme_constant_override("separation", 8)
		q_margin.add_child(q_vbox)
		
		var q_lbl = Label.new()
		q_lbl.text = "❓ Bu usta bir soru sormak istiyor:\n\"%s\"" % worker.active_question.get("text", "")
		q_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		q_lbl.add_theme_font_size_override("font_size", 11)
		q_lbl.add_theme_color_override("font_color", Color(0.95, 0.9, 0.85))
		q_vbox.add_child(q_lbl)
		
		var q_btn = Button.new()
		q_btn.text = "💬 Soruyu Cevapla"
		q_btn.custom_minimum_size = Vector2(0, 32)
		q_btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		var btn_sb = StyleBoxFlat.new()
		btn_sb.bg_color = Color(0.85, 0.35, 0.15)
		btn_sb.corner_radius_top_left = 6
		btn_sb.corner_radius_top_right = 6
		btn_sb.corner_radius_bottom_right = 6
		btn_sb.corner_radius_bottom_left = 6
		q_btn.add_theme_stylebox_override("normal", btn_sb)
		q_btn.add_theme_font_size_override("font_size", 11)
		q_btn.pressed.connect(func():
			var idx = GameManager.masters.find(worker)
			if idx != -1:
				EventBus.open_chat.emit(idx)
				SoundManager.play("notification")
		)
		q_vbox.add_child(q_btn)

func _get_status_turkish(status: String, has_question: bool) -> String:
	if has_question:
		return "❓ Soru Soruyor"
	match status:
		"idle": return "⏳ Boşta"
		"working": return "🔧 Çalışıyor"
		"slacking": return "☕ Mola/WC"
		"feud": return "🤬 Kavgalı"
		"leave": return "💤 İzinli"
		"sick": return "🤒 Refakatçi"
		"injured": return "🩹 Revirde"
		"injured_working": return "🤕 Sınırlı Hız"
		"offsite": return "🚚 Dış Görev"
		"distracted": return "👶 Uykusuz/Dağınık"
		"homecare": return "💖 Evde Bakım"
		"worried": return "😟 Endişeli"
		"training": return "📚 Seminer"
		_: return status

func _get_status_color(status: String) -> Color:
	match status:
		"working", "homecare": return Color(0.24, 0.81, 0.45)
		"slacking", "distracted", "worried", "injured_working": return Color(0.95, 0.77, 0.25)
		"anxious", "training": return Color(0.85, 0.35, 0.85)
		"feud": return Color(0.85, 0.15, 0.15)
		"leave", "sick", "injured", "offsite": return Color(0.5, 0.7, 0.9)
		_: return Color(0.65, 0.65, 0.65)
