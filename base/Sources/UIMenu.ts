
class UIMenu {

	static show: bool = false;
	static menu_category: i32 = 0;
	static menu_category_w: i32 = 0;
	static menu_category_h: i32 = 0;
	static menu_x: i32 = 0;
	static menu_y: i32 = 0;
	static menu_elements: i32 = 0;
	static keep_open: bool = false;
	static menu_commands: (ui: zui_t)=>void = null;
	static show_menu_first: bool = true;
	static hide_menu: bool = false;

	static render = () => {
		let ui: zui_t = base_ui_menu;
		let menu_w: i32 = UIMenu.menu_commands != null ? Math.floor(base_default_element_w * zui_SCALE(base_ui_menu) * 2.3) : Math.floor(zui_ELEMENT_W(ui) * 2.3);
		let _BUTTON_COL: i32 = ui.t.BUTTON_COL;
		ui.t.BUTTON_COL = ui.t.SEPARATOR_COL;
		let _ELEMENT_OFFSET: i32 = ui.t.ELEMENT_OFFSET;
		ui.t.ELEMENT_OFFSET = 0;
		let _ELEMENT_H: i32 = ui.t.ELEMENT_H;
		ui.t.ELEMENT_H = config_raw.touch_ui ? (28 + 2) : 28;

		zui_begin_region(ui, UIMenu.menu_x, UIMenu.menu_y, menu_w);

		if (UIMenu.menu_commands != null) {
			g2_set_color(ui.t.ACCENT_SELECT_COL);
			zui_draw_rect(true, ui._x + -1, ui._y + -1, ui._w + 2, zui_ELEMENT_H(ui) * UIMenu.menu_elements + 2);
			g2_set_color(ui.t.SEPARATOR_COL);
			zui_draw_rect(true, ui._x + 0, ui._y + 0, ui._w, zui_ELEMENT_H(ui) * UIMenu.menu_elements);
			g2_set_color(0xffffffff);

			UIMenu.menu_commands(ui);
		}
		else {
			UIMenu.menu_start(ui);
			if (UIMenu.menu_category == menu_category_t.FILE) {
				if (UIMenu.menu_button(ui, tr("New .."), config_keymap.file_new)) project_new_box();
				if (UIMenu.menu_button(ui, tr("Open..."), config_keymap.file_open)) project_open();
				if (UIMenu.menu_button(ui, tr("Open Recent..."), config_keymap.file_open_recent)) BoxProjects.show();
				if (UIMenu.menu_button(ui, tr("Save"), config_keymap.file_save)) project_save();
				if (UIMenu.menu_button(ui, tr("Save As..."), config_keymap.file_save_as)) project_save_as();
				UIMenu.menu_separator(ui);
				if (UIMenu.menu_button(ui, tr("Import Texture..."), config_keymap.file_import_assets)) project_import_asset(path_texture_formats.join(","), false);
				if (UIMenu.menu_button(ui, tr("Import Envmap..."))) {
					UIFiles.show("hdr", false, false, (path: string) => {
						if (!path.endsWith(".hdr")) {
							console_error(tr("Error: .hdr file expected"));
							return;
						}
						ImportAsset.run(path);
					});
				}

				///if (is_paint || is_sculpt)
				if (UIMenu.menu_button(ui, tr("Import Font..."))) project_import_asset("ttf,ttc,otf");
				if (UIMenu.menu_button(ui, tr("Import Material..."))) project_import_material();
				if (UIMenu.menu_button(ui, tr("Import Brush..."))) project_import_brush();
				///end

				///if (is_paint || is_lab)
				if (UIMenu.menu_button(ui, tr("Import Swatches..."))) project_import_swatches();
				///end
				if (UIMenu.menu_button(ui, tr("Import Mesh..."))) project_import_mesh();
				if (UIMenu.menu_button(ui, tr("Reimport Mesh"), config_keymap.file_reimport_mesh)) project_reimport_mesh();
				if (UIMenu.menu_button(ui, tr("Reimport Textures"), config_keymap.file_reimport_textures)) project_reimport_textures();
				UIMenu.menu_separator(ui);
				///if (is_paint || is_lab)
				if (UIMenu.menu_button(ui, tr("Export Textures..."), config_keymap.file_export_textures_as)) {
					///if is_paint
					context_raw.layers_export = export_mode_t.VISIBLE;
					///end
					BoxExport.show_textures();
				}
				if (UIMenu.menu_button(ui, tr("Export Swatches..."))) project_export_swatches();
				///end
				if (UIMenu.menu_button(ui, tr("Export Mesh..."))) {
					context_raw.export_mesh_index = 0; // All
					BoxExport.show_mesh();
				}

				///if is_paint
				if (UIMenu.menu_button(ui, tr("Bake Material..."))) BoxExport.show_bake_material();
				///end

				UIMenu.menu_separator(ui);
				if (UIMenu.menu_button(ui, tr("Exit"))) sys_stop();
			}
			else if (UIMenu.menu_category == menu_category_t.EDIT) {
				let step_undo: string = "";
				let step_redo: string = "";
				if (history_undos > 0) {
					step_undo = history_steps[history_steps.length - 1 - history_redos].name;
				}
				if (history_redos > 0) {
					step_redo = history_steps[history_steps.length - history_redos].name;
				}
				ui.enabled = history_undos > 0;
				if (UIMenu.menu_button(ui, tr("Undo {step}", new Map([["step", step_undo]])), config_keymap.edit_undo)) history_undo();
				ui.enabled = history_redos > 0;
				if (UIMenu.menu_button(ui, tr("Redo {step}", new Map([["step", step_redo]])), config_keymap.edit_redo)) history_redo();
				ui.enabled = true;
				UIMenu.menu_separator(ui);
				if (UIMenu.menu_button(ui, tr("Preferences..."), config_keymap.edit_prefs)) BoxPreferences.show();
			}
			else if (UIMenu.menu_category == menu_category_t.VIEWPORT) {
				if (UIMenu.menu_button(ui, tr("Distract Free"), config_keymap.view_distract_free)) {
					UIBase.toggle_distract_free();
					UIBase.ui.is_hovered = false;
				}

				///if !(krom_android || krom_ios)
				if (UIMenu.menu_button(ui, tr("Toggle Fullscreen"), "alt+enter")) {
					base_toggle_fullscreen();
				}
				///end

				ui.changed = false;

				UIMenu.menu_fill(ui);
				let p: world_data_t = scene_world;
				let env_handle: zui_handle_t = zui_handle("uimenu_0");
				env_handle.value = p.strength;
				UIMenu.menu_align(ui);
				p.strength = zui_slider(env_handle, tr("Environment"), 0.0, 8.0, true);
				if (env_handle.changed) context_raw.ddirty = 2;

				UIMenu.menu_fill(ui);
				let enva_handle: zui_handle_t = zui_handle("uimenu_1");
				enva_handle.value = context_raw.envmap_angle / Math.PI * 180.0;
				if (enva_handle.value < 0) {
					enva_handle.value += (Math.floor(-enva_handle.value / 360) + 1) * 360;
				}
				else if (enva_handle.value > 360) {
					enva_handle.value -= Math.floor(enva_handle.value / 360) * 360;
				}
				UIMenu.menu_align(ui);
				context_raw.envmap_angle = zui_slider(enva_handle, tr("Environment Angle"), 0.0, 360.0, true, 1) / 180.0 * Math.PI;
				if (ui.is_hovered) zui_tooltip(tr("{shortcut} and move mouse", new Map([["shortcut", config_keymap.rotate_envmap]])));
				if (enva_handle.changed) context_raw.ddirty = 2;

				if (scene_lights.length > 0) {
					let light: light_object_t = scene_lights[0];

					UIMenu.menu_fill(ui);
					let lhandle: zui_handle_t = zui_handle("uimenu_2");
					let scale: f32 = 1333;
					lhandle.value = light.data.strength / scale;
					lhandle.value = Math.floor(lhandle.value * 100) / 100;
					UIMenu.menu_align(ui);
					light.data.strength = zui_slider(lhandle, tr("Light"), 0.0, 4.0, true) * scale;
					if (lhandle.changed) context_raw.ddirty = 2;

					UIMenu.menu_fill(ui);
					light = scene_lights[0];
					let lahandle: zui_handle_t = zui_handle("uimenu_3");
					lahandle.value = context_raw.light_angle / Math.PI * 180;
					UIMenu.menu_align(ui);
					let new_angle: f32 = zui_slider(lahandle, tr("Light Angle"), 0.0, 360.0, true, 1) / 180 * Math.PI;
					if (ui.is_hovered) zui_tooltip(tr("{shortcut} and move mouse", new Map([["shortcut", config_keymap.rotate_light]])));
					let ldiff: f32 = new_angle - context_raw.light_angle;
					if (Math.abs(ldiff) > 0.005) {
						if (new_angle < 0) new_angle += (Math.floor(-new_angle / (2 * Math.PI)) + 1) * 2 * Math.PI;
						else if (new_angle > 2 * Math.PI) new_angle -= Math.floor(new_angle / (2 * Math.PI)) * 2 * Math.PI;
						context_raw.light_angle = new_angle;
						let m: mat4_t = mat4_rot_z(ldiff);
						mat4_mult_mat(light.base.transform.local, m);
						transform_decompose(light.base.transform);
						context_raw.ddirty = 2;
					}

					UIMenu.menu_fill(ui);
					let sxhandle: zui_handle_t = zui_handle("uimenu_4");
					sxhandle.value = light.data.size;
					UIMenu.menu_align(ui);
					light.data.size = zui_slider(sxhandle, tr("Light Size"), 0.0, 4.0, true);
					if (sxhandle.changed) context_raw.ddirty = 2;
				}

				///if (is_paint || is_sculpt)
				UIMenu.menu_fill(ui);
				let split_view_handle: zui_handle_t = zui_handle("uimenu_5", { selected: context_raw.split_view });
				context_raw.split_view = zui_check(split_view_handle, " " + tr("Split View"));
				if (split_view_handle.changed) {
					base_resize();
				}
				///end

				///if is_lab
				UIMenu.menu_fill(ui);
				let brush_scale_handle: zui_handle_t = zui_handle("uimenu_6", { value: context_raw.brush_scale });
				UIMenu.menu_align(ui);
				context_raw.brush_scale = zui_slider(brush_scale_handle, tr("UV Scale"), 0.01, 5.0, true);
				if (brush_scale_handle.changed) {
					MakeMaterial.parse_mesh_material();
					///if (krom_direct3d12 || krom_vulkan || krom_metal)
					RenderPathRaytrace.uv_scale = context_raw.brush_scale;
					RenderPathRaytrace.ready = false;
					///end
				}
				///end

				UIMenu.menu_fill(ui);
				let cull_handle: zui_handle_t = zui_handle("uimenu_7", { selected: context_raw.cull_backfaces });
				context_raw.cull_backfaces = zui_check(cull_handle, " " + tr("Cull Backfaces"));
				if (cull_handle.changed) {
					MakeMaterial.parse_mesh_material();
				}

				UIMenu.menu_fill(ui);
				let filter_handle: zui_handle_t = zui_handle("uimenu_8", { selected: context_raw.texture_filter });
				context_raw.texture_filter = zui_check(filter_handle, " " + tr("Filter Textures"));
				if (filter_handle.changed) {
					MakeMaterial.parse_paint_material();
					MakeMaterial.parse_mesh_material();
				}

				///if (is_paint || is_sculpt)
				UIMenu.menu_fill(ui);
				context_raw.draw_wireframe = zui_check(context_raw.wireframe_handle, " " + tr("Wireframe"));
				if (context_raw.wireframe_handle.changed) {
					let current: image_t = _g2_current;
					g2_end();
					UtilUV.cache_uv_map();
					g2_begin(current);
					MakeMaterial.parse_mesh_material();
				}
				///end

				///if is_paint
				UIMenu.menu_fill(ui);
				context_raw.draw_texels = zui_check(context_raw.texels_handle, " " + tr("Texels"));
				if (context_raw.texels_handle.changed) {
					MakeMaterial.parse_mesh_material();
				}
				///end

				UIMenu.menu_fill(ui);
				let compass_handle: zui_handle_t = zui_handle("uimenu_9", { selected: context_raw.show_compass });
				context_raw.show_compass = zui_check(compass_handle, " " + tr("Compass"));
				if (compass_handle.changed) context_raw.ddirty = 2;

				UIMenu.menu_fill(ui);
				context_raw.show_envmap = zui_check(context_raw.show_envmap_handle, " " + tr("Envmap"));
				if (context_raw.show_envmap_handle.changed) {
					context_load_envmap();
					context_raw.ddirty = 2;
				}

				UIMenu.menu_fill(ui);
				context_raw.show_envmap_blur = zui_check(context_raw.show_envmap_blur_handle, " " + tr("Blur Envmap"));
				if (context_raw.show_envmap_blur_handle.changed) context_raw.ddirty = 2;

				context_update_envmap();

				if (ui.changed) UIMenu.keep_open = true;
			}
			else if (UIMenu.menu_category == menu_category_t.MODE) {
				let mode_handle: zui_handle_t = zui_handle("uimenu_10");
				mode_handle.position = context_raw.viewport_mode;
				let modes: string[] = [
					tr("Lit"),
					tr("Base Color"),
					///if (is_paint || is_lab)
					tr("Normal"),
					tr("Occlusion"),
					tr("Roughness"),
					tr("Metallic"),
					tr("Opacity"),
					tr("Height"),
					///end
					///if (is_paint)
					tr("Emission"),
					tr("Subsurface"),
					///end
					///if (is_paint || is_sculpt)
					tr("TexCoord"),
					tr("Object Normal"),
					tr("Material ID"),
					tr("Object ID"),
					tr("Mask")
					///end
				];
				let shortcuts: string[] = ["l", "b", "n", "o", "r", "m", "a", "h", "e", "s", "t", "1", "2", "3", "4"];

				///if (krom_direct3d12 || krom_vulkan || krom_metal)
				if (krom_raytrace_supported()) {
					modes.push(tr("Path Traced"));
					shortcuts.push("p");
				}
				///end

				for (let i: i32 = 0; i < modes.length; ++i) {
					UIMenu.menu_fill(ui);
					let shortcut: string = config_raw.touch_ui ? "" : config_keymap.viewport_mode + ", " + shortcuts[i];
					zui_radio(mode_handle, i, modes[i], shortcut);
				}

				if (mode_handle.changed) {
					context_set_viewport_mode(mode_handle.position);
					// TODO: rotate mode is not supported for path tracing yet
					if (mode_handle.position == viewport_mode_t.PATH_TRACE && context_raw.camera_controls == camera_controls_t.ROTATE) {
						context_raw.camera_controls = camera_controls_t.ORBIT;
						viewport_reset();
					}
				}
			}
			else if (UIMenu.menu_category == menu_category_t.CAMERA) {
				if (UIMenu.menu_button(ui, tr("Reset"), config_keymap.view_reset)) {
					viewport_reset();
					viewport_scale_to_bounds();
				}
				UIMenu.menu_separator(ui);
				if (UIMenu.menu_button(ui, tr("Front"), config_keymap.view_front)) {
					viewport_set_view(0, -1, 0, Math.PI / 2, 0, 0);
				}
				if (UIMenu.menu_button(ui, tr("Back"), config_keymap.view_back)) {
					viewport_set_view(0, 1, 0, Math.PI / 2, 0, Math.PI);
				}
				if (UIMenu.menu_button(ui, tr("Right"), config_keymap.view_right)) {
					viewport_set_view(1, 0, 0, Math.PI / 2, 0, Math.PI / 2);
				}
				if (UIMenu.menu_button(ui, tr("Left"), config_keymap.view_left)) {
					viewport_set_view(-1, 0, 0, Math.PI / 2, 0, -Math.PI / 2);
				}
				if (UIMenu.menu_button(ui, tr("Top"), config_keymap.view_top)) {
					viewport_set_view(0, 0, 1, 0, 0, 0);
				}
				if (UIMenu.menu_button(ui, tr("Bottom"), config_keymap.view_bottom)) {
					viewport_set_view(0, 0, -1, Math.PI, 0, Math.PI);
				}
				UIMenu.menu_separator(ui);

				ui.changed = false;

				if (UIMenu.menu_button(ui, tr("Orbit Left"), config_keymap.view_orbit_left)) {
					viewport_orbit(-Math.PI / 12, 0);
				}
				if (UIMenu.menu_button(ui, tr("Orbit Right"), config_keymap.view_orbit_right)) {
					viewport_orbit(Math.PI / 12, 0);
				}
				if (UIMenu.menu_button(ui, tr("Orbit Up"), config_keymap.view_orbit_up)) {
					viewport_orbit(0, -Math.PI / 12);
				}
				if (UIMenu.menu_button(ui, tr("Orbit Down"), config_keymap.view_orbit_down)) {
					viewport_orbit(0, Math.PI / 12);
				}
				if (UIMenu.menu_button(ui, tr("Orbit Opposite"), config_keymap.view_orbit_opposite)) {
					viewport_orbit_opposite();
				}
				if (UIMenu.menu_button(ui, tr("Zoom In"), config_keymap.view_zoom_in)) {
					viewport_zoom(0.2);
				}
				if (UIMenu.menu_button(ui, tr("Zoom Out"), config_keymap.view_zoom_out)) {
					viewport_zoom(-0.2);
				}
				// menuSeparator(ui);

				UIMenu.menu_fill(ui);
				let cam: camera_object_t = scene_camera;
				context_raw.fov_handle = zui_handle("uimenu_11", { value: Math.floor(cam.data.fov * 100) / 100 });
				UIMenu.menu_align(ui);
				cam.data.fov = zui_slider(context_raw.fov_handle, tr("FoV"), 0.3, 1.4, true);
				if (context_raw.fov_handle.changed) {
					viewport_update_camera_type(context_raw.camera_type);
				}

				UIMenu.menu_fill(ui);
				UIMenu.menu_align(ui);
				let camera_controls_handle: zui_handle_t = zui_handle("uimenu_12");
				camera_controls_handle.position = context_raw.camera_controls;
				context_raw.camera_controls = zui_inline_radio(camera_controls_handle, [tr("Orbit"), tr("Rotate"), tr("Fly")], zui_align_t.LEFT);

				let orbit_and_rotate_tooltip: string = tr("Orbit and Rotate mode:\n{rotate_shortcut} or move right mouse button to rotate.\n{zoom_shortcut} or scroll to zoom.\n{pan_shortcut} or move middle mouse to pan.",
					new Map([
						["rotate_shortcut", config_keymap.action_rotate],
						["zoom_shortcut", config_keymap.action_zoom],
						["pan_shortcut", config_keymap.action_pan]
					])
				);
				let fly_tooltip: string = tr("Fly mode:\nHold the right mouse button and one of the following commands:\nmove mouse to rotate.\nw, up or scroll up to move forward.\ns, down or scroll down to move backward.\na or left to move left.\nd or right to move right.\ne to move up.\nq to move down.\nHold shift to move faster or alt to move slower.");
				if (ui.is_hovered) zui_tooltip(orbit_and_rotate_tooltip + "\n\n" + fly_tooltip);

				UIMenu.menu_fill(ui);
				UIMenu.menu_align(ui);
				context_raw.camera_type = zui_inline_radio(context_raw.cam_handle, [tr("Perspective"), tr("Orthographic")], zui_align_t.LEFT);
				if (ui.is_hovered) zui_tooltip(tr("Camera Type") + ` (${config_keymap.view_camera_type})`);
				if (context_raw.cam_handle.changed) {
					viewport_update_camera_type(context_raw.camera_type);
				}

				if (ui.changed) UIMenu.keep_open = true;
			}
			else if (UIMenu.menu_category == menu_category_t.HELP) {
				if (UIMenu.menu_button(ui, tr("Manual"))) {
					file_load_url(manifest_url + "/manual");
				}
				if (UIMenu.menu_button(ui, tr("How To"))) {
					file_load_url(manifest_url + "/howto");
				}
				if (UIMenu.menu_button(ui, tr("What's New"))) {
					file_load_url(manifest_url + "/notes");
				}
				if (UIMenu.menu_button(ui, tr("Issue Tracker"))) {
					file_load_url("https://github.com/armory3d/armortools/issues");
				}
				if (UIMenu.menu_button(ui, tr("Report Bug"))) {
					///if (krom_darwin || krom_ios) // Limited url length
					file_load_url("https://github.com/armory3d/armortools/issues/new?labels=bug&template=bug_report.md&body=*" + manifest_title + "%20" + manifest_version + "-" + config_get_sha() + ",%20" + sys_system_id());
					///else
					file_load_url("https://github.com/armory3d/armortools/issues/new?labels=bug&template=bug_report.md&body=*" + manifest_title + "%20" + manifest_version + "-" + config_get_sha() + ",%20" + sys_system_id() + "*%0A%0A**Issue description:**%0A%0A**Steps to reproduce:**%0A%0A");
					///end
				}
				if (UIMenu.menu_button(ui, tr("Request Feature"))) {
					///if (krom_darwin || krom_ios) // Limited url length
					file_load_url("https://github.com/armory3d/armortools/issues/new?labels=feature%20request&template=feature_request.md&body=*" + manifest_title + "%20" + manifest_version + "-" + config_get_sha() + ",%20" + sys_system_id());
					///else
					file_load_url("https://github.com/armory3d/armortools/issues/new?labels=feature%20request&template=feature_request.md&body=*" + manifest_title + "%20" + manifest_version + "-" + config_get_sha() + ",%20" + sys_system_id() + "*%0A%0A**Feature description:**%0A%0A");
					///end
				}
				UIMenu.menu_separator(ui);

				if (UIMenu.menu_button(ui, tr("Check for Updates..."))) {
					///if krom_android
					file_load_url(manifest_url_android);
					///elseif krom_ios
					file_load_url(manifest_url_ios);
					///else
					// Retrieve latest version number
					file_download_bytes("https://server.armorpaint.org/" + manifest_title.toLowerCase() + ".html", (buffer: ArrayBuffer) => {
						if (buffer != null)  {
							// Compare versions
							let update: any = json_parse(sys_buffer_to_string(buffer));
							let update_version: i32 = Math.floor(update.version);
							if (update_version > 0) {
								let date: string = config_get_date().substr(2); // 2019 -> 19
								let date_int: i32 = parseInt(string_replace_all(date, "-", ""));
								if (update_version > date_int) {
									UIBox.show_message(tr("Update"), tr("Update is available!\nPlease visit {url}.", new Map([["url", manifest_url]])));
								}
								else {
									UIBox.show_message(tr("Update"), tr("You are up to date!"));
								}
							}
						}
						else {
							UIBox.show_message(tr("Update"), tr("Unable to check for updates.\nPlease visit {url}.", new Map([["url", manifest_url]])));
						}
					});
					///end
				}

				if (UIMenu.menu_button(ui, tr("About..."))) {

					let msg: string = manifest_title + ".org - v" + manifest_version + " (" + config_get_date() + ") - " + config_get_sha() + "\n";
					msg += sys_system_id() + " - " + strings_graphics_api();

					///if krom_windows
					let save: string = (path_is_protected() ? krom_save_path() : path_data()) + path_sep + "tmp.txt";
					krom_sys_command('wmic path win32_VideoController get name > "' + save + '"');
					let blob: buffer_t = krom_load_blob(save);
					let u8: Uint8Array = new Uint8Array(blob);
					let gpu_raw: string = "";
					for (let i: i32 = 0; i < Math.floor(u8.length / 2); ++i) {
						let c: string = String.fromCharCode(u8[i * 2]);
						gpu_raw += c;
					}

					let gpus: string[] = gpu_raw.split("\n");
					gpus = gpus.splice(1, gpus.length - 2);
					let gpu: string = "";
					for (let g of gpus) {
						gpu += trim_end(g) + ", ";
					}
					gpu = gpu.substr(0, gpu.length - 2);
					msg += `\n${gpu}`;
					///else
					// { lshw -C display }
					///end

					UIBox.show_custom((ui: zui_t) => {
						let tab_vertical: bool = config_raw.touch_ui;
						if (zui_tab(zui_handle("uimenu_13"), tr("About"), tab_vertical)) {

							let img: image_t = data_get_image("badge.k");
							zui_image(img);
							zui_end_element();

							zui_text_area(zui_handle("uimenu_14", { text: msg }), zui_align_t.LEFT, false);

							zui_row([1 / 3, 1 / 3, 1 / 3]);

							///if (krom_windows || krom_linux || krom_darwin)
							if (zui_button(tr("Copy"))) {
								krom_copy_to_clipboard(msg);
							}
							///else
							zui_end_element();
							///end

							if (zui_button(tr("Contributors"))) {
								file_load_url("https://github.com/armory3d/armortools/graphs/contributors");
							}
							if (zui_button(tr("OK"))) {
								UIBox.hide();
							}
						}
					}, 400, 320);
				}
			}
		}

		UIMenu.hide_menu = ui.combo_selected_handle_ptr == 0 && !UIMenu.keep_open && !UIMenu.show_menu_first && (ui.changed || ui.input_released || ui.input_released_r || ui.is_escape_down);
		UIMenu.show_menu_first = false;
		UIMenu.keep_open = false;

		ui.t.BUTTON_COL = _BUTTON_COL;
		ui.t.ELEMENT_OFFSET = _ELEMENT_OFFSET;
		ui.t.ELEMENT_H = _ELEMENT_H;
		zui_end_region();

		if (UIMenu.hide_menu) {
			UIMenu.hide();
			UIMenu.show_menu_first = true;
			UIMenu.menu_commands = null;
		}
	}

