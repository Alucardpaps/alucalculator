extends Node2D

## Game Scene Controller: Manages world containers, game-over overlays, and the technical handbook.

@onready var factory_select_modal: Panel = $CanvasLayer/UI/FactorySelect
@onready var chat_modal: Panel = $CanvasLayer/UI/ChatModal
@onready var purchase_modal: Panel = $CanvasLayer/UI/PurchaseModal
@onready var hire_modal: Panel = $CanvasLayer/UI/HireModal
@onready var assign_modal: Panel = $CanvasLayer/UI/AssignModal
var meeting_modal: Control

@onready var handbook_panel: Panel = $CanvasLayer/UI/HandbookPanel
@onready var handbook_text: RichTextLabel = $CanvasLayer/UI/HandbookPanel/MarginContainer/VBoxContainer/HandbookText
@onready var handbook_close: Button = $CanvasLayer/UI/HandbookPanel/MarginContainer/VBoxContainer/CloseBtn
@onready var open_handbook_btn: Button = $CanvasLayer/UI/OpenHandbookBtn

@onready var game_over_panel: Panel = $CanvasLayer/UI/GameOverPanel
@onready var game_over_reason: Label = $CanvasLayer/UI/GameOverPanel/MarginContainer/VBoxContainer/ReasonLabel
@onready var game_over_restart_btn: Button = $CanvasLayer/UI/GameOverPanel/MarginContainer/VBoxContainer/RestartBtn

var layer_3d: CanvasLayer
var viewport_container: SubViewportContainer
var factory_3d: SubViewport
var tablet_frame: Panel
var status_time_label: Label
var tablet_ui: Control
var tablet_viewport_container: SubViewportContainer
var tablet_sub_viewport: SubViewport
var tablet_prompt: PanelContainer
var is_tablet_raised: bool = true

# Tabbed Navigation State
var current_tab: String = "workers" # "workers", "orders", "handbook", "flappy", "upgrades"
var flappy_bird_panel: Panel
var upgrades_panel: Panel
var upgrades_grid: GridContainer
var is_crunch_active: bool = false


# Flappy Bird State
var fb_is_running: bool = false
var fb_bird_y: float = 200.0
var fb_bird_vel: float = 0.0
var fb_pipe_x: float = 900.0
var fb_pipe_gap_y: float = 180.0
var fb_pipe_gap_height: float = 120.0
var fb_score: int = 0
var fb_high_score: int = 0

var fb_bird: ColorRect
var fb_pipe_up: ColorRect
var fb_pipe_down: ColorRect
var fb_score_lbl: Label
var fb_instruct_lbl: Label

