extends Panel

## PurchaseModal UI Controller: Handles purchasing materials, dynamically loading active factory inventory stock and costs.

@onready var list_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/ListContainer
@onready var money_label: Label = $MarginContainer/VBoxContainer/HeaderContainer/MoneyLabel
@onready var close_button: Button = $MarginContainer/VBoxContainer/CloseButton

func _ready() -> void:
	EventBus.open_purchase_modal.connect(_on_open)
	close_button.pressed.connect(_on_close)
	visible = false

func _on_open() -> void:
	# Pause the game time when buying materials
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
		
	# Populate based on active factory materials
	for mat in GameManager.active_factory["materials"]:
		var item = PanelContainer.new()
		item.custom_minimum_size = Vector2(0, 70)
		
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
		var qty = GameManager.inventory.get(mat, 0)
		var cost = GameManager.mat_costs.get(mat, 1000)
		info_lbl.text = "📦 %s\nStok: %d adet • Birim Fiyat: %s ₺" % [mat, qty, _format_money(cost)]
		info_lbl.add_theme_font_size_override("font_size", 12)
		info_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info_lbl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		hbox.add_child(info_lbl)
		
		# Buy buttons (+1, +5)
		var btn_hbox = HBoxContainer.new()
		btn_hbox.add_theme_constant_override("separation", 6)
		btn_hbox.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		hbox.add_child(btn_hbox)
		
		var btn1 = Button.new()
		btn1.text = "+1 Al"
		btn1.add_theme_font_size_override("font_size", 11)
		btn1.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn1.pressed.connect(func():
			GameManager.buy_mat(mat, 1)
			SoundManager.play("cash_register")
		)
		btn_hbox.add_child(btn1)
		
		var btn5 = Button.new()
		btn5.text = "+5 Al"
		btn5.add_theme_font_size_override("font_size", 11)
		btn5.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn5.pressed.connect(func():
			GameManager.buy_mat(mat, 5)
			SoundManager.play("cash_register")
		)
		btn_hbox.add_child(btn5)

func _on_close() -> void:
	# Resume the game time when closing store
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
