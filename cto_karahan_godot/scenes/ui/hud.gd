extends Panel

## HUD UI Controller: Displays time, money, rating, boss trust, and handles the purchase modal trigger.

@onready var time_label: Label = $MarginContainer/HBoxContainer/TimeContainer/TimeLabel
@onready var money_label: Label = $MarginContainer/HBoxContainer/StatsContainer/MoneyLabel
@onready var rating_label: Label = $MarginContainer/HBoxContainer/StatsContainer/RatingLabel
@onready var boss_trust_label: Label = $MarginContainer/HBoxContainer/StatsContainer/BossTrustLabel
@onready var crunch_banner: Panel = $CrunchBanner
@onready var crunch_label: Label = $CrunchBanner/CrunchLabel
@onready var buy_button: Button = $MarginContainer/HBoxContainer/BuyButton

func _ready() -> void:
	# Connect to EventBus signals
	EventBus.time_changed.connect(_on_time_changed)
	EventBus.money_changed.connect(_on_money_changed)
	EventBus.rating_changed.connect(_on_rating_changed)
	EventBus.boss_trust_changed.connect(_on_boss_trust_changed)
	EventBus.crunch_time_toggled.connect(_on_crunch_time_toggled)
	
	buy_button.pressed.connect(_on_buy_pressed)
	buy_button.custom_minimum_size = Vector2(120, 0)
	buy_button.text = "📦 Satın Al"
	
	# Connect toast notification signal
	EventBus.toast_notified.connect(_show_toast)
	
	# Compact spacing in HBoxContainers dynamically to prevent overlapping
	hbox_container = $MarginContainer/HBoxContainer
	hbox_container.add_theme_constant_override("separation", 12)
	
	var stats_container: HBoxContainer = $MarginContainer/HBoxContainer/StatsContainer
	if stats_container:
		stats_container.add_theme_constant_override("separation", 15)
	
	# Initial UI updates
	_on_time_changed(GameManager.day, GameManager.hour, GameManager.minute)
	_on_money_changed(GameManager.money)
	_on_rating_changed(GameManager.rating)
	_on_boss_trust_changed(GameManager.boss_trust)
	_on_crunch_time_toggled(GameManager.crunch_time)

var hbox_container: HBoxContainer
var is_3d_mode: bool = true

var _persistent_toast: PanelContainer = null
var _temp_toast: PanelContainer = null


func _show_toast(message: String, type_str: String) -> void:
	if type_str == "info_clear":
		if _persistent_toast:
			_persistent_toast.queue_free()
			_persistent_toast = null
		return
		
	if type_str == "info_persistent":
		if _persistent_toast:
			_persistent_toast.queue_free()
		
		if message.is_empty():
			return
			
		_persistent_toast = _create_toast_ui(message, Color(0.18, 0.52, 0.88)) # Blue accent
		_persistent_toast.position = Vector2((get_viewport_rect().size.x - 420) / 2.0, get_viewport_rect().size.y - 130)
		return
		
	# Temporary warning/info toasts
	if _temp_toast:
		_temp_toast.queue_free()
		
	var color = Color(0.85, 0.35, 0.15) if type_str == "warning" else Color(0.15, 0.75, 0.35)
	_temp_toast = _create_toast_ui(message, color)
	_temp_toast.position = Vector2((get_viewport_rect().size.x - 420) / 2.0, 100)
	
	# Auto close timer
	var t = get_tree().create_timer(3.0)
	t.timeout.connect(func():
		if is_instance_valid(_temp_toast):
			_temp_toast.queue_free()
			_temp_toast = null
	)

func _create_toast_ui(message: String, border_color: Color) -> PanelContainer:
	var pc := PanelContainer.new()
	pc.custom_minimum_size = Vector2(420, 48)
	
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.08, 0.10, 0.14, 0.95)
	sb.border_width_bottom = 3
	sb.border_color = border_color
	sb.corner_radius_top_left = 6
	sb.corner_radius_top_right = 6
	sb.corner_radius_bottom_right = 6
	sb.corner_radius_bottom_left = 6
	sb.shadow_color = Color(0, 0, 0, 0.4)
	sb.shadow_size = 12
	sb.shadow_offset = Vector2(0, 4)
	pc.add_theme_stylebox_override("panel", sb)
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_top", 8)
	margin.add_theme_constant_override("margin_bottom", 8)
	pc.add_child(margin)
	
	var label := Label.new()
	label.text = message
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
	margin.add_child(label)
	
	get_parent().add_child(pc)
	return pc

func _on_time_changed(day: int, hour: int, minute: int) -> void:
	time_label.text = "GÜN %d — %s:%s" % [day, str(hour).pad_zeros(2), str(minute).pad_zeros(2)]

func _on_money_changed(amount: int) -> void:
	money_label.text = "💰 %s ₺" % _format_money(amount)

func _on_rating_changed(rating: int) -> void:
	rating_label.text = "⭐ %%%d" % rating

func _on_boss_trust_changed(trust: int) -> void:
	var trust_text = "Patron: %d/10" % trust
	if trust >= 5:
		boss_trust_label.text = "🤝 %s" % trust_text
	elif trust >= 0:
		boss_trust_label.text = "😐 %s" % trust_text
	else:
		boss_trust_label.text = "🚨 %s" % trust_text

func _on_crunch_time_toggled(active: bool) -> void:
	crunch_banner.visible = active
	if active:
		crunch_label.text = "🚨 Crunch Başladı! Üretim Hızı 2x! Acil teknik sorular geliyor!"
		SoundManager.play("alarm_crunch")

func _on_buy_pressed() -> void:
	EventBus.open_purchase_modal.emit()
	SoundManager.play("notification")

func _format_money(val: int) -> String:
	# Formats integer money value with thousands separator
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
