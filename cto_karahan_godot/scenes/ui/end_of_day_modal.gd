extends Panel

## EndOfDayModal: Displays score summary, home status, and home upgrades list.

var personal_balance_label: Label
var score_label: Label
var stats_text_label: Label
var upgrades_container: VBoxContainer
var sleep_button: Button
var narrative_text: Label
var current_summary: Dictionary = {}

func _ready() -> void:
	# 1. Connect global signal
	EventBus.connect("show_end_of_day_summary", _on_show_summary)
	
	# 2. Styling the full screen background Panel
	var bg_style = StyleBoxFlat.new()
	bg_style.bg_color = Color(0.03, 0.04, 0.06, 0.96) # Dark glossy glass
	bg_style.border_width_left = 6
	bg_style.border_width_right = 6
	bg_style.border_color = Color(0.95, 0.77, 0.25, 0.5) # Amber/Gold accent borders
	add_theme_stylebox_override("panel", bg_style)
	
	# 3. Create Main split layout container
	var margin_container = MarginContainer.new()
	margin_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin_container.add_theme_constant_override("margin_left", 60)
	margin_container.add_theme_constant_override("margin_top", 40)
	margin_container.add_theme_constant_override("margin_right", 60)
	margin_container.add_theme_constant_override("margin_bottom", 40)
	add_child(margin_container)
	
	var main_hbox = HBoxContainer.new()
	main_hbox.add_theme_constant_override("separation", 50)
	margin_container.add_child(main_hbox)
	
	# ─── LEFT COLUMN: Scorecard, Narrative, Sleep Button ───
	var left_col = VBoxContainer.new()
	left_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_col.size_flags_stretch_ratio = 1.1
	left_col.add_theme_constant_override("separation", 20)
	main_hbox.add_child(left_col)
	
	# Title
	var left_title = Label.new()
	left_title.text = "🌙 GÜN SONU PUAN VE RAPORU"
	left_title.add_theme_font_size_override("font_size", 22)
	left_title.add_theme_color_override("font_color", Color(0.95, 0.77, 0.25)) # Amber Gold
	left_col.add_child(left_title)
	
	# Score Card Frame
	var score_panel = PanelContainer.new()
	var sp_style = StyleBoxFlat.new()
	sp_style.bg_color = Color(0.08, 0.1, 0.14, 0.9)
	sp_style.corner_radius_top_left = 10
	sp_style.corner_radius_top_right = 10
	sp_style.corner_radius_bottom_right = 10
	sp_style.corner_radius_bottom_left = 10
	sp_style.border_width_left = 2
	sp_style.border_color = Color(0.24, 0.51, 0.81, 0.4)
	score_panel.add_theme_stylebox_override("panel", sp_style)
	left_col.add_child(score_panel)
	
	var score_margin = MarginContainer.new()
	score_margin.add_theme_constant_override("margin_left", 20)
	score_margin.add_theme_constant_override("margin_top", 15)
	score_margin.add_theme_constant_override("margin_right", 20)
	score_margin.add_theme_constant_override("margin_bottom", 15)
	score_panel.add_child(score_margin)
	
	var score_vbox = VBoxContainer.new()
	score_vbox.add_theme_constant_override("separation", 8)
	score_margin.add_child(score_vbox)
	
	stats_text_label = Label.new()
	stats_text_label.add_theme_font_size_override("font_size", 12)
	stats_text_label.add_theme_color_override("font_color", Color(0.8, 0.82, 0.88))
	score_vbox.add_child(stats_text_label)
	
	score_label = Label.new()
	score_label.add_theme_font_size_override("font_size", 18)
	score_label.add_theme_color_override("font_color", Color(0.24, 0.81, 0.45))
	score_vbox.add_child(score_label)
	
	# Narrative
	var narrative_panel = PanelContainer.new()
	var np_style = StyleBoxFlat.new()
	np_style.bg_color = Color(0.05, 0.06, 0.08, 0.7)
	np_style.content_margin_left = 15
	np_style.content_margin_top = 10
	np_style.content_margin_right = 15
	np_style.content_margin_bottom = 10
	narrative_panel.add_theme_stylebox_override("panel", np_style)
	left_col.add_child(narrative_panel)
	
	narrative_text = Label.new()
	narrative_text.autowrap_mode = TextServer.AUTOWRAP_WORD
	narrative_text.add_theme_font_size_override("font_size", 12)
	narrative_text.add_theme_color_override("font_color", Color(0.65, 0.68, 0.75))
	narrative_panel.add_child(narrative_text)
	
	# Sleep button
	sleep_button = Button.new()
	sleep_button.text = "🏠 Günü Sonlandır ve Eve Git"
	sleep_button.custom_minimum_size = Vector2(0, 48)
	sleep_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	sleep_button.add_theme_font_size_override("font_size", 14)
	
	var btn_style = StyleBoxFlat.new()
	btn_style.bg_color = Color(0.18, 0.6, 0.35)
	btn_style.corner_radius_top_left = 8
	btn_style.corner_radius_top_right = 8
	btn_style.corner_radius_bottom_right = 8
	btn_style.corner_radius_bottom_left = 8
	sleep_button.add_theme_stylebox_override("normal", btn_style)
	
	var btn_hover = StyleBoxFlat.new()
	btn_hover.bg_color = Color(0.24, 0.7, 0.42)
	btn_hover.corner_radius_top_left = 8
	btn_hover.corner_radius_top_right = 8
	btn_hover.corner_radius_bottom_right = 8
	btn_hover.corner_radius_bottom_left = 8
	sleep_button.add_theme_stylebox_override("hover", btn_hover)
	
	sleep_button.pressed.connect(_on_sleep_pressed)
	left_col.add_child(sleep_button)
	
	# ─── RIGHT COLUMN: Home Upgrades & Balance ───
	var right_col = VBoxContainer.new()
	right_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_col.size_flags_stretch_ratio = 0.9
	right_col.add_theme_constant_override("separation", 15)
	main_hbox.add_child(right_col)
	
	# Title
	var right_title = Label.new()
	right_title.text = "🏠 EV GELİŞTİRME PANELİ"
	right_title.add_theme_font_size_override("font_size", 20)
	right_title.add_theme_color_override("font_color", Color(0.95, 0.77, 0.25))
	right_col.add_child(right_title)
	
	# Balance display
	personal_balance_label = Label.new()
	personal_balance_label.add_theme_font_size_override("font_size", 15)
	personal_balance_label.add_theme_color_override("font_color", Color(0.24, 0.81, 0.45))
	right_col.add_child(personal_balance_label)
	
	# Upgrades scroll list
	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right_col.add_child(scroll)
	
	upgrades_container = VBoxContainer.new()
	upgrades_container.add_theme_constant_override("separation", 10)
	scroll.add_child(upgrades_container)
	
	visible = false

