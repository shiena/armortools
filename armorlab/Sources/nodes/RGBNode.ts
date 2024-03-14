
class RGBNode extends LogicNode {

	image: image_t = null;

	constructor() {
		super();
	}

	override get_as_image = (from: i32, done: (img: image_t)=>void) => {
		if (this.image != null) {
			base_notify_on_next_frame(() => {
				image_unload(this.image);
			});
		}

		let f32a = new Float32Array(4);
		let raw = parser_logic_get_raw_node(this);
		let default_value = raw.outputs[0].default_value;
		f32a[0] = default_value[0];
		f32a[1] = default_value[1];
		f32a[2] = default_value[2];
		f32a[3] = default_value[3];
		this.image = image_from_bytes(f32a.buffer, 1, 1, tex_format_t.RGBA128);
		done(this.image);
	}

	override get_cached_image = (): image_t => {
		this.get_as_image(0, (img: image_t) => {});
		return this.image;
	}

	static def: zui_node_t = {
		id: 0,
		name: _tr("RGB"),
		type: "RGBNode",
		x: 0,
		y: 0,
		color: 0xffb34f5a,
		inputs: [],
		outputs: [
			{
				id: 0,
				node_id: 0,
				name: _tr("Color"),
				type: "RGBA",
				color: 0xffc7c729,
				default_value: new Float32Array([0.8, 0.8, 0.8, 1.0])
			}
		],
		buttons: [
			{
				name: _tr("default_value"),
				type: "RGBA",
				output: 0,
				default_value: new Float32Array([0.8, 0.8, 0.8, 1.0])
			}
		]
	};
}