func _ready() -> void:
	# Create SubViewportContainer and SubViewport for the tablet screen projection
	tablet_viewport_container = SubViewportContainer.new()
	tablet_viewport_container.name = "TabletViewportContainer"
	# Center it on the screen to look like a physical tablet (not full monitor width)
	tablet_viewport_container.anchor_left = 0.5
	tablet_viewport_container.anchor_right = 0.5
	tablet_viewport_container.anchor_top = 0.5
	tablet_viewport_container.anchor_bottom = 0.5
	tablet_viewport_container.custom_minimum_size = Vector2(1024, 576)
	tablet_viewport_container.size = Vector2(1024, 576)
	tablet_viewport_container.grow_horizontal = Control.GROW_DIRECTION_BOTH
	tablet_viewport_container.grow_vertical = Control.GROW_DIRECTION_BOTH
	tablet_viewport_container.offset_left = -512
	tablet_viewport_container.offset_right = 512
	tablet_viewport_container.offset_top = -288
	tablet_viewport_container.offset_bottom = 288
	tablet_viewport_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tablet_viewport_container.stretch = true
	$CanvasLayer/UI.add_child(tablet_viewport_container)
	
	tablet_sub_viewport = SubViewport.new()
	tablet_sub_viewport.name = "TabletSubViewport"
	tablet_sub_viewport.size = Vector2i(1024, 576)
	tablet_sub_viewport.transparent_bg = false # Solid background to allow projection mapping
	tablet_sub_viewport.gui_disable_input = false
	tablet_sub_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	tablet_viewport_container.add_child(tablet_sub_viewport)
	
	# Create Tablet UI Container
	tablet_ui = Control.new()
	tablet_ui.name = "TabletUI"
	tablet_ui.custom_minimum_size = Vector2(1024, 576)
	tablet_ui.size = Vector2(1024, 576)
	tablet_ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tablet_sub_viewport.add_child(tablet_ui)
	
	# Create Tablet Frame FIRST so it draws behind panels
	tablet_frame = Panel.new()
	tablet_frame.name = "TabletFrame"
	tablet_frame.set_anchors_preset(Control.PRESET_FULL_RECT)
	tablet_frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	# Design the tablet bezel using a StyleBoxFlat with a thick border
	var bezel_style := StyleBoxFlat.new()
	bezel_style.bg_color = Color(0.06, 0.08, 0.1, 1.0) # Solid dark premium glass background
	bezel_style.border_width_left = 24
	bezel_style.border_width_right = 24
	bezel_style.border_width_top = 32
	bezel_style.border_width_bottom = 32
	bezel_style.border_color = Color(0.08, 0.09, 0.12, 1.0) # Sleek dark carbon bezel
	bezel_style.corner_radius_top_left = 28
	bezel_style.corner_radius_top_right = 28
	bezel_style.corner_radius_bottom_right = 28
	bezel_style.corner_radius_bottom_left = 28
	bezel_style.shadow_color = Color(0, 0, 0, 0.5)
	bezel_style.shadow_size = 15
	
	tablet_frame.add_theme_stylebox_override("panel", bezel_style)
	tablet_ui.add_child(tablet_frame)
	
	# Add Status Bar at the top of the bezel
	var status_bar := HBoxContainer.new()
	status_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	status_bar.offset_left = 36.0
	status_bar.offset_right = -36.0
	status_bar.offset_top = 8.0
	status_bar.offset_bottom = 24.0
	status_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	status_bar.alignment = BoxContainer.ALIGNMENT_BEGIN
	tablet_frame.add_child(status_bar)
	
	var left_status := Label.new()
	left_status.text = "📶 ALU-SECURE-NET  5G"
	left_status.add_theme_font_size_override("font_size", 10)
	left_status.add_theme_color_override("font_color", Color(0.5, 0.53, 0.6))
	status_bar.add_child(left_status)
	
	# Notch in center
	var notch := Panel.new()
	notch.custom_minimum_size = Vector2(80, 12)
	notch.size_flags_horizontal = Control.SIZE_EXPAND | Control.SIZE_SHRINK_CENTER
	var notch_style := StyleBoxFlat.new()
	notch_style.bg_color = Color(0.05, 0.06, 0.08, 1.0)
	notch_style.corner_radius_bottom_right = 8
	notch_style.corner_radius_bottom_left = 8
	notch.add_theme_stylebox_override("panel", notch_style)
	status_bar.add_child(notch)
	
	var right_status_container := HBoxContainer.new()
	right_status_container.size_flags_horizontal = Control.SIZE_SHRINK_END
	right_status_container.add_theme_constant_override("separation", 10)
	status_bar.add_child(right_status_container)
	
	var battery_lbl := Label.new()
	battery_lbl.text = "🔋 98%"
	battery_lbl.add_theme_font_size_override("font_size", 10)
	battery_lbl.add_theme_color_override("font_color", Color(0.5, 0.53, 0.6))
	right_status_container.add_child(battery_lbl)
	
	status_time_label = Label.new()
	status_time_label.text = "08:00"
	status_time_label.add_theme_font_size_override("font_size", 10)
	status_time_label.add_theme_color_override("font_color", Color(0.5, 0.53, 0.6))
	right_status_container.add_child(status_time_label)
	
	# Bottom Home Indicator
	var home_indicator := Panel.new()
	home_indicator.anchor_left = 0.5
	home_indicator.anchor_right = 0.5
	home_indicator.anchor_top = 1.0
	home_indicator.anchor_bottom = 1.0
	home_indicator.offset_left = -60.0
	home_indicator.offset_right = 60.0
	home_indicator.offset_top = -14.0
	home_indicator.offset_bottom = -10.0
	home_indicator.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var indicator_style := StyleBoxFlat.new()
	indicator_style.bg_color = Color(0.4, 0.43, 0.48, 0.6)
	indicator_style.corner_radius_top_left = 2
	indicator_style.corner_radius_top_right = 2
	indicator_style.corner_radius_bottom_right = 2
	indicator_style.corner_radius_bottom_left = 2
	home_indicator.add_theme_stylebox_override("panel", indicator_style)
	tablet_frame.add_child(home_indicator)
	
	# Reparent panels to tablet_ui so they slide together
	$CanvasLayer/UI/HUD.reparent(tablet_ui)
	$CanvasLayer/UI/WorkerPanel.reparent(tablet_ui)
	$CanvasLayer/UI/OrderPanel.reparent(tablet_ui)
	# LogPanel remains under CanvasLayer/UI and is positioned at the bottom-left of the screen
	var log_panel: Control = $CanvasLayer/UI/LogPanel
	log_panel.anchor_left = 0.0
	log_panel.anchor_right = 0.0
	log_panel.anchor_top = 1.0
	log_panel.anchor_bottom = 1.0
	log_panel.offset_left = 24.0
	log_panel.offset_right = 384.0
	log_panel.offset_top = -204.0
	log_panel.offset_bottom = -24.0
	log_panel.custom_minimum_size = Vector2(360, 180)
	log_panel.visible = false # Hidden initially until factory is selected
	purchase_modal.reparent(tablet_ui)
	hire_modal.reparent(tablet_ui)
	assign_modal.reparent(tablet_ui)
	handbook_panel.reparent(tablet_ui)
	handbook_panel.custom_minimum_size = Vector2.ZERO
	open_handbook_btn.reparent(tablet_ui)
	
	# Keep visible so the SubViewport renders in the background to the 3D mesh screen
	tablet_viewport_container.visible = true
	tablet_viewport_container.modulate.a = 0.0
	tablet_viewport_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	# HUD fits inside bezel at the top
	var hud_ctrl: Control = tablet_ui.get_node("HUD")
	hud_ctrl.anchor_left = 0.0
	hud_ctrl.anchor_right = 1.0
	hud_ctrl.offset_left = 24.0
	hud_ctrl.offset_right = -24.0
	hud_ctrl.offset_top = 32.0
	hud_ctrl.offset_bottom = 92.0
	
	# --- Create Tab Navigation Bar ---
	var tab_bar := HBoxContainer.new()
	tab_bar.name = "TabBar"
	tab_bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	tab_bar.offset_left = 32.0
	tab_bar.offset_right = -32.0
	tab_bar.offset_top = 92.0
	tab_bar.offset_bottom = 124.0
	tab_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	tab_bar.mouse_filter = Control.MOUSE_FILTER_PASS
	tablet_ui.add_child(tab_bar)
	
	var btn_workers := Button.new()
	btn_workers.text = "👷 Ustalar"
	btn_workers.custom_minimum_size = Vector2(120, 28)
	tab_bar.add_child(btn_workers)
	
	var btn_orders := Button.new()
	btn_orders.text = "📋 Siparişler"
	btn_orders.custom_minimum_size = Vector2(120, 28)
	tab_bar.add_child(btn_orders)
	
	var btn_handbook := Button.new()
	btn_handbook.text = "📖 El Kitabı"
	btn_handbook.custom_minimum_size = Vector2(120, 28)
	tab_bar.add_child(btn_handbook)
	
	var btn_flappy := Button.new()
	btn_flappy.text = "🐦 Flappy Bird"
	btn_flappy.custom_minimum_size = Vector2(120, 28)
	tab_bar.add_child(btn_flappy)
	
	var btn_upgrades := Button.new()
	btn_upgrades.text = "🔧 Geliştirmeler"
	btn_upgrades.custom_minimum_size = Vector2(120, 28)
	tab_bar.add_child(btn_upgrades)
	
	# Setup styling and connections
	for btn in [btn_workers, btn_orders, btn_handbook, btn_flappy, btn_upgrades]:
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_size_override("font_size", 11)
		
	btn_workers.pressed.connect(func(): _switch_tab("workers"))
	btn_orders.pressed.connect(func(): _switch_tab("orders"))
	btn_handbook.pressed.connect(func(): _switch_tab("handbook"))
	btn_flappy.pressed.connect(func(): _switch_tab("flappy"))
	btn_upgrades.pressed.connect(func(): _switch_tab("upgrades"))

	# Sidebars start below the Tab Bar (y = 128.0) and inside bezel
	var worker_panel: Control = tablet_ui.get_node("WorkerPanel")
	worker_panel.anchor_top = 0.0
	worker_panel.anchor_bottom = 1.0
	worker_panel.offset_top = 128.0
	worker_panel.offset_bottom = -32.0
	worker_panel.offset_left = 24.0
	worker_panel.offset_right = 304.0
	
	var worker_margin: MarginContainer = worker_panel.get_node("MarginContainer")
	if worker_margin:
		worker_margin.add_theme_constant_override("margin_top", 15)

	var order_panel: Control = tablet_ui.get_node("OrderPanel")
	order_panel.anchor_top = 0.0
	order_panel.anchor_bottom = 1.0
	order_panel.offset_top = 128.0
	order_panel.offset_bottom = -32.0
	order_panel.offset_left = -324.0
	order_panel.offset_right = -24.0

	var order_margin: MarginContainer = order_panel.get_node("MarginContainer")
	if order_margin:
		order_margin.add_theme_constant_override("margin_top", 15)

	# OpenHandbookBtn legacy is hidden
	open_handbook_btn.visible = false
	handbook_close.visible = false # Managed via tabs now
	
	# --- Create Upgrades Panel ---
	upgrades_panel = Panel.new()
	upgrades_panel.name = "UpgradesPanel"
	upgrades_panel.custom_minimum_size = Vector2.ZERO
	upgrades_panel.size = Vector2(960, 416)
	upgrades_panel.anchor_left = 0.5
	upgrades_panel.anchor_right = 0.5
	upgrades_panel.anchor_top = 0.5
	upgrades_panel.anchor_bottom = 0.5
	upgrades_panel.offset_left = -480.0
	upgrades_panel.offset_right = 480.0
	upgrades_panel.offset_top = -150.0
	upgrades_panel.offset_bottom = 230.0 # Fit inside screen frame below TabBar
	upgrades_panel.visible = false
	tablet_ui.add_child(upgrades_panel)
	
	var upgrades_style := StyleBoxFlat.new()
	upgrades_style.bg_color = Color(0.08, 0.1, 0.14, 1.0) # Sleek slate-dark theme
	upgrades_style.border_width_left = 2
	upgrades_style.border_width_right = 2
	upgrades_style.border_width_top = 2
	upgrades_style.border_width_bottom = 2
	upgrades_style.border_color = Color(0.917, 0.722, 0.227) # Gold border matching handbook
	upgrades_style.corner_radius_top_left = 12
	upgrades_style.corner_radius_top_right = 12
	upgrades_style.corner_radius_bottom_right = 12
	upgrades_style.corner_radius_bottom_left = 12
	upgrades_panel.add_theme_stylebox_override("panel", upgrades_style)
	
	var upgrades_margin := MarginContainer.new()
	upgrades_margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	upgrades_margin.add_theme_constant_override("margin_left", 20)
	upgrades_margin.add_theme_constant_override("margin_right", 20)
	upgrades_margin.add_theme_constant_override("margin_top", 20)
	upgrades_margin.add_theme_constant_override("margin_bottom", 20)
	upgrades_panel.add_child(upgrades_margin)
	
	var upgrades_scroll := ScrollContainer.new()
	upgrades_scroll.set_anchors_preset(Control.PRESET_FULL_RECT)
	upgrades_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	upgrades_margin.add_child(upgrades_scroll)
	
	upgrades_grid = GridContainer.new()
	upgrades_grid.columns = 2
	upgrades_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	upgrades_grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	upgrades_grid.add_theme_constant_override("h_separation", 20)
	upgrades_grid.add_theme_constant_override("v_separation", 15)
	upgrades_scroll.add_child(upgrades_grid)
	
	# --- Create Flappy Bird Game Panel ---
	flappy_bird_panel = Panel.new()
	flappy_bird_panel.name = "FlappyBirdPanel"
	flappy_bird_panel.custom_minimum_size = Vector2.ZERO
	flappy_bird_panel.size = Vector2(960, 416)
	flappy_bird_panel.anchor_left = 0.5
	flappy_bird_panel.anchor_right = 0.5
	flappy_bird_panel.anchor_top = 0.5
	flappy_bird_panel.anchor_bottom = 0.5
	flappy_bird_panel.offset_left = -480.0
	flappy_bird_panel.offset_right = 480.0
	flappy_bird_panel.offset_top = -150.0
	flappy_bird_panel.offset_bottom = 230.0 # Fit inside screen frame below TabBar
	flappy_bird_panel.visible = false
	tablet_ui.add_child(flappy_bird_panel)
	
	var flappy_style := StyleBoxFlat.new()
	flappy_style.bg_color = Color(0.12, 0.16, 0.22, 1.0) # Deep retro arcade blue-gray
	flappy_style.border_width_left = 2
	flappy_style.border_width_right = 2
	flappy_style.border_width_top = 2
	flappy_style.border_width_bottom = 2
	flappy_style.border_color = Color(0.24, 0.51, 0.81)
	flappy_style.corner_radius_top_left = 12
	flappy_style.corner_radius_top_right = 12
	flappy_style.corner_radius_bottom_right = 12
	flappy_style.corner_radius_bottom_left = 12
	flappy_bird_panel.add_theme_stylebox_override("panel", flappy_style)
	
	# Bird
	fb_bird = ColorRect.new()
	fb_bird.name = "Bird"
	fb_bird.color = Color(0.95, 0.85, 0.2) # Yellow
	fb_bird.size = Vector2(24, 24)
	fb_bird.position = Vector2(100, 200)
	flappy_bird_panel.add_child(fb_bird)
	
	# Pipe Up
	fb_pipe_up = ColorRect.new()
	fb_pipe_up.name = "PipeUp"
	fb_pipe_up.color = Color(0.2, 0.7, 0.3) # Green
	fb_pipe_up.size = Vector2(60, 200)
	fb_pipe_up.position = Vector2(1000, 0)
	flappy_bird_panel.add_child(fb_pipe_up)
	
	# Pipe Down
	fb_pipe_down = ColorRect.new()
	fb_pipe_down.name = "PipeDown"
	fb_pipe_down.color = Color(0.2, 0.7, 0.3) # Green
	fb_pipe_down.size = Vector2(60, 200)
	fb_pipe_down.position = Vector2(1000, 300)
	flappy_bird_panel.add_child(fb_pipe_down)
	
	# Score Label
	fb_score_lbl = Label.new()
	fb_score_lbl.name = "ScoreLabel"
	fb_score_lbl.text = "Skor: 0  |  En Yüksek: 0"
	fb_score_lbl.add_theme_font_size_override("font_size", 14)
	fb_score_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	fb_score_lbl.set_anchors_preset(Control.PRESET_TOP_WIDE)
	fb_score_lbl.offset_top = 10.0
	flappy_bird_panel.add_child(fb_score_lbl)
	
	# Instruct Label
	fb_instruct_lbl = Label.new()
	fb_instruct_lbl.name = "InstructLabel"
	fb_instruct_lbl.text = "Zıplamak için [SPACE] veya Ekrana Tıkla!\nOyunu başlatmak için tıkla."
	fb_instruct_lbl.add_theme_font_size_override("font_size", 16)
	fb_instruct_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	fb_instruct_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	fb_instruct_lbl.set_anchors_preset(Control.PRESET_FULL_RECT)
	flappy_bird_panel.add_child(fb_instruct_lbl)
	
	flappy_bird_panel.gui_input.connect(func(event: InputEvent):
		if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_flappy_bird_jump()
	)
	
	# Create Tooltip Prompt for 3D walkthrough
	tablet_prompt = PanelContainer.new()
	tablet_prompt.name = "TabletPrompt"
	var prompt_style := StyleBoxFlat.new()
	prompt_style.bg_color = Color(0.08, 0.1, 0.14, 0.95)
	prompt_style.border_width_bottom = 2
	prompt_style.border_color = Color(0.24, 0.51, 0.81, 0.8) # Blue accent
	prompt_style.corner_radius_top_left = 6
	prompt_style.corner_radius_top_right = 6
	prompt_style.corner_radius_bottom_right = 6
	prompt_style.corner_radius_bottom_left = 6
	tablet_prompt.add_theme_stylebox_override("panel", prompt_style)
	
	var prompt_margin := MarginContainer.new()
	prompt_margin.add_theme_constant_override("margin_left", 16)
	prompt_margin.add_theme_constant_override("margin_right", 16)
	prompt_margin.add_theme_constant_override("margin_top", 8)
	prompt_margin.add_theme_constant_override("margin_bottom", 8)
	tablet_prompt.add_child(prompt_margin)
	
	var prompt_lbl := Label.new()
	prompt_lbl.text = "📟 Tableti eline almak için [TAB] tuşuna bas"
	prompt_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	prompt_lbl.add_theme_font_size_override("font_size", 13)
	prompt_margin.add_child(prompt_lbl)
	
	tablet_prompt.anchor_left = 0.5
	tablet_prompt.anchor_right = 0.5
	tablet_prompt.anchor_top = 1.0
	tablet_prompt.anchor_bottom = 1.0
	tablet_prompt.offset_left = -180.0
	tablet_prompt.offset_right = 180.0
	tablet_prompt.offset_top = -140.0
	tablet_prompt.offset_bottom = -100.0
	tablet_prompt.visible = false
	$CanvasLayer/UI.add_child(tablet_prompt)

	# Register container paths to GameManager
	GameManager.workstations_container = $Map/Workstations
	GameManager.workers_container = $Map/Workers
	GameManager.animals_container = $Map/Animals
	GameManager.preys_container = $Map/Preys
	GameManager.factory_floor = $Map/FactoryFloor
	
	# Connect to EventBus signals
	EventBus.game_over.connect(_on_game_over)
	EventBus.factory_selected.connect(_on_factory_selected)
	EventBus.time_changed.connect(_on_time_changed)
	EventBus.open_chat.connect(_on_open_chat)
	EventBus.go_to_home.connect(_on_go_to_home)
	EventBus.crunch_time_toggled.connect(_on_crunch_time_toggled)
	EventBus.request_fade.connect(fade_transition)
	
	# Reactivate player when chat is closed
	chat_modal.visibility_changed.connect(func():
		if not chat_modal.visible and viewport_container.visible:
			var manager = factory_3d.manager_3d
			if is_instance_valid(manager):
				manager.set_active(true)
	)
	
	# Connect local buttons
	open_handbook_btn.pressed.connect(_on_open_handbook)
	handbook_close.pressed.connect(_on_close_handbook)
	game_over_restart_btn.pressed.connect(_on_restart_pressed)
	
	# Hide overlays initially
	handbook_panel.visible = false
	game_over_panel.visible = false
	
	# Instantiate EndOfDayModal overlay
	var eod_scene = load("res://scenes/ui/end_of_day_modal.tscn")
	if eod_scene:
		var eod_modal = eod_scene.instantiate()
		$CanvasLayer/UI.add_child(eod_modal)
		
	# Instantiate MeetingModal programmatically
	var meeting_script = load("res://scenes/ui/meeting_panel.gd")
	meeting_modal = PanelContainer.new()
	meeting_modal.name = "MeetingModal"
	meeting_modal.set_script(meeting_script)
	$CanvasLayer/UI.add_child(meeting_modal)
	meeting_modal.meeting_finished.connect(_on_meeting_finished)
	
	# Instantiate Layer3D and 3D Viewport Container
	layer_3d = CanvasLayer.new()
	layer_3d.layer = -1
	add_child(layer_3d)
	
	viewport_container = SubViewportContainer.new()
	viewport_container.stretch = true
	viewport_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	viewport_container.visible = false
	layer_3d.add_child(viewport_container)
	
	factory_3d = SubViewport.new()
	factory_3d.size = Vector2i(1152, 648)
	factory_3d.set_script(load("res://scripts/visuals/factory_3d.gd"))
	viewport_container.add_child(factory_3d)
	
	_assign_viewport_texture()
	
	# Ensure Tab Bar is drawn on top of all other panels
	var tab_bar_node = tablet_ui.get_node_or_null("TabBar")
	if is_instance_valid(tab_bar_node):
		tablet_ui.move_child(tab_bar_node, -1)
	
	# Set default tab initially
	_switch_tab("workers")

