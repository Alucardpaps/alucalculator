class_name GrinderVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var time_elapsed: float = state.get("time_elapsed", 0.0)
	
	# Angle grinder with safety guard, rotating blade, and gravity sparks
	canvas.draw_rect(Rect2(Vector2(-4, -3), Vector2(14, 6)), Color(0.15, 0.42, 0.24)) # Green body
	canvas.draw_rect(Rect2(Vector2(-10, -1.5), Vector2(6, 3)), Color(0.1, 0.1, 0.12)) # Handle
	canvas.draw_arc(Vector2(10, 0), 8.0, -PI * 0.5, PI * 0.5, 8, Color(0.9, 0.75, 0.1), 2.5) # Yellow guard
	
	var spin_angle: float = time_elapsed * 40.0
	canvas.draw_circle(Vector2(10, 0), 6.5, Color(0.68, 0.7, 0.74)) # Disc
	canvas.draw_line(Vector2(10, 0), Vector2(10, 0) + Vector2(cos(spin_angle), sin(spin_angle)) * 6.0, Color(0.3, 0.3, 0.35), 1.5)
	
	for k in range(5):
		var spark_dir: Vector2 = Vector2(randf_range(1.2, 2.2), randf_range(-0.8, 0.8)).normalized()
		var spark_len: float = randf_range(6.0, 18.0)
		var spark_end: Vector2 = Vector2(10, 0) + spark_dir * spark_len + Vector2(0, spark_len * 0.15)
		canvas.draw_line(Vector2(10, 0), spark_end, Color(1.0, 0.65, 0.15, randf_range(0.6, 1.0)), 1.5)