	static hide = () => {
		UIMenu.show = false;
		base_redraw_ui();
	}

	static draw = (commands: (ui: zui_t)=>void = null, elements: i32, x: i32 = -1, y: i32 = -1) => {
		zui_end_input();
		UIMenu.show = true;
		UIMenu.menu_commands = commands;
		UIMenu.menu_elements = elements;
		UIMenu.menu_x = x > -1 ? x : Math.floor(mouse_x + 1);
		UIMenu.menu_y = y > -1 ? y : Math.floor(mouse_y + 1);
		UIMenu.fit_to_screen();
	}

	static fit_to_screen = () => {
		// Prevent the menu going out of screen
		let menu_w: f32 = base_default_element_w * zui_SCALE(base_ui_menu) * 2.3;
		if (UIMenu.menu_x + menu_w > sys_width()) {
			if (UIMenu.menu_x - menu_w > 0) {
				UIMenu.menu_x = Math.floor(UIMenu.menu_x - menu_w);
			}
			else {
				UIMenu.menu_x = Math.floor(sys_width() - menu_w);
			}
		}
		let menu_h: f32 = Math.floor(UIMenu.menu_elements * 30 * zui_SCALE(base_ui_menu)); // ui.t.ELEMENT_H
		if (UIMenu.menu_y + menu_h > sys_height()) {
			if (UIMenu.menu_y - menu_h > 0) {
				UIMenu.menu_y = Math.floor(UIMenu.menu_y - menu_h);
			}
			else {
				UIMenu.menu_y = sys_height() - menu_h;
			}
			UIMenu.menu_x += 1; // Move out of mouse focus
		}
	}