func _process(delta: float) -> void:
	if current_tab == "flappy" and is_instance_valid(flappy_bird_panel) and flappy_bird_panel.visible and fb_is_running:
		_tick_flappy_bird(delta)
		
	# Check if player enters factory to start work day (only when day has started and game is paused)
	if GameManager.paused and is_instance_valid(factory_3d) and is_instance_valid(factory_3d.manager_3d):
		var manager = factory_3d.manager_3d
		if manager.get("current_zone") == "factory" and GameManager.get("day_ended_and_slept") == true:
			var pos = manager.global_position
			# Check if player is inside factory building bounds
			if pos.x >= -10.0 and pos.x <= 87.5 and pos.z >= -15.0 and pos.z <= 35.0:
				var current_day = GameManager.day
				var is_midweek = (current_day - 4) % 7 == 0
				var is_weekend = (current_day - 7) % 7 == 0
				
				if is_midweek or is_weekend:
					_toggle_tablet_raise(true)
					meeting_modal.start_meeting(is_midweek)
					# Keep day_ended_and_slept = true so it halts until meeting is finished!
				else:
					GameManager.day_ended_and_slept = false
					GameManager.set_paused(false)
					GameManager.add_log("🌅 Mesai başladı! Fabrika kapıları açıldı ve ustalar iş başı yaptı.")
					SoundManager.play("day_start")

