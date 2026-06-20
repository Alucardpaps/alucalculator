class_name FurnaceVisual
extends BaseWorkstationVisual

const BOX_H: float = 40.0

func draw_workstation(canvas: CanvasItem, occupied: bool, _theme_color: Color, anim_state: float, time_elapsed: float) -> void:
	# Furnace: Draw internal heating glow & rising steam/exhaust
	if occupied:
		var glow_radius: float = 10.0 + sin(anim_state * 2.0) * 3.0
		canvas.draw_circle(Vector2(0, -BOX_H * 0.4), glow_radius, Color(1.0, 0.3, 0.0, 0.6))
		canvas.draw_circle(Vector2(0, -BOX_H * 0.4), glow_radius * 0.6, Color(1.0, 0.8, 0.0, 0.9))
		
		# Rising steam/exhaust bubbles
		for k in range(3):
			var phase: float = wrapf(time_elapsed * 1.2 + (float(k) * 0.33), 0.0, 1.0)
			var steam_y: float = -BOX_H - 5.0 - (phase * 22.0)
			var steam_x: float = sin(time_elapsed * 3.0 + float(k)) * 3.5
			var alpha: float = 0.55 * (1.0 - phase)
			canvas.draw_circle(Vector2(steam_x, steam_y), 2.5 + phase * 2.0, Color(0.88, 0.88, 0.92, alpha))
