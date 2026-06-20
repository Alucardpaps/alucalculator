class_name WorkstationVisual
extends Node2D

## Procedural 2.5D Isometric Workstation Renderer.
## Draws detailed machine/desk shapes, status indicators, and micro-animations.

@onready var parent_ws: Workstation = get_parent() as Workstation

# Animation variables
var _time_elapsed: float = 0.0
var _anim_state: float = 0.0

# Shape configurations
const BOX_W: float = 48.0
const BOX_D: float = 32.0
const BOX_H: float = 40.0

# ─── Colors ──────────────────────────────────────────────────────────────────
const COLOR_FRONT:     Color = Color(0.24, 0.28, 0.35, 1.0)
const COLOR_SIDE:      Color = Color(0.18, 0.21, 0.28, 1.0)
const COLOR_TOP:       Color = Color(0.35, 0.40, 0.48, 1.0)
const COLOR_INDICATOR_BUSY: Color = Color(0.10, 0.90, 0.40, 1.0)
const COLOR_INDICATOR_IDLE: Color = Color(0.90, 0.60, 0.10, 1.0)

var _drawer: BaseWorkstationVisual = null

func _ready() -> void:
	# Enable processing for animations
	set_process(true)
	# Center visual at local origin
	position = Vector2.ZERO
	_setup_drawer()

func _setup_drawer() -> void:
	if not parent_ws:
		_drawer = GearVisual.new()
		return
		
	var ws_type: String = parent_ws.ws_id
	if ws_type == "ws-lazer" or ws_type == "ws-abkant":
		_drawer = LaserVisual.new()
	elif ws_type == "ws-firin" or ws_type == "ws-lehim":
		_drawer = FurnaceVisual.new()
	elif ws_type == "ws-depo" or ws_type == "ws-boya":
		_drawer = StorageVisual.new()
	else:
		_drawer = GearVisual.new()

func _process(delta: float) -> void:
	_time_elapsed += delta
	_anim_state = wrapf(_anim_state + delta * 2.0, 0.0, PI * 2.0)
	queue_redraw()

func _draw() -> void:
	if not parent_ws:
		return
	
	# Determine if workstation is currently occupied
	var is_occupied: bool = _check_if_occupied()
	
	# Primary color modifier based on the required skill's thematic color
	var skill_color_hex: String = FactoryData.SKILL_COLORS.get(parent_ws.required_skill, "#64748b")
	var skill_color: Color = Color(skill_color_hex)
	
	# Draw isometric cuboid for the machine base
	_draw_cuboid(Vector2(0, 0), BOX_W, BOX_D, BOX_H, skill_color)
	
	# Draw specific machine animations
	_draw_machine_animation(is_occupied, skill_color)
	
	# Draw the status light indicator
	_draw_status_indicator(is_occupied)

func _check_if_occupied() -> bool:
	for worker in GameManager.masters:
		if is_instance_valid(worker) and worker.current_ws == parent_ws.ws_id and worker.status == "working":
			return true
	return false

# ─── Bounding Box Drawing ────────────────────────────────────────────────────
func _draw_cuboid(center: Vector2, w: float, d: float, h: float, base_color: Color) -> void:
	var hw := w * 0.5
	var hd := d * 0.5
	
	# Define top vertices
	var t_ctr := center + Vector2(0, -h)
	var t_front := t_ctr + Vector2(0, hd)
	var t_back  := t_ctr + Vector2(0, -hd)
	var t_left  := t_ctr + Vector2(-hw, 0)
	var t_right := t_ctr + Vector2(hw, 0)
	
	# Define bottom vertices
	var b_ctr := center
	var b_front := b_ctr + Vector2(0, hd)
	var b_left  := b_ctr + Vector2(-hw, 0)
	var b_right := b_ctr + Vector2(hw, 0)
	
	# Draw Left/Front-Left Face
	var face_left := PackedVector2Array([b_left, t_left, t_front, b_front])
	draw_colored_polygon(face_left, base_color * COLOR_FRONT)
	
	# Draw Right/Front-Right Face
	var face_right := PackedVector2Array([b_front, t_front, t_right, b_right])
	draw_colored_polygon(face_right, base_color * COLOR_SIDE)
	
	# Draw Top Face
	var face_top := PackedVector2Array([t_front, t_left, t_back, t_right])
	draw_colored_polygon(face_top, base_color * COLOR_TOP)
	
	# Draw borders
	var borders := PackedVector2Array([
		t_left, t_back, t_right, t_front, t_left,
		b_left, b_front, b_right,
	])
	draw_polyline(borders, COLOR_TOP * 1.5, 1.5)
	
	# Draw vertical corner lines
	draw_line(t_left, b_left, COLOR_SIDE, 1.0)
	draw_line(t_front, b_front, COLOR_SIDE, 1.0)
	draw_line(t_right, b_right, COLOR_SIDE, 1.0)

# ─── Specialized Animation Details ───────────────────────────────────────────
func _draw_machine_animation(occupied: bool, theme_color: Color) -> void:
	if _drawer:
		_drawer.draw_workstation(self, occupied, theme_color, _anim_state, _time_elapsed)

# ─── Status Indicator ────────────────────────────────────────────────────────
func _draw_status_indicator(occupied: bool) -> void:
	var ind_pos := Vector2(0, -BOX_H - 22.0)
	var color := COLOR_INDICATOR_BUSY if occupied else COLOR_INDICATOR_IDLE
	
	# Draw pulsing indicator light
	var pulse := sin(_anim_state * 3.0) * 0.15 + 0.85
	var size := 5.0 * pulse
	
	# Glow backing
	draw_circle(ind_pos, size + 4.0, Color(color.r, color.g, color.b, 0.3))
	# Main dot
	draw_circle(ind_pos, size, color)
	draw_circle(ind_pos - Vector2(1, 1), size * 0.4, Color.WHITE)
