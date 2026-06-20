extends Panel

## ChatModal UI Controller: Manages interactive RPG split-dialogs in 3D walkthrough mode.

@onready var name_label: Label = $MarginContainer/VBoxContainer/HeaderContainer/NameLabel
@onready var bg_label: RichTextLabel = $MarginContainer/VBoxContainer/BioContainer/BgLabel
@onready var stats_label: Label = $MarginContainer/VBoxContainer/StatsContainer/StatsLabel
@onready var question_container: VBoxContainer = $MarginContainer/VBoxContainer/QuestionContainer
@onready var question_body: Label = $MarginContainer/VBoxContainer/QuestionContainer/QuestionBody
@onready var options_list: VBoxContainer = $MarginContainer/VBoxContainer/QuestionContainer/OptionsList
@onready var action_buttons_container: HBoxContainer = $MarginContainer/VBoxContainer/ActionButtonsContainer
@onready var prim_button: Button = $MarginContainer/VBoxContainer/ActionButtonsContainer/PrimButton
@onready var warn_button: Button = $MarginContainer/VBoxContainer/ActionButtonsContainer/WarnButton
@onready var fire_button: Button = $MarginContainer/VBoxContainer/ActionButtonsContainer/FireButton
@onready var close_button: Button = $MarginContainer/VBoxContainer/CloseButton

var current_worker: Worker = null
var right_col: VBoxContainer

func _ready() -> void:
	EventBus.open_chat.connect(_on_open_chat)
	
	# Reposition and style ChatModal to be a bottom-center dialogue bar (Skyrim RPG style)
	custom_minimum_size = Vector2(0, 180)
	set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	offset_left = 0.0
	offset_right = 0.0
	offset_top = -180.0
	offset_bottom = 0.0
	
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.04, 0.05, 0.08, 0.90) # Glossy dark glass
	panel_style.border_width_top = 2
	panel_style.border_color = Color(0.24, 0.51, 0.81, 0.6) # Neon blue top border
	panel_style.corner_radius_top_left = 16
	panel_style.corner_radius_top_right = 16
	panel_style.shadow_color = Color(0, 0, 0, 0.6)
	panel_style.shadow_size = 12
	add_theme_stylebox_override("panel", panel_style)
	
	# Restructure layout into Left/Right Columns for immersive Skyrim Split Dialogue View
	var margin_container: MarginContainer = $MarginContainer
	margin_container.add_theme_constant_override("margin_left", 48)
	margin_container.add_theme_constant_override("margin_right", 48)
	margin_container.add_theme_constant_override("margin_top", 18)
	margin_container.add_theme_constant_override("margin_bottom", 18)
	
	# Hide old VBoxContainer
	var old_vbox = $MarginContainer/VBoxContainer
	old_vbox.visible = false
	
	# Create new split container layout
	var split_container = HBoxContainer.new()
	split_container.name = "SplitContainer"
	split_container.add_theme_constant_override("separation", 60)
	margin_container.add_child(split_container)
	
	# Left Column (Speaker Name, stats, spoken lines)
	var left_col = VBoxContainer.new()
	left_col.name = "LeftCol"
	left_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_col.size_flags_stretch_ratio = 1.3
	left_col.add_theme_constant_override("separation", 8)
	split_container.add_child(left_col)
	
	# Reparent labels
	name_label.reparent(left_col)
	name_label.add_theme_font_size_override("font_size", 16)
	name_label.add_theme_color_override("font_color", Color(0.24, 0.82, 0.93)) # Neon cyan name
	
	stats_label.reparent(left_col)
	stats_label.add_theme_font_size_override("font_size", 11)
	stats_label.add_theme_color_override("font_color", Color(0.65, 0.7, 0.8))
	
	bg_label.reparent(left_col)
	bg_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	bg_label.add_theme_font_size_override("normal_font_size", 13)
	bg_label.bbcode_enabled = true
	
	question_body.reparent(left_col)
	question_body.add_theme_font_size_override("font_size", 13)
	question_body.autowrap_mode = TextServer.AUTOWRAP_WORD
	
	# Right Column (Dialogue choices stack)
	right_col = VBoxContainer.new()
	right_col.name = "RightCol"
	right_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right_col.size_flags_stretch_ratio = 0.7
	right_col.alignment = BoxContainer.ALIGNMENT_CENTER
	right_col.add_theme_constant_override("separation", 6)
	split_container.add_child(right_col)
	
	visible = false

func _on_open_chat(worker_idx: int) -> void:
	if worker_idx < 0 or worker_idx >= GameManager.masters.size():
		return
		
	current_worker = GameManager.masters[worker_idx]
	if not is_instance_valid(current_worker):
		return
		
	# Pause game tick while reading/answering questions
	GameManager.set_paused(true)
	
	refresh_dialog()
	visible = true

