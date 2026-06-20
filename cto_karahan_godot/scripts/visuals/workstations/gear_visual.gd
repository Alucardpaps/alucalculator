class_name GearVisual
extends BaseWorkstationVisual

const BOX_H: float = 40.0
const COLOR_FRONT: Color = Color(0.24, 0.28, 0.35, 1.0)

func draw_workstation(canvas: CanvasItem, occupied: bool, _theme_color: Color, _anim_state: float, time_elapsed: float) -> void:
	# Default: Simple rotating gear indicator
	var angle: float = time_elapsed * 4.0 if occupied else 0.0
	var r_ctr := Vector2(0, -BOX_H * 0.5)
	canvas.draw_circle(r_ctr, 8.0, COLOR_FRONT * 0.5)
	
	# Draw gear teeth lines
	for i in range(8):
		var a: float = angle + (float(i) * PI / 4.0)
		var start: Vector2 = r_ctr + Vector2(cos(a), sin(a)) * 5.0
		var end: Vector2 = r_ctr + Vector2(cos(a), sin(a)) * 11.0
		canvas.draw_line(start, end, COLOR_FRONT * 0.5, 3.0)
