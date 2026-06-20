class_name BaseWorkstationVisual
extends RefCounted

## Base class for procedural 2.5D workstation drawing.
## Implementations must override draw_workstation() to perform custom rendering.

func draw_workstation(canvas: CanvasItem, occupied: bool, theme_color: Color, anim_state: float, time_elapsed: float) -> void:
	pass