func _switch_tab(tab_name: String, play_sound: bool = true) -> void:
	current_tab = tab_name
	if play_sound:
		SoundManager.play("notification")
	
	var w_panel: Control = tablet_ui.get_node("WorkerPanel")
	var o_panel: Control = tablet_ui.get_node("OrderPanel")
	
	var shift = 30.0 if is_crunch_active else 0.0
	
	if tab_name == "workers":
		w_panel.visible = true
		o_panel.visible = false
		handbook_panel.visible = false
		flappy_bird_panel.visible = false
		upgrades_panel.visible = false
		
		# Set anchors to full width first to prevent negative size calculations
		w_panel.anchor_left = 0.0
		w_panel.anchor_right = 1.0
		w_panel.offset_left = 24.0
		w_panel.offset_right = -24.0
		w_panel.offset_top = 128.0 + shift
		w_panel.offset_bottom = -32.0
		
	elif tab_name == "orders":
		w_panel.visible = false
		o_panel.visible = true
		handbook_panel.visible = false
		flappy_bird_panel.visible = false
		upgrades_panel.visible = false
		
		# Set anchors to full width first to prevent negative size calculations
		o_panel.anchor_left = 0.0
		o_panel.anchor_right = 1.0
		o_panel.offset_left = 24.0
		o_panel.offset_right = -24.0
		o_panel.offset_top = 128.0 + shift
		o_panel.offset_bottom = -32.0
		
	elif tab_name == "handbook":
		w_panel.visible = false
		o_panel.visible = false
		handbook_panel.visible = true
		flappy_bird_panel.visible = false
		upgrades_panel.visible = false
		
		# Embed handbook panel directly in full frame size
		handbook_panel.anchor_left = 0.5
		handbook_panel.anchor_top = 0.5
		handbook_panel.anchor_right = 0.5
		handbook_panel.anchor_bottom = 0.5
		handbook_panel.offset_left = -480.0
		handbook_panel.offset_right = 480.0
		handbook_panel.offset_top = -150.0 + shift
		handbook_panel.offset_bottom = 230.0 + shift
		
	elif tab_name == "flappy":
		w_panel.visible = false
		o_panel.visible = false
		handbook_panel.visible = false
		flappy_bird_panel.visible = true
		upgrades_panel.visible = false
		
		flappy_bird_panel.offset_top = -150.0 + shift
		flappy_bird_panel.offset_bottom = 230.0 + shift
		
	elif tab_name == "upgrades":
		w_panel.visible = false
		o_panel.visible = false
		handbook_panel.visible = false
		flappy_bird_panel.visible = false
		upgrades_panel.visible = true
		
		upgrades_panel.offset_top = -150.0 + shift
		upgrades_panel.offset_bottom = 230.0 + shift
		_update_upgrades_tab()
		
	# Stop/Reset Flappy Bird if switching away
	if tab_name != "flappy":
		_stop_flappy_bird()

