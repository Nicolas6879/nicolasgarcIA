"""
Laptop low-poly procedural para el portafolio (explosion por scroll, three.js).

Ejecutar (headless):
  "C:\\Program Files\\Blender Foundation\\Blender 5.3\\blender.exe" --background --factory-startup --python blender/laptop.py

Genera: blender/laptop.blend, blender/explode.json, blender/renders/*.png
Coordenadas Blender: Z arriba, frente del laptop en -Y, ancho en X. Unidades: metros.
Es determinista: siempre parte de una escena vacia.
"""
import json
import math
import os

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

# ----------------------------------------------------------------------------
# CONSTANTES
# ----------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_BLEND = os.path.join(BASE_DIR, "laptop.blend")
OUT_JSON = os.path.join(BASE_DIR, "explode.json")
OUT_RENDERS = os.path.join(BASE_DIR, "renders")

W = 0.32            # ancho (X)
D = 0.22            # fondo (Y)
HW, HD = W / 2, D / 2
WALL = 0.003        # grosor de paredes del chasis
BASE_H = 0.016      # alto total de la base
TRAY_H = 0.013      # alto del chasis (el deck cierra de 0.013 a 0.016)
LID_OPEN_DEG = 110  # apertura de la tapa respecto a la base
HINGE = Vector((0.0, 0.1085, 0.0105))  # eje de bisagra
HINGE_R = 0.0055

# Tapa (coordenadas locales: u=X, v=a lo largo de la tapa desde la bisagra, w=normal hacia el usuario)
LID_V0, LID_V1 = 0.004, 0.224
SHELL_W = (-0.0045, -0.0015)   # carcasa de aluminio
FRAME_W = (-0.0015, 0.0015)    # bisel
PANEL_W = (-0.0015, 0.0005)    # panel (hundido respecto al bisel)
SCREEN_W, SCREEN_H = 0.296, 0.185   # 16:10
BEZEL_BOTTOM = 0.018                # margen del bisel junto a la bisagra
BEZEL_SIDE = (W - SCREEN_W) / 2

RES = (1280, 800)

# Colores sRGB
HEX = {
    "aluminio": "#D7DCE4",
    "grafito": "#161B26",
    "interno": "#343C4D",
    "acento": "#FF7A45",
    "pistas": "#FF7A45",
    "pantalla": "#0E121A",
    "pantalla_emi": "#1E2A3A",
}
BG_OSCURO = "#161B26"
BG_CLARO = "#EEF1F5"
LUZ_AMBIENTE = "#9AA3B5"  # color con el que el mundo ilumina (no se ve en camara)

# Direcciones de la tapa abierta
_a = math.radians(LID_OPEN_DEG)
LID_DIR = Vector((0.0, -math.cos(_a), math.sin(_a)))         # a lo largo de la tapa
LID_NRM = Vector((0.0, -math.sin(_a), -math.cos(_a)))        # normal hacia el usuario (pantalla)
LID_NRM = LID_DIR.cross(Vector((1, 0, 0)))                   # (X x d = s) -> se recalcula para asegurar
LID_NRM = Vector((1, 0, 0)).cross(LID_DIR)

# Offsets de explosion (Blender, metros)
EXPLODE = {
    "chasis": (0.0, 0.0, 0.0),
    "bateria": (0.0, -0.10, -0.07),
    "placa": (0.0, 0.05, 0.07),
    "cpu": (0.0, -0.26, 0.10),
    "disco": (-0.20, 0.04, 0.07),
    "antena": (0.0, 0.07, 0.05),
    "teclado": (0.0, -0.02, 0.40),
    "tapa": (0.0, 0.13, 0.50),
}
# la pantalla flota por delante de la tapa (a lo largo de la normal de la pantalla)
_p = Vector(EXPLODE["tapa"]) + LID_NRM * 0.06
EXPLODE["pantalla"] = (_p.x, _p.y, _p.z)

