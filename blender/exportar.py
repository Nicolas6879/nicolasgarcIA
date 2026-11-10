"""
Exporta blender/laptop.blend a public/models/laptop-raw.glb (temporal, sin comprimir).
Uso: blender --background --factory-startup --python blender/exportar.py
Conserva nombres de nodos, materiales, UVs y propiedades personalizadas (pieza, explode) como extras.
"""
import os
import bpy

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "laptop.blend")
OUT = os.path.normpath(os.path.join(BASE, "..", "public", "models", "laptop-raw.glb"))

bpy.ops.wm.open_mainfile(filepath=SRC)
# El exportador de glTF solo escribe UVs si el material usa una textura. Para que la pantalla
# conserve sus UVs 0..1 (el sitio le pondra una textura), se conecta una imagen 1x1 del mismo color
# base (#0E121A) a Base Color: el aspecto no cambia y despues se reemplaza por la textura real.
mat = bpy.data.materials["pantalla"]
img = bpy.data.images.new("pantalla_base", 1, 1)
img.pixels = [0.0044, 0.0060, 0.0103, 1.0]  # #0E121A en lineal
img.colorspace_settings.name = "sRGB"
img.file_format = "PNG"
img.filepath_raw = os.path.join(bpy.app.tempdir, "pantalla_base.png")
img.save()
img.pack()
tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
tex.image = img
bsdf = mat.node_tree.nodes["Principled BSDF"]
mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_yup=True,
    export_apply=True,
    export_materials="EXPORT",
    export_texcoords=True,
    export_normals=True,
    export_extras=True,
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    use_selection=False,
)
print("EXPORTADO:", OUT, os.path.getsize(OUT), "bytes")