func _on_crunch_time_toggled(active: bool) -> void:
	is_crunch_active = active
	_apply_crunch_shift()

func _apply_crunch_shift() -> void:
	var tab_bar = tablet_ui.get_node_or_null("TabBar")
	var shift = 30.0 if is_crunch_active else 0.0
	
	if tab_bar:
		tab_bar.offset_top = 92.0 + shift
		tab_bar.offset_bottom = 124.0 + shift
	
	# Update offsets for current active panel
	_switch_tab(current_tab, false) # Do not play sound when shifting dynamically

func _flappy_bird_jump() -> void:
	if not fb_is_running:
		fb_is_running = true
		fb_bird_y = 200.0
		fb_bird_vel = 0.0
		fb_pipe_x = 900.0
		_randomize_fb_pipe()
		fb_score = 0
		fb_instruct_lbl.visible = false
		SoundManager.play("notification")
	else:
		fb_bird_vel = -280.0 # Jump upward impulse
		SoundManager.play("notification")

func _randomize_fb_pipe() -> void:
	fb_pipe_gap_y = randf_range(60.0, 416.0 - 60.0 - fb_pipe_gap_height)
	
	fb_pipe_up.size.y = fb_pipe_gap_y
	fb_pipe_up.position.y = 0.0
	
	fb_pipe_down.position.y = fb_pipe_gap_y + fb_pipe_gap_height
	fb_pipe_down.size.y = 416.0 - fb_pipe_down.position.y

func _stop_flappy_bird() -> void:
	fb_is_running = false
	fb_instruct_lbl.text = "Zıplamak için [SPACE] veya Ekrana Tıkla!\nOyunu başlatmak için tıkla."
	fb_instruct_lbl.visible = true

func _tick_flappy_bird(delta: float) -> void:
	# Gravity & velocity integration
	fb_bird_vel += 800.0 * delta
	fb_bird_y += fb_bird_vel * delta
	fb_bird.position.y = fb_bird_y
	
	# Move pipes left
	fb_pipe_x -= 180.0 * delta
	if fb_pipe_x < -60.0:
		fb_pipe_x = 960.0
		_randomize_fb_pipe()
		fb_score += 1
		if fb_score > fb_high_score:
			fb_high_score = fb_score
		fb_score_lbl.text = "Skor: %d  |  En Yüksek: %d" % [fb_score, fb_high_score]
		SoundManager.play("cash_register")
		
	fb_pipe_up.position.x = fb_pipe_x
	fb_pipe_down.position.x = fb_pipe_x
	
	# Collisions checking
	var bird_rect := Rect2(fb_bird.position, fb_bird.size)
	var pipe_up_rect := Rect2(fb_pipe_up.position, fb_pipe_up.size)
	var pipe_down_rect := Rect2(fb_pipe_down.position, fb_pipe_down.size)
	
	# Sky/Floor collision
	if fb_bird_y < 0.0 or fb_bird_y > 416.0 - fb_bird.size.y:
		_game_over_flappy_bird()
		return
		
	# Pipes collision
	if bird_rect.intersects(pipe_up_rect) or bird_rect.intersects(pipe_down_rect):
		_game_over_flappy_bird()
		return

func _game_over_flappy_bird() -> void:
	fb_is_running = false
	SoundManager.play("alarm_crunch")
	fb_instruct_lbl.text = "🚨 OYUN BİTTİ!\nSkorun: %d\n\nYeniden başlatmak için tıkla." % fb_score
	fb_instruct_lbl.visible = true

func _on_time_changed(_day: int, hour: int, minute: int) -> void:
	if is_instance_valid(status_time_label):
		status_time_label.text = "%02d:%02d" % [hour, minute]

func _input(event: InputEvent) -> void:
	if GameManager.selected_factory_type.is_empty():
		return
		
	# Intercept TAB key directly here before SubViewport can swallow it
	if event is InputEventKey and event.pressed and event.keycode == KEY_TAB:
		_toggle_tablet_raise(not is_tablet_raised)
		get_viewport().set_input_as_handled()
		return
		
	# Intercept SPACE key for jumping in Flappy Bird when active
	if current_tab == "flappy" and flappy_bird_panel.visible:
		if event is InputEventKey and event.pressed and event.keycode == KEY_SPACE:
			_flappy_bird_jump()
			get_viewport().set_input_as_handled()
			return

	if not is_tablet_raised and is_instance_valid(viewport_container) and viewport_container.visible and is_instance_valid(factory_3d):
		factory_3d.push_input(event)
		
		# Recapture mouse cursor on click in 3D walkthrough if tablet is lowered and not in chat
		if not is_tablet_raised and not chat_modal.visible and event is InputEventMouseButton and event.pressed:
			if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
				Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
				get_viewport().set_input_as_handled()
		
		# Forward mouse movements to player controller directly for flawless yaw and pitch rotation
		if not is_tablet_raised and event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			var manager = factory_3d.manager_3d
			if is_instance_valid(manager) and manager.has_method("rotate_look"):
				manager.rotate_look(event.relative)

func _toggle_tablet_raise(raise: bool) -> void:
	is_tablet_raised = raise
	
	var tween = create_tween().set_parallel(true)
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_OUT)
	
	# 1. Tween 3D Tablet Viewmodel model position and rotation
	if is_instance_valid(factory_3d) and is_instance_valid(factory_3d.tablet_3d):
		var target_pos := Vector3(0.0, -0.05, -0.22) if raise else Vector3(0.22, -0.22, -0.32)
		var target_rot := Vector3(deg_to_rad(5), 0.0, 0.0) if raise else Vector3(deg_to_rad(15), deg_to_rad(-25), deg_to_rad(10))
		
		tween.tween_property(factory_3d.tablet_3d, "position", target_pos, 0.4)
		tween.tween_property(factory_3d.tablet_3d, "rotation", target_rot, 0.4)
		
	# 2. Tween 2D UI modulate alpha and set input capture
	if raise:
		tablet_viewport_container.mouse_filter = Control.MOUSE_FILTER_STOP
		tween.tween_property(tablet_viewport_container, "modulate:a", 1.0, 0.4)
	else:
		tablet_viewport_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
		tween.tween_property(tablet_viewport_container, "modulate:a", 0.0, 0.4)
	
	# Show/hide prompt label
	if is_instance_valid(tablet_prompt):
		tablet_prompt.visible = not raise
		
	# Enable/disable manager active state (locks movement when tablet is raised)
	var manager = factory_3d.manager_3d
	if is_instance_valid(manager):
		manager.set_active(not raise)

