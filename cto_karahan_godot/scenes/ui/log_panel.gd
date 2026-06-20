extends Panel

## LogPanel UI Controller: Displays factory event logs using RichTextLabel BBCode formatting.

@onready var rich_text_label: RichTextLabel = $MarginContainer/VBoxContainer/RichTextLabel

func _ready() -> void:
	EventBus.log_added.connect(_on_log_added)
	clear_and_rebuild()

func clear_and_rebuild() -> void:
	rich_text_label.clear()
	# GameManager.logs is ordered newest first, but we want to display logs
	# chronologically in the terminal or list, or newest at top.
	# Let's list newest at the top for quick viewing.
	for entry in GameManager.logs:
		_append_entry(entry["time"], entry["day"], entry["text"])

func _on_log_added(time_str: String, day_num: int, text_msg: String) -> void:
	# Add the log at the top of the RichTextLabel (newest first is very user-friendly)
	# Or we can rebuild, or prepend
	var current_text = rich_text_label.text
	rich_text_label.clear()
	_append_entry(time_str, day_num, text_msg)
	rich_text_label.append_text(current_text)

func _append_entry(time_str: String, day_num: int, text_msg: String) -> void:
	var color = "[color=#a1a8b8]"
	if "⚠️" in text_msg or "Maliyet" in text_msg:
		color = "[color=#e5c07b]" # Yellow warning
	elif "🚨" in text_msg or "❌" in text_msg:
		color = "[color=#e06c75]" # Red alarm
	elif "✅" in text_msg or "🎉" in text_msg:
		color = "[color=#98c379]" # Green success
	elif "👷" in text_msg:
		color = "[color=#61afef]" # Blue worker
	elif "🐾" in text_msg:
		color = "[color=#c678dd]" # Purple animal
		
	var formatted = "[color=#5c6370][Gün %d — %s][/color] %s%s[/color]\n" % [day_num, time_str, color, text_msg]
	rich_text_label.append_text(formatted)