func refresh_dialog() -> void:
	if not is_instance_valid(current_worker):
		_on_close_pressed()
		return
		
	name_label.text = "👷 %s (%s)" % [current_worker.worker_name, current_worker.hometown]
	
	# Clean Stats Block
	stats_label.text = "🎯 Branş: %s  |  🌟 Özellik: %s  |  😊 Moral: %% %d  |  🤝 Güven: %% %d  |  ⚠️ Uyarı: %d/3" % [
		current_worker.skill,
		current_worker.personality_trait,
		current_worker.morale,
		current_worker.trust,
		current_worker.warnings
	]
	
	# Clear choices list
	for child in right_col.get_children():
		child.queue_free()
		
	# Check if worker has an active question
	if not current_worker.active_question.is_empty():
		question_body.visible = true
		bg_label.visible = false
		
		var q = current_worker.active_question
		question_body.text = q["body"]
		
		# Generate Skyrim-style answer buttons in the right column
		for act in q["actions"]:
			var choice_btn = _create_dialogue_choice(act["label"], func():
				SoundManager.play("notification")
				if act.has("cmd"):
					GameManager.record_and_dispatch_command(act["cmd"], current_worker, act.get("args", []))
				elif act.has("fn") and act["fn"].is_valid():
					act["fn"].call()
				# Resume game tick and close
				GameManager.set_paused(false)
				visible = false
			)
			right_col.add_child(choice_btn)
	else:
		question_body.visible = false
		bg_label.visible = true
		bg_label.text = current_worker.bg
		
		# Generate Skyrim-style dialogue choices in the right column
		var ask_btn = _create_dialogue_choice("💬 Hal Hatır Sor", _on_talk_ask_pressed)
		right_col.add_child(ask_btn)
		
		var gossip_btn = _create_dialogue_choice("👂 Dedikodu Yap", _on_talk_gossip_pressed)
		right_col.add_child(gossip_btn)
		
		var tease_btn = _create_dialogue_choice("😜 Dalga Geç", _on_talk_tease_pressed)
		right_col.add_child(tease_btn)
		
		var prim_btn = _create_dialogue_choice("💰 Prim Ver (750₺)", _on_prim_pressed)
		if GameManager.money < 750:
			prim_btn.text = "   💰 Prim Ver (750₺) - Yetersiz Bakiye"
			prim_btn.disabled = true
			prim_btn.add_theme_color_override("font_disabled_color", Color(0.4, 0.4, 0.4))
		right_col.add_child(prim_btn)
		
		var warn_btn = _create_dialogue_choice("⚠️ Uyar / Fırçala", _on_warn_pressed)
		right_col.add_child(warn_btn)
		
		if current_worker.worker_name != "Sevkiyatçı Selo":
			var fire_btn = _create_dialogue_choice("🚨 İşten Çıkar", _on_fire_pressed)
			right_col.add_child(fire_btn)
			
		var exit_btn = _create_dialogue_choice("❌ Konuşmayı Bitir", _on_close_pressed)
		right_col.add_child(exit_btn)

func _create_dialogue_choice(label: String, callback: Callable) -> Button:
	var btn := Button.new()
	btn.text = "   " + label
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.custom_minimum_size = Vector2(0, 28)
	btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	btn.add_theme_font_size_override("font_size", 12)
	
	# Borderless clean styling
	var style_empty := StyleBoxEmpty.new()
	btn.add_theme_stylebox_override("normal", style_empty)
	btn.add_theme_stylebox_override("focus", style_empty)
	
	var style_hover := StyleBoxFlat.new()
	style_hover.bg_color = Color(0.24, 0.51, 0.81, 0.15) # Subtle blue highlight
	style_hover.corner_radius_top_left = 4
	style_hover.corner_radius_top_right = 4
	style_hover.corner_radius_bottom_right = 4
	style_hover.corner_radius_bottom_left = 4
	style_hover.content_margin_left = 8
	btn.add_theme_stylebox_override("hover", style_hover)
	btn.add_theme_stylebox_override("pressed", style_hover)
	
	btn.add_theme_color_override("font_color", Color(0.75, 0.78, 0.85))
	btn.add_theme_color_override("font_hover_color", Color(1.0, 1.0, 1.0))
	btn.add_theme_color_override("font_focus_color", Color(1.0, 1.0, 1.0))
	btn.add_theme_color_override("font_pressed_color", Color(0.24, 0.82, 0.93))
	
	btn.pressed.connect(callback)
	return btn

