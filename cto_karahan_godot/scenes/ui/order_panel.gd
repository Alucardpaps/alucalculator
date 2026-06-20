extends Panel

## OrderPanel UI Controller: Displays active orders in a split-view. List on the right, details/blueprints on the left.

@onready var list_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/ListContainer

var split_view: HBoxContainer
var left_col: PanelContainer
var right_col: VBoxContainer
var detail_vbox: VBoxContainer

var selected_order_id: String = ""

func _ready() -> void:
	# Restructure layout dynamically for Apple-style split view
	var main_vbox := $MarginContainer/VBoxContainer as VBoxContainer
	
	split_view = HBoxContainer.new()
	split_view.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split_view.add_theme_constant_override("separation", 20)
	main_vbox.add_child(split_view)
	
	# Left Detail Panel
	left_col = PanelContainer.new()
	left_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_col.size_flags_vertical = Control.SIZE_EXPAND_FILL
	
	var sb = StyleBoxFlat.new()
	sb.bg_color = Color(0.09, 0.11, 0.15, 0.8) # Translucent dark background
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
	left_col.add_theme_stylebox_override("panel", sb)
	split_view.add_child(left_col)
	
	var left_margin = MarginContainer.new()
	left_margin.add_theme_constant_override("margin_left", 20)
	left_margin.add_theme_constant_override("margin_right", 20)
	left_margin.add_theme_constant_override("margin_top", 20)
	left_margin.add_theme_constant_override("margin_bottom", 20)
	left_col.add_child(left_margin)
	
	detail_vbox = VBoxContainer.new()
	detail_vbox.add_theme_constant_override("separation", 14)
	left_margin.add_child(detail_vbox)
	
	# Right Column
	right_col = VBoxContainer.new()
	right_col.custom_minimum_size = Vector2(300, 0)
	right_col.size_flags_vertical = Control.SIZE_EXPAND_FILL
	split_view.add_child(right_col)
	
	# Reparent scroll container
	var scroll = main_vbox.get_node("ScrollContainer")
	scroll.reparent(right_col)
	
	EventBus.orders_updated.connect(refresh_list)
	refresh_list()

func refresh_list() -> void:
	# Store right scroll position
	var right_scroll = list_container.get_parent() as ScrollContainer
	var previous_right_scroll_v: int = 0
	if right_scroll:
		previous_right_scroll_v = right_scroll.scroll_vertical

	# Clear existing children
	for child in list_container.get_children():
		child.queue_free()
		
	if GameManager.orders.size() == 0:
		var empty_lbl = Label.new()
		empty_lbl.text = "Gelen sipariş bulunmamaktadır."
		empty_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		empty_lbl.size_flags_vertical = Control.SIZE_EXPAND_FILL
		empty_lbl.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		list_container.add_child(empty_lbl)
		# Clear details
		update_detail_view({})
		return
		
	# Find currently selected order
	var selected_order = {}
	var current_exists = false
	for o in GameManager.orders:
		if o["id"] == selected_order_id:
			selected_order = o
			current_exists = true
			break
			
	if not current_exists:
		selected_order = GameManager.orders[0]
		selected_order_id = selected_order["id"]
		
	# Rebuild right list
	for order in GameManager.orders:
		var card = PanelContainer.new()
		card.custom_minimum_size = Vector2(0, 72)
		
		# Set card style
		var sb = StyleBoxFlat.new()
		if order["id"] == selected_order_id:
			sb.bg_color = Color(0.18, 0.22, 0.3, 0.95) # Glowing blue active state
			sb.border_width_left = 6
		else:
			sb.bg_color = Color(0.11, 0.13, 0.17, 0.8) # Apple flat slate card
			sb.border_width_left = 4
			
		var is_rnd = not order.get("designed", false)
		if is_rnd:
			sb.border_color = Color(0.5, 0.7, 0.9) # Light Blue
		elif order["due"] <= 1:
			sb.border_color = Color(0.9, 0.2, 0.2) # Urgent Red
		else:
			sb.border_color = Color(0.95, 0.77, 0.25) # Yellow/Orange
			
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
		
		# First Line: ID & Reward
		var line1 = HBoxContainer.new()
		vbox.add_child(line1)
		
		var id_lbl = Label.new()
		id_lbl.text = order["id"]
		if is_rnd:
			id_lbl.text += " (📐 Ar-Ge)"
		id_lbl.add_theme_font_size_override("font_size", 13)
		id_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
		line1.add_child(id_lbl)
		
		var spacer = Control.new()
		spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		line1.add_child(spacer)
		
		var reward_lbl = Label.new()
		reward_lbl.text = "+%s ₺" % _format_money(order["reward"])
		reward_lbl.add_theme_font_size_override("font_size", 12)
		reward_lbl.add_theme_color_override("font_color", Color(0.24, 0.81, 0.45))
		line1.add_child(reward_lbl)
		
		# Second Line: Due Date
		var due_lbl = Label.new()
		if is_rnd:
			due_lbl.text = "⏱️ Ar-Ge Kalan: %d Gün" % order.get("rnd_days", 1)
			due_lbl.add_theme_color_override("font_color", Color(0.5, 0.7, 0.9))
		else:
			due_lbl.text = "⏱️ Kalan Süre: %d Gün" % order["due"]
			if order["due"] <= 1:
				due_lbl.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2))
			else:
				due_lbl.add_theme_color_override("font_color", Color(0.95, 0.77, 0.25))
		due_lbl.add_theme_font_size_override("font_size", 10)
		vbox.add_child(due_lbl)
		
		# Click overlay button to select order
		var button = TextureButton.new()
		button.set_anchors_preset(Control.PRESET_FULL_RECT)
		button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		button.pressed.connect(func():
			selected_order_id = order["id"]
			refresh_list()
			SoundManager.play("notification")
		)
		card.add_child(button)
		
		list_container.add_child(card)
		
	# Update left detail view
	update_detail_view(selected_order)
	
	# Restore right scroll position deferred
	if right_scroll and previous_right_scroll_v > 0:
		(func(): if is_instance_valid(right_scroll): right_scroll.scroll_vertical = previous_right_scroll_v).call_deferred()

