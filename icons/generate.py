"""
生成快贴 PWA 图标 v2 — 深空玻璃拟态风格
Violet (#A78BFA) + Cyan (#22D3EE) 渐变
"""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT_DIR = r"C:\Users\bjmu-sh\Desktop\PWA_app\icons"
os.makedirs(OUT_DIR, exist_ok=True)

VIOLET  = (167, 139, 250)  # #A78BFA
CYAN    = ( 34, 211, 238)  # #22D3EE
DARK    = (  5,   8,  22)  # #050816
WHITE   = (255, 255, 255)
GLOW    = (167, 139, 250, 80)


def gradient(size, c1, c2, direction='vertical'):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i in range(size if direction == 'vertical' else size):
        t = i / max((size - 1), 1)
        r = int(c1[0] * (1 - t) + c2[0] * t)
        g = int(c1[1] * (1 - t) + c2[1] * t)
        b = int(c1[2] * (1 - t) + c2[2] * t)
        if direction == 'vertical':
            draw.line([(0, i), (size, i)], fill=(r, g, b, 255))
        else:
            draw.line([(i, 0), (i, size)], fill=(r, g, b, 255))
    return img


def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(m)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def soft_glow(size, color, radius=60, strength=0.6):
    """柔和光晕"""
    glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # 多层模糊叠加
    for layer, alpha in [(radius, int(255 * strength * 0.3)),
                           (radius // 2, int(255 * strength * 0.5)),
                           (radius // 4, int(255 * strength))]:
        layer_size = layer * 2
        l = Image.new("RGBA", (layer_size, layer_size), (0, 0, 0, 0))
        ld = ImageDraw.Draw(l)
        ld.ellipse([0, 0, layer_size - 1, layer_size - 1],
                   fill=(*color, alpha))
        l = l.filter(ImageFilter.GaussianBlur(radius=layer // 3))
        paste_x = (size - layer_size) // 2
        paste_y = (size - layer_size) // 2
        glow_img.paste(l, (paste_x, paste_y), l)
    return glow_img


def draw_icon(size):
    """
    画一个精致的 app 图标：
    - 深色背景 + 紫青渐变圆角矩形
    - 顶部有一层柔和光晕
    - 底部居中画一个发光的"快"字或抽象闪电/传输符号
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # 1. 背景渐变
    bg = gradient(size, VIOLET, CYAN, 'diagonal')
    mask = rounded_mask(size, int(size * 0.22))
    bg.putalpha(mask)
    img.paste(bg, (0, 0), bg)

    # 2. 叠加深色叠加层（降低饱和度，让文字更突出）
    overlay = Image.new("RGBA", (size, size), (*DARK, int(255 * 0.45)))
    overlay.putalpha(mask)
    img = Image.alpha_composite(img, overlay)

    # 3. 顶部光晕
    glow_size = int(size * 0.5)
    glow_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gl = Image.new("RGBA", (glow_size, glow_size), (*CYAN, 60))
    gl = gl.filter(ImageFilter.GaussianBlur(radius=glow_size // 3))
    paste_x = (size - glow_size) // 2
    glow_layer.paste(gl, (paste_x, 0), gl)
    img = Image.alpha_composite(img, glow_layer)

    # 4. 白色传输符号（中间大闪电 + 两侧小圆点，表示快速传输）
    draw = ImageDraw.Draw(img)
    c = size // 2
    s = size

    # 发光效果：先画一层淡紫色
    glow_c = int(s * 0.25)
    draw.ellipse([c - glow_c, c - glow_c, c + glow_c, c + glow_c],
                 fill=(*VIOLET, 40))

    # 中心发光点
    inner = int(s * 0.08)
    draw.ellipse([c - inner, c - inner, c + inner, c + inner],
                 fill=(*WHITE, 220))

    # 上下两个小三角（表示双向传输）
    tri_size = int(s * 0.15)
    # 上三角（向下）
    tri_up = [
        (c, c - int(tri_size * 0.3)),
        (c - int(tri_size * 0.55), c + int(tri_size * 0.15)),
        (c + int(tri_size * 0.55), c + int(tri_size * 0.15)),
    ]
    draw.polygon(tri_up, fill=(*WHITE, 200))

    # 下三角（向上）
    tri_dn = [
        (c, c + int(tri_size * 0.3)),
        (c - int(tri_size * 0.55), c - int(tri_size * 0.15)),
        (c + int(tri_size * 0.55), c - int(tri_size * 0.15)),
    ]
    draw.polygon(tri_dn, fill=(*WHITE, 200))

    # 左侧小三角（向右）
    lx = c - int(s * 0.18)
    tri_l = [
        (lx + int(tri_size * 0.4), c),
        (lx - int(tri_size * 0.15), c - int(tri_size * 0.4)),
        (lx - int(tri_size * 0.15), c + int(tri_size * 0.4)),
    ]
    draw.polygon(tri_l, fill=(*WHITE, 160))

    # 右侧小三角（向左）
    rx = c + int(s * 0.18)
    tri_r = [
        (rx - int(tri_size * 0.4), c),
        (rx + int(tri_size * 0.15), c - int(tri_size * 0.4)),
        (rx + int(tri_size * 0.15), c + int(tri_size * 0.4)),
    ]
    draw.polygon(tri_r, fill=(*WHITE, 160))

    return img


def make_icon(size, fname):
    img = draw_icon(size)
    img.save(os.path.join(OUT_DIR, fname), "PNG", optimize=True)
    print(f"  [ok] {fname}  ({size}×{size})")


def make_maskable(size=512):
    """Maskable 图标：中心放内容，四周留 safe zone"""
    inner_size = int(size * 0.8)
    offset = (size - inner_size) // 2
    img = draw_icon(inner_size)
    # 加一圈深色底
    base = Image.new("RGBA", (size, size), DARK + (255,))
    base.paste(img, (offset, offset), img)
    base.save(os.path.join(OUT_DIR, f"icon-maskable-{size}.png"), "PNG", optimize=True)
    print(f"  [ok] icon-maskable-{size}.png  ({size}×{size})")


def make_apple():
    size = 180
    img = draw_icon(size)
    img.save(os.path.join(OUT_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
    print(f"  [ok] apple-touch-icon.png  ({size}×{size})")


def make_favicon():
    size = 64
    img = draw_icon(size)
    img.save(os.path.join(OUT_DIR, "favicon.png"), "PNG", optimize=True)
    print(f"  [ok] favicon.png  ({size}×{size})")


if __name__ == "__main__":
    print("Generating icons...")
    make_icon(192, "icon-192.png")
    make_icon(512, "icon-512.png")
    make_maskable(512)
    make_apple()
    make_favicon()
    print(f"\nDone → {OUT_DIR}")