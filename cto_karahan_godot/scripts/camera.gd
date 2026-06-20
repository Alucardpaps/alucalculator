extends Camera2D

## Scrollable & Zoomable 2D Camera for navigating the 2.5D factory floor.
## Drag with Middle Mouse Button (or Left Mouse Button when not clicking entities) to pan.
## Scroll Wheel to Zoom.

@export var zoom_speed: float = 0.15
@export var min_zoom: float = 0.4
@export var max_zoom: float = 2.0
@export var drag_speed: float = 1.0
@export var lerp_speed: float = 8.0

var _is_dragging: bool = false
var _target_position: Vector2
var _target_zoom: float = 1.0

func _ready() -> void:
	_target_position = position
	_target_zoom = zoom.x

func _process(delta: float) -> void:
	position = position.lerp(_target_position, lerp_speed * delta)
	var current_zoom_scalar: float = lerp(zoom.x, _target_zoom, lerp_speed * delta)
	zoom = Vector2(current_zoom_scalar, current_zoom_scalar)

func _unhandled_input(event: InputEvent) -> void:
	# Zoom input
	if event is InputEventMouseButton:
		if event.is_pressed():
			if event.button_index == MOUSE_BUTTON_WHEEL_UP:
				_zoom_camera(zoom_speed)
			elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
				_zoom_camera(-zoom_speed)
			elif event.button_index == MOUSE_BUTTON_MIDDLE or event.button_index == MOUSE_BUTTON_LEFT:
				_is_dragging = true
		else:
			if event.button_index == MOUSE_BUTTON_MIDDLE or event.button_index == MOUSE_BUTTON_LEFT:
				_is_dragging = false

	# Drag pan input
	elif event is InputEventMouseMotion and _is_dragging:
		_target_position -= event.relative * (1.0 / zoom.x) * drag_speed

func _zoom_camera(delta: float) -> void:
	_target_zoom = clamp(_target_zoom + delta, min_zoom, max_zoom)

## Directly snaps target and camera position to prevent starting pan lag.
func snap_to_position(pos: Vector2) -> void:
	_target_position = pos
	position = pos

## Sets the target position to pan smoothly towards.
func set_target_position(pos: Vector2) -> void:
	_target_position = pos