	static menu_fill = (ui: zui_t) => {
		g2_set_color(ui.t.ACCENT_SELECT_COL);
		g2_fill_rect(ui._x - 1, ui._y, ui._w + 2, zui_ELEMENT_H(ui) + 1 + 1);
		g2_set_color(ui.t.SEPARATOR_COL);
		g2_fill_rect(ui._x, ui._y, ui._w, zui_ELEMENT_H(ui) + 1);
		g2_set_color(0xffffffff);
	}

	static menu_separator = (ui: zui_t) => {
		ui._y++;
		if (config_raw.touch_ui) {
			zui_fill(0, 0, ui._w / zui_SCALE(ui), 1, ui.t.ACCENT_SELECT_COL);
		}
		else {
			zui_fill(26, 0, ui._w / zui_SCALE(ui) - 26, 1, ui.t.ACCENT_SELECT_COL);
		}
	}

	static menu_button = (ui: zui_t, text: string, label: string = ""/*, icon: i32 = -1*/): bool => {
		UIMenu.menu_fill(ui);
		if (config_raw.touch_ui) {
			label = "";
		}

		// let icons: image_t = icon > -1 ? get("icons.k") : null;
		// let r: rect_t = tile25(icons, icon, 8);
		// return Zui.button(config_button_spacing + text, config_button_align, label, icons, r.x, r.y, r.w, r.h);

		return zui_button(config_button_spacing + text, config_button_align, label);
	}

