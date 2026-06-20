class_name BaseToolVisual
extends RefCounted

## Base class for procedural 2.5D worker tool drawing.
## Implementations must override draw_tool() to perform custom rendering.

func draw_tool(canvas: CanvasItem, state: Dictionary) -> void:
	pass
