class_name StorageVisual
extends BaseWorkstationVisual

const BOX_H: float = 40.0

func draw_workstation(canvas: CanvasItem, _occupied: bool, theme_color: Color, anim_state: float, _time_elapsed: float) -> void:
	# Storage/Paint: Rotating stack indicator
	var rot_offset := Vector2(0, -BOX_H - 5.0 + sin(anim_state) * 3.0)
	canvas.draw_circle(rot_offset, 6.0, theme_color)
	canvas.draw_circle(rot_offset, 3.0, Color.WHITE)
