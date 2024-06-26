
///if (is_paint || is_sculpt)

let ui_toolbar_default_w: i32 = 36;

let ui_toolbar_handle: zui_handle_t = zui_handle_create();
let ui_toolbar_w: i32 = ui_toolbar_default_w;
let ui_toolbar_last_tool: i32 = 0;

let ui_toolbar_tool_names: string[] = [
	_tr("Brush"),
	_tr("Eraser"),
	_tr("Fill"),
	_tr("Decal"),
	_tr("Text"),
	_tr("Clone"),
	_tr("Blur"),
	_tr("Smudge"),
	_tr("Particle"),
	_tr("ColorID"),
	_tr("Picker"),
	_tr("Bake"),
	_tr("Gizmo"),
	_tr("Material"),
];

function ui_toolbar_init() {
}

let _ui_toolbar_i: i32;

function ui_toolbar_draw_tool(i: i32, ui: zui_t, img: image_t, icon_accent: i32, keys: string[]) {
	ui._x += 2;
	if (context_raw.tool == i) {
		ui_toolbar_draw_highlight();
	}
	let tile_y: i32 = math_floor(i / 12);
	let tile_x: i32 = tile_y % 2 == 0 ? i % 12 : (11 - (i % 12));
	let rect: rect_t = resource_tile50(img, tile_x, tile_y);
	let _y: i32 = ui._y;

	let image_state: zui_state_t = _zui_image(img, icon_accent, -1.0, rect.x, rect.y, rect.w, rect.h);
	if (image_state == zui_state_t.STARTED) {
		_ui_toolbar_i = i;
		app_notify_on_next_frame(function() {
			context_select_tool(_ui_toolbar_i);
		});
	}
	else if (image_state == zui_state_t.RELEASED && config_raw.layout[layout_size_t.HEADER] == 0) {
		if (ui_toolbar_last_tool == i) {
			ui_toolbar_tool_properties_menu();
		}
		ui_toolbar_last_tool = i;
	}

	///if is_paint
	if (i == workspace_tool_t.COLORID && context_raw.colorid_picked) {
		let rt: render_target_t = map_get(render_path_render_targets, "texpaint_colorid");
		g2_draw_scaled_sub_image(rt._image, 0, 0, 1, 1, 0, _y + 1.5 * zui_SCALE(ui), 5 * zui_SCALE(ui), 34 * zui_SCALE(ui));
	}
	///end

	if (ui.is_hovered) {
		zui_tooltip(tr(ui_toolbar_tool_names[i]) + " " + keys[i]);
	}
	ui._x -= 2;
	ui._y += 2;
}

