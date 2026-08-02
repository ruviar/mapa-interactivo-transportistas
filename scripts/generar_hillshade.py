"""Genera el hillshade estático de España (Bloque B, Fase 7).

Fuente: Copernicus DEM GLO-90 (30 arc-segundos), bucket público de AWS Open
Data, sin API key. Se ejecuta una sola vez, en el momento de construir: el
resultado son dos PNG (península+Baleares y Canarias) que se colocan como
capa de fondo estática en Leaflet. No hay terreno navegable ni teselas de
elevación bajo demanda -- eso violaría el requisito de <1.5s clic->respuesta.
"""

import json
import math
import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.errors import RasterioIOError
from rasterio.features import rasterize
from PIL import Image, ImageFilter
from shapely.geometry import shape
from shapely.ops import unary_union, transform as shapely_transform

BUCKET = "https://copernicus-dem-90m.s3.amazonaws.com"
RES_DEG = 0.005  # ~550m/px en el ecuador -- de sobra para un fondo sutil


def tile_url(lat_deg, lon_deg):
    ns = "N" if lat_deg >= 0 else "S"
    ew = "E" if lon_deg >= 0 else "W"
    lat_code = f"{ns}{abs(lat_deg):02d}_00"
    lon_code = f"{ew}{abs(lon_deg):03d}_00"
    name = f"Copernicus_DSM_COG_30_{lat_code}_{lon_code}_DEM"
    return f"/vsicurl/{BUCKET}/{name}/{name}.tif"


def abrir_tiles(lon_min, lat_min, lon_max, lat_max):
    datasets = []
    for lat in range(math.floor(lat_min), math.ceil(lat_max)):
        for lon in range(math.floor(lon_min), math.ceil(lon_max)):
            url = tile_url(lat, lon)
            try:
                ds = rasterio.open(url)
                datasets.append(ds)
            except RasterioIOError:
                continue  # tesela sin datos (océano profundo sin tile publicado)
    if not datasets:
        raise RuntimeError("Ninguna tesela encontrada para este bbox")
    return datasets


def hillshade(z, cellsize_x_m, cellsize_y_m, azimuth_deg=315, altitud_deg=45):
    az = math.radians(azimuth_deg)
    alt = math.radians(altitud_deg)
    dzdy, dzdx = np.gradient(z, cellsize_y_m, cellsize_x_m)
    slope = np.arctan(np.hypot(dzdx, dzdy))
    aspect = np.arctan2(dzdy, -dzdx)
    sombreado = np.cos(math.pi / 2 - alt) * np.cos(slope) + np.sin(
        math.pi / 2 - alt
    ) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(sombreado, 0, 1)


def cargar_mascaras():
    """Geometría de España (unión de CCAA) para recortar el hillshade a tierra
    firme -- sin esto, el relieve de Francia/Portugal/Marruecos asomaría
    dentro del rectángulo de la imagen, fuera de donde pinta la coropleta."""
    with open("src/data/ccaa.geojson", encoding="utf-8") as f:
        geo = json.load(f)

    peninsula_geoms = [
        shape(f["geometry"]).buffer(0) for f in geo["features"] if f["properties"]["cod"] != "05"
    ]
    peninsula_mascara = unary_union(peninsula_geoms)

    canarias_feature = next(f for f in geo["features"] if f["properties"]["cod"] == "05")
    dlon, dlat = geo["canarias"]["desplazamiento"]
    canarias_mascara = shapely_transform(
        lambda x, y: (x - dlon, y - dlat), shape(canarias_feature["geometry"])
    )
    return peninsula_mascara, canarias_mascara


