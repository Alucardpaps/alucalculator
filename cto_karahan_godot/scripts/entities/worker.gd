class_name Worker
extends CharacterBody2D

## Worker entity: Manages worker stats, movement, and FSM.
## Ticked by GameManager to run discrete simulation steps.

@export var speed: float = 180.0

# Worker Stats
var worker_name: String = ""
var hometown: String = ""
var skill: String = ""
var personality_trait: String = ""
var bg: String = ""
var feuds: Array = []
var trust: int = 80
var morale: int = 80
var warnings: int = 0

# Simulation State
var status: String = "idle" # "idle", "working", "slacking", "anxious", "feud"
var bp: Dictionary = {}
var stage_idx: int = 0
var slacking: bool = false
var active_question: Dictionary = {}
var current_ws: String = ""
var anxious_requests_today: int = 0

# Narrative Event State
var event_status: String = ""
var event_days_remaining: int = 0
var speed_modifier: float = 1.0
var event_description: String = ""
var training_speed_bonus: float = 0.0

# Internal state variables
var idle_ticks: int = 0
var slack_ticks: int = 0
var target_pos: Vector2 = Vector2.ZERO:
	set(val):
		target_pos = val
		_update_path()

var path_points: Array[Vector2] = []
var current_state: WorkerState = null

@onready var name_label: Label = $Visual/NameLabel
@onready var status_label: Label = $Visual/StatusLabel
@onready var sprite: Sprite2D = $Visual/Sprite2D

func _ready() -> void:
	target_pos = global_position
	# Make sure collision/input pickable is active to detect clicks
	input_pickable = true
	# Setup initial state
	change_state(IdleState.new(self))
	update_visuals()

func _exit_tree() -> void:
	if current_state:
		current_state.exit()
	TaskScheduler.release_all_for_worker(worker_name)

func setup(data: Dictionary) -> void:
	worker_name = data.get("name", "")
	hometown = data.get("hometown", "")
	skill = data.get("skill", "")
	personality_trait = data.get("trait", "")
	bg = data.get("bg", "")
	feuds = data.get("feuds", [])
	trust = data.get("trust", 80)
	morale = data.get("morale", 80)
	update_visuals()

func _update_path() -> void:
	if GameManager.factory_floor:
		path_points = GameManager.factory_floor.get_astar_path(global_position, target_pos)
	else:
		path_points.clear()
		path_points.append(target_pos)

func _physics_process(_delta: float) -> void:
	if path_points.size() > 0:
		var next_target = path_points[0]
		if global_position.distance_to(next_target) > 10.0:
			var dir = (next_target - global_position).normalized()
			velocity = dir * speed
			move_and_slide()
		else:
			global_position = next_target # Snap
			path_points.remove_at(0)
	else:
		velocity = Vector2.ZERO

func tick() -> void:
	if current_state:
		current_state.execute()
	update_visuals()

func change_state(new_state: WorkerState) -> void:
	if current_state:
		current_state.exit()
	current_state = new_state
	if current_state:
		current_state.enter()
	update_visuals()

func return_to_work_or_idle() -> void:
	if bp.is_empty():
		change_state(IdleState.new(self))
	else:
		change_state(WorkingState.new(self))

## Set worker's target workstation by its key (e.g. 'ws-lazer')
func set_workstation(ws_id: String) -> void:
	current_ws = ws_id
	var ws_node = GameManager.get_workstation_node(ws_id)
	if ws_node:
		# Set target pos near the workstation
		target_pos = ws_node.get_stand_position()
	else:
		# Fallback target pos
		target_pos = global_position

func update_visuals() -> void:
	if not is_node_ready():
		return
		
	if name_label:
		name_label.text = worker_name
	
	if status_label:
		if not active_question.is_empty():
			status_label.text = "❓"
		else:
			match status:
				"idle": status_label.text = "⏳"
				"working": status_label.text = "🔧"
				"slacking": status_label.text = "☕"
				"feud": status_label.text = "🤬"
				"leave": status_label.text = "💤"
				"sick": status_label.text = "🤒"
				"injured": status_label.text = "🩹"
				"offsite": status_label.text = "🚚"
				_: status_label.text = ""
				
	# Modulate sprite color based on status if no custom textures are loaded yet
	if sprite:
		match status:
			"idle":
				sprite.self_modulate = Color(0.7, 0.7, 0.7) # Gray
			"working":
				sprite.self_modulate = Color(0.4, 0.8, 0.4) # Green
			"slacking":
				sprite.self_modulate = Color(0.9, 0.5, 0.2) # Orange
			"feud":
				sprite.self_modulate = Color(0.9, 0.2, 0.2) # Red
			"leave", "sick", "injured", "offsite":
				sprite.self_modulate = Color(0.5, 0.7, 0.9) # Light Blue
			_:
				sprite.self_modulate = Color(1, 1, 1)

func get_preferred_workstation() -> String:
	var factory = GameManager.active_factory
	if factory.is_empty() or not factory.has("workstations"):
		return ""
		
	# Find a workstation matching our skill
	for ws_key in factory["workstations"].keys():
		var ws_data = factory["workstations"][ws_key]
		if ws_data.get("requiredSkill", "") == skill:
			return ws_key
			
	return ""

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if not GameManager.selected_factory_type.is_empty():
		return
	# Open chat when clicked
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var idx = GameManager.masters.find(self)
		if idx != -1:
			EventBus.open_chat.emit(idx)
