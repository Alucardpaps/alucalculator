class_name ProbeVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var time_elapsed: float = state.get("time_elapsed", 0.0)
	
	# Handheld test multimeter unit with a sine wave hologram
	canvas.draw_rect(Rect2(Vector2(-3, 1), Vector2(8, 9)), Color(0.2, 0.2, 0.22)) # Tester box
	canvas.draw_rect(Rect2(Vector2(-2, 2), Vector2(6, 7)), Color(0.9, 0.5, 0.1)) # Orange protective casing
	canvas.draw_arc(Vector2(2, 9), 5.0, 0, PI, 6, Color(0.85, 0.1, 0.1), 1.2) # Red cable
	canvas.draw_line(Vector2(4, -1), Vector2(13, -4), Color(0.3, 0.3, 0.35), 2.5) # Probe pen
	canvas.draw_circle(Vector2(13, -4), 1.8, Color(0.1, 0.9, 0.9)) # Probe tip LED
	
	var hologram_ctr := Vector2(2, -15.0)
	canvas.draw_rect(Rect2(hologram_ctr - Vector2(10, 5), Vector2(20, 10)), Color(0.1, 0.9, 0.4, 0.12)) # Hologram box
	
	var wave_pts := PackedVector2Array()
	for step in range(21):
		var wx: float = float(step) - 10.0
		var wy: float = sin(time_elapsed * 12.0 + wx * 0.5) * 3.5
		wave_pts.append(hologram_ctr + Vector2(wx, wy))
	canvas.draw_polyline(wave_pts, Color(0.2, 1.0, 0.5, 0.75), 1.0)
