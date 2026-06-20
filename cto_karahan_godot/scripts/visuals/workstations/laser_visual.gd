class_name LaserVisual
extends BaseWorkstationVisual

const BOX_W: float = 48.0
const BOX_D: float = 32.0
const BOX_H: float = 40.0

func draw_workstation(canvas: CanvasItem, occupied: bool, _theme_color: Color, anim_state: float, _time_elapsed: float) -> void:
	# Laser or Press: Draw sliding glowing bar
	var pulse: float = sin(anim_state) * 0.5 + 0.5
	var y_offset: float = -BOX_H + (pulse * (BOX_H - 10.0) if occupied else 5.0)
	var bar_pts := PackedVector2Array([
		Vector2(-BOX_W * 0.4, y_offset),
		Vector2(0, y_offset + BOX_D * 0.4),
		Vector2(BOX_W * 0.4, y_offset),
		Vector2(0, y_offset - BOX_D * 0.4),
	])
	
	var ws_type: String = ""
	if canvas and "parent_ws" in canvas and canvas.parent_ws:
		ws_type = canvas.parent_ws.ws_id
		
	var glow_color := Color(0.0, 0.9, 1.0, 0.8) if ws_type == "ws-lazer" else Color(0.9, 0.4, 0.1, 0.8)
	canvas.draw_colored_polygon(bar_pts, glow_color)