func _on_show_summary(summary_data: Dictionary) -> void:
	current_summary = summary_data
	
	# Update scorecard labels
	stats_text_label.text = "Tamamlanan Siparişler: %d\nÖdenen Usta Yevmiyeleri: -%d ₺\nGecikme Cezaları: -%d ₺" % [
		summary_data["orders_completed"],
		summary_data["wages"],
		summary_data["overdue_penalty"]
	]
	
	var limit_change_str = ""
	if summary_data.has("max_orders_limit"):
		var perf_str = " (+1 Performans Artışı)" if summary_data.get("performance_good", false) else " (-1 Performans Düşüşü)"
		limit_change_str = "\n📋 Aktif Sipariş Limiti: %d%s" % [summary_data["max_orders_limit"], perf_str]

	score_label.text = "🏆 Günlük Performans Skoru: %d Puan\n💰 Kişisel Kazanç: +%d ₺%s" % [
		summary_data["daily_score"],
		summary_data["personal_earned"],
		limit_change_str
	]
	
	personal_balance_label.text = "💵 Kişisel Bakiye: %d ₺" % summary_data["personal_balance"]
	
	# Construct a nice flavor text narrative based on active upgrades
	var upgrades_owned = 0
	for key in summary_data["home_upgrades"].keys():
		if summary_data["home_upgrades"][key]:
			upgrades_owned += 1
			
	var home_flavor = ""
	if upgrades_owned == 0:
		home_flavor = "Evin şu an oldukça boş ve soğuk. Sadece eski bir yatak ve yıpranmış mobilyalar var."
	elif upgrades_owned < 3:
		home_flavor = "Evin yavaş yavaş şekilleniyor. Satın aldığın konfor ögeleri iş stresini azaltmana yardımcı oluyor."
	else:
		home_flavor = "Lüks ve konforlu bir yuvaya sahipsin! Sanayinin gürültüsünden sonra burası adeta bir cennet."
		
	narrative_text.text = "Yorucu bir mesainin ardından fabrikanın şalterlerini kapatıp evine döndün.\n\n%s\n\nKişisel birikimlerini evini modernize etmek için harcayabilirsin. Hazır olduğunda yatağına uzanıp uyuyarak yeni günü başlatabilirsin." % home_flavor
	
	refresh_upgrades_list()
	visible = true

