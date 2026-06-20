class_name DrillVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var time_elapsed: float = state.get("time_elapsed", 0.0)
	
	# Electric drill with rechargeable battery pack and metal shavings
	canvas.draw_rect(Rect2(Vector2(-2, -1), Vector2(4.5, 7.0)), Color(0.1, 0.1, 0.12)) # Handle
	canvas.draw_rect(Rect2(Vector2(-3, 6.0), Vector2(6.5, 3.0)), Color(0.8, 0.45, 0.1)) # Battery
	canvas.draw_rect(Rect2(Vector2(-2, -3.5), Vector2(9.0, 5.0)), Color(0.1, 0.35, 0.35)) # Teal body
	canvas.draw_line(Vector2(7.0, -1.0), Vector2(14.0, -1.0), Color(0.7, 0.7, 0.72), 2.2) # Bit
	
	if int(time_elapsed * 15.0) % 2 == 0:
		var curl_pos := Vector2(14.0, -1.0)
		canvas.draw_arc(curl_pos + Vector2(2, 2), 2.5, -PI, 0, 4, Color(0.6, 0.6, 0.6), 1.0)
		canvas.draw_arc(curl_pos + Vector2(4, -1), 2.0, 0, PI, 4, Color(0.6, 0.6, 0.6), 1.0)
