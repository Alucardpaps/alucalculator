extends Node

## Global Event Bus for decoupled system-to-system and system-to-UI communication.
## Uses static parameter typing for safety and auto-complete in Godot 4.

# State & Stat changes
@warning_ignore("unused_signal")
signal factory_selected(type: String)
@warning_ignore("unused_signal")
signal money_changed(new_amount: int)
@warning_ignore("unused_signal")
signal rating_changed(new_rating: int)
@warning_ignore("unused_signal")
signal boss_trust_changed(new_trust: int)
@warning_ignore("unused_signal")
signal time_changed(day: int, hour: int, minute: int)
@warning_ignore("unused_signal")
signal crunch_time_toggled(active: bool)

# Entity and List updates
@warning_ignore("unused_signal")
signal log_added(time_str: String, day_num: int, text_msg: String)
@warning_ignore("unused_signal")
signal masters_updated()
@warning_ignore("unused_signal")
signal orders_updated()
@warning_ignore("unused_signal")
signal animals_updated()
@warning_ignore("unused_signal")
signal preys_updated()

# Dialogs & Modal triggers
@warning_ignore("unused_signal")
signal open_chat(worker_index: int)
@warning_ignore("unused_signal")
signal open_assign_modal(order_id: String, bp_name: String)
@warning_ignore("unused_signal")
signal open_purchase_modal()
@warning_ignore("unused_signal")
signal toast_notified(message: String, type_str: String)

# Action feedback
@warning_ignore("unused_signal")
signal candidate_hired(worker_name: String, skill: String)
@warning_ignore("unused_signal")
signal game_over(reason: String)
@warning_ignore("unused_signal")
signal show_end_of_day_summary(summary_data: Dictionary)
@warning_ignore("unused_signal")
signal go_to_home()
@warning_ignore("unused_signal")
signal possession_requested(possessable: Node3D)
@warning_ignore("unused_signal")
signal possession_released()
@warning_ignore("unused_signal")
signal request_fade(callback: Callable)
