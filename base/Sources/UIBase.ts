
///if is_paint
/// <reference path='../../armorpaint/Sources/TabLayers.ts'/>
///end
///if is_sculpt
/// <reference path='../../armorsculpt/Sources/TabLayers.ts'/>
///end
///if is_forge
/// <reference path='../../armorforge/Sources/TabObjects.ts'/>
///end
/// <reference path='./TabHistory.ts'/>
/// <reference path='./TabPlugins.ts'/>
/// <reference path='./TabMaterials.ts'/>
/// <reference path='./TabBrushes.ts'/>
/// <reference path='./TabParticles.ts'/>
/// <reference path='./TabBrowser.ts'/>
/// <reference path='./TabTextures.ts'/>
/// <reference path='./TabMeshes.ts'/>
/// <reference path='./TabFonts.ts'/>
/// <reference path='./TabSwatches.ts'/>
/// <reference path='./TabScript.ts'/>
/// <reference path='./TabConsole.ts'/>
/// <reference path='./UIStatus.ts'/>

class UIBase {

	static show: bool = true;
	static ui: zui_t;
	static border_started: i32 = 0;
	static border_handle_ptr: i32 = 0;
	static action_paint_remap: string = "";
	static operator_search_offset: i32 = 0;
	static undo_tap_time: f32 = 0.0;
	static redo_tap_time: f32 = 0.0;

	static init_hwnds = (): zui_handle_t[] => {
		///if is_paint
		return [zui_handle_create(), zui_handle_create(), zui_handle_create()];
		///end
		///if is_sculpt
		return [zui_handle_create(), zui_handle_create(), zui_handle_create()];
		///end
		///if is_lab
		return [zui_handle_create()];
		///end
	}

	static init_htabs = (): zui_handle_t[] => {
		///if is_paint
		return [zui_handle_create(), zui_handle_create(), zui_handle_create()];
		///end
		///if is_sculpt
		return [zui_handle_create(), zui_handle_create(), zui_handle_create()];
		///end
		///if is_lab
		return [zui_handle_create()];
		///end
	}

	static init_hwnd_tabs = (): any[] => {
		///if is_paint
		return [
			[TabLayers.draw, TabHistory.draw, TabPlugins.draw
				///if is_forge
				, TabObjects.draw
				///end
			],
			[TabMaterials.draw, TabBrushes.draw, TabParticles.draw],
			[TabBrowser.draw, TabTextures.draw, TabMeshes.draw, TabFonts.draw, TabSwatches.draw, TabScript.draw, TabConsole.draw, UIStatus.draw_version_tab]
		];
		///end
		///if is_sculpt
		return [
			[TabLayers.draw, TabHistory.draw, TabPlugins.draw
				///if is_forge
				, TabObjects.draw
				///end
			],
			[TabMaterials.draw, TabBrushes.draw, TabParticles.draw],
			[TabBrowser.draw, TabTextures.draw, TabMeshes.draw, TabFonts.draw, TabScript.draw, TabConsole.draw, UIStatus.draw_version_tab]
		];
		///end
		///if is_lab
		return [
			[TabBrowser.draw, TabTextures.draw, TabMeshes.draw, TabSwatches.draw, TabPlugins.draw, TabScript.draw, TabConsole.draw, UIStatus.draw_version_tab]
		];
		///end
	}

	static hwnds: zui_handle_t[] = UIBase.init_hwnds();
	static htabs: zui_handle_t[] = UIBase.init_htabs();
	static hwnd_tabs: any[] = UIBase.init_hwnd_tabs();

	///if (is_paint || is_sculpt)
	static default_sidebar_mini_w: i32 = 56;
	static default_sidebar_full_w: i32 = 280;
	///if (krom_android || krom_ios)
	static default_sidebar_w: i32 = UIBase.default_sidebar_mini_w;
	///else
	static default_sidebar_w: i32 = UIBase.default_sidebar_full_w;
	///end
	static tabx: i32 = 0;
	static hminimized: zui_handle_t = zui_handle_create();
	static sidebar_mini_w: i32 = UIBase.default_sidebar_mini_w;
	///end

	constructor() {
		///if (is_paint || is_sculpt)
		new UIToolbar();
		UIToolbar.toolbar_w = Math.floor(UIToolbar.default_toolbar_w * config_raw.window_scale);
		context_raw.text_tool_text = tr("Text");
		///end

		new UIHeader();
		new UIStatus();
		new UIMenubar();

		UIHeader.headerh = Math.floor(UIHeader.default_header_h * config_raw.window_scale);
		UIMenubar.menubarw = Math.floor(UIMenubar.default_menubar_w * config_raw.window_scale);

		///if (is_paint || is_sculpt)
		if (project_materials == null) {
			project_materials = [];
			let m: material_data_t = data_get_material("Scene", "Material");
			project_materials.push(SlotMaterial.create(m));
			context_raw.material = project_materials[0];
		}

		if (project_brushes == null) {
			project_brushes = [];
			project_brushes.push(SlotBrush.create());
			context_raw.brush = project_brushes[0];
			MakeMaterial.parse_brush();
		}

		if (project_fonts == null) {
			project_fonts = [];
			project_fonts.push(SlotFont.create("default.ttf", base_font));
			context_raw.font = project_fonts[0];
		}

		if (project_layers == null) {
			project_layers = [];
			project_layers.push(SlotLayer.create());
			context_raw.layer = project_layers[0];
		}
		///end

		///if is_lab
		if (project_material_data == null) {
			let m: material_data_t = data_get_material("Scene", "Material");
			project_material_data = m;
		}

		if (project_default_canvas == null) { // Synchronous
			let b: ArrayBuffer = data_get_blob("default_brush.arm");
			project_default_canvas = b;
		}

		project_nodes = zui_nodes_create();
		project_canvas = armpack_decode(project_default_canvas);
		project_canvas.name = "Brush 1";

		context_parse_brush_inputs();

		ParserLogic.parse(project_canvas);
		///end

		if (project_raw.swatches == null) {
			project_set_default_swatches();
			context_raw.swatch = project_raw.swatches[0];
		}

		if (context_raw.empty_envmap == null) {
			let b: Uint8Array = new Uint8Array(4);
			b[0] = 8;
			b[1] = 8;
			b[2] = 8;
			b[3] = 255;
			context_raw.empty_envmap = image_from_bytes(b.buffer, 1, 1);
		}
		if (context_raw.preview_envmap == null) {
			let b: Uint8Array = new Uint8Array(4);
			b[0] = 0;
			b[1] = 0;
			b[2] = 0;
			b[3] = 255;
			context_raw.preview_envmap = image_from_bytes(b.buffer, 1, 1);
		}

		let world: world_data_t = scene_world;
		if (context_raw.saved_envmap == null) {
			// raw.savedEnvmap = world._envmap;
			context_raw.default_irradiance = world._.irradiance;
			context_raw.default_radiance = world._.radiance;
			context_raw.default_radiance_mipmaps = world._.radiance_mipmaps;
		}
		world._.envmap = context_raw.show_envmap ? context_raw.saved_envmap : context_raw.empty_envmap;
		context_raw.ddirty = 1;

		history_reset();

		let scale: f32 = config_raw.window_scale;
		UIBase.ui = zui_create({ theme: base_theme, font: base_font, scale_factor: scale, color_wheel: base_color_wheel, black_white_gradient: base_color_wheel_gradient });
		zui_set_on_border_hover(UIBase.on_border_hover);
		zui_set_on_text_hover(UIBase.on_text_hover);
		zui_set_on_deselect_text(UIBase.on_deselect_text);
		zui_set_on_tab_drop(UIBase.on_tab_drop);

		///if (is_paint || is_sculpt)
		let resources: string[] = ["cursor.k", "icons.k"];
		///end
		///if is_lab
		let resources: string[] = ["cursor.k", "icons.k", "placeholder.k"];
		///end

		///if (is_paint || is_sculpt)
		context_raw.gizmo = scene_get_child(".Gizmo");
		context_raw.gizmo_translate_x = object_get_child(context_raw.gizmo, ".TranslateX");
		context_raw.gizmo_translate_y = object_get_child(context_raw.gizmo, ".TranslateY");
		context_raw.gizmo_translate_z = object_get_child(context_raw.gizmo, ".TranslateZ");
		context_raw.gizmo_scale_x = object_get_child(context_raw.gizmo, ".ScaleX");
		context_raw.gizmo_scale_y = object_get_child(context_raw.gizmo, ".ScaleY");
		context_raw.gizmo_scale_z = object_get_child(context_raw.gizmo, ".ScaleZ");
		context_raw.gizmo_rotate_x = object_get_child(context_raw.gizmo, ".RotateX");
		context_raw.gizmo_rotate_y = object_get_child(context_raw.gizmo, ".RotateY");
		context_raw.gizmo_rotate_z = object_get_child(context_raw.gizmo, ".RotateZ");
		///end

		resource_load(resources, () => {});

		if (zui_SCALE(UIBase.ui) > 1) UIBase.set_icon_scale();

		context_raw.paint_object = scene_get_child(".Cube").ext;
		project_paint_objects = [context_raw.paint_object];

		if (project_filepath == "") {
			app_notify_on_init(base_init_layers);
		}

		context_raw.project_objects = [];
		for (let m of scene_meshes) context_raw.project_objects.push(m);

		operator_register("view_top", UIBase.view_top);
	}