func _on_factory_selected(_type: String) -> void:
	# Hide the legacy handbook button as we now use tabbed navigation
	open_handbook_btn.visible = false
	
	# Populate the handbook text based on chosen template
	if not GameManager.active_factory.is_empty():
		handbook_text.text = GameManager.active_factory.get("handbook", "El kitabı içeriği bulunamadı.")
		
	# Switch directly to 3D View mode
	$Map.visible = false
	$CanvasLayer/UI/LogPanel.visible = true
	viewport_container.visible = true
	factory_3d.active = true
	
	# Lower tablet initially
	is_tablet_raised = false
	tablet_viewport_container.visible = true
	tablet_viewport_container.modulate.a = 0.0
	tablet_viewport_container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if is_instance_valid(factory_3d) and is_instance_valid(factory_3d.tablet_3d):
		factory_3d.tablet_3d.position = Vector3(0.22, -0.22, -0.32)
		factory_3d.tablet_3d.rotation = Vector3(deg_to_rad(15), deg_to_rad(-25), deg_to_rad(10))
		
	if is_instance_valid(tablet_prompt):
		tablet_prompt.visible = true
		
	# Pan 3D player near starting area
	var cam_focus_3d = FactoryFloor.screen_to_3d(Vector2(1000, 300))
	if is_instance_valid(factory_3d.manager_3d):
		factory_3d.manager_3d.global_position = cam_focus_3d + Vector3(0, 1.0, 0)
		factory_3d.manager_3d.set_active(true)

func _on_open_handbook() -> void:
	SoundManager.play("notification")
	GameManager.set_paused(true)
	handbook_panel.visible = true

func _on_close_handbook() -> void:
	SoundManager.play("notification")
	GameManager.set_paused(false)
	handbook_panel.visible = false

func _on_game_over(reason: String) -> void:
	# Pause the simulation
	GameManager.set_paused(true)
	SoundManager.play("alarm_crunch")
	
	game_over_reason.text = reason
	game_over_panel.visible = true

func _on_restart_pressed() -> void:
	SoundManager.play("notification")
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _unhandled_input(event: InputEvent) -> void:
	if GameManager.selected_factory_type.is_empty():
		return
		
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_Z and event.ctrl_pressed:
			if GameManager.undo_last_command():
				SoundManager.play("cash_register")

func _on_open_chat(worker_idx: int) -> void:
	if GameManager.selected_factory_type.is_empty():
		return
		
	# 1. Lower tablet automatically if it is raised
	if is_tablet_raised:
		_toggle_tablet_raise(false)
		
	# 2. Lock player movement/look by deactivating manager controls
	var manager = factory_3d.manager_3d
	if is_instance_valid(manager):
		manager.set_active(false)
		
		# 3. Rotate camera to face the worker!
		if worker_idx >= 0 and worker_idx < GameManager.masters.size():
			var worker = GameManager.masters[worker_idx]
			if is_instance_valid(factory_3d) and factory_3d._worker_nodes.has(worker.worker_name):
				var w_data = factory_3d._worker_nodes[worker.worker_name]
				var w_node = w_data["node"]
				if is_instance_valid(w_node):
					# Swing camera to face the worker's head level
					if manager.has_method("look_at_target"):
						manager.look_at_target(w_node.global_position + Vector3(0, 1.4, 0))

func _assign_viewport_texture() -> void:
	await get_tree().process_frame
	if is_instance_valid(factory_3d) and is_instance_valid(tablet_sub_viewport):
		factory_3d.set_tablet_screen_texture(tablet_sub_viewport.get_texture())