func _on_prim_pressed() -> void:
	var cost = 750
	if GameManager.money < cost:
		return
		
	GameManager.money -= cost
	EventBus.money_changed.emit(GameManager.money)
	SoundManager.play("cash_register")
	
	var max_m = 110 if GameManager.coffee_machine_owned else 100
	current_worker.morale = clampi(current_worker.morale + 15, 0, max_m)
	current_worker.trust = clampi(current_worker.trust + 8, 0, 100)
	
	var resp = "👷 [color=cyan]%s:[/color] \"Ooo şefim, kesene bereket! Bu jestini unutmam, işimize daha sıkı sarılacağız!\"" % current_worker.worker_name
	_apply_talk_outcome(resp, 0, 0, "Prim verildi.")

func _on_warn_pressed() -> void:
	current_worker.warnings += 1
	var max_m = 110 if GameManager.coffee_machine_owned else 100
	current_worker.morale = clampi(current_worker.morale - 15, 0, max_m)
	current_worker.trust = clampi(current_worker.trust - 12, 0, 100)
	
	SoundManager.play("alarm_crunch")
	
	if current_worker.warnings >= 3:
		GameManager.add_log("🚨 %s 3 uyarı sınırını aştığı için istifa edip fabrikayı terk etti!" % current_worker.worker_name)
		if not current_worker.bp.is_empty():
			current_worker.bp.get("workers", []).erase(current_worker.worker_name)
			current_worker.bp = {}
			
		GameManager.masters.erase(current_worker)
		current_worker.queue_free()
		current_worker = null
		_on_close_pressed()
	else:
		var resp = "👷 [color=red]%s:[/color] \"Tamam şef, anladık... Hatalarimizi düzelteceğiz ama bu kadar sert çıkmana gerek yoktu.\"" % current_worker.worker_name
		_apply_talk_outcome(resp, 0, 0, "Uyarılıp fırçalandı.")

func _on_fire_pressed() -> void:
	if current_worker.worker_name == "Sevkiyatçı Selo":
		return
		
	GameManager.add_log("🚨 %s işten çıkarıldı!" % current_worker.worker_name)
	SoundManager.play("alarm_crunch")
	
	if not current_worker.bp.is_empty():
		current_worker.bp.get("workers", []).erase(current_worker.worker_name)
		current_worker.bp = {}
		
	GameManager.masters.erase(current_worker)
	current_worker.queue_free()
	current_worker = null
	
	EventBus.masters_updated.emit()
	EventBus.orders_updated.emit()
	_on_close_pressed()

func _on_close_pressed() -> void:
	GameManager.set_paused(false)
	visible = false

func _on_talk_ask_pressed() -> void:
	if not is_instance_valid(current_worker):
		return
	
	var trait_str = current_worker.personality_trait
	var trust = current_worker.trust
	var resp = ""
	var morale_change = 0
	var trust_change = 0
	
	match trait_str:
		"İnatçı":
			if trust < 50:
				resp = "👷 [color=orange]%s:[/color] \"Lafa tutma bizi şef, yapacak tonla iş var.\"" % current_worker.worker_name
				morale_change = -5
				trust_change = -2
			else:
				resp = "👷 [color=cyan]%s:[/color] \"Teşekkürler şef, idare ediyoruz işte. Fırın sıcak, saclar bekler.\"" % current_worker.worker_name
				morale_change = 5
				trust_change = 4
		"Girişken":
			resp = "👷 [color=cyan]%s:[/color] \"Ooo şefim! Bomba gibiyiz, sen nasılsın? Bugün işler tıkırında, çaylar senden ama!\"" % current_worker.worker_name
			morale_change = 12
			trust_change = 6
		"Yardımsever":
			resp = "👷 [color=cyan]%s:[/color] \"Çok sağ olun şefim, iyiyim. Siz yorulmayın hiç, buralar bizde Allah'ın izniyle.\"" % current_worker.worker_name
			morale_change = 10
			trust_change = 8
		"Asosyal":
			resp = "👷 [color=cyan]%s:[/color] \"İ-iyiyim şef... Teşekkürler... Sacları hatasız bitirmeye çalışıyorum...\"" % current_worker.worker_name
			morale_change = 4
			trust_change = 5
		_:
			resp = "👷 [color=cyan]%s:[/color] \"İyiyim şef, sağ olasın.\"" % current_worker.worker_name
			morale_change = 5
			trust_change = 5
			
	_apply_talk_outcome(resp, morale_change, trust_change, "Hal hatır sordunuz.")

