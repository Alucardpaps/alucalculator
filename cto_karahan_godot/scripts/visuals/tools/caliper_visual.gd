class_name CaliperVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var anim_state: float = state.get("anim_state", 0.0)
	
	# Digital steel caliper measuring a bronze pin
	var slide_val: float = abs(sin(anim_state * 2.0)) * 6.0
	canvas.draw_rect(Rect2(Vector2(2, 1), Vector2(slide_val + 1.0, 3.5)), Color(0.8, 0.5, 0.2)) # Workpiece
	canvas.draw_line(Vector2(-4, 0), Vector2(18, 0), Color(0.78, 0.8, 0.83), 2.5) # Scale
	canvas.draw_line(Vector2(0, 0), Vector2(0, 5), Color(0.78, 0.8, 0.83), 2.0) # Fixed jaw
	canvas.draw_rect(Rect2(Vector2(1, -3), Vector2(7, 4.5)), Color(0.1, 0.1, 0.12)) # Screen frame
	canvas.draw_rect(Rect2(Vector2(2, -2.5), Vector2(5, 3.5)), Color(0.5, 0.85, 0.5)) # LCD green screen
	
	var sx: float = 2.0 + slide_val
	canvas.draw_line(Vector2(sx, 0), Vector2(sx, 5), Color(0.72, 0.74, 0.78), 2.0) # Slider jaw
