class_name ClipboardVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	# Detailed wooden clipboard, white paper sheet, checklists and signature line
	
	# Helper stylebox flat for clipboard wood backing
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.48, 0.32, 0.18)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(0.48, 0.32, 0.18).darkened(0.25)
	
	canvas.draw_style_box(sb, Rect2(Vector2(0, -6), Vector2(11, 14))) # Clipboard
	canvas.draw_rect(Rect2(Vector2(1.5, -4.5), Vector2(8, 11)), Color(0.96, 0.96, 0.96)) # Paper
	canvas.draw_rect(Rect2(Vector2(3.5, -6.5), Vector2(4, 2.5)), Color(0.65, 0.65, 0.7)) # Clip
	
	canvas.draw_line(Vector2(3, -2), Vector2(8, -2), Color(0.2, 0.2, 0.2), 1.0)
	canvas.draw_line(Vector2(3, 1), Vector2(8, 1), Color(0.2, 0.2, 0.2), 1.0)
	
	var check_pts := PackedVector2Array([Vector2(3.5, 3.5), Vector2(4.5, 4.5), Vector2(6.5, 2.5)])
	canvas.draw_polyline(check_pts, Color(0.1, 0.65, 0.2), 1.2) # Green checkmark
	
	canvas.draw_line(Vector2(7.0, 4.0), Vector2(11.0, 8.0), Color(0.1, 0.1, 0.9), 1.8) # Blue pen