func refresh_upgrades_list() -> void:
	# Clear list
	for child in upgrades_container.get_children():
		child.queue_free()
		
	var upgrades_data = [
		{"key": "bed", "name": "🛏️ Rahat Yatak", "cost": 1000, "desc": "Her sabah tüm ustalara kalıcı +5 Güven bonusu verir."},
		{"key": "tv", "name": "📺 Akıllı TV", "cost": 2000, "desc": "Her sabah tüm ustalara kalıcı +5 Moral bonusu verir."},
		{"key": "coffee", "name": "☕ Ev Espresso Makinesi", "cost": 3000, "desc": "Her sabah başlangıç itibarını +5 artırır."},
		{"key": "kitchen", "name": "🍳 Modern Mutfak", "cost": 5000, "desc": "Her sabah başlangıçta patron güvenini +1 artırır."},
		{"key": "pc", "name": "🎮 Hobi Bilgisayarı (RTX)", "cost": 8000, "desc": "Maksimum itibar limitini kalıcı olarak +10 artırır."},
		# Vehicles Dealership
		{"key": "red_hatchback", "name": "🚗 Hızlı Hatchback (Kırmızı)", "cost": 4000, "desc": "Kompakt araç. 16 m/s azami sürüş hızı.", "is_vehicle": true},
		{"key": "yellow_suv", "name": "🚙 Heybetli SUV (Sarı)", "cost": 8000, "desc": "Geniş ve yüksek şasi. 24 m/s azami sürüş hızı.", "is_vehicle": true},
		{"key": "black_sport", "name": "🏎️ Spor Araba (Siyah)", "cost": 15000, "desc": "Yere yakın yarış arabası. 32 m/s azami hız!", "is_vehicle": true}
	]
	
	for item in upgrades_data:
		var key = item["key"]
		var cost = item["cost"]
		var item_name = item["name"]
		var desc = item["desc"]
		var is_v = item.get("is_vehicle", false)
		
		var card = PanelContainer.new()
		card.custom_minimum_size = Vector2(0, 70)
		
		var sb = StyleBoxFlat.new()
		sb.bg_color = Color(0.12, 0.15, 0.20, 0.8)
		sb.border_width_left = 4
		
		var owned = GameManager.personal_vehicles.get(key, false) if is_v else GameManager.home_upgrades.get(key, false)
		if owned:
			sb.border_color = Color(0.24, 0.81, 0.45) # Green if owned
		else:
			sb.border_color = Color(0.4, 0.4, 0.4)
			
		card.add_theme_stylebox_override("panel", sb)
		upgrades_container.add_child(card)
		
		var margin = MarginContainer.new()
		margin.add_theme_constant_override("margin_left", 12)
		margin.add_theme_constant_override("margin_right", 12)
		card.add_child(margin)
		
		var hbox = HBoxContainer.new()
		margin.add_child(hbox)
		
		# Info VBox
		var info_vbox = VBoxContainer.new()
		info_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info_vbox.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		hbox.add_child(info_vbox)
		
		var name_lbl = Label.new()
		name_lbl.text = item_name + (" (Satın Alındı)" if owned else " - %d ₺" % cost)
		name_lbl.add_theme_font_size_override("font_size", 13)
		name_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
		info_vbox.add_child(name_lbl)
		
		var desc_lbl = Label.new()
		desc_lbl.text = desc
		desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc_lbl.add_theme_font_size_override("font_size", 10)
		desc_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.75))
		info_vbox.add_child(desc_lbl)
		
		# Buy Button
		if not owned:
			var buy_btn = Button.new()
			buy_btn.text = "Satın Al"
			buy_btn.custom_minimum_size = Vector2(80, 28)
			buy_btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			buy_btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
			buy_btn.add_theme_font_size_override("font_size", 11)
			
			var can_afford = current_summary["personal_balance"] >= cost
			var buy_style = StyleBoxFlat.new()
			if can_afford:
				buy_style.bg_color = Color(0.18, 0.6, 0.35)
				buy_btn.add_theme_stylebox_override("normal", buy_style)
				buy_btn.pressed.connect(func():
					var success = false
					if is_v:
						success = GameManager.buy_personal_vehicle(key, cost)
					else:
						success = GameManager.buy_home_upgrade(key, cost)
						
					if success:
						# Deduct locally for UI update
						current_summary["personal_balance"] -= cost
						personal_balance_label.text = "💵 Kişisel Bakiye: %d ₺" % current_summary["personal_balance"]
						# Update 3D visuals instantly
						var game_node = get_node_or_null("/root/Game")
						if game_node:
							if is_instance_valid(game_node.factory_3d):
								if is_instance_valid(game_node.factory_3d.home_3d_node):
									game_node.factory_3d.home_3d_node.update_furnishing()
								game_node.factory_3d.rebuild_personal_vehicles()
						refresh_upgrades_list()
				)
			else:
				buy_style.bg_color = Color(0.3, 0.3, 0.3)
				buy_btn.add_theme_stylebox_override("normal", buy_style)
				buy_btn.disabled = true
				buy_btn.add_theme_color_override("font_disabled_color", Color(0.5, 0.5, 0.5))
				
			hbox.add_child(buy_btn)

func _on_sleep_pressed() -> void:
	SoundManager.play("day_end")
	visible = false
	EventBus.emit_signal("go_to_home")
