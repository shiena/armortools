
class File {

	///if krom_windows
	static cmd_mkdir = "mkdir";
	static cmd_copy = "copy";
	///else
	static cmd_mkdir = "mkdir -p";
	static cmd_copy = "cp";
	///end

	static cloud: Map<string, string[]> = null;
	static cloudSizes: Map<string, i32> = null;

	// ///if krom_android
	// static let internal: Map<string, string[]> = null; // .apk contents
	// ///end

	static readDirectory = (path: string, foldersOnly = false): string[] => {
		if (path.startsWith("cloud")) {
			let files = File.cloud != null ? File.cloud.get(path.replace("\\", "/")) : null;
			return files != null ? files : [];
		}
		// ///if krom_android
		// path = path.replace("//", "/");
		// if (internal == null) {
		// 	internal = [];
		// 	internal.set("/data/plugins", BuildMacros.readDirectory("krom/data/plugins"));
		// 	internal.set("/data/export_presets", BuildMacros.readDirectory("krom/data/export_presets"));
		// 	internal.set("/data/keymap_presets", BuildMacros.readDirectory("krom/data/keymap_presets"));
		// 	internal.set("/data/locale", BuildMacros.readDirectory("krom/data/locale"));
		// 	internal.set("/data/meshes", BuildMacros.readDirectory("krom/data/meshes"));
		// 	internal.set("/data/themes", BuildMacros.readDirectory("krom/data/themes"));
		// }
		// if (internal.exists(path)) return internal.get(path);
		// ///end
		return Krom.readDirectory(path, foldersOnly).split("\n");
	}

	static createDirectory = (path: string) => {
		Krom.sysCommand(File.cmd_mkdir + ' "' + path + '"');
	}

	static copy = (srcPath: string, dstPath: string) => {
		Krom.sysCommand(File.cmd_copy + ' "' + srcPath + '" "' + dstPath + '"');
	}

	static start = (path: string) => {
		///if krom_windows
		Krom.sysCommand('start "" "' + path + '"');
		///elseif krom_linux
		Krom.sysCommand('xdg-open "' + path + '"');
		///else
		Krom.sysCommand('open "' + path + '"');
		///end
	}

	static loadUrl = (url: string) => {
		Krom.loadUrl(url);
	}

	static delete = (path: string) => {
		Krom.deleteFile(path);
	}

	static exists = (path: string): bool => {
		return Krom.fileExists(path);
	}

	static download = (url: string, dstPath: string, done: ()=>void, size = 0) => {
		///if (krom_windows || krom_darwin || krom_ios || krom_android)
		Krom.httpRequest(url, size, (ab: ArrayBuffer) => {
			if (ab != null) Krom.fileSaveBytes(dstPath, ab);
			done();
		});
		///elseif krom_linux
		Krom.sysCommand('wget -O "' + dstPath + '" "' + url + '"');
		done();
		///else
		Krom.sysCommand('curl -L ' + url + ' -o "' + dstPath + '"');
		done();
		///end
	}

	static downloadBytes = (url: string, done: (ab: ArrayBuffer)=>void) => {
		let save = (Path.isProtected() ? Krom.savePath() : Path.data() + Path.sep) + "download.bin";
		File.download(url, save, () => {
			let buffer: ArrayBuffer = null;
			try {
				buffer = Krom.loadBlob(save);
			}
			catch (e: any) {}
			done(buffer);
		});
	}

	static cacheCloud = (path: string, done: (s: string)=>void) => {
		///if krom_ios
		let path2 = path.replace("/", "_"); // Cache everything into root folder
		///else
		let path2 = path;
		///end
		let dest = (Path.isProtected() ? Krom.savePath() : Krom.getFilesLocation() + Path.sep) + path2;
		if (File.exists(dest)) {
			///if (krom_darwin || krom_ios)
			done(dest);
			///else
			done((Path.isProtected() ? Krom.savePath() : Path.workingDir() + Path.sep) + path);
			///end
			return;
		}

		let fileDir = dest.substr(0, dest.lastIndexOf(Path.sep));
		if (File.readDirectory(fileDir)[0] == "") {
			File.createDirectory(fileDir);
		}
		///if krom_windows
		path = path.replace("\\", "/");
		///end
		let url = Config.raw.server + "/" + path;
		File.download(url, dest, () => {
			if (!File.exists(dest)) {
				Console.error(Strings.error5());
				done(null);
				return;
			}
			///if (krom_darwin || krom_ios)
			done(dest);
			///else
			done((Path.isProtected() ? Krom.savePath() : Path.workingDir() + Path.sep) + path);
			///end
		}, File.cloudSizes.get(path));
	}

	static initCloudBytes = (done: ()=>void, append = "") => {
		File.downloadBytes(Config.raw.server + "/?list-type=2" + append, (buffer: ArrayBuffer) => {
			if (buffer == null) {
				File.cloud.set("cloud", []);
				Console.error(Strings.error5());
				return;
			}
			let files: string[] = [];
			let sizes: i32[] = [];

			let str = System.bufferToString(buffer);
			let pos_start = 0;
			let pos_end = 0;

			while (true) {
				pos_start = str.indexOf("<Key>", pos_start);
				if (pos_start == -1) break;
				pos_start += 5; // <Key>
				pos_end = str.indexOf("</Key>", pos_start);

				files.push(str.substring(pos_start, pos_end));

				pos_start = str.indexOf("<Size>", pos_end);
				pos_start += 6; //<Size>
				pos_end = str.indexOf("</Size>", pos_start);

				sizes.push(Number(str.substring(pos_start, pos_end)));
			}

			for (let file of files) {
				if (Path.isFolder(file)) {
					File.cloud.set(file.substr(0, file.length - 1), []);
				}
			}
			for (let i = 0; i < files.length; ++i) {
				let file = files[i];
				let nested = file.indexOf("/") != file.lastIndexOf("/");
				if (nested) {
					let delim = Path.isFolder(file) ? file.substr(0, file.length - 1).lastIndexOf("/") : file.lastIndexOf("/");
					let parent = file.substr(0, delim);
					let child = Path.isFolder(file) ? file.substring(delim + 1, file.length - 1) : file.substr(delim + 1);
					File.cloud.get(parent).push(child);
					if (!Path.isFolder(file)) {
						File.cloudSizes.set(file, sizes[i]);
					}
				}
			}

			let isTruncated = str.indexOf("<IsTruncated>true") > -1;
			if (isTruncated) {
				let pos_start = str.indexOf("<NextContinuationToken>");
				pos_start += 23;
				let pos_end = str.indexOf("</NextContinuationToken>", pos_start);
				File.initCloudBytes(done, "&start-after=" + str.substring(pos_start, pos_end));
			}
			else done();
		});
	}

	static initCloud = (done: ()=>void) => {
		File.cloud = new Map();
		File.cloudSizes = new Map();
		File.initCloudBytes(done);
	}
}