func update_detail_view(order: Dictionary) -> void:
	# Store blueprint scroll position
	var previous_scroll_v: int = 0
	for child in detail_vbox.get_children():
		if child is ScrollContainer:
			previous_scroll_v = child.scroll_vertical
			break
			
	# Clear details
	for child in detail_vbox.get_children():
		child.queue_free()
		
	if order.is_empty():
		var placeholder = Label.new()
		placeholder.text = "Detayları görmek için sağdan bir sipariş seçin."
		placeholder.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		placeholder.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		placeholder.size_flags_vertical = Control.SIZE_EXPAND_FILL
		placeholder.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		detail_vbox.add_child(placeholder)
		return
		
	# Title & Reward Row
	var title_hbox = HBoxContainer.new()
	detail_vbox.add_child(title_hbox)
	
	var title_lbl = Label.new()
	title_lbl.text = "📋 %s" % order["id"]
	if not order.get("designed", false):
		title_lbl.text += " (📐 Ar-Ge Aşamasında)"
	title_lbl.add_theme_font_size_override("font_size", 18)
	title_lbl.add_theme_color_override("font_color", Color.WHITE)
	title_hbox.add_child(title_lbl)
	
	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_hbox.add_child(spacer)
	
	var reward_lbl = Label.new()
	reward_lbl.text = "+%s ₺" % _format_money(order["reward"])
	reward_lbl.add_theme_font_size_override("font_size", 16)
	reward_lbl.add_theme_color_override("font_color", Color(0.24, 0.81, 0.45))
	title_hbox.add_child(reward_lbl)
	
	# Description and Story
	var desc_lbl = Label.new()
	desc_lbl.text = order["desc"]
	desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
	desc_lbl.add_theme_font_size_override("font_size", 12)
	desc_lbl.add_theme_color_override("font_color", Color(0.85, 0.87, 0.9))
	detail_vbox.add_child(desc_lbl)
	
	if order.get("story", "") != "":
		var story_panel = PanelContainer.new()
		var story_sb = StyleBoxFlat.new()
		story_sb.bg_color = Color(0.14, 0.16, 0.2, 0.5)
		story_sb.corner_radius_top_left = 8
		story_sb.corner_radius_top_right = 8
		story_sb.corner_radius_bottom_right = 8
		story_sb.corner_radius_bottom_left = 8
		story_sb.border_width_left = 1
		story_sb.border_color = Color(0.917, 0.722, 0.227, 0.3)
		story_panel.add_theme_stylebox_override("panel", story_sb)
		detail_vbox.add_child(story_panel)
		
		var story_margin = MarginContainer.new()
		story_margin.add_theme_constant_override("margin_left", 10)
		story_margin.add_theme_constant_override("margin_right", 10)
		story_margin.add_theme_constant_override("margin_top", 8)
		story_margin.add_theme_constant_override("margin_bottom", 8)
		story_panel.add_child(story_margin)
		
		var story_lbl = Label.new()
		story_lbl.text = "📖 %s" % order["story"]
		story_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		story_lbl.add_theme_font_size_override("font_size", 10)
		story_lbl.add_theme_color_override("font_color", Color(0.65, 0.7, 0.8))
		story_margin.add_child(story_lbl)
		
	# Status Pill Row
	var status_hbox = HBoxContainer.new()
	status_hbox.add_theme_constant_override("separation", 10)
	detail_vbox.add_child(status_hbox)
	
	var time_pill = PanelContainer.new()
	var time_sb = StyleBoxFlat.new()
	var time_color = Color(0.9, 0.2, 0.2) if order["due"] <= 1 else Color(0.95, 0.77, 0.25) if order.get("designed", false) else Color(0.5, 0.7, 0.9)
	time_sb.bg_color = time_color
	time_sb.bg_color.a = 0.25
	time_sb.border_width_left = 1
	time_sb.border_width_top = 1
	time_sb.border_width_right = 1
	time_sb.border_width_bottom = 1
	time_sb.border_color = time_color
	time_sb.corner_radius_top_left = 12
	time_sb.corner_radius_top_right = 12
	time_sb.corner_radius_bottom_right = 12
	time_sb.corner_radius_bottom_left = 12
	time_pill.add_theme_stylebox_override("panel", time_sb)
	status_hbox.add_child(time_pill)
	
	var time_margin = MarginContainer.new()
	time_margin.add_theme_constant_override("margin_left", 10)
	time_margin.add_theme_constant_override("margin_right", 10)
	time_margin.add_theme_constant_override("margin_top", 4)
	time_margin.add_theme_constant_override("margin_bottom", 4)
	time_pill.add_child(time_margin)
	
	var time_lbl = Label.new()
	if order.get("designed", false):
		time_lbl.text = "⏱️ Kalan Süre: %d Gün" % order["due"]
	else:
		time_lbl.text = "📐 Ar-Ge Kalan Süre: %d Gün" % order.get("rnd_days", 1)
	time_lbl.add_theme_font_size_override("font_size", 11)
	time_lbl.add_theme_color_override("font_color", time_color)
	time_margin.add_child(time_lbl)
	
	# Blueprints Detail Container
	if order.get("designed", false):
		var bp_title_lbl = Label.new()
		bp_title_lbl.text = "📐 ÜRETİM AŞAMALARI"
		bp_title_lbl.add_theme_font_size_override("font_size", 12)
		bp_title_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.76))
		detail_vbox.add_child(bp_title_lbl)
		
		# Blueprints scroll container
		var bp_scroll = ScrollContainer.new()
		bp_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
		bp_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		detail_vbox.add_child(bp_scroll)
		
		var bp_vbox = VBoxContainer.new()
		bp_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		bp_vbox.add_theme_constant_override("separation", 10)
		bp_scroll.add_child(bp_vbox)
		
		for bp in order["blueprints"]:
			var bp_card = PanelContainer.new()
			var bp_card_style = StyleBoxFlat.new()
			bp_card_style.bg_color = Color(0.12, 0.14, 0.18, 0.6)
			bp_card_style.corner_radius_top_left = 10
			bp_card_style.corner_radius_top_right = 10
			bp_card_style.corner_radius_bottom_right = 10
			bp_card_style.corner_radius_bottom_left = 10
			bp_card_style.border_width_left = 4
			
			if bp.get("done", false):
				bp_card_style.border_color = Color(0.24, 0.81, 0.45) # Green
			elif bp.get("faulty", false):
				bp_card_style.border_color = Color(0.9, 0.2, 0.2) # Red
			else:
				bp_card_style.border_color = Color(0.24, 0.51, 0.81) # Blue
				
			bp_card.add_theme_stylebox_override("panel", bp_card_style)
			bp_vbox.add_child(bp_card)
			
			var bp_margin = MarginContainer.new()
			bp_margin.add_theme_constant_override("margin_left", 12)
			bp_margin.add_theme_constant_override("margin_right", 12)
			bp_margin.add_theme_constant_override("margin_top", 8)
			bp_margin.add_theme_constant_override("margin_bottom", 8)
			bp_card.add_child(bp_margin)
			
			var bp_content = VBoxContainer.new()
			bp_content.add_theme_constant_override("separation", 4)
			bp_margin.add_child(bp_content)
			
			# Header Row (BP Name & Status)
			var bp_header = HBoxContainer.new()
			bp_content.add_child(bp_header)
			
			var bp_name_lbl = Label.new()
			bp_name_lbl.text = bp["name"]
			bp_name_lbl.add_theme_font_size_override("font_size", 12)
			bp_name_lbl.add_theme_color_override("font_color", Color.WHITE)
			bp_header.add_child(bp_name_lbl)
			
			var bp_spacer = Control.new()
			bp_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			bp_header.add_child(bp_spacer)
			
			var bp_status_lbl = Label.new()
			if bp.get("done", false):
				bp_status_lbl.text = "✅ Tamamlandı"
				bp_status_lbl.add_theme_color_override("font_color", Color(0.24, 0.81, 0.45))
			elif bp.get("faulty", false):
				bp_status_lbl.text = "⚠️ Hatalı!"
				bp_status_lbl.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2))
			else:
				bp_status_lbl.text = "🔧 Üretimde"
				bp_status_lbl.add_theme_color_override("font_color", Color(0.24, 0.51, 0.81))
			bp_status_lbl.add_theme_font_size_override("font_size", 10)
			bp_header.add_child(bp_status_lbl)
			
			# Progress Bar & Stage Info
			if bp.get("done", false):
				var done_desc = Label.new()
				done_desc.text = "Bu bileşenin üretimi başarıyla tamamlandı."
				done_desc.add_theme_font_size_override("font_size", 11)
				done_desc.add_theme_color_override("font_color", Color(0.55, 0.58, 0.65))
				bp_content.add_child(done_desc)
			else:
				# Dependency check
				var is_bp_ready = true
				var missing_dep = ""
				for dep in bp.get("dependencies", []):
					var dep_bp = null
					for b in order["blueprints"]:
						if b["name"] == dep:
							dep_bp = b
							break
					if not dep_bp or not dep_bp.get("done", false):
						is_bp_ready = false
						missing_dep = dep
						break
						
				if not is_bp_ready:
					var dep_desc = Label.new()
					dep_desc.text = "⏳ Ön koşul bekleniyor: %s" % missing_dep
					dep_desc.add_theme_font_size_override("font_size", 11)
					dep_desc.add_theme_color_override("font_color", Color(0.4, 0.6, 0.8))
					bp_content.add_child(dep_desc)
				else:
					var stages = bp["stages"]
					var current_stage_idx = bp["stage"]
					var req_skill = stages[current_stage_idx]
					
					var stage_lbl = Label.new()
					stage_lbl.text = "Aşama: %s (%s)" % [req_skill, _get_stage_dots(stages, current_stage_idx)]
					stage_lbl.add_theme_font_size_override("font_size", 11)
					stage_lbl.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
					bp_content.add_child(stage_lbl)
					
					var p_bar = ProgressBar.new()
					p_bar.value = bp["progress"]
					p_bar.min_value = 0
					p_bar.max_value = bp.get("target_progress", 100)
					p_bar.custom_minimum_size = Vector2(0, 10)
					p_bar.show_percentage = true
					p_bar.add_theme_font_size_override("font_size", 8)
					var p_sb = StyleBoxFlat.new()
					p_sb.bg_color = Color(0.24, 0.51, 0.81)
					p_sb.corner_radius_top_left = 4
					p_sb.corner_radius_top_right = 4
					p_sb.corner_radius_bottom_right = 4
					p_sb.corner_radius_bottom_left = 4
					p_bar.add_theme_stylebox_override("fill", p_sb)
					bp_content.add_child(p_bar)
					
					# Workers
					var workers_lbl = Label.new()
					var assigned_workers = bp.get("workers", [])
					var need = bp.get("need", 1)
					
					if assigned_workers.size() > 0:
						workers_lbl.text = "Çalışanlar: " + ", ".join(assigned_workers) + " (%d/%d)" % [assigned_workers.size(), need]
						workers_lbl.add_theme_color_override("font_color", Color(0.24, 0.81, 0.45))
					else:
						workers_lbl.text = "Çalışan yok (%d usta gerekli)" % need
						workers_lbl.add_theme_color_override("font_color", Color(0.9, 0.4, 0.4))
					workers_lbl.add_theme_font_size_override("font_size", 10)
					bp_content.add_child(workers_lbl)
					
					# Assign worker Button
					if assigned_workers.size() < need:
						var assign_btn = Button.new()
						assign_btn.text = "👤 Usta Ata (%d/%d)" % [assigned_workers.size(), need]
						assign_btn.custom_minimum_size = Vector2(0, 28)
						assign_btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
						
						var btn_sb = StyleBoxFlat.new()
						btn_sb.bg_color = Color(0.18, 0.44, 0.7)
						btn_sb.corner_radius_top_left = 6
						btn_sb.corner_radius_top_right = 6
						btn_sb.corner_radius_bottom_right = 6
						btn_sb.corner_radius_bottom_left = 6
						assign_btn.add_theme_stylebox_override("normal", btn_sb)
						assign_btn.add_theme_font_size_override("font_size", 11)
						
						assign_btn.pressed.connect(func():
							EventBus.open_assign_modal.emit(order["id"], bp["name"])
							SoundManager.play("notification")
						)
						bp_content.add_child(assign_btn)
		
		# Restore blueprints scroll position deferred
		if previous_scroll_v > 0:
			(func(): if is_instance_valid(bp_scroll): bp_scroll.scroll_vertical = previous_scroll_v).call_deferred()
	else:
		# R&D Info
		var rnd_panel = PanelContainer.new()
		var rnd_sb = StyleBoxFlat.new()
		rnd_sb.bg_color = Color(0.14, 0.16, 0.2, 0.5)
		rnd_sb.corner_radius_top_left = 10
		rnd_sb.corner_radius_top_right = 10
		rnd_sb.corner_radius_bottom_right = 10
		rnd_sb.corner_radius_bottom_left = 10
		rnd_sb.border_width_left = 1
		rnd_sb.border_color = Color(0.5, 0.7, 0.9, 0.3)
		rnd_panel.add_theme_stylebox_override("panel", rnd_sb)
		detail_vbox.add_child(rnd_panel)
		
		var rnd_margin = MarginContainer.new()
		rnd_margin.add_theme_constant_override("margin_left", 12)
		rnd_margin.add_theme_constant_override("margin_right", 12)
		rnd_margin.add_theme_constant_override("margin_top", 10)
		rnd_margin.add_theme_constant_override("margin_bottom", 10)
		rnd_panel.add_child(rnd_margin)
		
		var rnd_lbl = Label.new()
		rnd_lbl.text = "📐 Ar-Ge Süreci: Mühendislerimiz ve tasarım ekibimiz bu siparişin teknik çizimleri ve üretim reçeteleri (blueprints) üzerinde çalışmaktadır. Tasarım tamamlandığında üretim bileşenleri burada aktifleşecektir."
		rnd_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		rnd_lbl.add_theme_font_size_override("font_size", 11)
		rnd_lbl.add_theme_color_override("font_color", Color(0.8, 0.85, 0.9))
		rnd_margin.add_child(rnd_lbl)

func _get_stage_dots(stages: Array, current: int) -> String:
	var s = ""
	for i in range(stages.size()):
		if i == current:
			s += "●"
		else:
			s += "○"
	return s

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
