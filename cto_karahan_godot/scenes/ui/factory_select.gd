extends Panel

## FactorySelect UI Controller: Initial overlay for choosing the factory template.

@onready var radiator_btn: Button = $MarginContainer/VBoxContainer/GridContainer/RadiatorPanel/VBoxContainer/SelectBtn
@onready var gearbox_btn: Button = $MarginContainer/VBoxContainer/GridContainer/GearboxPanel/VBoxContainer/SelectBtn
@onready var armored_btn: Button = $MarginContainer/VBoxContainer/GridContainer/ArmoredPanel/VBoxContainer/SelectBtn

func _ready() -> void:
	radiator_btn.pressed.connect(func(): _select("radiator"))
	gearbox_btn.pressed.connect(func(): _select("gearbox"))
	armored_btn.pressed.connect(func(): _select("armored"))
	
	# Pause the game initially so time doesn't tick until factory is chosen
	GameManager.set_paused(true)
	visible = true

func _select(type: String) -> void:
	SoundManager.play("notification")
	GameManager.select_factory(type)
	visible = false