func _on_talk_gossip_pressed() -> void:
	if not is_instance_valid(current_worker):
		return
		
	var trait_str = current_worker.personality_trait
	var resp = ""
	var morale_change = 0
	var trust_change = 0
	
	match trait_str:
		"İnatçı":
			resp = "👷 [color=red]%s:[/color] \"Şef, biz buraya laklak yapmaya gelmedik. İşimiz gücümüz var, dedikodu yakışmaz.\"" % current_worker.worker_name
			morale_change = -10
			trust_change = -12
		"Girişken":
			resp = "👷 [color=cyan]%s:[/color] \"Hadi ya! Selo da diyordu zaten o siparişte bir bit yeniği var diye... Ee, başka ne olmuş?\"" % current_worker.worker_name
			morale_change = 15
			trust_change = 10
		"Yardımsever":
			resp = "👷 [color=orange]%s:[/color] \"Şefim boşverelim dedikoduyu. İnsanların arkasından konuşmak bize yakışmaz.\"" % current_worker.worker_name
			morale_change = -2
			trust_change = -5
		"Asosyal":
			resp = "👷 [color=orange]%s:[/color] \"B-ben pek anlamam o işlerden şef... Kendi işime bakıyorum...\"" % current_worker.worker_name
			morale_change = -3
			trust_change = 0
		_:
			resp = "👷 [color=cyan]%s:[/color] \"Haklısın şef, fabrikada kulis çok.\"" % current_worker.worker_name
			morale_change = 2
			trust_change = 2

	_apply_talk_outcome(resp, morale_change, trust_change, "Dedikodu yaptınız.")

func _on_talk_tease_pressed() -> void:
	if not is_instance_valid(current_worker):
		return
		
	var trait_str = current_worker.personality_trait
	var trust = current_worker.trust
	var resp = ""
	var morale_change = 0
	var trust_change = 0
	
	match trait_str:
		"İnatçı":
			resp = "👷 [color=red]%s:[/color] \"Şef, saygımızı bozmayalım! Biz burada alnımızın teriyle çalışıyoruz!\"" % current_worker.worker_name
			morale_change = -18
			trust_change = -15
		"Girişken":
			if trust >= 60:
				resp = "👷 [color=cyan]%s:[/color] \"Ahahaha! Şefim sen de az değilsin ha! Ama haklısın, şaka kakadır derler ama güldük!\"" % current_worker.worker_name
				morale_change = 10
				trust_change = 5
			else:
				resp = "👷 [color=orange]%s:[/color] \"Aşk olsun şef, durup dururken niye laf sokuyorsun şimdi?\"" % current_worker.worker_name
				morale_change = -8
				trust_change = -8
		"Yardımsever":
			resp = "👷 [color=red]%s:[/color] \"Ayıp ettin şefim... Biz burada canla başla çalışırken dalga geçilecek adam mıyız?\"" % current_worker.worker_name
			morale_change = -12
			trust_change = -10
		"Asosyal":
			resp = "👷 [color=red]%s:[/color] \"N-niye öyle dediniz ki şef... Yanlış bir şey mi yaptım? Kötü hissettim...\"" % current_worker.worker_name
			morale_change = -15
			trust_change = -10
		_:
			resp = "👷 [color=orange]%s:[/color] \"Şaka kaka oldu şef.\"" % current_worker.worker_name
			morale_change = -5
			trust_change = -5

	_apply_talk_outcome(resp, morale_change, trust_change, "Dalga geçtiniz.")

func _apply_talk_outcome(response_text: String, morale_diff: int, trust_diff: int, action_name: String) -> void:
	var max_m = 110 if GameManager.coffee_machine_owned else 100
	current_worker.morale = clampi(current_worker.morale + morale_diff, 0, max_m)
	current_worker.trust = clampi(current_worker.trust + trust_diff, 0, 100)
	
	var morale_sign = "+" if morale_diff >= 0 else ""
	var trust_sign = "+" if trust_diff >= 0 else ""
	var log_msg = "💬 %s ile konuştunuz (%s). Moral: %s%d, Güven: %s%d" % [
		current_worker.worker_name,
		action_name,
		morale_sign, morale_diff,
		trust_sign, trust_diff
	]
	GameManager.add_log(log_msg)
	
	bg_label.text = response_text
	
	stats_label.text = "🎯 Branş: %s  |  🌟 Özellik: %s  |  😊 Moral: %% %d  |  🤝 Güven: %% %d  |  ⚠️ Uyarı: %d/3" % [
		current_worker.skill,
		current_worker.personality_trait,
		current_worker.morale,
		current_worker.trust,
		current_worker.warnings
	]
	
	# Clear choices list and show only exit choice
	for child in right_col.get_children():
		child.queue_free()
		
	var exit_btn = _create_dialogue_choice("❌ Devam Et", _on_close_pressed)
	right_col.add_child(exit_btn)
	EventBus.masters_updated.emit()
