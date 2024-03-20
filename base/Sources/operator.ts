
let operator_ops: map_t<string, any> = map_create();

function operator_register(name: string, call: any) {
	map_set(operator_ops, name, call);
}

function operator_run(name: string) {
	if (map_get(operator_ops, name) != null) {
		map_get(operator_ops, name)();
	}
}

function operator_update() {
	if (mouse_started_any() || keyboard_started_any()) {
		for (let op in config_keymap) {
			if (operator_shortcut(config_keymap[op])) {
				operator_run(op);
			}
		}
	}
}

function operator_shortcut(s: string, type = shortcut_type_t.STARTED): bool {
	if (s == "") {
		return false;
	}
	let shift: bool = string_index_of(s, "shift") >= 0;
	let ctrl: bool = string_index_of(s, "ctrl") >= 0;
	let alt: bool = string_index_of(s, "alt") >= 0;
	let flag: bool = shift == keyboard_down("shift") && ctrl == keyboard_down("control") && alt == keyboard_down("alt");

	if (string_index_of(s, "+") > 0) {
		s = substring(s, string_last_index_of(s, "+") + 1, s.length);
		if (s == "number") {
			return flag;
		}
	}
	else if (shift || ctrl || alt) {
		return flag;
	}

	let key: bool = (s == "left" || s == "right" || s == "middle") ?
		// Mouse
		(type == shortcut_type_t.DOWN ? mouse_down(s) : mouse_started(s)) :
		// Keyboard
		(type == shortcut_type_t.REPEAT ? keyboard_repeat(s) : type == shortcut_type_t.DOWN ? keyboard_down(s) :
		type == shortcut_type_t.RELEASED ? keyboard_released(s) : keyboard_started(s));

	return flag && key;
}

enum shortcut_type_t {
	STARTED,
	REPEAT,
	DOWN,
	RELEASED,
}