function ui_toolbar_render_ui() {
	let ui: zui_t = ui_base_ui;

	if (config_raw.touch_ui) {
		ui_toolbar_w = ui_toolbar_default_w + 6;
	}
	else {
		ui_toolbar_w = ui_toolbar_default_w;
	}
	ui_toolbar_w = math_floor(ui_toolbar_w * zui_SCALE(ui));

	if (zui_window(ui_toolbar_handle, 0, ui_header_h, ui_toolbar_w, sys_height() - ui_header_h)) {
		ui._y -= 4 * zui_SCALE(ui);

		ui.image_scroll_align = false;
		let img: image_t = resource_get("icons.k");

		let col: u32 = ui.ops.theme.WINDOW_BG_COL;
		let light: bool = col > 0xff666666;
		let icon_accent: i32 = light ? 0xff666666 : -1;

		// Properties icon
		if (config_raw.layout[layout_size_t.HEADER] == 1) {
			let rect: rect_t = resource_tile50(img, 7, 1);
			if (_zui_image(img, light ? 0xff666666 : ui.ops.theme.BUTTON_COL, -1.0, rect.x, rect.y, rect.w, rect.h) == zui_state_t.RELEASED) {
				config_raw.layout[layout_size_t.HEADER] = 0;
			}
		}
		// Draw ">>" button if header is hidden
		else {
			let _ELEMENT_H: i32 = ui.ops.theme.ELEMENT_H;
			let _BUTTON_H: i32 = ui.ops.theme.BUTTON_H;
			let _BUTTON_COL: i32 = ui.ops.theme.BUTTON_COL;
			let _fontOffsetY: i32 = ui.font_offset_y;
			ui.ops.theme.ELEMENT_H = math_floor(ui.ops.theme.ELEMENT_H * 1.5);
			ui.ops.theme.BUTTON_H = ui.ops.theme.ELEMENT_H;
			ui.ops.theme.BUTTON_COL = ui.ops.theme.WINDOW_BG_COL;
			let font_height: i32 = g2_font_height(ui.ops.font, ui.font_size);
			ui.font_offset_y = (zui_ELEMENT_H(ui) - font_height) / 2;
			let _w: i32 = ui._w;
			ui._w = ui_toolbar_w;

			if (zui_button(">>")) {
				ui_toolbar_tool_properties_menu();
			}

			ui._w = _w;
			ui.ops.theme.ELEMENT_H = _ELEMENT_H;
			ui.ops.theme.BUTTON_H = _BUTTON_H;
			ui.ops.theme.BUTTON_COL = _BUTTON_COL;
			ui.font_offset_y = _fontOffsetY;
		}
		if (ui.is_hovered) {
			zui_tooltip(tr("Toggle header"));
		}
		ui._y -= 4 * zui_SCALE(ui);

		let vars_brush: map_t<string, string> = map_create();
		map_set(vars_brush, "key", map_get(config_keymap, "brush_ruler"));
		map_set(vars_brush, "action_paint", map_get(config_keymap, "action_paint"));

		let vars_decal: map_t<string, string> = map_create();
		map_set(vars_decal, "key", map_get(config_keymap, "decal_mask"));

		let vars_clone: map_t<string, string> = map_create();
		map_set(vars_clone, "key", map_get(config_keymap, "set_clone_source"));

		let key_tool_brush: string = map_get(config_keymap, "tool_brush");
		let key_tool_eraser: string = map_get(config_keymap, "tool_eraser");
		let key_tool_fill: string = map_get(config_keymap, "tool_fill");
		let key_tool_decal: string = map_get(config_keymap, "tool_decal");
		let key_tool_text: string = map_get(config_keymap, "tool_text");
		let key_tool_clone: string = map_get(config_keymap, "tool_clone");
		let key_tool_blur: string = map_get(config_keymap, "tool_blur");
		let key_tool_smudge: string = map_get(config_keymap, "tool_smudge");
		let key_tool_particle: string = map_get(config_keymap, "tool_particle");
		let key_tool_colorid: string = map_get(config_keymap, "tool_colorid");
		let key_tool_picker: string = map_get(config_keymap, "tool_picker");
		let key_tool_bake: string = map_get(config_keymap, "tool_bake");
		let key_tool_gizmo: string = map_get(config_keymap, "tool_gizmo");
		let key_tool_material: string = map_get(config_keymap, "tool_material");

		key_tool_brush = "(" + key_tool_brush + ") - " + tr("Hold {action_paint} to paint\nHold {key} and press {action_paint} to paint a straight line (ruler mode)", vars_brush);
		key_tool_eraser = "(" + key_tool_eraser + ") - " + tr("Hold {action_paint} to erase\nHold {key} and press {action_paint} to erase a straight line (ruler mode)", vars_brush);
		key_tool_fill = "(" + key_tool_fill + ")";
		key_tool_decal = "(" + key_tool_decal + ") - " + tr("Hold {key} to paint on a decal mask", vars_decal);
		key_tool_text = "(" + key_tool_text + ") - " + tr("Hold {key} to use the text as a mask", vars_decal);
		key_tool_clone = "(" + key_tool_clone + ") - " + tr("Hold {key} to set source", vars_clone);
		key_tool_blur = "(" + key_tool_blur + ")";
		key_tool_smudge = "(" + key_tool_smudge + ")";
		key_tool_particle = "(" + key_tool_particle + ")";
		key_tool_colorid = "(" + key_tool_colorid + ")";
		key_tool_picker = "(" + key_tool_picker + ")";
		key_tool_bake = "(" + key_tool_bake + ")";
		key_tool_gizmo = "(" + key_tool_gizmo + ")";
		key_tool_material = "(" + key_tool_material + ")";

		let keys: string[] = [
			key_tool_brush,
			key_tool_eraser,
			key_tool_fill,
			key_tool_decal,
			key_tool_text,
			key_tool_clone,
			key_tool_blur,
			key_tool_smudge,
			key_tool_particle,
			key_tool_colorid,
			key_tool_picker,
			key_tool_bake,
			key_tool_gizmo,
			key_tool_material
		];

		ui_toolbar_draw_tool(workspace_tool_t.BRUSH, ui, img, icon_accent, keys);
		///if is_paint
		ui_toolbar_draw_tool(workspace_tool_t.ERASER, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.FILL, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.DECAL, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.TEXT, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.CLONE, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.BLUR, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.SMUDGE, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.PARTICLE, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.COLORID, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.PICKER, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.BAKE, ui, img, icon_accent, keys);
		ui_toolbar_draw_tool(workspace_tool_t.MATERIAL, ui, img, icon_accent, keys);
		///end

		///if is_forge
		ui_toolbar_draw_tool(workspace_tool_t.GIZMO, ui, img, icon_accent, keys);
		///end

		ui.image_scroll_align = true;
	}

	if (config_raw.touch_ui) {
		// Hide scrollbar
		let _SCROLL_W: i32 = ui.ops.theme.SCROLL_W;
		ui.ops.theme.SCROLL_W = 0;
		zui_end_window();
		ui.ops.theme.SCROLL_W = _SCROLL_W;
	}
}

let _ui_toolbar_tool_properties_menu_x: i32;
let _ui_toolbar_tool_properties_menu_y: i32;
let _ui_toolbar_tool_properties_menu_w: i32;

function ui_toolbar_tool_properties_menu() {
	let ui: zui_t = ui_base_ui;
	_ui_toolbar_tool_properties_menu_x = ui._x;
	_ui_toolbar_tool_properties_menu_y = ui._y;
	_ui_toolbar_tool_properties_menu_w = ui._w;
	ui_menu_draw(function (ui: zui_t) {
		let start_y: i32 = ui._y;
		ui.changed = false;

		ui_header_draw_tool_properties(ui);

		if (ui.changed) {
			ui_menu_keep_open = true;
		}

		if (zui_button(tr("Pin to Header"), zui_align_t.LEFT)) {
			config_raw.layout[layout_size_t.HEADER] = 1;
		}

		let h: i32 = ui._y - start_y;
		ui_menu_elements = math_floor(h / zui_ELEMENT_H(ui));
		ui_menu_x = math_floor(_ui_toolbar_tool_properties_menu_x + _ui_toolbar_tool_properties_menu_w + 2);
		ui_menu_y = math_floor(_ui_toolbar_tool_properties_menu_y - 6 * zui_SCALE(ui));
		ui_menu_fit_to_screen();

	}, 0);

	// First draw out of screen, then align the menu based on menu height
	ui_menu_x = -sys_width();
	ui_menu_y = -sys_height();
}

function ui_toolbar_draw_highlight() {
	let ui: zui_t = ui_base_ui;
	let size: i32 = ui_toolbar_w - 4;
	g2_set_color(ui.ops.theme.HIGHLIGHT_COL);
	zui_draw_rect(true, ui._x + -1,  ui._y + 2, size + 2, size + 2);
}

///end