PART_ORDER = ["chasis", "teclado", "placa", "cpu", "bateria", "disco", "antena", "tapa", "pantalla"]


def srgb_to_linear(h):
    h = h.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out) + (1.0,)


# ----------------------------------------------------------------------------
# ESCENA VACIA + MATERIALES
# ----------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"


def make_material(name, color_hex, metallic=0.0, roughness=0.5, emission_hex=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    try:
        mat.use_nodes = True
    except Exception:
        pass
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb_to_linear(color_hex)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission_hex:
        bsdf.inputs["Emission Color"].default_value = srgb_to_linear(emission_hex)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


MATS = {
    "aluminio": make_material("aluminio", HEX["aluminio"], 0.6, 0.35),
    "grafito": make_material("grafito", HEX["grafito"], 0.0, 0.6),
    "interno": make_material("interno", HEX["interno"], 0.0, 0.7),
    "acento": make_material("acento", HEX["acento"], 0.0, 0.5, HEX["acento"], 2.0),
    "pistas": make_material("pistas", HEX["pistas"], 0.0, 0.5, HEX["pistas"], 0.6),
    "pantalla": make_material("pantalla", HEX["pantalla"], 0.0, 0.2, HEX["pantalla_emi"], 0.5),
}


# ----------------------------------------------------------------------------
# CONSTRUCTOR DE MALLAS (acumula cajas/cilindros en una sola malla)
# ----------------------------------------------------------------------------
class Builder:
    def __init__(self, mat_names):
        self.mat_names = list(mat_names)
        self.verts = []
        self.faces = []
        self.fmat = []
        self.fuv = {}  # indice de cara -> lista de uv

    def _commit(self, tb, mat, M, uv_fn=None, uv_mat=None):
        mi = self.mat_names.index(mat)
        base = len(self.verts)
        tb.verts.ensure_lookup_table()
        idx = {}
        for i, v in enumerate(tb.verts):
            idx[v.index] = i
        local = [v.co.copy() for v in tb.verts]
        for f in tb.faces:
            fi = len(self.faces)
            self.faces.append([base + idx[v.index] for v in f.verts])
            self.fmat.append(mi)
            if uv_fn is not None and f.normal.z > 0.9:  # cara frontal (+w local)
                self.fuv[fi] = [uv_fn(v.co) for v in f.verts]
        for co in local:
            self.verts.append(M @ co if M is not None else co)

    def box(self, c, s, mat, bev=0.0006, seg=1, M=None, uv_fn=None):
        """Caja centrada en c (local), tamano s, con bisel pequeno."""
        tb = bmesh.new()
        res = bmesh.ops.create_cube(tb, size=1.0, calc_uvs=False)
        bmesh.ops.scale(tb, vec=s, verts=res["verts"])
        off = min(bev, 0.3 * min(s))
        if off > 1e-6:
            bmesh.ops.bevel(tb, geom=list(tb.edges), offset=off, offset_type="OFFSET",
                            segments=seg, profile=0.5, affect="EDGES")
        bmesh.ops.translate(tb, vec=Vector(c), verts=tb.verts)
        bmesh.ops.recalc_face_normals(tb, faces=tb.faces)
        tb.normal_update()
        self._commit(tb, mat, M, uv_fn, "x" if uv_fn else None)
        tb.free()

    def cyl(self, c, r, length, mat, segs=12, axis="X", M=None):
        """Cilindro con eje X o Z."""
        tb = bmesh.new()
        bmesh.ops.create_cone(tb, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r,
                              depth=length, calc_uvs=False)
        if axis == "X":
            bmesh.ops.rotate(tb, cent=(0, 0, 0), matrix=Matrix.Rotation(math.radians(90), 3, "Y"), verts=tb.verts)
        bmesh.ops.translate(tb, vec=Vector(c), verts=tb.verts)
        bmesh.ops.recalc_face_normals(tb, faces=tb.faces)
        self._commit(tb, mat, M)
        tb.free()

    def cyl_x(self, c, r, length, mat, segs=12, M=None):
        self.cyl(c, r, length, mat, segs, "X", M)


def finish(name, b):
    """Crea el objeto con el origen en el centro de su bounding box."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in b.verts], [], b.faces)
    xs = [v.x for v in b.verts]
    ys = [v.y for v in b.verts]
    zs = [v.z for v in b.verts]
    ctr = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2))
    mesh.transform(Matrix.Translation(-ctr))
    for mname in b.mat_names:
        mesh.materials.append(MATS[mname])
    for i, p in enumerate(mesh.polygons):
        p.material_index = b.fmat[i]
        p.use_smooth = False
    if b.fuv:
        uvl = mesh.uv_layers.new(name="UVMap")
        for i, p in enumerate(mesh.polygons):
            uvs = b.fuv.get(i)
            for k, li in enumerate(p.loop_indices):
                uvl.data[li].uv = uvs[k] if uvs else (0.0, 0.0)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = ctr
    obj["pieza"] = name
    obj["explode"] = list(EXPLODE[name])
    scene.collection.objects.link(obj)
    return obj


# Transformacion de la tapa: local (u, v, w) -> mundo
LID_M = Matrix.Translation(HINGE) @ Matrix((
    (1, 0, 0, 0),
    (0, LID_DIR.y, LID_NRM.y, 0),
    (0, LID_DIR.z, LID_NRM.z, 0),
    (0, 0, 0, 1),
))


# ----------------------------------------------------------------------------
# PIEZAS
# ----------------------------------------------------------------------------
def build_chasis():
    b = Builder(["aluminio", "acento"])
    b.box((0, 0, WALL / 2), (W, D, WALL), "aluminio", bev=0.002, seg=3)
    zc, hh = WALL + (TRAY_H - WALL) / 2, TRAY_H - WALL
    b.box((0, -HD + WALL / 2, zc), (W, WALL, hh), "aluminio")
    b.box((0, HD - WALL / 2, zc), (W, WALL, hh), "aluminio")
    for sx in (-1, 1):
        b.box((sx * (HW - WALL / 2), 0, zc), (WALL, D - 2 * WALL, hh), "aluminio")
    # barril de la bisagra
    b.cyl_x((0, HINGE.y, HINGE.z), HINGE_R, 0.20, "aluminio")
    # LED en el borde frontal
    b.box((0.0, -HD - 0.0004, 0.0065), (0.012, 0.0012, 0.0015), "acento", bev=0)
    return finish("chasis", b)


def build_teclado():
    b = Builder(["aluminio", "grafito"])
    z0, zm, z1 = TRAY_H, 0.0145, BASE_H
    y_back = 0.10
    # placa base del deck
    b.box((0, (-HD + y_back) / 2, (z0 + zm) / 2), (W, y_back + HD, zm - z0), "aluminio", bev=0.0004)
    zr, hr = (zm + z1) / 2, z1 - zm
    # reposamanos con hueco para el trackpad
    tp_x, tp_y0, tp_y1 = 0.055, -0.098, -0.038
    py0, py1 = -HD, -0.012
    b.box((-(HW + tp_x) / 2, (py0 + py1) / 2, zr), (HW - tp_x, py1 - py0, hr), "aluminio")
    b.box(((HW + tp_x) / 2, (py0 + py1) / 2, zr), (HW - tp_x, py1 - py0, hr), "aluminio")
    b.box((0, (py0 + tp_y0) / 2, zr), (2 * tp_x, tp_y0 - py0, hr), "aluminio")
    b.box((0, (tp_y1 + py1) / 2, zr), (2 * tp_x, py1 - tp_y1, hr), "aluminio")
    # marco del teclado
    well_x, well_y1 = 0.1485, 0.0885
    ym0, ym1 = py1, y_back
    for sx in (-1, 1):
        b.box((sx * (HW + well_x) / 2, (ym0 + ym1) / 2, zr), (HW - well_x, ym1 - ym0, hr), "aluminio")
    b.box((0, (well_y1 + y_back) / 2, zr), (2 * well_x, y_back - well_y1, hr), "aluminio")
    # borde grafito del trackpad
    e = 0.0012
    zt = zm + 0.0005
    b.box((0, tp_y0 + e / 2, zt), (2 * tp_x - 0.001, e, 0.001), "grafito", bev=0)
    b.box((0, tp_y1 - e / 2, zt), (2 * tp_x - 0.001, e, 0.001), "grafito", bev=0)
    for sx in (-1, 1):
        b.box((sx * (tp_x - e / 2 - 0.0005), (tp_y0 + tp_y1) / 2, zt), (e, tp_y1 - tp_y0 - 2 * e, 0.001),
              "grafito", bev=0)
    # teclas: 6 filas x 15 unidades
    pitch_x, pitch_y, kw, kd = 0.0185, 0.0165, 0.0160, 0.0145
    x_start = -15 * pitch_x / 2
    for row in range(6):
        yc = well_y1 - 0.003 - kd / 2 - row * pitch_y
        kh = 0.0030 if row == 0 else 0.0038
        zc = zm + kh / 2
        if row == 5:
            layout = [(1, 4), (6, 1), (5, 1)]  # (unidades de ancho, repeticiones)
            keys = []
            u = 0
            for units, rep in layout:
                for _ in range(rep if units == 1 else 1):
                    pass
            keys = [(0, 1), (1, 1), (2, 1), (3, 1), (4, 6), (10, 1), (11, 1), (12, 1), (13, 1), (14, 1)]
        else:
            keys = [(i, 1) for i in range(15)]
        for start, units in keys:
            width = units * pitch_x - (pitch_x - kw)
            xc = x_start + (start + units / 2) * pitch_x
            b.box((xc, yc, zc), (width, kd, kh), "grafito", bev=0.0006, seg=1)
    return finish("teclado", b)


PCB = dict(z0=0.0040, t=0.0016)
PCB_TOP = PCB["z0"] + PCB["t"]
CPU_XY = (0.02, 0.04)
FAN_XY = (0.11, 0.052)
FAN_R = 0.031
DISCO_XY = (-0.075, 0.04)


def rotz(c, ang):
    return Matrix.Translation(Vector(c)) @ Matrix.Rotation(ang, 4, "Z")


def build_placa():
    b = Builder(["interno", "grafito", "aluminio", "pistas"])
    t, z0 = PCB["t"], PCB["z0"]
    zc = z0 + t / 2
    # placa en L: cuerpo principal + extension frontal derecha (hueco para el ventilador)
    b.box((-0.035, 0.038, zc), (0.220, 0.100, t), "interno", bev=0.0004)
    b.box((0.110, 0.0015, zc), (0.070, 0.027, t), "interno", bev=0.0004)

    def top(x, y, sx, sy, h, mat, bev=0.0003):
        b.box((x, y, PCB_TOP + h / 2), (sx, sy, h), mat, bev=bev)

    # RAM: fila de chips + escudo
    for x in (-0.105, -0.080, -0.055, -0.030):
        top(x, 0.072, 0.020, 0.012, 0.0013, "grafito")
    top(0.040, 0.075, 0.014, 0.014, 0.0020, "aluminio")
    # SMD: tres filas de pasivos
    for i in range(6):
        top(-0.095 + i * 0.007, 0.012, 0.0035, 0.0018, 0.0009, "aluminio" if i % 2 else "grafito", 0)
    for i in range(5):
        top(0.012 + i * 0.007, 0.010, 0.0035, 0.0018, 0.0009, "grafito" if i % 2 else "aluminio", 0)
    for i in range(4):
        top(0.047 + i * 0.007, 0.060, 0.0035, 0.0018, 0.0009, "aluminio" if i % 2 else "grafito", 0)
    # conectores (headers) con pines
    for x, y, sx, sy, h in ((-0.090, -0.001, 0.035, 0.007, 0.004), (0.040, 0.000, 0.020, 0.007, 0.004),
                            (0.125, 0.003, 0.018, 0.008, 0.004)):
        top(x, y, sx, sy, h, "grafito")
        top(x, y, sx - 0.004, sy * 0.4, h + 0.0006, "aluminio", 0)
    # agujeros de montaje (anillos)
    for x, y in ((-0.137, -0.004), (0.065, -0.004), (-0.137, 0.080), (0.065, 0.082), (0.138, -0.004)):
        b.cyl((x, y, PCB_TOP + 0.0003), 0.0035, 0.0006, "aluminio", segs=10, axis="Z")
        b.cyl((x, y, PCB_TOP + 0.0006), 0.0018, 0.0010, "grafito", segs=8, axis="Z")
    # pistas (lineas finas en relieve)
    w, h = 0.0008, 0.0003
    segs = [  # (x0, y0, x1, y1)
        (-0.040, 0.050, 0.002, 0.050), (-0.040, 0.050, -0.040, 0.066),
        (-0.120, 0.000, -0.120, 0.025), (-0.120, 0.025, -0.045, 0.025),
        (0.050, 0.004, 0.050, 0.028), (0.050, 0.028, 0.072, 0.028),
        (-0.130, 0.030, -0.130, 0.062), (0.020, 0.018, 0.020, 0.006),
        (0.010, 0.060, 0.034, 0.060), (0.034, 0.060, 0.034, 0.068),
    ]
    for x0, y0, x1, y1 in segs:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        b.box((cx, cy, PCB_TOP + h / 2), (abs(x1 - x0) + w, abs(y1 - y0) + w, h), "pistas", bev=0)
    return finish("placa", b)


def build_cpu():
    """Procesador + sistema de enfriamiento (heatpipe + ventilador)."""
    b = Builder(["interno", "acento", "aluminio", "grafito"])
    x, y = CPU_XY
    b.box((x, y, PCB_TOP + 0.00085), (0.035, 0.035, 0.0017), "interno", bev=0.0005)
    b.box((x, y, PCB_TOP + 0.0017 + 0.0006), (0.026, 0.026, 0.0012), "acento", bev=0.0004)
    # heatpipes hacia el ventilador
    x0, x1 = x + 0.013, FAN_XY[0] - 0.022
    for dy in (-0.004, 0.004):
        b.cyl(((x0 + x1) / 2, y + dy, 0.0078), 0.0022, x1 - x0, "aluminio", segs=8, axis="X")
    # ventilador: base, pared, buje y aspas
    fx, fy = FAN_XY
    b.cyl((fx, fy, 0.00375), FAN_R, 0.0015, "aluminio", segs=24, axis="Z")
    n = 16
    side = 2 * math.pi * FAN_R / n * 1.1
    for i in range(n):
        a = 2 * math.pi * i / n
        b.box((FAN_R, 0, 0.0075), (0.0012, side, 0.006), "aluminio", bev=0, M=rotz((fx, fy, 0), a))
    b.cyl((fx, fy, 0.0065), 0.006, 0.004, "grafito", segs=12, axis="Z")
    nb = 9
    for i in range(nb):
        a = 2 * math.pi * i / nb
        b.box((0.0125, 0, 0.0062), (0.0135, 0.0055, 0.0009), "grafito", bev=0, M=rotz((fx, fy, 0), a + 0.35))
    return finish("cpu", b)


def build_bateria():
    b = Builder(["interno", "aluminio", "grafito"])
    cw, gap, depth = 0.068, 0.003, 0.078
    x_start = -(4 * cw + 3 * gap) / 2
    yc = -0.066
    for i in range(4):
        xc = x_start + cw / 2 + i * (cw + gap)
        b.box((xc, yc, 0.003 + 0.00225), (cw, depth, 0.0045), "interno", bev=0.0008, seg=2)
        b.box((xc, yc, 0.0075 + 0.0002), (0.050, 0.016, 0.0004), "aluminio", bev=0)
    # conector + cable hacia la placa
    b.box((0.0, -0.0285, 0.0045), (0.014, 0.006, 0.003), "grafito", bev=0.0003)
    b.box((0.0, -0.0205, 0.0036), (0.005, 0.012, 0.0010), "grafito", bev=0)
    return finish("bateria", b)


def build_disco():
    b = Builder(["interno", "grafito", "aluminio"])
    x, y = DISCO_XY
    z = PCB_TOP + 0.0007
    b.box((x, y, z), (0.060, 0.022, 0.0014), "interno", bev=0.0004)
    zt = PCB_TOP + 0.0014
    for dx, sx in ((-0.010, 0.014), (0.008, 0.014), (0.024, 0.006)):  # 2 NAND + controlador
        b.box((x + dx, y, zt + 0.0005), (sx, 0.014 if sx > 0.01 else 0.009, 0.001), "grafito", bev=0.0003)
    # contactos (aluminio) con muesca
    for dy in (-0.0065, 0.0065):
        b.box((x - 0.0285, y + dy, z), (0.004, 0.0075, 0.0016), "aluminio", bev=0)
    # media luna del tornillo
    b.cyl((x + 0.030, y, z + 0.0003), 0.0035, 0.0018, "aluminio", segs=10, axis="Z")
    return finish("disco", b)


def build_antena():
    b = Builder(["interno", "acento", "grafito"])
    for sx in (-1, 1):
        x, y, z = sx * 0.12, 0.098, 0.0075
        b.box((x, y, z), (0.050, 0.004, 0.0015), "interno", bev=0.0003)
        b.box((x, y, z + 0.0015 / 2 + 0.0002), (0.040, 0.0008, 0.0004), "acento", bev=0)
        # cable hacia la tarjeta Wi-Fi
        xe = sx * 0.095
        xc = sx * 0.0115
        b.box(((xe + xc) / 2, 0.0985, z), (abs(xe - xc), 0.0012, 0.0008), "grafito", bev=0)
    # tarjeta Wi-Fi cuadrada entre las antenas
    b.box((0.0, 0.0965, 0.0075), (0.024, 0.012, 0.0018), "interno", bev=0.0003)
    b.box((0.0, 0.0965, 0.0075 + 0.0014), (0.014, 0.008, 0.001), "grafito", bev=0.0003)
    for sx in (-1, 1):
        b.box((sx * 0.0105, 0.0965, 0.0075 + 0.0012), (0.002, 0.002, 0.0006), "acento", bev=0)
    return finish("antena", b)


def build_tapa():
    b = Builder(["aluminio", "grafito"])
    L = LID_V1 - LID_V0
    vc = (LID_V0 + LID_V1) / 2
    ws, wf = SHELL_W, FRAME_W
    b.box((0, vc, (ws[0] + ws[1]) / 2), (W, L, ws[1] - ws[0]), "aluminio", bev=0.0012, seg=2, M=LID_M)
    wc, wh = (wf[0] + wf[1]) / 2, wf[1] - wf[0]
    v_scr0 = LID_V0 + BEZEL_BOTTOM
    v_scr1 = v_scr0 + SCREEN_H
    # marco: abajo, arriba, izquierda, derecha
    b.box((0, (LID_V0 + v_scr0) / 2, wc), (W, v_scr0 - LID_V0, wh), "grafito", bev=0.0004, M=LID_M)
    b.box((0, (v_scr1 + LID_V1) / 2, wc), (W, LID_V1 - v_scr1, wh), "grafito", bev=0.0004, M=LID_M)
    for sx in (-1, 1):
        b.box((sx * (SCREEN_W / 2 + BEZEL_SIDE / 2), (v_scr0 + v_scr1) / 2, wc), (BEZEL_SIDE, SCREEN_H, wh),
              "grafito", bev=0.0004, M=LID_M)
    return finish("tapa", b)


def build_pantalla():
    b = Builder(["grafito", "pantalla"])
    v0 = LID_V0 + BEZEL_BOTTOM
    vc = v0 + SCREEN_H / 2
    wc, wh = (PANEL_W[0] + PANEL_W[1]) / 2, PANEL_W[1] - PANEL_W[0]
    # UV 0..1 sobre la cara frontal visible; v local -> V (arriba = 1)
    uv = lambda co: ((co.x + SCREEN_W / 2) / SCREEN_W, (co.y - v0) / SCREEN_H)
    b.mat_names = ["grafito", "pantalla"]
    # caja sin bisel; la cara frontal usa el material "pantalla"
    tb = bmesh.new()
    res = bmesh.ops.create_cube(tb, size=1.0, calc_uvs=False)
    bmesh.ops.scale(tb, vec=(SCREEN_W, SCREEN_H, wh), verts=res["verts"])
    bmesh.ops.translate(tb, vec=Vector((0, vc, wc)), verts=tb.verts)
    bmesh.ops.recalc_face_normals(tb, faces=tb.faces)
    tb.normal_update()
    base = len(b.verts)
    for f in tb.faces:
        fi = len(b.faces)
        b.faces.append([base + v.index for v in f.verts])
        front = f.normal.z > 0.9
        b.fmat.append(1 if front else 0)
        if front:
            b.fuv[fi] = [uv(v.co) for v in f.verts]
    for v in tb.verts:
        b.verts.append(LID_M @ v.co)
    tb.free()
    return finish("pantalla", b)


# ----------------------------------------------------------------------------
# CONSTRUCCION
# ----------------------------------------------------------------------------
BUILDERS = {
    "chasis": build_chasis, "teclado": build_teclado, "placa": build_placa, "cpu": build_cpu,
    "bateria": build_bateria, "disco": build_disco, "antena": build_antena, "tapa": build_tapa,
    "pantalla": build_pantalla,
}
OBJS = {n: BUILDERS[n]() for n in PART_ORDER}
REST = {n: o.location.copy() for n, o in OBJS.items()}


def tri_count(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def apply_explode(on):
    for n, o in OBJS.items():
        o.location = REST[n] + (Vector(EXPLODE[n]) if on else Vector((0, 0, 0)))
    bpy.context.view_layer.update()


# JSON + blend (antes de agregar camara y luces)
with open(OUT_JSON, "w", encoding="utf-8") as fh:
    json.dump({"_nota": "Coordenadas de Blender (Z arriba, frente del laptop en -Y), metros.",
               **{n: [round(c, 5) for c in EXPLODE[n]] for n in PART_ORDER}}, fh, indent=2)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

# ----------------------------------------------------------------------------
# RENDER
# ----------------------------------------------------------------------------
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
for cand in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    if cand in engines:
        scene.render.engine = cand
        break
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
if hasattr(scene, "eevee"):
    try:
        scene.eevee.taa_render_samples = 48
    except Exception:
        pass


def use_cycles():
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True


world = bpy.data.worlds.new("mundo")
scene.world = world
try:
    world.use_nodes = True
except Exception:
    pass
wn = world.node_tree.nodes
wl = world.node_tree.links
wn.clear()
lp = wn.new("ShaderNodeLightPath")
bg_luz = wn.new("ShaderNodeBackground")
bg_cam = wn.new("ShaderNodeBackground")
mix = wn.new("ShaderNodeMixShader")
out = wn.new("ShaderNodeOutputWorld")
bg_luz.inputs["Color"].default_value = srgb_to_linear(LUZ_AMBIENTE)
bg_luz.inputs["Strength"].default_value = 0.25
bg_cam.inputs["Strength"].default_value = 1.0
wl.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
wl.new(bg_luz.outputs["Background"], mix.inputs[1])
wl.new(bg_cam.outputs["Background"], mix.inputs[2])
wl.new(mix.outputs["Shader"], out.inputs["Surface"])


def set_bg(hexcolor):
    bg_cam.inputs["Color"].default_value = srgb_to_linear(hexcolor)


cam_data = bpy.data.cameras.new("camara")
cam_data.lens = 60
cam = bpy.data.objects.new("camara", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def add_area(name, loc, target, energy, size):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy, ld.size = energy, size
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    scene.collection.objects.link(lo)
    look_at(lo, target)
    return lo


add_area("luz_key", (-0.55, -0.55, 0.70), (0, 0, 0.1), 12, 0.7)
add_area("luz_relleno", (0.70, -0.45, 0.35), (0, 0, 0.1), 7, 0.8)
add_area("luz_contra", (0.25, 0.75, 0.70), (0, 0, 0.1), 14, 0.7)
add_area("luz_rim", (-0.6, 0.6, 0.5), (0, 0, 0.1), 25, 0.5)
add_area("luz_arriba", (0.0, 0.0, 1.0), (0, 0, 0.1), 2, 0.9)

CAM_DIR = Vector((-0.55, -0.62, 0.60)).normalized()


def bbox_points():
    pts = []
    for o in OBJS.values():
        for c in o.bound_box:
            pts.append(o.matrix_world @ Vector(c))
    return pts


def frame_camera(margin=0.045):
    """Aleja la camara hasta que todo el laptop cabe con margen, y centra con shift."""
    pts = bbox_points()
    target = sum(pts, Vector()) / len(pts)
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    target = (mn + mx) / 2
    aspect = RES[1] / RES[0]
    dist = 0.4
    while dist < 6:
        cam.location = target + CAM_DIR * dist
        look_at(cam, target)
        cam_data.shift_x = cam_data.shift_y = 0
        bpy.context.view_layer.update()
        pr = [world_to_camera_view(scene, cam, p) for p in pts]
        cx = (min(p.x for p in pr) + max(p.x for p in pr)) / 2
        cy = (min(p.y for p in pr) + max(p.y for p in pr)) / 2
        cam_data.shift_x = cx - 0.5
        cam_data.shift_y = (cy - 0.5) * aspect
        bpy.context.view_layer.update()
        pr = [world_to_camera_view(scene, cam, p) for p in pr and pts]
        if all(margin <= p.x <= 1 - margin and margin <= p.y <= 1 - margin for p in pr):
            return
        dist += 0.01


def render(path, bg_hex, exploded):
    set_bg(bg_hex)
    apply_explode(exploded)
    frame_camera()
    scene.render.filepath = path
    try:
        bpy.ops.render.render(write_still=True)
    except Exception as ex:
        print("EEVEE fallo, usando Cycles:", ex)
        use_cycles()
        bpy.ops.render.render(write_still=True)
    apply_explode(False)


os.makedirs(OUT_RENDERS, exist_ok=True)
print("Motor:", scene.render.engine)
render(os.path.join(OUT_RENDERS, "armado.png"), BG_OSCURO, False)
render(os.path.join(OUT_RENDERS, "desarmado.png"), BG_OSCURO, True)
render(os.path.join(OUT_RENDERS, "armado-claro.png"), BG_CLARO, False)

# ----------------------------------------------------------------------------
# REPORTE
# ----------------------------------------------------------------------------
total = 0
print("\n=== TRIANGULOS ===")
for n in PART_ORDER:
    t = tri_count(OBJS[n])
    total += t
    print(f"{n:10s} {t:6d}   mats={[m.name for m in OBJS[n].data.materials]}")
print(f"{'TOTAL':10s} {total:6d}")
print("OK")