	static update = () => {
		UIBase.update_ui();
		operator_update();

		for (let p of plugin_map.values()) if (p.update != null) p.update();

		if (!base_ui_enabled) return;

		if (!UINodes.ui.is_typing && !UIBase.ui.is_typing) {
			if (operator_shortcut(config_keymap.toggle_node_editor)) {
				///if (is_paint || is_sculpt)
				UINodes.canvas_type == canvas_type_t.MATERIAL ? UIBase.show_material_nodes() : UIBase.show_brush_nodes();
				///end
				///if is_lab
				UIBase.show_material_nodes();
				///end
			}
			else if (operator_shortcut(config_keymap.toggle_browser)) {
				UIBase.toggle_browser();
			}

			else if (operator_shortcut(config_keymap.toggle_2d_view)) {
				///if (is_paint || is_sculpt)
				UIBase.show_2d_view(view_2d_type_t.LAYER);
				///else
				UIBase.show_2d_view(view_2d_type_t.ASSET);
				///end
			}
		}

		if (operator_shortcut(config_keymap.file_save_as)) project_save_as();
		else if (operator_shortcut(config_keymap.file_save)) project_save();
		else if (operator_shortcut(config_keymap.file_open)) project_open();
		else if (operator_shortcut(config_keymap.file_open_recent)) BoxProjects.show();
		else if (operator_shortcut(config_keymap.file_reimport_mesh)) project_reimport_mesh();
		else if (operator_shortcut(config_keymap.file_reimport_textures)) project_reimport_textures();
		else if (operator_shortcut(config_keymap.file_new)) project_new_box();
		///if (is_paint || is_lab)
		else if (operator_shortcut(config_keymap.file_export_textures)) {
			if (context_raw.texture_export_path == "") { // First export, ask for path
				///if is_paint
				context_raw.layers_export = export_mode_t.VISIBLE;
				///end
				BoxExport.show_textures();
			}
			else {
				let _init = () => {
					ExportTexture.run(context_raw.texture_export_path);
				}
				app_notify_on_init(_init);
			}
		}
		else if (operator_shortcut(config_keymap.file_export_textures_as)) {
			///if (is_paint || is_sculpt)
			context_raw.layers_export = export_mode_t.VISIBLE;
			///end
			BoxExport.show_textures();
		}
		///end
		else if (operator_shortcut(config_keymap.file_import_assets)) project_import_asset();
		else if (operator_shortcut(config_keymap.edit_prefs)) BoxPreferences.show();

		if (keyboard_started(config_keymap.view_distract_free) ||
		   (keyboard_started("escape") && !UIBase.show && !UIBox.show)) {
			UIBase.toggle_distract_free();
		}

		///if krom_linux
		if (operator_shortcut("alt+enter", shortcut_type_t.STARTED)) {
			base_toggle_fullscreen();
		}
		///end

		///if (is_paint || is_sculpt)
		let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;
		let decal_mask: bool = decal && operator_shortcut(config_keymap.decal_mask, shortcut_type_t.DOWN);

		if ((context_raw.brush_can_lock || context_raw.brush_locked) && mouse_moved) {
			if (operator_shortcut(config_keymap.brush_radius, shortcut_type_t.DOWN) ||
				operator_shortcut(config_keymap.brush_opacity, shortcut_type_t.DOWN) ||
				operator_shortcut(config_keymap.brush_angle, shortcut_type_t.DOWN) ||
				(decal_mask && operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.brush_radius, shortcut_type_t.DOWN))) {
				if (context_raw.brush_locked) {
					if (operator_shortcut(config_keymap.brush_opacity, shortcut_type_t.DOWN)) {
						context_raw.brush_opacity += mouse_movement_x / 500;
						context_raw.brush_opacity = Math.max(0.0, Math.min(1.0, context_raw.brush_opacity));
						context_raw.brush_opacity = Math.round(context_raw.brush_opacity * 100) / 100;
						context_raw.brush_opacity_handle.value = context_raw.brush_opacity;
					}
					else if (operator_shortcut(config_keymap.brush_angle, shortcut_type_t.DOWN)) {
						context_raw.brush_angle += mouse_movement_x / 5;
						context_raw.brush_angle = Math.floor(context_raw.brush_angle) % 360;
						if (context_raw.brush_angle < 0) context_raw.brush_angle += 360;
						context_raw.brush_angle_handle.value = context_raw.brush_angle;
						MakeMaterial.parse_paint_material();
					}
					else if (decal_mask && operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.brush_radius, shortcut_type_t.DOWN)) {
						context_raw.brush_decal_mask_radius += mouse_movement_x / 150;
						context_raw.brush_decal_mask_radius = Math.max(0.01, Math.min(4.0, context_raw.brush_decal_mask_radius));
						context_raw.brush_decal_mask_radius = Math.round(context_raw.brush_decal_mask_radius * 100) / 100;
						context_raw.brush_decal_mask_radius_handle.value = context_raw.brush_decal_mask_radius;
					}
					else {
						context_raw.brush_radius += mouse_movement_x / 150;
						context_raw.brush_radius = Math.max(0.01, Math.min(4.0, context_raw.brush_radius));
						context_raw.brush_radius = Math.round(context_raw.brush_radius * 100) / 100;
						context_raw.brush_radius_handle.value = context_raw.brush_radius;
					}
					UIHeader.header_handle.redraws = 2;
				}
				else if (context_raw.brush_can_lock) {
					context_raw.brush_can_lock = false;
					context_raw.brush_locked = true;
				}
			}
		}
		///end

		///if is_lab
		if ((context_raw.brush_can_lock || context_raw.brush_locked) && mouse_moved) {
			if (operator_shortcut(config_keymap.brush_radius, shortcut_type_t.DOWN)) {
				if (context_raw.brush_locked) {
					context_raw.brush_radius += mouse_movement_x / 150;
					context_raw.brush_radius = Math.max(0.01, Math.min(4.0, context_raw.brush_radius));
					context_raw.brush_radius = Math.round(context_raw.brush_radius * 100) / 100;
					context_raw.brush_radius_handle.value = context_raw.brush_radius;
					UIHeader.header_handle.redraws = 2;
				}
				else if (context_raw.brush_can_lock) {
					context_raw.brush_can_lock = false;
					context_raw.brush_locked = true;
				}
			}
		}
		///end

		let is_typing: bool = UIBase.ui.is_typing || UIView2D.ui.is_typing || UINodes.ui.is_typing;

		///if (is_paint || is_sculpt)
		if (!is_typing) {
			if (operator_shortcut(config_keymap.select_material, shortcut_type_t.DOWN)) {
				UIBase.hwnds[tab_area_t.SIDEBAR1].redraws = 2;
				for (let i: i32 = 1; i < 10; ++i) if (keyboard_started(i + "")) context_select_material(i - 1);
			}
			else if (operator_shortcut(config_keymap.select_layer, shortcut_type_t.DOWN)) {
				UIBase.hwnds[tab_area_t.SIDEBAR0].redraws = 2;
				for (let i: i32 = 1; i < 10; ++i) if (keyboard_started(i + "")) context_select_layer(i - 1);
			}
		}
		///end

		// Viewport shortcuts
		if (context_in_paint_area() && !is_typing) {

			///if is_paint
			if (!mouse_down("right")) { // Fly mode off
				if (operator_shortcut(config_keymap.tool_brush)) context_select_tool(workspace_tool_t.BRUSH);
				else if (operator_shortcut(config_keymap.tool_eraser)) context_select_tool(workspace_tool_t.ERASER);
				else if (operator_shortcut(config_keymap.tool_fill)) context_select_tool(workspace_tool_t.FILL);
				else if (operator_shortcut(config_keymap.tool_colorid)) context_select_tool(workspace_tool_t.COLORID);
				else if (operator_shortcut(config_keymap.tool_decal)) context_select_tool(workspace_tool_t.DECAL);
				else if (operator_shortcut(config_keymap.tool_text)) context_select_tool(workspace_tool_t.TEXT);
				else if (operator_shortcut(config_keymap.tool_clone)) context_select_tool(workspace_tool_t.CLONE);
				else if (operator_shortcut(config_keymap.tool_blur)) context_select_tool(workspace_tool_t.BLUR);
				else if (operator_shortcut(config_keymap.tool_smudge)) context_select_tool(workspace_tool_t.SMUDGE);
				else if (operator_shortcut(config_keymap.tool_particle)) context_select_tool(workspace_tool_t.PARTICLE);
				else if (operator_shortcut(config_keymap.tool_picker)) context_select_tool(workspace_tool_t.PICKER);
				else if (operator_shortcut(config_keymap.tool_bake)) context_select_tool(workspace_tool_t.BAKE);
				else if (operator_shortcut(config_keymap.tool_gizmo)) context_select_tool(workspace_tool_t.GIZMO);
				else if (operator_shortcut(config_keymap.tool_material)) context_select_tool(workspace_tool_t.MATERIAL);
				else if (operator_shortcut(config_keymap.swap_brush_eraser)) context_select_tool(context_raw.tool == workspace_tool_t.BRUSH ? workspace_tool_t.ERASER : workspace_tool_t.BRUSH);
			}

			// Radius
			if (context_raw.tool == workspace_tool_t.BRUSH  ||
				context_raw.tool == workspace_tool_t.ERASER ||
				context_raw.tool == workspace_tool_t.DECAL  ||
				context_raw.tool == workspace_tool_t.TEXT   ||
				context_raw.tool == workspace_tool_t.CLONE  ||
				context_raw.tool == workspace_tool_t.BLUR   ||
				context_raw.tool == workspace_tool_t.SMUDGE   ||
				context_raw.tool == workspace_tool_t.PARTICLE) {
				if (operator_shortcut(config_keymap.brush_radius) ||
					operator_shortcut(config_keymap.brush_opacity) ||
					operator_shortcut(config_keymap.brush_angle) ||
					(decal_mask && operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.brush_radius))) {
					context_raw.brush_can_lock = true;
					if (!pen_connected) mouse_lock();
					context_raw.lock_started_x = mouse_x;
					context_raw.lock_started_y = mouse_y;
				}
				else if (operator_shortcut(config_keymap.brush_radius_decrease, shortcut_type_t.REPEAT)) {
					context_raw.brush_radius -= UIBase.get_radius_increment();
					context_raw.brush_radius = Math.max(Math.round(context_raw.brush_radius * 100) / 100, 0.01);
					context_raw.brush_radius_handle.value = context_raw.brush_radius;
					UIHeader.header_handle.redraws = 2;
				}
				else if (operator_shortcut(config_keymap.brush_radius_increase, shortcut_type_t.REPEAT)) {
					context_raw.brush_radius += UIBase.get_radius_increment();
					context_raw.brush_radius = Math.round(context_raw.brush_radius * 100) / 100;
					context_raw.brush_radius_handle.value = context_raw.brush_radius;
					UIHeader.header_handle.redraws = 2;
				}
				else if (decal_mask) {
					if (operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.brush_radius_decrease, shortcut_type_t.REPEAT)) {
						context_raw.brush_decal_mask_radius -= UIBase.get_radius_increment();
						context_raw.brush_decal_mask_radius = Math.max(Math.round(context_raw.brush_decal_mask_radius * 100) / 100, 0.01);
						context_raw.brush_decal_mask_radius_handle.value = context_raw.brush_decal_mask_radius;
						UIHeader.header_handle.redraws = 2;
					}
					else if (operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.brush_radius_increase, shortcut_type_t.REPEAT)) {
						context_raw.brush_decal_mask_radius += UIBase.get_radius_increment();
						context_raw.brush_decal_mask_radius = Math.round(context_raw.brush_decal_mask_radius * 100) / 100;
						context_raw.brush_decal_mask_radius_handle.value = context_raw.brush_decal_mask_radius;
						UIHeader.header_handle.redraws = 2;
					}
				}
			}

			if (decal_mask && (operator_shortcut(config_keymap.decal_mask, shortcut_type_t.STARTED) || operator_shortcut(config_keymap.decal_mask, shortcut_type_t.RELEASED))) {
				UIHeader.header_handle.redraws = 2;
			}
			///end

			///if is_lab
			if (UIHeader.worktab.position == space_type_t.SPACE3D) {
				// Radius
				if (context_raw.tool == workspace_tool_t.ERASER ||
					context_raw.tool == workspace_tool_t.CLONE  ||
					context_raw.tool == workspace_tool_t.BLUR   ||
					context_raw.tool == workspace_tool_t.SMUDGE) {
					if (operator_shortcut(config_keymap.brush_radius)) {
						context_raw.brush_can_lock = true;
						if (!pen_connected) mouse_lock();
						context_raw.lock_started_x = mouse_x;
						context_raw.lock_started_y = mouse_y;
					}
					else if (operator_shortcut(config_keymap.brush_radius_decrease, shortcut_type_t.REPEAT)) {
						context_raw.brush_radius -= UIBase.get_radius_increment();
						context_raw.brush_radius = Math.max(Math.round(context_raw.brush_radius * 100) / 100, 0.01);
						context_raw.brush_radius_handle.value = context_raw.brush_radius;
						UIHeader.header_handle.redraws = 2;
					}
					else if (operator_shortcut(config_keymap.brush_radius_increase, shortcut_type_t.REPEAT)) {
						context_raw.brush_radius += UIBase.get_radius_increment();
						context_raw.brush_radius = Math.round(context_raw.brush_radius * 100) / 100;
						context_raw.brush_radius_handle.value = context_raw.brush_radius;
						UIHeader.header_handle.redraws = 2;
					}
				}
			}
			///end

			// Viewpoint
			if (mouse_view_x() < app_w()) {
				if (operator_shortcut(config_keymap.view_reset)) {
					viewport_reset();
					viewport_scale_to_bounds();
				}
				else if (operator_shortcut(config_keymap.view_back)) viewport_set_view(0, 1, 0, Math.PI / 2, 0, Math.PI);
				else if (operator_shortcut(config_keymap.view_front)) viewport_set_view(0, -1, 0, Math.PI / 2, 0, 0);
				else if (operator_shortcut(config_keymap.view_left)) viewport_set_view(-1, 0, 0, Math.PI / 2, 0, -Math.PI / 2);
				else if (operator_shortcut(config_keymap.view_right)) viewport_set_view(1, 0, 0, Math.PI / 2, 0, Math.PI / 2);
				else if (operator_shortcut(config_keymap.view_bottom)) viewport_set_view(0, 0, -1, Math.PI, 0, Math.PI);
				else if (operator_shortcut(config_keymap.view_camera_type)) {
					context_raw.camera_type = context_raw.camera_type == camera_type_t.PERSPECTIVE ? camera_type_t.ORTHOGRAPHIC : camera_type_t.PERSPECTIVE;
					context_raw.cam_handle.position = context_raw.camera_type;
					viewport_update_camera_type(context_raw.camera_type);
				}
				else if (operator_shortcut(config_keymap.view_orbit_left, shortcut_type_t.REPEAT)) viewport_orbit(-Math.PI / 12, 0);
				else if (operator_shortcut(config_keymap.view_orbit_right, shortcut_type_t.REPEAT)) viewport_orbit(Math.PI / 12, 0);
				else if (operator_shortcut(config_keymap.view_orbit_up, shortcut_type_t.REPEAT)) viewport_orbit(0, -Math.PI / 12);
				else if (operator_shortcut(config_keymap.view_orbit_down, shortcut_type_t.REPEAT)) viewport_orbit(0, Math.PI / 12);
				else if (operator_shortcut(config_keymap.view_orbit_opposite)) viewport_orbit_opposite();
				else if (operator_shortcut(config_keymap.view_zoom_in, shortcut_type_t.REPEAT)) viewport_zoom(0.2);
				else if (operator_shortcut(config_keymap.view_zoom_out, shortcut_type_t.REPEAT)) viewport_zoom(-0.2);
				else if (operator_shortcut(config_keymap.viewport_mode)) {

					let count: i32;

					///if (is_paint || is_sculpt)
					count = 16;
					///if (krom_direct3d12 || krom_vulkan || krom_metal)
					count += 1;
					///end
					///end

					///if is_lab
					count = 9;
					///if (krom_direct3d12 || krom_vulkan || krom_metal)
					count += 1;
					///end
					///end

					UIMenu.draw((ui: zui_t) => {
						let mode_handle: zui_handle_t = zui_handle("uibase_0");
						mode_handle.position = context_raw.viewport_mode;
						zui_text(tr("Viewport Mode"), zui_align_t.RIGHT, ui.t.HIGHLIGHT_COL);
						let modes: string[] = [
							tr("Lit"),
							tr("Base Color"),
							tr("Normal"),
							tr("Occlusion"),
							tr("Roughness"),
							tr("Metallic"),
							tr("Opacity"),
							tr("Height"),
							///if (is_paint || is_sculpt)
							tr("Emission"),
							tr("Subsurface"),
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
							zui_radio(mode_handle, i, modes[i], shortcuts[i]);
						}

						let index: i32 = shortcuts.indexOf(keyboard_key_code(ui.key));
						if (ui.is_key_pressed && index != -1) {
							mode_handle.position = index;
							ui.changed = true;
							context_set_viewport_mode(mode_handle.position);
						}
						else if (mode_handle.changed) {
							context_set_viewport_mode(mode_handle.position);
							ui.changed = true;
						}
					}, count);
				}
			}

			if (operator_shortcut(config_keymap.operator_search)) UIBase.operator_search();
		}

		if (context_raw.brush_can_lock || context_raw.brush_locked) {
			if (mouse_moved && context_raw.brush_can_unlock) {
				context_raw.brush_locked = false;
				context_raw.brush_can_unlock = false;
			}

			///if (is_paint || is_sculpt)
			let b: bool = (context_raw.brush_can_lock || context_raw.brush_locked) &&
				!operator_shortcut(config_keymap.brush_radius, shortcut_type_t.DOWN) &&
				!operator_shortcut(config_keymap.brush_opacity, shortcut_type_t.DOWN) &&
				!operator_shortcut(config_keymap.brush_angle, shortcut_type_t.DOWN) &&
				!(decal_mask && operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.brush_radius, shortcut_type_t.DOWN));
			///end
			///if is_lab
			let b: bool = (context_raw.brush_can_lock || context_raw.brush_locked) &&
				!operator_shortcut(config_keymap.brush_radius, shortcut_type_t.DOWN);
			///end

			if (b) {
				mouse_unlock();
				context_raw.last_paint_x = -1;
				context_raw.last_paint_y = -1;
				if (context_raw.brush_can_lock) {
					context_raw.brush_can_lock = false;
					context_raw.brush_can_unlock = false;
					context_raw.brush_locked = false;
				}
				else {
					context_raw.brush_can_unlock = true;
				}
			}
		}

		///if (is_paint || is_sculpt)
		if (UIBase.border_handle_ptr != 0) {
			if (UIBase.border_handle_ptr == UINodes.hwnd.ptr || UIBase.border_handle_ptr == UIView2D.hwnd.ptr) {
				if (UIBase.border_started == border_side_t.LEFT) {
					config_raw.layout[layout_size_t.NODES_W] -= Math.floor(mouse_movement_x);
					if (config_raw.layout[layout_size_t.NODES_W] < 32) config_raw.layout[layout_size_t.NODES_W] = 32;
					else if (config_raw.layout[layout_size_t.NODES_W] > sys_width() * 0.7) config_raw.layout[layout_size_t.NODES_W] = Math.floor(sys_width() * 0.7);
				}
				else { // UINodes / UIView2D ratio
					config_raw.layout[layout_size_t.NODES_H] -= Math.floor(mouse_movement_y);
					if (config_raw.layout[layout_size_t.NODES_H] < 32) config_raw.layout[layout_size_t.NODES_H] = 32;
					else if (config_raw.layout[layout_size_t.NODES_H] > app_h() * 0.95) config_raw.layout[layout_size_t.NODES_H] = Math.floor(app_h() * 0.95);
				}
			}
			else if (UIBase.border_handle_ptr == UIBase.hwnds[tab_area_t.STATUS].ptr) {
				let my: i32 = Math.floor(mouse_movement_y);
				if (config_raw.layout[layout_size_t.STATUS_H] - my >= UIStatus.default_status_h * config_raw.window_scale && config_raw.layout[layout_size_t.STATUS_H] - my < sys_height() * 0.7) {
					config_raw.layout[layout_size_t.STATUS_H] -= my;
				}
			}
			else {
				if (UIBase.border_started == border_side_t.LEFT) {
					config_raw.layout[layout_size_t.SIDEBAR_W] -= Math.floor(mouse_movement_x);
					if (config_raw.layout[layout_size_t.SIDEBAR_W] < UIBase.sidebar_mini_w) config_raw.layout[layout_size_t.SIDEBAR_W] = UIBase.sidebar_mini_w;
					else if (config_raw.layout[layout_size_t.SIDEBAR_W] > sys_width() - UIBase.sidebar_mini_w) config_raw.layout[layout_size_t.SIDEBAR_W] = sys_width() - UIBase.sidebar_mini_w;
				}
				else {
					let my: i32 = Math.floor(mouse_movement_y);
					if (UIBase.border_handle_ptr == UIBase.hwnds[tab_area_t.SIDEBAR1].ptr && UIBase.border_started == border_side_t.TOP) {
						if (config_raw.layout[layout_size_t.SIDEBAR_H0] + my > 32 && config_raw.layout[layout_size_t.SIDEBAR_H1] - my > 32) {
							config_raw.layout[layout_size_t.SIDEBAR_H0] += my;
							config_raw.layout[layout_size_t.SIDEBAR_H1] -= my;
						}
					}
				}
			}
		}
		///end

		///if is_lab
		if (UIBase.border_handle_ptr != 0) {
			if (UIBase.border_handle_ptr == UINodes.hwnd.ptr || UIBase.border_handle_ptr == UIView2D.hwnd.ptr) {
				if (UIBase.border_started == border_side_t.LEFT) {
					config_raw.layout[layout_size_t.NODES_W] -= Math.floor(mouse_movement_x);
					if (config_raw.layout[layout_size_t.NODES_W] < 32) config_raw.layout[layout_size_t.NODES_W] = 32;
					else if (config_raw.layout[layout_size_t.NODES_W] > sys_width() * 0.7) config_raw.layout[layout_size_t.NODES_W] = Math.floor(sys_width() * 0.7);
				}
				else { // UINodes / UIView2D ratio
					config_raw.layout[layout_size_t.NODES_H] -= Math.floor(mouse_movement_y);
					if (config_raw.layout[layout_size_t.NODES_H] < 32) config_raw.layout[layout_size_t.NODES_H] = 32;
					else if (config_raw.layout[layout_size_t.NODES_H] > app_h() * 0.95) config_raw.layout[layout_size_t.NODES_H] = Math.floor(app_h() * 0.95);
				}
			}
			else if (UIBase.border_handle_ptr == UIBase.hwnds[tab_area_t.STATUS].ptr) {
				let my: i32 = Math.floor(mouse_movement_y);
				if (config_raw.layout[layout_size_t.STATUS_H] - my >= UIStatus.default_status_h * config_raw.window_scale && config_raw.layout[layout_size_t.STATUS_H] - my < sys_height() * 0.7) {
					config_raw.layout[layout_size_t.STATUS_H] -= my;
				}
			}
		}
		///end

		if (!mouse_down()) {
			UIBase.border_handle_ptr = 0;
			base_is_resizing = false;
		}

		///if arm_physics
		if (context_raw.tool == workspace_tool_t.PARTICLE && context_raw.particle_physics && context_in_paint_area() && !context_raw.paint2d) {
			UtilParticle.init_particle_physics();
			let world: PhysicsWorldRaw = PhysicsWorld.active;
			PhysicsWorld.late_update(world);
			context_raw.ddirty = 2;
			context_raw.rdirty = 2;
			if (mouse_started()) {
				if (context_raw.particle_timer != null) {
					tween_stop(context_raw.particle_timer);
					context_raw.particle_timer.done();
					context_raw.particle_timer = null;
				}
				history_push_undo = true;
				context_raw.particle_hit_x = context_raw.particle_hit_y = context_raw.particle_hit_z = 0;
				let o: object_t = scene_spawn_object(".Sphere");
				let md: material_data_t = data_get_material("Scene", ".Gizmo");
				let mo: mesh_object_t = o.ext;
				mo.base.name = ".Bullet";
				mo.materials[0] = md;
				mo.base.visible = true;

				let camera: camera_object_t = scene_camera;
				let ct: transform_t = camera.base.transform;
				vec4_set(mo.base.transform.loc, transform_world_x(ct), transform_world_y(ct), transform_world_z(ct));
				vec4_set(mo.base.transform.scale, context_raw.brush_radius * 0.2, context_raw.brush_radius * 0.2, context_raw.brush_radius * 0.2);
				transform_build_matrix(mo.base.transform);

				let body: PhysicsBodyRaw = PhysicsBody.create();
				body.shape = shape_type_t.SPHERE;
				body.mass = 1.0;
				body.ccd = true;
				mo.base.transform.radius /= 10; // Lower ccd radius
				PhysicsBody.init(body, mo.base);
				(mo.base as any).physicsBody = body;
				mo.base.transform.radius *= 10;

				let ray: ray_t = raycast_get_ray(mouse_view_x(), mouse_view_y(), camera);
				PhysicsBody.apply_impulse(body, vec4_mult(ray.dir, 0.15));

				context_raw.particle_timer = tween_timer(5, function() { mesh_object_remove(mo); });
			}

			let pairs: pair_t[] = PhysicsWorld.get_contact_pairs(world, context_raw.paint_body);
			if (pairs != null) {
				for (let p of pairs) {
					context_raw.last_particle_hit_x = context_raw.particle_hit_x != 0 ? context_raw.particle_hit_x : p.pos_a.x;
					context_raw.last_particle_hit_y = context_raw.particle_hit_y != 0 ? context_raw.particle_hit_y : p.pos_a.y;
					context_raw.last_particle_hit_z = context_raw.particle_hit_z != 0 ? context_raw.particle_hit_z : p.pos_a.z;
					context_raw.particle_hit_x = p.pos_a.x;
					context_raw.particle_hit_y = p.pos_a.y;
					context_raw.particle_hit_z = p.pos_a.z;
					context_raw.pdirty = 1;
					break; // 1 pair for now
				}
			}
		}
		///end
	}

	static view_top = () => {
		let is_typing: bool = UIBase.ui.is_typing || UIView2D.ui.is_typing || UINodes.ui.is_typing;

		if (context_in_paint_area() && !is_typing) {
			if (mouse_view_x() < app_w()) {
				viewport_set_view(0, 0, 1, 0, 0, 0);
			}
		}
	}

	static operator_search = () => {
		let search_handle: zui_handle_t = zui_handle("uibase_1");
		let first: bool = true;
		UIMenu.draw((ui: zui_t) => {
			zui_fill(0, 0, ui._w / zui_SCALE(ui), ui.t.ELEMENT_H * 8, ui.t.SEPARATOR_COL);
			let search: string = zui_text_input(search_handle, "", zui_align_t.LEFT, true, true);
			ui.changed = false;
			if (first) {
				first = false;
				search_handle.text = "";
				zui_start_text_edit(search_handle); // Focus search bar
			}

			if (search_handle.changed) UIBase.operator_search_offset = 0;

			if (ui.is_key_pressed) { // Move selection
				if (ui.key == key_code_t.DOWN && UIBase.operator_search_offset < 6) UIBase.operator_search_offset++;
				if (ui.key == key_code_t.UP && UIBase.operator_search_offset > 0) UIBase.operator_search_offset--;
			}
			let enter: bool = keyboard_down("enter");
			let count: i32 = 0;
			let BUTTON_COL: i32 = ui.t.BUTTON_COL;

			for (let n in config_keymap) {
				if (n.indexOf(search) >= 0) {
					ui.t.BUTTON_COL = count == UIBase.operator_search_offset ? ui.t.HIGHLIGHT_COL : ui.t.SEPARATOR_COL;
					if (zui_button(n, zui_align_t.LEFT, config_keymap[n]) || (enter && count == UIBase.operator_search_offset)) {
						if (enter) {
							ui.changed = true;
							count = 6; // Trigger break
						}
						operator_run(n);
					}
					if (++count > 6) break;
				}
			}

			if (enter && count == 0) { // Hide popup on enter when command is not found
				ui.changed = true;
				search_handle.text = "";
			}
			ui.t.BUTTON_COL = BUTTON_COL;
		}, 8, -1, -1);
	}

	static toggle_distract_free = () => {
		UIBase.show = !UIBase.show;
		base_resize();
	}

	static get_radius_increment = (): f32 => {
		return 0.1;
	}

	static hit_rect = (mx: f32, my: f32, x: i32, y: i32, w: i32, h: i32) => {
		return mx > x && mx < x + w && my > y && my < y + h;
	}

	///if (is_paint || is_sculpt)
	static get_brush_stencil_rect = (): rect_t => {
		let w: i32 = Math.floor(context_raw.brush_stencil_image.width * (base_h() / context_raw.brush_stencil_image.height) * context_raw.brush_stencil_scale);
		let h: i32 = Math.floor(base_h() * context_raw.brush_stencil_scale);
		let x: i32 = Math.floor(base_x() + context_raw.brush_stencil_x * base_w());
		let y: i32 = Math.floor(base_y() + context_raw.brush_stencil_y * base_h());
		return { w: w, h: h, x: x, y: y };
	}
	///end

	static update_ui = () => {
		if (console_message_timer > 0) {
			console_message_timer -= time_delta();
			if (console_message_timer <= 0) UIBase.hwnds[tab_area_t.STATUS].redraws = 2;
		}

		///if (is_paint || is_sculpt)
		UIBase.sidebar_mini_w = Math.floor(UIBase.default_sidebar_mini_w * zui_SCALE(UIBase.ui));
		///end

		if (!base_ui_enabled) return;

		///if (is_paint || is_sculpt)
		// Same mapping for paint and rotate (predefined in touch keymap)
		if (context_in_viewport()) {
			if (mouse_started() && config_keymap.action_paint == config_keymap.action_rotate) {
				UIBase.action_paint_remap = config_keymap.action_paint;
				UtilRender.pick_pos_nor_tex();
				let is_mesh: bool = Math.abs(context_raw.posx_picked) < 50 && Math.abs(context_raw.posy_picked) < 50 && Math.abs(context_raw.posz_picked) < 50;
				///if krom_android
				// Allow rotating with both pen and touch, because hovering a pen prevents touch input on android
				let pen_only: bool = false;
				///else
				let pen_only: bool = context_raw.pen_painting_only;
				///end
				let is_pen: bool = pen_only && pen_down();
				// Mesh picked - disable rotate
				// Pen painting only - rotate with touch, paint with pen
				if ((is_mesh && !pen_only) || is_pen) {
					config_keymap.action_rotate = "";
					config_keymap.action_paint = UIBase.action_paint_remap;
				}
				// World sphere picked - disable paint
				else {
					config_keymap.action_paint = "";
					config_keymap.action_rotate = UIBase.action_paint_remap;
				}
			}
			else if (!mouse_down() && UIBase.action_paint_remap != "") {
				config_keymap.action_rotate = UIBase.action_paint_remap;
				config_keymap.action_paint = UIBase.action_paint_remap;
				UIBase.action_paint_remap = "";
			}
		}

		if (context_raw.brush_stencil_image != null && operator_shortcut(config_keymap.stencil_transform, shortcut_type_t.DOWN)) {
			let r: rect_t = UIBase.get_brush_stencil_rect();
			if (mouse_started("left")) {
				context_raw.brush_stencil_scaling =
					UIBase.hit_rect(mouse_x, mouse_y, r.x - 8,       r.y - 8,       16, 16) ||
					UIBase.hit_rect(mouse_x, mouse_y, r.x - 8,       r.h + r.y - 8, 16, 16) ||
					UIBase.hit_rect(mouse_x, mouse_y, r.w + r.x - 8, r.y - 8,       16, 16) ||
					UIBase.hit_rect(mouse_x, mouse_y, r.w + r.x - 8, r.h + r.y - 8, 16, 16);
				let cosa: f32 = Math.cos(-context_raw.brush_stencil_angle);
				let sina: f32 = Math.sin(-context_raw.brush_stencil_angle);
				let ox: f32 = 0;
				let oy: f32 = -r.h / 2;
				let x: f32 = ox * cosa - oy * sina;
				let y: f32 = ox * sina + oy * cosa;
				x += r.x + r.w / 2;
				y += r.y + r.h / 2;
				context_raw.brush_stencil_rotating =
					UIBase.hit_rect(mouse_x, mouse_y, Math.floor(x - 16), Math.floor(y - 16), 32, 32);
			}
			let _scale: f32 = context_raw.brush_stencil_scale;
			if (mouse_down("left")) {
				if (context_raw.brush_stencil_scaling) {
					let mult: i32 = mouse_x > r.x + r.w / 2 ? 1 : -1;
					context_raw.brush_stencil_scale += mouse_movement_x / 400 * mult;
				}
				else if (context_raw.brush_stencil_rotating) {
					let gizmo_x: f32 = r.x + r.w / 2;
					let gizmo_y: f32 = r.y + r.h / 2;
					context_raw.brush_stencil_angle = -Math.atan2(mouse_y - gizmo_y, mouse_x - gizmo_x) - Math.PI / 2;
				}
				else {
					context_raw.brush_stencil_x += mouse_movement_x / base_w();
					context_raw.brush_stencil_y += mouse_movement_y / base_h();
				}
			}
			else context_raw.brush_stencil_scaling = false;
			if (mouse_wheel_delta != 0) {
				context_raw.brush_stencil_scale -= mouse_wheel_delta / 10;
			}
			// Center after scale
			let ratio: f32 = base_h() / context_raw.brush_stencil_image.height;
			let old_w: f32 = _scale * context_raw.brush_stencil_image.width * ratio;
			let new_w: f32 = context_raw.brush_stencil_scale * context_raw.brush_stencil_image.width * ratio;
			let old_h: f32 = _scale * base_h();
			let new_h: f32 = context_raw.brush_stencil_scale * base_h();
			context_raw.brush_stencil_x += (old_w - new_w) / base_w() / 2;
			context_raw.brush_stencil_y += (old_h - new_h) / base_h() / 2;
		}
		///end

		let set_clone_source: bool = context_raw.tool == workspace_tool_t.CLONE && operator_shortcut(config_keymap.set_clone_source + "+" + config_keymap.action_paint, shortcut_type_t.DOWN);

		///if (is_paint || is_sculpt)
		let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;
		let decal_mask: bool = decal && operator_shortcut(config_keymap.decal_mask + "+" + config_keymap.action_paint, shortcut_type_t.DOWN);
		let down: bool = operator_shortcut(config_keymap.action_paint, shortcut_type_t.DOWN) ||
				   		 decal_mask ||
				   		 set_clone_source ||
				   		 operator_shortcut(config_keymap.brush_ruler + "+" + config_keymap.action_paint, shortcut_type_t.DOWN) ||
				   		 (pen_down() && !keyboard_down("alt"));
		///end
		///if is_lab
		let down: bool = operator_shortcut(config_keymap.action_paint, shortcut_type_t.DOWN) ||
				   		 set_clone_source ||
				   		 operator_shortcut(config_keymap.brush_ruler + "+" + config_keymap.action_paint, shortcut_type_t.DOWN) ||
				   		 (pen_down() && !keyboard_down("alt"));
		///end

		if (config_raw.touch_ui) {
			if (pen_down()) {
				context_raw.pen_painting_only = true;
			}
			else if (context_raw.pen_painting_only) {
				down = false;
			}
		}

		///if arm_physics
		if (context_raw.tool == workspace_tool_t.PARTICLE && context_raw.particle_physics) {
			down = false;
		}
		///end

		///if (is_paint || is_sculpt)
		///if krom_ios
		// No hover on iPad, decals are painted by pen release
		if (decal) {
			down = pen_released();
			if (!context_raw.pen_painting_only) {
				down = down || mouse_released();
			}
		}
		///end
		///end

		if (down) {
			let mx: i32 = mouse_view_x();
			let my: i32 = mouse_view_y();
			let ww: i32 = app_w();

			///if (is_paint || is_sculpt)
			if (context_raw.paint2d) {
				mx -= app_w();
				ww = UIView2D.ww;
			}
			///end

			if (mx < ww &&
				mx > app_x() &&
				my < app_h() &&
				my > app_y()) {

				if (set_clone_source) {
					context_raw.clone_start_x = mx;
					context_raw.clone_start_y = my;
				}
				else {
					if (context_raw.brush_time == 0 &&
						!base_is_dragging &&
						!base_is_resizing &&
						!base_is_combo_selected()) { // Paint started

						// Draw line
						if (operator_shortcut(config_keymap.brush_ruler + "+" + config_keymap.action_paint, shortcut_type_t.DOWN)) {
							context_raw.last_paint_vec_x = context_raw.last_paint_x;
							context_raw.last_paint_vec_y = context_raw.last_paint_y;
						}

						///if (is_paint || is_sculpt)
						history_push_undo = true;

						if (context_raw.tool == workspace_tool_t.CLONE && context_raw.clone_start_x >= 0.0) { // Clone delta
							context_raw.clone_delta_x = (context_raw.clone_start_x - mx) / ww;
							context_raw.clone_delta_y = (context_raw.clone_start_y - my) / app_h();
							context_raw.clone_start_x = -1;
						}
						else if (context_raw.tool == workspace_tool_t.PARTICLE) {
							// Reset particles
							///if arm_particles
							let emitter: mesh_object_t = scene_get_child(".ParticleEmitter").ext;
							let psys: particle_sys_t = emitter.particle_systems[0];
							psys.time = 0;
							// psys.time = psys.seed * psys.animtime;
							// psys.seed++;
							///end
						}
						else if (context_raw.tool == workspace_tool_t.FILL && context_raw.fill_type_handle.position == fill_type_t.UV_ISLAND) {
							UtilUV.uvislandmap_cached = false;
						}
						///end
					}

					context_raw.brush_time += time_delta();

					///if (is_paint || is_sculpt)
					if (context_raw.run_brush != null) {
						context_raw.run_brush(0);
					}
					///end
					///if is_lab
					if (context_run_brush != null) {
						context_run_brush(0);
					}
					///end
				}
			}
		}
		else if (context_raw.brush_time > 0) { // Brush released
			context_raw.brush_time = 0;
			context_raw.prev_paint_vec_x = -1;
			context_raw.prev_paint_vec_y = -1;
			///if (!krom_direct3d12 && !krom_vulkan && !krom_metal) // Keep accumulated samples for D3D12
			context_raw.ddirty = 3;
			///end
			context_raw.brush_blend_dirty = true; // Update brush mask

			///if (is_paint || is_sculpt)
			context_raw.layer_preview_dirty = true; // Update layer preview
			///end

			///if is_paint
			// New color id picked, update fill layer
			if (context_raw.tool == workspace_tool_t.COLORID && context_raw.layer.fill_layer != null) {
				base_notify_on_next_frame(() => {
					base_update_fill_layer();
					MakeMaterial.parse_paint_material(false);
				});
			}
			///end
		}

		///if is_paint
		if (context_raw.layers_preview_dirty) {
			context_raw.layers_preview_dirty = false;
			context_raw.layer_preview_dirty = false;
			context_raw.mask_preview_last = null;
			if (base_pipe_merge == null) base_make_pipe();
			// Update all layer previews
			for (let l of project_layers) {
				if (SlotLayer.is_group(l)) continue;
				let target: image_t = l.texpaint_preview;
				let source: image_t = l.texpaint;
				g2_begin(target);
				g2_clear(0x00000000);
				// g2_set_pipeline(l.isMask() ? base_pipe_copy8 : base_pipe_copy);
				g2_set_pipeline(base_pipe_copy); // texpaint_preview is always RGBA32 for now
				g2_draw_scaled_image(source, 0, 0, target.width, target.height);
				g2_set_pipeline(null);
				g2_end();
			}
			UIBase.hwnds[tab_area_t.SIDEBAR0].redraws = 2;
		}
		if (context_raw.layer_preview_dirty && !SlotLayer.is_group(context_raw.layer)) {
			context_raw.layer_preview_dirty = false;
			context_raw.mask_preview_last = null;
			if (base_pipe_merge == null) base_make_pipe();
			// Update layer preview
			let l: SlotLayerRaw = context_raw.layer;
			let target: image_t = l.texpaint_preview;
			let source: image_t = l.texpaint;
			g2_begin(target);
			g2_clear(0x00000000);
			// g2_set_pipeline(raw.layer.isMask() ? base_pipe_copy8 : base_pipe_copy);
			g2_set_pipeline(base_pipe_copy); // texpaint_preview is always RGBA32 for now
			g2_draw_scaled_image(source, 0, 0, target.width, target.height);
			g2_set_pipeline(null);
			g2_end();
			UIBase.hwnds[tab_area_t.SIDEBAR0].redraws = 2;
		}
		///end

		let undo_pressed: bool = operator_shortcut(config_keymap.edit_undo);
		let redo_pressed: bool = operator_shortcut(config_keymap.edit_redo) ||
						  		(keyboard_down("control") && keyboard_started("y"));

		// Two-finger tap to undo, three-finger tap to redo
		if (context_in_viewport() && config_raw.touch_ui) {
			if (mouse_started("middle")) { UIBase.redo_tap_time = time_time(); }
			else if (mouse_started("right")) { UIBase.undo_tap_time = time_time(); }
			else if (mouse_released("middle") && time_time() - UIBase.redo_tap_time < 0.1) { UIBase.redo_tap_time = UIBase.undo_tap_time = 0; redo_pressed = true; }
			else if (mouse_released("right") && time_time() - UIBase.undo_tap_time < 0.1) { UIBase.redo_tap_time = UIBase.undo_tap_time = 0; undo_pressed = true; }
		}

		if (undo_pressed) history_undo();
		else if (redo_pressed) history_redo();

		///if (is_paint || is_sculpt)
		gizmo_update();
		///end
	}

	static render = () => {
		if (!UIBase.show && config_raw.touch_ui) {
			UIBase.ui.input_enabled = true;
			g2_end();
			zui_begin(UIBase.ui);
			if (zui_window(zui_handle("uibase_2"), 0, 0, 150, Math.floor(zui_ELEMENT_H(UIBase.ui) + zui_ELEMENT_OFFSET(UIBase.ui) + 1))) {
				if (zui_button(tr("Close"))) {
					UIBase.toggle_distract_free();
				}
			}
			zui_end();
			g2_begin(null);
		}

		if (!UIBase.show || sys_width() == 0 || sys_height() == 0) return;

		UIBase.ui.input_enabled = base_ui_enabled;

		// Remember last tab positions
		for (let i: i32 = 0; i < UIBase.htabs.length; ++i) {
			if (UIBase.htabs[i].changed) {
				config_raw.layout_tabs[i] = UIBase.htabs[i].position;
				config_save();
			}
		}

		// Set tab positions
		for (let i: i32 = 0; i < UIBase.htabs.length; ++i) {
			UIBase.htabs[i].position = config_raw.layout_tabs[i];
		}

		g2_end();
		zui_begin(UIBase.ui);

		///if (is_paint || is_sculpt)
		UIToolbar.render_ui();
		///end
		UIMenubar.render_ui();
		UIHeader.render_ui();
		UIStatus.render_ui();

		///if (is_paint || is_sculpt)
		UIBase.draw_sidebar();
		///end

		zui_end();
		g2_begin(null);
	}

	///if (is_paint || is_sculpt)
	static draw_sidebar = () => {
		// Tabs
		let mini: bool = config_raw.layout[layout_size_t.SIDEBAR_W] <= UIBase.sidebar_mini_w;
		let expand_button_offset: i32 = config_raw.touch_ui ? Math.floor(zui_ELEMENT_H(UIBase.ui) + zui_ELEMENT_OFFSET(UIBase.ui)) : 0;
		UIBase.tabx = sys_width() - config_raw.layout[layout_size_t.SIDEBAR_W];

		let _SCROLL_W: i32 = UIBase.ui.t.SCROLL_W;
		if (mini) UIBase.ui.t.SCROLL_W = UIBase.ui.t.SCROLL_MINI_W;

		if (zui_window(UIBase.hwnds[tab_area_t.SIDEBAR0], UIBase.tabx, 0, config_raw.layout[layout_size_t.SIDEBAR_W], config_raw.layout[layout_size_t.SIDEBAR_H0])) {
			for (let i: i32 = 0; i < (mini ? 1 : UIBase.hwnd_tabs[tab_area_t.SIDEBAR0].length); ++i) UIBase.hwnd_tabs[tab_area_t.SIDEBAR0][i](UIBase.htabs[tab_area_t.SIDEBAR0]);
		}
		if (zui_window(UIBase.hwnds[tab_area_t.SIDEBAR1], UIBase.tabx, config_raw.layout[layout_size_t.SIDEBAR_H0], config_raw.layout[layout_size_t.SIDEBAR_W], config_raw.layout[layout_size_t.SIDEBAR_H1] - expand_button_offset)) {
			for (let i: i32 = 0; i < (mini ? 1 : UIBase.hwnd_tabs[tab_area_t.SIDEBAR1].length); ++i) UIBase.hwnd_tabs[tab_area_t.SIDEBAR1][i](UIBase.htabs[tab_area_t.SIDEBAR1]);
		}

		zui_end_window();
		UIBase.ui.t.SCROLL_W = _SCROLL_W;

		// Collapse / expand button for mini sidebar
		if (config_raw.touch_ui) {
			let width: i32 = config_raw.layout[layout_size_t.SIDEBAR_W];
			let height: i32 = Math.floor(zui_ELEMENT_H(UIBase.ui) + zui_ELEMENT_OFFSET(UIBase.ui));
			if (zui_window(zui_handle("uibase_3"), sys_width() - width, sys_height() - height, width, height + 1)) {
				UIBase.ui._w = width;
				let _BUTTON_H: i32 = UIBase.ui.t.BUTTON_H;
				let _BUTTON_COL: i32 = UIBase.ui.t.BUTTON_COL;
				UIBase.ui.t.BUTTON_H = UIBase.ui.t.ELEMENT_H;
				UIBase.ui.t.BUTTON_COL = UIBase.ui.t.WINDOW_BG_COL;
				if (zui_button(mini ? "<<" : ">>")) {
					config_raw.layout[layout_size_t.SIDEBAR_W] = mini ? UIBase.default_sidebar_full_w : UIBase.default_sidebar_mini_w;
					config_raw.layout[layout_size_t.SIDEBAR_W] = Math.floor(config_raw.layout[layout_size_t.SIDEBAR_W] * zui_SCALE(UIBase.ui));
				}
				UIBase.ui.t.BUTTON_H = _BUTTON_H;
				UIBase.ui.t.BUTTON_COL = _BUTTON_COL;
			}
		}

		// Expand button
		if (config_raw.layout[layout_size_t.SIDEBAR_W] == 0) {
			let width: i32 = Math.floor(g2_font_width(UIBase.ui.font, UIBase.ui.font_size, "<<") + 25 * zui_SCALE(UIBase.ui));
			if (zui_window(UIBase.hminimized, sys_width() - width, 0, width, Math.floor(zui_ELEMENT_H(UIBase.ui) + zui_ELEMENT_OFFSET(UIBase.ui) + 1))) {
				UIBase.ui._w = width;
				let _BUTTON_H: i32 = UIBase.ui.t.BUTTON_H;
				let _BUTTON_COL: i32 = UIBase.ui.t.BUTTON_COL;
				UIBase.ui.t.BUTTON_H = UIBase.ui.t.ELEMENT_H;
				UIBase.ui.t.BUTTON_COL = UIBase.ui.t.SEPARATOR_COL;

				if (zui_button("<<")) {
					config_raw.layout[layout_size_t.SIDEBAR_W] = context_raw.maximized_sidebar_width != 0 ? context_raw.maximized_sidebar_width : Math.floor(UIBase.default_sidebar_w * config_raw.window_scale);
				}
				UIBase.ui.t.BUTTON_H = _BUTTON_H;
				UIBase.ui.t.BUTTON_COL = _BUTTON_COL;
			}
		}
		else if (UIBase.htabs[tab_area_t.SIDEBAR0].changed && UIBase.htabs[tab_area_t.SIDEBAR0].position == context_raw.last_htab0_pos) {
			if (time_time() - context_raw.select_time < 0.25) {
				context_raw.maximized_sidebar_width = config_raw.layout[layout_size_t.SIDEBAR_W];
				config_raw.layout[layout_size_t.SIDEBAR_W] = 0;
			}
			context_raw.select_time = time_time();
		}
		context_raw.last_htab0_pos = UIBase.htabs[tab_area_t.SIDEBAR0].position;
	}

	static render_cursor = () => {
		if (!base_ui_enabled) return;

		///if is_paint
		if (context_raw.tool == workspace_tool_t.MATERIAL || context_raw.tool == workspace_tool_t.BAKE) return;
		///end

		g2_set_color(0xffffffff);

		context_raw.view_index = context_raw.view_index_last;
		let mx: i32 = base_x() + context_raw.paint_vec.x * base_w();
		let my: i32 = base_y() + context_raw.paint_vec.y * base_h();
		context_raw.view_index = -1;

		// Radius being scaled
		if (context_raw.brush_locked) {
			mx += context_raw.lock_started_x - sys_width() / 2;
			my += context_raw.lock_started_y - sys_height() / 2;
		}

		let tool: workspace_tool_t = context_raw.tool as workspace_tool_t;

		///if is_paint
		if (context_raw.brush_stencil_image != null &&
			tool != workspace_tool_t.BAKE &&
			tool != workspace_tool_t.PICKER &&
			tool != workspace_tool_t.MATERIAL &&
			tool != workspace_tool_t.COLORID) {
			let r: rect_t = UIBase.get_brush_stencil_rect();
			if (!operator_shortcut(config_keymap.stencil_hide, shortcut_type_t.DOWN)) {
				g2_set_color(0x88ffffff);
				let angle: f32 = context_raw.brush_stencil_angle;
				let cx: f32 = r.x + r.w / 2;
				let cy: f32 = r.y + r.h / 2;
				g2_set_transformation(mat3_multmat(mat3_multmat(mat3_translation(cx, cy), mat3_rotation(-angle)), mat3_translation(-cx, -cy)));
				g2_draw_scaled_image(context_raw.brush_stencil_image, r.x, r.y, r.w, r.h);
				g2_set_transformation(null);
				g2_set_color(0xffffffff);
			}
			let transform: bool = operator_shortcut(config_keymap.stencil_transform, shortcut_type_t.DOWN);
			if (transform) {
				// Outline
				g2_draw_rect(r.x, r.y, r.w, r.h);
				// Scale
				g2_draw_rect(r.x - 8,       r.y - 8,       16, 16);
				g2_draw_rect(r.x - 8 + r.w, r.y - 8,       16, 16);
				g2_draw_rect(r.x - 8,       r.y - 8 + r.h, 16, 16);
				g2_draw_rect(r.x - 8 + r.w, r.y - 8 + r.h, 16, 16);
				// Rotate
				let angle: f32 = context_raw.brush_stencil_angle;
				let cx: f32 = r.x + r.w / 2;
				let cy: f32 = r.y + r.h / 2;
				g2_set_transformation(mat3_multmat(mat3_multmat(mat3_translation(cx, cy), mat3_rotation(-angle)), mat3_translation(-cx, -cy)));
				g2_fill_circle(r.x + r.w / 2, r.y - 4, 8);
				g2_set_transformation(null);
			}
		}
		///end

		// Show picked material next to cursor
		if (context_raw.tool == workspace_tool_t.PICKER && context_raw.picker_select_material && context_raw.color_picker_callback == null) {
			let img: image_t = context_raw.material.image_icon;
			///if krom_opengl
			g2_draw_scaled_image(img, mx + 10, my + 10 + img.height, img.width, -img.height);
			///else
			g2_draw_image(img, mx + 10, my + 10);
			///end
		}
		if (context_raw.tool == workspace_tool_t.PICKER && context_raw.color_picker_callback != null) {
			let img: image_t = resource_get("icons.k");
			let rect: rect_t = resource_tile50(img, workspace_tool_t.PICKER, 0);
			g2_draw_sub_image(img, mx + 10, my + 10, rect.x, rect.y, rect.w, rect.h);
		}

		let cursor_img: image_t = resource_get("cursor.k");
		let psize: i32 = Math.floor(cursor_img.width * (context_raw.brush_radius * context_raw.brush_nodes_radius) * zui_SCALE(UIBase.ui));

		// Clone source cursor
		if (context_raw.tool == workspace_tool_t.CLONE && !keyboard_down("alt") && (mouse_down() || pen_down())) {
			g2_set_color(0x66ffffff);
			g2_draw_scaled_image(cursor_img, mx + context_raw.clone_delta_x * app_w() - psize / 2, my + context_raw.clone_delta_y * app_h() - psize / 2, psize, psize);
			g2_set_color(0xffffffff);
		}

		let decal: bool = context_raw.tool == workspace_tool_t.DECAL || context_raw.tool == workspace_tool_t.TEXT;

		if (!config_raw.brush_3d || context_in_2d_view() || decal) {
			let decal_mask: bool = decal && operator_shortcut(config_keymap.decal_mask, shortcut_type_t.DOWN);
			if (decal && !context_in_nodes()) {
				let decal_alpha: f32 = 0.5;
				if (!decal_mask) {
					context_raw.decal_x = context_raw.paint_vec.x;
					context_raw.decal_y = context_raw.paint_vec.y;
					decal_alpha = context_raw.brush_opacity;

					// Radius being scaled
					if (context_raw.brush_locked) {
						context_raw.decal_x += (context_raw.lock_started_x - sys_width() / 2) / base_w();
						context_raw.decal_y += (context_raw.lock_started_y - sys_height() / 2) / base_h();
					}
				}

				if (!config_raw.brush_live) {
					let psizex: i32 = Math.floor(256 * zui_SCALE(UIBase.ui) * (context_raw.brush_radius * context_raw.brush_nodes_radius * context_raw.brush_scale_x));
					let psizey: i32 = Math.floor(256 * zui_SCALE(UIBase.ui) * (context_raw.brush_radius * context_raw.brush_nodes_radius));

					context_raw.view_index = context_raw.view_index_last;
					let decalx: f32 = base_x() + context_raw.decal_x * base_w() - psizex / 2;
					let decaly: f32 = base_y() + context_raw.decal_y * base_h() - psizey / 2;
					context_raw.view_index = -1;

					g2_set_color(color_from_floats(1, 1, 1, decal_alpha));
					let angle: f32 = (context_raw.brush_angle + context_raw.brush_nodes_angle) * (Math.PI / 180);
					let cx: f32 = decalx + psizex / 2;
					let cy: f32 = decaly + psizey / 2;
					g2_set_transformation(mat3_multmat(mat3_multmat(mat3_translation(cx, cy), mat3_rotation(angle)), mat3_translation(-cx, -cy)));
					///if (krom_direct3d11 || krom_direct3d12 || krom_metal || krom_vulkan)
					g2_draw_scaled_image(context_raw.decal_image, decalx, decaly, psizex, psizey);
					///else
					g2_draw_scaled_image(context_raw.decal_image, decalx, decaly + psizey, psizex, -psizey);
					///end
					g2_set_transformation(null);
					g2_set_color(0xffffffff);
				}
			}
			if (context_raw.tool == workspace_tool_t.BRUSH  ||
				context_raw.tool == workspace_tool_t.ERASER ||
				context_raw.tool == workspace_tool_t.CLONE  ||
				context_raw.tool == workspace_tool_t.BLUR   ||
				context_raw.tool == workspace_tool_t.SMUDGE   ||
				context_raw.tool == workspace_tool_t.PARTICLE ||
				(decal_mask && !config_raw.brush_3d) ||
				(decal_mask && context_in_2d_view())) {
				if (decal_mask) {
					psize = Math.floor(cursor_img.width * (context_raw.brush_decal_mask_radius * context_raw.brush_nodes_radius) * zui_SCALE(UIBase.ui));
				}
				if (config_raw.brush_3d && context_in_2d_view()) {
					psize = Math.floor(psize * UIView2D.pan_scale);
				}
				g2_draw_scaled_image(cursor_img, mx - psize / 2, my - psize / 2, psize, psize);
			}
		}

		if (context_raw.brush_lazy_radius > 0 && !context_raw.brush_locked &&
			(context_raw.tool == workspace_tool_t.BRUSH ||
			 context_raw.tool == workspace_tool_t.ERASER ||
			 context_raw.tool == workspace_tool_t.DECAL ||
			 context_raw.tool == workspace_tool_t.TEXT ||
			 context_raw.tool == workspace_tool_t.CLONE ||
			 context_raw.tool == workspace_tool_t.BLUR ||
			 context_raw.tool == workspace_tool_t.SMUDGE ||
			 context_raw.tool == workspace_tool_t.PARTICLE)) {
			g2_fill_rect(mx - 1, my - 1, 2, 2);
			mx = context_raw.brush_lazy_x * base_w() + base_x();
			my = context_raw.brush_lazy_y * base_h() + base_y();
			let radius: f32 = context_raw.brush_lazy_radius * 180;
			g2_set_color(0xff666666);
			g2_draw_scaled_image(cursor_img, mx - radius / 2, my - radius / 2, radius, radius);
			g2_set_color(0xffffffff);
		}
	}
	///end

	static show_material_nodes = () => {
		// Clear input state as ui receives input events even when not drawn
		zui_end_input();

		///if (is_paint || is_sculpt)
		UINodes.show = !UINodes.show || UINodes.canvas_type != canvas_type_t.MATERIAL;
		UINodes.canvas_type = canvas_type_t.MATERIAL;
		///end
		///if is_lab
		UINodes.show = !UINodes.show;
		///end

		base_resize();
	}

	///if (is_paint || is_sculpt)
	static show_brush_nodes = () => {
		// Clear input state as ui receives input events even when not drawn
		zui_end_input();
		UINodes.show = !UINodes.show || UINodes.canvas_type != canvas_type_t.BRUSH;
		UINodes.canvas_type = canvas_type_t.BRUSH;
		base_resize();
	}
	///end

	static show_2d_view = (type: view_2d_type_t) => {
		// Clear input state as ui receives input events even when not drawn
		zui_end_input();
		if (UIView2D.type != type) UIView2D.show = true;
		else UIView2D.show = !UIView2D.show;
		UIView2D.type = type;
		UIView2D.hwnd.redraws = 2;
		base_resize();
	}

	static toggle_browser = () => {
		let minimized: bool = config_raw.layout[layout_size_t.STATUS_H] <= (UIStatus.default_status_h * config_raw.window_scale);
		config_raw.layout[layout_size_t.STATUS_H] = minimized ? 240 : UIStatus.default_status_h;
		config_raw.layout[layout_size_t.STATUS_H] = Math.floor(config_raw.layout[layout_size_t.STATUS_H] * config_raw.window_scale);
	}

	static set_icon_scale = () => {
		if (zui_SCALE(UIBase.ui) > 1) {
			resource_load(["icons2x.k"], () => {
				resource_bundled.set("icons.k", resource_get("icons2x.k"));
			});
		}
		else {
			resource_load(["icons.k"], () => {});
		}
	}

	static on_border_hover = (handle_ptr: i32, side: i32) => {
		if (!base_ui_enabled) return;

		///if (is_paint || is_sculpt)
		if (handle_ptr != UIBase.hwnds[tab_area_t.SIDEBAR0].ptr &&
			handle_ptr != UIBase.hwnds[tab_area_t.SIDEBAR1].ptr &&
			handle_ptr != UIBase.hwnds[tab_area_t.STATUS].ptr &&
			handle_ptr != UINodes.hwnd.ptr &&
			handle_ptr != UIView2D.hwnd.ptr) return; // Scalable handles
		if (handle_ptr == UIView2D.hwnd.ptr && side != border_side_t.LEFT) return;
		if (handle_ptr == UINodes.hwnd.ptr && side == border_side_t.TOP && !UIView2D.show) return;
		if (handle_ptr == UIBase.hwnds[tab_area_t.SIDEBAR0].ptr && side == border_side_t.TOP) return;
		///end

		///if is_lab
		if (handle_ptr != UIBase.hwnds[tab_area_t.STATUS].ptr &&
			handle_ptr != UINodes.hwnd.ptr &&
			handle_ptr != UIView2D.hwnd.ptr) return; // Scalable handles
		if (handle_ptr == UIView2D.hwnd.ptr && side != border_side_t.LEFT) return;
		if (handle_ptr == UINodes.hwnd.ptr && side == border_side_t.TOP && !UIView2D.show) return;
		///end

		if (handle_ptr == UINodes.hwnd.ptr && side != border_side_t.LEFT && side != border_side_t.TOP) return;
		if (handle_ptr == UIBase.hwnds[tab_area_t.STATUS].ptr && side != border_side_t.TOP) return;
		if (side == border_side_t.RIGHT) return; // UI is snapped to the right side

		side == border_side_t.LEFT || side == border_side_t.RIGHT ?
			krom_set_mouse_cursor(3) : // Horizontal
			krom_set_mouse_cursor(4);  // Vertical

		if (zui_current.input_started) {
			UIBase.border_started = side;
			UIBase.border_handle_ptr = handle_ptr;
			base_is_resizing = true;
		}
	}

	static on_text_hover = () => {
		krom_set_mouse_cursor(2); // I-cursor
	}

	static on_deselect_text = () => {
		///if krom_ios
		keyboard_up_listener(key_code_t.SHIFT);
		///end
	}

	static on_tab_drop = (to_ptr: i32, toPosition: i32, from_ptr: i32, fromPosition: i32) => {
		let i: i32 = -1;
		let j: i32 = -1;
		for (let k: i32 = 0; k < UIBase.htabs.length; ++k) {
			if (UIBase.htabs[k].ptr == to_ptr) i = k;
			if (UIBase.htabs[k].ptr == from_ptr) j = k;
		}
		if (i > -1 && j > -1) {
			let element: any = UIBase.hwnd_tabs[j][fromPosition];
			UIBase.hwnd_tabs[j].splice(fromPosition, 1);
			UIBase.hwnd_tabs[i].splice(toPosition, 0, element);
			UIBase.hwnds[i].redraws = 2;
			UIBase.hwnds[j].redraws = 2;
		}
	}

	static tag_ui_redraw = () => {
		UIHeader.header_handle.redraws = 2;
		UIBase.hwnds[tab_area_t.STATUS].redraws = 2;
		UIMenubar.workspace_handle.redraws = 2;
		UIMenubar.menu_handle.redraws = 2;
		///if (is_paint || is_sculpt)
		UIBase.hwnds[tab_area_t.SIDEBAR0].redraws = 2;
		UIBase.hwnds[tab_area_t.SIDEBAR1].redraws = 2;
		UIToolbar.toolbar_handle.redraws = 2;
		///end
	}
}
