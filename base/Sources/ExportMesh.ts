
class ExportMesh {

	static run = (path: string, paintObjects: mesh_object_t[] = null, applyDisplacement: bool = false) => {
		if (paintObjects == null) paintObjects = project_paint_objects;
		if (context_raw.export_mesh_format == mesh_format_t.OBJ) ExportObj.run(path, paintObjects, applyDisplacement);
		else ExportArm.run_mesh(path, paintObjects);
	}
}
