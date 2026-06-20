class_name BlueprintVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var anim_state: float = state.get("anim_state", 0.0)
	
	# Blueprint unrolling sheet and yellow pencil drawing
	var unroll_w: float = 8.0 + abs(sin(anim_state * 1.5)) * 10.0
	var sheet_rect := Rect2(Vector2(0, -5), Vector2(unroll_w, 10))
	
	# Programmatic stylebox flat for the blueprint container
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.1, 0.25, 0.65)
	sb.border_width_left = 1
	sb.border_width_top = 1
	sb.border_width_right = 1
	sb.border_width_bottom = 1
	sb.border_color = Color(0.1, 0.25, 0.65).darkened(0.25)
	
	canvas.draw_style_box(sb, sheet_rect) # Blue page
	
	if unroll_w > 12.0:
		canvas.draw_rect(Rect2(Vector2(1.5, -4), Vector2(unroll_w - 3.0, 8.0)), Color(0.3, 0.5, 0.9, 0.5), false, 1.0)
		canvas.draw_line(Vector2(4, -2), Vector2(unroll_w - 4.0, 2), Color(1, 1, 1, 0.7), 1.0)
		
	var pencil_pos := Vector2(unroll_w - 2.0, sin(anim_state * 6.0) * 3.0)
	canvas.draw_line(pencil_pos + Vector2(4, -8), pencil_pos, Color(0.9, 0.8, 0.15), 2.0) # Pencil body
	canvas.draw_circle(pencil_pos, 1.5, Color(0.15, 0.15, 0.15)) # Lead tip
