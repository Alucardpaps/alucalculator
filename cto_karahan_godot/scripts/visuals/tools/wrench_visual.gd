class_name WrenchVisual
extends BaseToolVisual

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	var body_color: Color = state.get("body_color", Color.GRAY)
	
	# Wrench fallback
	canvas.draw_line(Vector2.ZERO, Vector2(12, -4), Color.GRAY, 4.0)
	canvas.draw_circle(Vector2(12, -4), 4.0, Color.GRAY)
	canvas.draw_circle(Vector2(12, -4), 1.5, body_color)