func _update_upgrades_tab() -> void:
	if not is_instance_valid(upgrades_grid):
		return
		
	# Clear previous children
	for child in upgrades_grid.get_children():
		child.queue_free()
		
	var is_at_home = false
	if is_instance_valid(factory_3d) and is_instance_valid(factory_3d.manager_3d):
		if factory_3d.manager_3d.get("current_zone") == "home":
			is_at_home = true
			
	if is_at_home:
		_render_home_upgrades_on_tablet()
		return
		
	var factory = GameManager.active_factory
	if factory.is_empty():
		return
		
	# ─── SECTION 1: WORKSTATION SPEED UPGRADES ───
	var workstations = factory.get("workstations", {})
	for ws_id in workstations.keys():
		var ws_data = workstations[ws_id]
		# Only list production workstations that are valid for upgrades
		if not GameManager.workstation_upgrades.has(ws_id):
			continue
			
		var ws_name = ws_data.get("name", ws_id)
		var current_lvl = GameManager.workstation_upgrades.get(ws_id, 0)
		var cost = (current_lvl + 1) * 8000
		var current_bonus = current_lvl * 20
		var next_bonus = (current_lvl + 1) * 20
		
		var card := PanelContainer.new()
		var card_style := StyleBoxFlat.new()
		card_style.bg_color = Color(0.12, 0.15, 0.20, 1.0)
		card_style.corner_radius_top_left = 8
		card_style.corner_radius_top_right = 8
		card_style.corner_radius_bottom_right = 8
		card_style.corner_radius_bottom_left = 8
		card_style.border_width_left = 1
		card_style.border_width_right = 1
		card_style.border_width_top = 1
		card_style.border_width_bottom = 1
		card_style.border_color = Color(0.2, 0.24, 0.3)
		card.add_theme_stylebox_override("panel", card_style)
		card.custom_minimum_size = Vector2(440, 90)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		
		var margin_c := MarginContainer.new()
		margin_c.add_theme_constant_override("margin_left", 12)
		margin_c.add_theme_constant_override("margin_right", 12)
		margin_c.add_theme_constant_override("margin_top", 8)
		margin_c.add_theme_constant_override("margin_bottom", 8)
		card.add_child(margin_c)
		
		var hbox := HBoxContainer.new()
		margin_c.add_child(hbox)
		
		var vbox := VBoxContainer.new()
		vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(vbox)
		
		var icon_lbl := Label.new()
		icon_lbl.text = ws_data.get("icon", "🔧") + " " + ws_name
		icon_lbl.add_theme_font_size_override("font_size", 13)
		icon_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
		vbox.add_child(icon_lbl)
		
		var desc_lbl := Label.new()
		desc_lbl.text = "Seviye: %d  ➔  Hız: +%d%%\nSonraki: +%d%%" % [current_lvl, current_bonus, next_bonus]
		desc_lbl.add_theme_font_size_override("font_size", 11)
		desc_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.72))
		vbox.add_child(desc_lbl)
		
		var btn := Button.new()
		btn.text = "Geliştir\n%d ₺" % cost
		btn.custom_minimum_size = Vector2(110, 48)
		btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_size_override("font_size", 11)
		
		if GameManager.money < cost:
			btn.disabled = true
			btn.add_theme_color_override("font_color", Color(0.6, 0.3, 0.3))
		else:
			btn.pressed.connect(func():
				GameManager.money -= cost
				GameManager.workstation_upgrades[ws_id] = current_lvl + 1
				GameManager.add_log("🔧 %s tezgahı Seviye %d'e yükseltildi! (-%d ₺)" % [ws_name, current_lvl + 1, cost])
				SoundManager.play("cash_register")
				EventBus.money_changed.emit(GameManager.money)
				_update_upgrades_tab()
			)
			
		hbox.add_child(btn)
		upgrades_grid.add_child(card)

	# ─── SECTION 2: WORKER TRAINING ───
	for w in GameManager.masters:
		var current_lvl = GameManager.worker_levels.get(w.worker_name, 1)
		var cost = current_lvl * 5000
		var current_bonus = (current_lvl - 1) * 15
		var next_bonus = current_lvl * 15
		
		var card := PanelContainer.new()
		var card_style := StyleBoxFlat.new()
		card_style.bg_color = Color(0.12, 0.15, 0.20, 1.0)
		card_style.corner_radius_top_left = 8
		card_style.corner_radius_top_right = 8
		card_style.corner_radius_bottom_right = 8
		card_style.corner_radius_bottom_left = 8
		card_style.border_width_left = 1
		card_style.border_width_right = 1
		card_style.border_width_top = 1
		card_style.border_width_bottom = 1
		card_style.border_color = Color(0.2, 0.24, 0.3)
		card.add_theme_stylebox_override("panel", card_style)
		card.custom_minimum_size = Vector2(440, 90)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		
		var margin_c := MarginContainer.new()
		margin_c.add_theme_constant_override("margin_left", 12)
		margin_c.add_theme_constant_override("margin_right", 12)
		margin_c.add_theme_constant_override("margin_top", 8)
		margin_c.add_theme_constant_override("margin_bottom", 8)
		card.add_child(margin_c)
		
		var hbox := HBoxContainer.new()
		margin_c.add_child(hbox)
		
		var vbox := VBoxContainer.new()
		vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(vbox)
		
		var icon_lbl := Label.new()
		icon_lbl.text = "👷 " + w.worker_name + " (" + w.skill + ")"
		icon_lbl.add_theme_font_size_override("font_size", 13)
		icon_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
		vbox.add_child(icon_lbl)
		
		var desc_lbl := Label.new()
		desc_lbl.text = "Seviye: %d  ➔  Verim: +%d%%\nSonraki: +%d%% (+10 Moral)" % [current_lvl, current_bonus, next_bonus]
		desc_lbl.add_theme_font_size_override("font_size", 11)
		desc_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.72))
		vbox.add_child(desc_lbl)
		
		var btn := Button.new()
		btn.text = "Eğit\n%d ₺" % cost
		btn.custom_minimum_size = Vector2(110, 48)
		btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_size_override("font_size", 11)
		
		if GameManager.money < cost:
			btn.disabled = true
			btn.add_theme_color_override("font_color", Color(0.6, 0.3, 0.3))
		else:
			btn.pressed.connect(func():
				GameManager.money -= cost
				GameManager.worker_levels[w.worker_name] = current_lvl + 1
				var max_m = 110 if GameManager.coffee_machine_owned else 100
				w.morale = clampi(w.morale + 10, 0, max_m)
				GameManager.add_log("🎓 %s mesleki eğitime katıldı ve Seviye %d oldu! (-%d ₺)" % [w.worker_name, current_lvl + 1, cost])
				SoundManager.play("cash_register")
				EventBus.money_changed.emit(GameManager.money)
				EventBus.masters_updated.emit()
				_update_upgrades_tab()
			)
			
		hbox.add_child(btn)
		upgrades_grid.add_child(card)

	# ─── SECTION 3: FACTORY BOOST UPGRADES ───
	var boosts = [
		{
			"id": "coffee",
			"name": "☕ Endüstriyel Kahve Makinesi",
			"desc": "Ustaların maksimum moral limitini 110 yapar ve dinlenme/çay molasında moral yenileme hızını arttırır (+6/sn).",
			"cost": 12000,
			"owned": GameManager.coffee_machine_owned,
			"buy_action": func(): _buy_coffee_machine()
		},
		{
			"id": "software",
			"name": "💻 Gelişmiş Sipariş ve ERP Yazılımı",
			"desc": "Maksimum aktif sipariş kapasitesini 8 yapar ve yeni gelen siparişlerin kazançlarını kalıcı olarak %10 arttırır.",
			"cost": 15000,
			"owned": GameManager.order_software_owned,
			"buy_action": func(): GameManager.order_software_owned = true
		},
		{
			"id": "loader",
			"name": "🚚 Otomatik Yükleme Rampası",
			"desc": "Fabrika kapısına gelen sipariş tırlarının yüklenme bekleme süresini 5 saniyeden 2 saniyeye indirir.",
			"cost": 10000,
			"owned": GameManager.auto_loader_owned,
			"buy_action": func(): GameManager.auto_loader_owned = true
		}
	]
	
	for b in boosts:
		var card := PanelContainer.new()
		var card_style := StyleBoxFlat.new()
		card_style.bg_color = Color(0.14, 0.12, 0.18, 1.0) if b["owned"] else Color(0.12, 0.15, 0.20, 1.0)
		card_style.corner_radius_top_left = 8
		card_style.corner_radius_top_right = 8
		card_style.corner_radius_bottom_right = 8
		card_style.corner_radius_bottom_left = 8
		card_style.border_width_left = 1
		card_style.border_width_right = 1
		card_style.border_width_top = 1
		card_style.border_width_bottom = 1
		card_style.border_color = Color(0.5, 0.4, 0.7) if b["owned"] else Color(0.2, 0.24, 0.3)
		card.add_theme_stylebox_override("panel", card_style)
		card.custom_minimum_size = Vector2(440, 90)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		
		var margin_c := MarginContainer.new()
		margin_c.add_theme_constant_override("margin_left", 12)
		margin_c.add_theme_constant_override("margin_right", 12)
		margin_c.add_theme_constant_override("margin_top", 8)
		margin_c.add_theme_constant_override("margin_bottom", 8)
		card.add_child(margin_c)
		
		var hbox := HBoxContainer.new()
		margin_c.add_child(hbox)
		
		var vbox := VBoxContainer.new()
		vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(vbox)
		
		var name_lbl := Label.new()
		name_lbl.text = b["name"]
		name_lbl.add_theme_font_size_override("font_size", 13)
		name_lbl.add_theme_color_override("font_color", Color(0.95, 0.85, 0.5) if b["owned"] else Color(0.95, 0.95, 0.95))
		vbox.add_child(name_lbl)
		
		var desc_lbl := Label.new()
		desc_lbl.text = b["desc"]
		desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc_lbl.add_theme_font_size_override("font_size", 10)
		desc_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.72))
		vbox.add_child(desc_lbl)
		
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(110, 48)
		btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_size_override("font_size", 11)
		
		if b["owned"]:
			btn.text = "Alındı ✓"
			btn.disabled = true
			btn.add_theme_color_override("font_color_disabled", Color(0.5, 0.8, 0.5))
		else:
			btn.text = "Satın Al\n%d ₺" % b["cost"]
			if GameManager.money < b["cost"]:
				btn.disabled = true
				btn.add_theme_color_override("font_color", Color(0.6, 0.3, 0.3))
			else:
				btn.pressed.connect(func():
					GameManager.money -= b["cost"]
					b["buy_action"].call()
					GameManager.add_log("🚀 %s satın alındı! (-%d ₺)" % [b["name"], b["cost"]])
					SoundManager.play("cash_register")
					EventBus.money_changed.emit(GameManager.money)
					EventBus.masters_updated.emit()
					_update_upgrades_tab()
				)
				
		hbox.add_child(btn)
		upgrades_grid.add_child(card)

func _buy_coffee_machine() -> void:
	GameManager.coffee_machine_owned = true
	for w in GameManager.masters:
		var max_m = 110 if GameManager.coffee_machine_owned else 100
		w.morale = clampi(w.morale + 10, 0, max_m)

