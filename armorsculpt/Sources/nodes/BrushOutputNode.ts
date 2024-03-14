
class BrushOutputNode extends LogicNode {

	Directional = false; // button 0

	constructor() {
		super();
		context_raw.run_brush = this.run;
		context_raw.parse_brush_inputs = this.parse_inputs;
	}

	parse_inputs = () => {
		let last_mask = context_raw.brush_mask_image;
		let last_stencil = context_raw.brush_stencil_image;

		let input0: any;
		let input1: any;
		let input2: any;
		let input3: any;
		let input4: any;
		try {
			this.inputs[0].get((value) => { input0 = value; });
			this.inputs[1].get((value) => { input1 = value; });
			this.inputs[2].get((value) => { input2 = value; });
			this.inputs[3].get((value) => { input3 = value; });
			this.inputs[4].get((value) => { input4 = value; });
		}
		catch (_) {
			return;
		}

		context_raw.paint_vec = input0;
		context_raw.brush_nodes_radius = input1;

		let opac: any = input2; // Float or texture name
		if (opac == null) opac = 1.0;
		if (typeof opac == "string") {
			context_raw.brush_mask_image_is_alpha = opac.endsWith(".a");
			opac = opac.substr(0, opac.lastIndexOf("."));
			context_raw.brush_nodes_opacity = 1.0;
			let index = project_asset_names.indexOf(opac);
			let asset = project_assets[index];
			context_raw.brush_mask_image = project_get_image(asset);
		}
		else {
			context_raw.brush_nodes_opacity = opac;
			context_raw.brush_mask_image = null;
		}

		context_raw.brush_nodes_hardness = input3;

		let stencil: any = input4; // Float or texture name
		if (stencil == null) stencil = 1.0;
		if (typeof stencil == "string") {
			context_raw.brush_stencil_image_is_alpha = stencil.endsWith(".a");
			stencil = stencil.substr(0, stencil.lastIndexOf("."));
			let index = project_asset_names.indexOf(stencil);
			let asset = project_assets[index];
			context_raw.brush_stencil_image = project_get_image(asset);
		}
		else {
			context_raw.brush_stencil_image = null;
		}

		if (last_mask != context_raw.brush_mask_image ||
			last_stencil != context_raw.brush_stencil_image) {
			make_material_parse_paint_material();
		}

		context_raw.brush_directional = this.Directional;
	}

	run = (from: i32) => {
		let left = 0.0;
		let right = 1.0;
		if (context_raw.paint2d) {
			left = 1.0;
			right = (context_raw.split_view ? 2.0 : 1.0) + ui_view2d_ww / base_w();
		}

		// First time init
		if (context_raw.last_paint_x < 0 || context_raw.last_paint_y < 0) {
			context_raw.last_paint_vec_x = context_raw.paint_vec.x;
			context_raw.last_paint_vec_y = context_raw.paint_vec.y;
		}

		// Do not paint over fill layer
		let fillLayer = context_raw.layer.fill_layer != null;

		// Do not paint over groups
		let groupLayer = slot_layer_is_group(context_raw.layer);

		// Paint bounds
		if (context_raw.paint_vec.x > left &&
			context_raw.paint_vec.x < right &&
			context_raw.paint_vec.y > 0 &&
			context_raw.paint_vec.y < 1 &&
			!fillLayer &&
			!groupLayer &&
			(slot_layer_is_visible(context_raw.layer) || context_raw.paint2d) &&
			!ui_base_ui.is_hovered &&
			!base_is_dragging &&
			!base_is_resizing &&
			!base_is_scrolling() &&
			!base_is_combo_selected()) {

			let down = mouse_down() || pen_down();

			// Prevent painting the same spot
			let sameSpot = context_raw.paint_vec.x == context_raw.last_paint_x && context_raw.paint_vec.y == context_raw.last_paint_y;
			let lazy = context_raw.tool == workspace_tool_t.BRUSH && context_raw.brush_lazy_radius > 0;
			if (down && (sameSpot || lazy)) {
				context_raw.painted++;
			}
			else {
				context_raw.painted = 0;
			}
			context_raw.last_paint_x = context_raw.paint_vec.x;
			context_raw.last_paint_y = context_raw.paint_vec.y;

			if (context_raw.tool == workspace_tool_t.PARTICLE) {
				context_raw.painted = 0; // Always paint particles
			}

			if (context_raw.painted == 0) {
				this.parse_inputs();
			}

			if (context_raw.painted == 0) {
				context_raw.pdirty = 1;
				context_raw.rdirty = 2;
				history_push_undo2 = true; ////
			}
		}
	}
}
