import os
import struct
import zlib
import math

os.makedirs('/public', exist_ok=True)

# Generate icon.svg
svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="50%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="redAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#b91c1c"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <!-- Background Rounded Rect -->
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  
  <!-- Outer Shield Crest -->
  <path d="M 256 60 Q 380 60 410 170 C 410 320 256 430 256 450 C 256 430 102 320 102 170 Q 132 60 256 60 Z" 
        fill="#ffffff" opacity="0.12" filter="url(#shadow)"/>

  <!-- Red Accent Chevron / Ribbon -->
  <path d="M 120 180 L 256 260 L 392 180 L 392 230 L 256 310 L 120 230 Z" fill="url(#redAccent)"/>

  <!-- Center Ball / Target Emblem -->
  <circle cx="256" cy="180" r="76" fill="#ffffff" filter="url(#shadow)"/>
  <circle cx="256" cy="180" r="68" fill="#047857"/>
  <circle cx="256" cy="180" r="56" fill="#ffffff"/>
  
  <!-- Soccer / Star Geometric Pattern -->
  <polygon points="256,144 269,168 296,168 274,184 282,210 256,194 230,210 238,184 216,168 243,168" fill="#dc2626"/>

  <!-- Sure Odd Typography -->
  <text x="256" y="375" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="3">SURE ODD</text>
  <text x="256" y="415" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#86efac" text-anchor="middle" letter-spacing="4">PREDICTIONS &amp; SCORES</text>
</svg>'''

with open('/public/icon.svg', 'w') as f:
    f.write(svg_content)

def make_png(width, height, is_maskable=False):
    # Pure python PNG generator using zlib
    raw = bytearray()
    
    cx, cy = width / 2.0, height / 2.0
    r_max = width / 2.0
    pad = 0.15 if is_maskable else 0.05
    safe_r = width * (0.5 - pad)

    for y in range(height):
        raw.append(0)  # filter type 0
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Base color: deep green #065f46 (6, 95, 70)
            r, g, b, a = 6, 95, 70, 255
            
            # Corner radius clipping if not maskable
            if not is_maskable:
                # Rounded square mask
                rx = abs(dx) - (width * 0.42)
                ry = abs(dy) - (height * 0.42)
                corner_d = math.sqrt(max(0, rx)**2 + max(0, ry)**2)
                if corner_d > width * 0.08:
                    r, g, b, a = 0, 0, 0, 0

            if a > 0:
                # Center circular crest
                if dist < safe_r * 0.65:
                    r, g, b = 255, 255, 255
                    if dist < safe_r * 0.58:
                        r, g, b = 4, 120, 87
                        if dist < safe_r * 0.48:
                            r, g, b = 255, 255, 255
                            if dist < safe_r * 0.35:
                                # Red star center
                                r, g, b = 220, 38, 38
                # Red chevron stripe below center
                elif abs(dy - (safe_r * 0.4)) < (height * 0.06) and abs(dx) < safe_r * 0.9:
                    r, g, b = 239, 68, 68

            raw.extend([r, g, b, a])

    compressed = zlib.compress(bytes(raw), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff))
    
    # IDAT
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff))
    
    # IEND
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff))
    
    return bytes(png)

# Write sizes
with open('/public/pwa-192x192.png', 'wb') as f:
    f.write(make_png(192, 192, is_maskable=False))

with open('/public/pwa-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, is_maskable=False))

with open('/public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, is_maskable=True))

with open('/public/apple-touch-icon.png', 'wb') as f:
    f.write(make_png(180, 180, is_maskable=False))

# Also create favicon.ico as copy of apple-touch-icon.png (valid image)
with open('/public/favicon.ico', 'wb') as f:
    f.write(make_png(64, 64, is_maskable=False))

print("PWA assets successfully generated.")