func _on_go_to_home() -> void:
	fade_transition(func(): teleport_to_home())

func teleport_to_home() -> void:
	if is_instance_valid(factory_3d) and is_instance_valid(factory_3d.manager_3d):
		var manager = factory_3d.manager_3d
		manager.current_zone = "home"
		manager.global_position = Vector3(-25.0, 1.0, 10.0)
		manager.global_rotation = Vector3.ZERO
		
		if is_instance_valid(factory_3d.camera_3d):
			factory_3d.camera_3d.rotation = Vector3.ZERO
			factory_3d.camera_3d.position = Vector3(0, 1.6, 0)
			
		if is_instance_valid(factory_3d.home_3d_node):
			factory_3d.home_3d_node.update_furnishing()
			
		_toggle_tablet_raise(false)
		
		# Reset camera look variables on manager controller if present
		if manager.get("_rotation_x") != null:
			manager._rotation_x = 0.0
			
		$Map.visible = false
		viewport_container.visible = true
		factory_3d.active = true
		
		# Make sure mouse mode is captured for walkabout
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		
		# Clear prompt
		EventBus.toast_notified.emit("", "info_clear")

var fade_overlay: ColorRect = null

func _get_or_create_fade_overlay() -> ColorRect:
	if fade_overlay == null or not is_instance_valid(fade_overlay):
		fade_overlay = ColorRect.new()
		fade_overlay.name = "FadeOverlay"
		fade_overlay.color = Color(0, 0, 0, 0)
		fade_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
		fade_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
		$CanvasLayer.add_child(fade_overlay)
	# Draw on top
	fade_overlay.get_parent().move_child(fade_overlay, -1)
	return fade_overlay

func fade_transition(callback: Callable) -> void:
	var overlay = _get_or_create_fade_overlay()
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	
	var tween = create_tween()
	tween.tween_property(overlay, "color:a", 1.0, 0.4)
	tween.tween_callback(callback)
	tween.tween_property(overlay, "color:a", 0.0, 0.4)
	tween.tween_callback(func():
		overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	)

func fade_and_sleep() -> void:
	SoundManager.play("day_end")
	fade_transition(func():
		GameManager.start_new_day()
		if is_instance_valid(factory_3d.manager_3d):
			factory_3d.manager_3d.global_position = Vector3(-30.0, 1.0, 5.0)
		if is_instance_valid(factory_3d.home_3d_node):
			factory_3d.home_3d_node.update_furnishing()
		# Refresh the upgrades tab if open on the tablet
		_update_upgrades_tab()
		EventBus.toast_notified.emit("", "info_clear")
	)

func fade_and_exit_home() -> void:
	SoundManager.play("notification")
	fade_transition(func():
		if is_instance_valid(factory_3d.manager_3d):
			factory_3d.manager_3d.current_zone = "factory"
			# Teleport just outside the house door (driveway)
			factory_3d.manager_3d.global_position = Vector3(-25.0, 1.0, 20.0)
			factory_3d.manager_3d.global_rotation = Vector3.ZERO
			if is_instance_valid(factory_3d.camera_3d):
				factory_3d.camera_3d.rotation = Vector3.ZERO
				factory_3d.camera_3d.position = Vector3(0, 1.6, 0)
				
		# Keep paused until they cross into the factory building!
		EventBus.toast_notified.emit("", "info_clear")
	)

func _render_home_upgrades_on_tablet() -> void:
	var upgrades_data = [
		{"key": "bed", "name": "🛏️ Rahat Yatak", "cost": 1000, "desc": "Her sabah ustalara kalıcı +5 Güven bonusu verir."},
		{"key": "tv", "name": "📺 Akıllı TV", "cost": 2000, "desc": "Her sabah ustalara kalıcı +5 Moral bonusu verir."},
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
		
		var owned = GameManager.personal_vehicles.get(key, false) if is_v else GameManager.home_upgrades.get(key, false)
		
		var card := PanelContainer.new()
		var card_style := StyleBoxFlat.new()
		card_style.bg_color = Color(0.14, 0.12, 0.18, 1.0) if owned else Color(0.12, 0.15, 0.20, 1.0)
		card_style.corner_radius_top_left = 8
		card_style.corner_radius_top_right = 8
		card_style.corner_radius_bottom_right = 8
		card_style.corner_radius_bottom_left = 8
		card_style.border_width_left = 1
		card_style.border_width_right = 1
		card_style.border_width_top = 1
		card_style.border_width_bottom = 1
		card_style.border_color = Color(0.24, 0.81, 0.45) if owned else Color(0.2, 0.24, 0.3)
		card.add_theme_stylebox_override("panel", card_style)
		card.custom_minimum_size = Vector2(440, 90)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		
		var margin_c := MarginContainer.new()
		margin_c.add_theme_constant_override("margin_left", 12)
		margin_c.add_theme_constant_override("margin_right", 12)
		margin_c.add_theme_constant_override("margin_top", 8)
		margin_c.add_theme_constant_override("margin_bottom", 8)
		card.add_child(margin_c)
		
		var hbox := HBoxContainer.new()
		margin_c.add_child(hbox)
		
		var vbox := VBoxContainer.new()
		vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(vbox)
		
		var icon_lbl := Label.new()
		icon_lbl.text = item_name + (" (Alındı)" if owned else " - %d ₺" % cost)
		icon_lbl.add_theme_font_size_override("font_size", 13)
		icon_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
		vbox.add_child(icon_lbl)
		
		var desc_lbl := Label.new()
		desc_lbl.text = desc
		desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD
		desc_lbl.add_theme_font_size_override("font_size", 10)
		desc_lbl.add_theme_color_override("font_color", Color(0.65, 0.68, 0.72))
		vbox.add_child(desc_lbl)
		
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(110, 48)
		btn.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
		btn.add_theme_font_size_override("font_size", 11)
		
		if owned:
			btn.text = "Alındı ✓"
			btn.disabled = true
			btn.add_theme_color_override("font_color_disabled", Color(0.5, 0.8, 0.5))
		else:
			btn.text = "Satın Al\n%d ₺" % cost
			if GameManager.personal_balance < cost:
				btn.disabled = true
				btn.add_theme_color_override("font_color", Color(0.6, 0.3, 0.3))
			else:
				btn.pressed.connect(func():
					var success = false
					if is_v:
						success = GameManager.buy_personal_vehicle(key, cost)
					else:
						success = GameManager.buy_home_upgrade(key, cost)
						
					if success:
						# Update 3D visuals instantly
						if is_instance_valid(factory_3d.home_3d_node):
							factory_3d.home_3d_node.update_furnishing()
						if is_instance_valid(factory_3d):
							factory_3d.rebuild_personal_vehicles()
						_update_upgrades_tab()
				)
				
		hbox.add_child(btn)
		upgrades_grid.add_child(card)

func _on_meeting_finished() -> void:
	GameManager.day_ended_and_slept = false
	GameManager.set_paused(false)
	GameManager.add_log("🌅 Mesai başladı! Fabrika kapıları açıldı ve ustalar iş başı yaptı.")
	SoundManager.play("day_start")
	_toggle_tablet_raise(false)