	static menu_align = (ui: zui_t) => {
		if (!config_raw.touch_ui) {
			zui_row([12 / 100, 88 / 100]);
			zui_end_element();
		}
	}

	static menu_start = (ui: zui_t) => {
		// Draw top border
		g2_set_color(ui.t.ACCENT_SELECT_COL);
		if (config_raw.touch_ui) {
			g2_fill_rect(ui._x + ui._w / 2 + UIMenu.menu_category_w / 2, ui._y - 1, ui._w / 2 - UIMenu.menu_category_w / 2 + 1, 1);
			g2_fill_rect(ui._x - 1, ui._y - 1, ui._w / 2 - UIMenu.menu_category_w / 2 + 1, 1);
			g2_fill_rect(ui._x + ui._w / 2 - UIMenu.menu_category_w / 2, ui._y - UIMenu.menu_category_h, UIMenu.menu_category_w, 1);
			g2_fill_rect(ui._x + ui._w / 2 - UIMenu.menu_category_w / 2, ui._y - UIMenu.menu_category_h, 1, UIMenu.menu_category_h);
			g2_fill_rect(ui._x + ui._w / 2 + UIMenu.menu_category_w / 2, ui._y - UIMenu.menu_category_h, 1, UIMenu.menu_category_h);
		}
		else {
			g2_fill_rect(ui._x - 1 + UIMenu.menu_category_w, ui._y - 1, ui._w + 2 - UIMenu.menu_category_w, 1);
			g2_fill_rect(ui._x - 1, ui._y - UIMenu.menu_category_h, UIMenu.menu_category_w, 1);
			g2_fill_rect(ui._x - 1, ui._y - UIMenu.menu_category_h, 1, UIMenu.menu_category_h);
			g2_fill_rect(ui._x - 1 + UIMenu.menu_category_w, ui._y - UIMenu.menu_category_h, 1, UIMenu.menu_category_h);
		}
		g2_set_color(0xffffffff);
	}
}
