# OGP image 1200x630 for the site
from PIL import Image, ImageDraw, ImageFont
W, H = 1200, 630
BG, AC, SUB = (35, 57, 93), (255, 214, 90), (200, 210, 225)
BOLD = "C:/Windows/Fonts/YuGothB.ttc"
REG = "C:/Windows/Fonts/YuGothM.ttc"
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
x = 80
d.text((x, 150), "町内会・PTA・賃貸管理・会社・お店", font=ImageFont.truetype(REG, 40), fill=SUB, anchor="lm")
d.text((x, 260), "お知らせ文メーカー", font=ImageFont.truetype(BOLD, 84), fill="white", anchor="lm")
d.text((x, 370), "空欄を埋めて、そのまま印刷", font=ImageFont.truetype(BOLD, 48), fill=AC, anchor="lm")
d.text((x, 460), "登録不要・無料・475種", font=ImageFont.truetype(REG, 40), fill=SUB, anchor="lm")
x0, y0, w, h = 900, 170, 220, 300
fold = w // 5
d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=14, fill="white")
d.polygon([(x0 + w - fold, y0), (x0 + w, y0), (x0 + w, y0 + fold)], fill=BG)
d.polygon([(x0 + w - fold, y0), (x0 + w, y0 + fold), (x0 + w - fold, y0 + fold)], fill=SUB)
lx, lw = x0 + w // 7, w - 2 * (w // 7)
for i in range(6):
    y = y0 + h // 4 + i * h // 10
    col = AC if i in (1, 4) else (150, 165, 190)
    ww = lw * 2 // 3 if i in (1, 4) else lw
    d.rounded_rectangle((lx, y, lx + ww, y + 10), radius=5, fill=col)
img.save("docs/ogp.png")
