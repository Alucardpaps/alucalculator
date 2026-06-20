class_name Workstation
extends Node2D

## Workstation entity: Represents a machine or room on the factory floor.
## Setup dynamically by the game board based on the selected factory template.

@export var ws_id: String = ""
@export var station_name: String = ""
@export var station_icon: String = ""
@export var required_skill: String = ""

@onready var icon_label: Label = $Visual/IconLabel
@onready var name_label: Label = $Visual/NameLabel
@onready var workers_container: Node2D = $WorkersContainer

func _ready() -> void:
	update_visuals()

## Set workstation details programmatically.
func setup(p_id: String, p_data: Dictionary) -> void:
	ws_id = p_id
	station_name = p_data.get("name", "")
	station_icon = p_data.get("icon", "")
	required_skill = p_data.get("requiredSkill", "")
	update_visuals()

## Update the Labels when parameters change.
func update_visuals() -> void:
	if not is_node_ready():
		return
	if icon_label:
		icon_label.text = station_icon
	if name_label:
		name_label.text = station_name
		# Assign a color tag to the label background based on the required skill
		var skill_color = FactoryData.SKILL_COLORS.get(required_skill, "#64748b")
		name_label.modulate = Color(skill_color)

## Get the global target position where a worker should stand.
func get_stand_position() -> Vector2:
	return global_position + Vector2(0, 24.0)
