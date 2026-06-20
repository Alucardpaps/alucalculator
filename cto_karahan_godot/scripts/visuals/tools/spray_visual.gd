class_name SprayVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var time_elapsed: float = state.get("time_elapsed", 0.0)
	var p_color: Color = state.get("helmet_color", Color.WHITE)
	
	# Spray gun with paint canister and paint mist clouds
	canvas.draw_circle(Vector2(2, -6), 3.5, Color(0.85, 0.85, 0.85)) # Canister
	canvas.draw_line(Vector2(2, -3), Vector2(2, 0), Color(0.6, 0.6, 0.6), 2.0)
	canvas.draw_rect(Rect2(Vector2(-3, -1), Vector2(5, 9)), Color(0.25, 0.25, 0.28)) # Handle
	canvas.draw_line(Vector2(0, 1), Vector2(10, 1), Color(0.7, 0.7, 0.75), 4.5) # Barrel
	
	var pulse: float = sin(time_elapsed * 35.0) * 2.0
	canvas.draw_line(Vector2(10, 1), Vector2(24, -5.0 - pulse), Color(p_color.r, p_color.g, p_color.b, 0.22), 2.5)
	canvas.draw_line(Vector2(10, 1), Vector2(24, 7.0 + pulse), Color(p_color.r, p_color.g, p_color.b, 0.22), 2.5)
	
	for j in range(3):
		var cloud_x: float = randf_range(16.0, 26.0)
		var cloud_y: float = randf_range(-4.0, 4.0)
		canvas.draw_circle(Vector2(cloud_x, cloud_y), randf_range(2.0, 5.0), Color(p_color.r, p_color.g, p_color.b, 0.35))
