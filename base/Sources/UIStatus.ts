
class UIStatus {

	static inst: UIStatus;
	static defaultStatusH = 33;

	constructor() {
		UIStatus.inst = this;
	}

	static get width(): i32 {
		///if (is_paint || is_sculpt)
		return System.width - UIToolbar.inst.toolbarw - Config.raw.layout[LayoutSize.LayoutSidebarW];
		///end
		///if is_lab
		return System.width;
		///end
	}

	renderUI = (g: Graphics2) => {
		let ui = UIBase.inst.ui;

		let statush = Config.raw.layout[LayoutSize.LayoutStatusH];

		if (ui.window(UIBase.inst.hwnds[TabArea.TabStatus], App.x(), System.height - statush, UIStatus.width, statush)) {
			ui._y += 2;

			// Border
			ui.g.color = ui.t.SEPARATOR_COL;
			ui.g.fillRect(0, 0, 1, ui._windowH);
			ui.g.fillRect(ui._windowW - 1, 0, 1, ui._windowH);

			// Draw tabs
			for (let draw of UIBase.inst.hwndTabs[TabArea.TabStatus]) draw(UIBase.inst.htabs[TabArea.TabStatus]);

			let minimized = statush <= UIStatus.defaultStatusH * Config.raw.window_scale;
			if (UIBase.inst.htabs[TabArea.TabStatus].changed && (UIBase.inst.htabs[TabArea.TabStatus].position == Context.raw.lastStatusPosition || minimized)) {
				UIBase.inst.toggleBrowser();
			}
			Context.raw.lastStatusPosition = UIBase.inst.htabs[TabArea.TabStatus].position;
		}
	}

	static drawVersionTab = (htab: Handle) => {
		// Version label
		if (!Config.raw.touch_ui) {
			let ui = UIBase.inst.ui;
			ui.enabled = false;
			ui.tab(UIBase.inst.htabs[TabArea.TabStatus], Manifest.version);
			ui.enabled = true;
		}
	}
}