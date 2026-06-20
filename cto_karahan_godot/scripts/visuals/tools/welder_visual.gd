class_name WelderVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var time_elapsed: float = state.get("time_elapsed", 0.0)
	
	# Welding torch with dual red/blue gas lines and arc light flashes
	canvas.draw_arc(Vector2(-4, 4), 6.0, 0, PI, 8, Color(0.8, 0.2, 0.2), 1.5) # Red hose
	canvas.draw_arc(Vector2(-2, 6), 6.0, 0, PI, 8, Color(0.2, 0.4, 0.8), 1.5) # Blue hose
	canvas.draw_line(Vector2.ZERO, Vector2(12, -2), Color(0.18, 0.18, 0.2), 4.5) # Handle
	canvas.draw_circle(Vector2(4, -1), 2.0, Color(0.8, 0.2, 0.2)) # Red valve knob
	canvas.draw_circle(Vector2(8, -2), 2.0, Color(0.2, 0.4, 0.8)) # Blue valve knob
	canvas.draw_line(Vector2(12, -2), Vector2(18, -4), Color(0.78, 0.6, 0.15), 3.0) # Brass tip nozzle
	
	var pulse: float = sin(time_elapsed * 60.0) * 0.5 + 0.5
	canvas.draw_circle(Vector2(18, -4), 7.0 + pulse * 5.0, Color(0.5, 0.85, 1.0, 0.35)) # Outer glow
	canvas.draw_circle(Vector2(18, -4), 3.0 + pulse * 2.0, Color(1.0, 1.0, 1.0, 0.95)) # Inner arc core
	
	for k in range(6):
		var spark_dir: Vector2 = Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)).normalized()
		var spark_len: float = randf_range(5.0, 14.0)
		canvas.draw_line(Vector2(18, -4), Vector2(18, -4) + spark_dir * spark_len, Color(0.45, 0.9, 1.0, 0.9), 1.3)