def procesar(nombre, lon_min, lat_min, lon_max, lat_max, margen, mascara_geom, desplazamiento=(0, 0)):
    lon_min -= margen
    lat_min -= margen
    lon_max += margen
    lat_max += margen
    print(f"[{nombre}] bbox real usado: [{lon_min}, {lat_min}, {lon_max}, {lat_max}]")

    datasets = abrir_tiles(lon_min, lat_min, lon_max, lat_max)
    print(f"[{nombre}] teselas abiertas: {len(datasets)}")

    mosaico, transform = merge(
        datasets,
        bounds=(lon_min, lat_min, lon_max, lat_max),
        res=RES_DEG,
    )
    for ds in datasets:
        ds.close()

    z = mosaico[0].astype(np.float64)
    z[z < -1000] = 0  # nodata / batimetría rara -> nivel del mar
    alto, ancho = z.shape

    lat_media = (lat_min + lat_max) / 2
    m_por_grado_lat = 111_320.0
    m_por_grado_lon = 111_320.0 * math.cos(math.radians(lat_media))
    cellsize_x_m = RES_DEG * m_por_grado_lon
    cellsize_y_m = RES_DEG * m_por_grado_lat

    sombra = hillshade(z, cellsize_x_m, cellsize_y_m)

    # La coropleta se pinta encima con `fill-opacity: 0.8` (ChoroplethLayer.tsx)
    # -- ese 20% de resquicio es todo lo que tiene este gris para notarse, así
    # que pide más contraste que un hillshade "normal". `contexto` (0.55) usa
    # la misma imagen con más resquicio: con este rango ya se nota bastante
    # ahí, así que no hace falta forzar más el de `coropleta`.
    gris = 150 + (sombra - sombra.mean()) * 62
    gris = np.clip(gris, 88, 212).astype(np.uint8)

    # Buffer pequeño + difuminado del borde: el polígono de la coropleta no
    # coincide pixel a pixel con esta máscara, y un corte binario duro se
    # notaría como un recorte contra el borde real de la región.
    mascara = rasterize(
        [(mascara_geom.buffer(0.03), 1)],
        out_shape=(alto, ancho),
        transform=transform,
        fill=0,
        dtype=np.uint8,
    )
    alfa_img = Image.fromarray((mascara * 255).astype(np.uint8), mode="L")
    alfa_img = alfa_img.filter(ImageFilter.GaussianBlur(radius=2))
    alfa = np.array(alfa_img)

    rgba = np.dstack([gris, gris, gris, alfa])
    img = Image.fromarray(rgba, mode="RGBA")
    salida = f"src/assets/relieve/{nombre}.webp"
    img.save(salida, format="WEBP", quality=80, method=6)
    print(f"[{nombre}] guardado {salida} ({img.width}x{img.height})")

    # El mapa no dibuja Canarias en su posición real -- la cartela ya viene
    # trasladada en el propio GeoJSON. La imagen se generó con datos reales
    # (para que el DEM sea correcto) pero hay que anclarla en Leaflet en las
    # coordenadas trasladadas, o queda fuera de donde caen los polígonos.
    dlon, dlat = desplazamiento
    lat_min_l, lon_min_l = lat_min + dlat, lon_min + dlon
    lat_max_l, lon_max_l = lat_max + dlat, lon_max + dlon
    print(f"[{nombre}] bounds_leaflet=[[{lat_min_l},{lon_min_l}],[{lat_max_l},{lon_max_l}]]")
    return (lon_min_l, lat_min_l, lon_max_l, lat_max_l)


if __name__ == "__main__":
    import os

    os.makedirs("src/assets/relieve", exist_ok=True)

    mascara_peninsula, mascara_canarias = cargar_mascaras()

    peninsula = procesar(
        "peninsula-baleares",
        -9.2993, 35.26546, 4.32779, 43.78727,
        margen=0.4,
        mascara_geom=mascara_peninsula,
    )
    with open("src/data/ccaa.geojson", encoding="utf-8") as f:
        desplazamiento = tuple(json.load(f)["canarias"]["desplazamiento"])

    canarias = procesar(
        "canarias",
        -18.51029, 27.28954, -13.06948, 29.64077,
        margen=0.15,
        mascara_geom=mascara_canarias,
        desplazamiento=desplazamiento,
    )

    print("\n=== RESUMEN ===")
    print("peninsula bbox:", peninsula)
    print("canarias bbox:", canarias)
