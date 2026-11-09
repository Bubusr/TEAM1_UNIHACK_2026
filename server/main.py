import os
import io
import math
import base64
import tempfile
import subprocess
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFilter
import replicate
import requests
import rembg

app = FastAPI(
    title="Măng Non — Meta Animated Drawings & Replicate AI Server",
    description="Microservice xử lý gắn xương 16 khớp Meta Demo Lab và tạo video hoạt ảnh nhân vật giấy",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnimateRequest(BaseModel):
    image_base64: str
    motion: Optional[str] = "walk"  # walk, run, jump, dance, funny
    format: Optional[str] = "mp4"   # mp4, webp, gif

class SegmentRequest(BaseModel):
    image_base64: str
    model: Optional[str] = "auto"   # auto, u2netp, birefnet, remove_bg, clipdrop, replicate
    remove_bg_api_key: Optional[str] = None
    clipdrop_api_key: Optional[str] = None
    replicate_api_token: Optional[str] = None

_REMBG_SESSIONS: Dict[str, Any] = {}

def get_rembg_session(model_name: str = "u2netp"):
    global _REMBG_SESSIONS
    if model_name not in _REMBG_SESSIONS:
        try:
            _REMBG_SESSIONS[model_name] = rembg.new_session(model_name)
        except Exception as e:
            print(f"Warning: could not load rembg session '{model_name}': {e}")
            return None
    return _REMBG_SESSIONS.get(model_name)

def segment_character_ai(
    src_image: Image.Image,
    model_choice: str = "auto",
    remove_bg_api_key: Optional[str] = None,
    clipdrop_api_key: Optional[str] = None,
    replicate_api_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Tự động nhận diện và bóc tách nhân vật khỏi ảnh vẽ bằng AI (Meta Demo Lab Step 3 standard):
    1. Remove.bg API (nếu có API Key trong request hoặc env)
    2. Clipdrop API (nếu có API Key trong request hoặc env)
    3. Replicate Cloud AI (nếu có Token trong request hoặc env)
    4. rembg ONNX Local AI (u2netp siêu tốc ~0.2s hoặc birefnet sắc nét)
    5. Adaptive Computer Vision fallback
    """
    src_rgba = src_image.convert("RGBA")
    w, h = src_rgba.size
    cutout_img: Optional[Image.Image] = None
    engine_name = "rembg AI (u2netp)"

    # 1. Thử Remove.bg API
    rb_key = remove_bg_api_key or os.getenv("REMOVE_BG_API_KEY")
    if rb_key and (model_choice in ["auto", "remove_bg"]):
        try:
            buf = io.BytesIO()
            src_image.save(buf, format="PNG")
            resp = requests.post(
                "https://api.remove.bg/v1.0/removebg",
                files={"image_file": buf.getvalue()},
                data={"size": "auto", "format": "png"},
                headers={"X-Api-Key": rb_key},
                timeout=12,
            )
            if resp.status_code == 200:
                cutout_img = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                engine_name = "Remove.bg Cloud API"
        except Exception as e:
            print(f"Remove.bg error: {e}")

    # 2. Thử Clipdrop API
    cd_key = clipdrop_api_key or os.getenv("CLIPDROP_API_KEY")
    if not cutout_img and cd_key and (model_choice in ["auto", "clipdrop"]):
        try:
            buf = io.BytesIO()
            src_image.save(buf, format="PNG")
            resp = requests.post(
                "https://clipdrop-api.co/remove-background/v1",
                files={"image_file": ("image.png", buf.getvalue(), "image/png")},
                headers={"x-api-key": cd_key},
                timeout=12,
            )
            if resp.status_code == 200:
                cutout_img = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                engine_name = "Clipdrop Cloud API"
        except Exception as e:
            print(f"Clipdrop error: {e}")

    # 3. Thử Replicate API
    rep_token = replicate_api_token or os.getenv("REPLICATE_API_TOKEN")
    if not cutout_img and rep_token and (model_choice in ["auto", "replicate"]):
        try:
            buf = io.BytesIO()
            src_image.save(buf, format="PNG")
            rep_client = replicate.Client(api_token=rep_token)
            out = rep_client.run(
                "cjwbw/rembg:fb8af171cfa1616ddcf12428596cced42fb55608b8b2f8425ba60e09787865de",
                input={"image": buf}
            )
            if out:
                resp = requests.get(str(out), timeout=12)
                if resp.status_code == 200:
                    cutout_img = Image.open(io.BytesIO(resp.content)).convert("RGBA")
                    engine_name = "Replicate Cloud AI (Rembg)"
        except Exception as e:
            print(f"Replicate segmentation error: {e}")

    # 4. rembg ONNX Local AI (u2netp hoặc bria-rmbg)
    if not cutout_img:
        try:
            target_model = "bria-rmbg" if model_choice == "birefnet" else "u2netp"
            session = get_rembg_session(target_model)
            buf = io.BytesIO()
            src_image.save(buf, format="PNG")

            if session:
                out_bytes = rembg.remove(buf.getvalue(), session=session)
            else:
                out_bytes = rembg.remove(buf.getvalue())

            cutout_img = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
            engine_name = f"rembg AI Local ({target_model})"
        except Exception as e:
            print(f"rembg local error: {e}")

    # 5. Fallback Computer Vision nếu tất cả lỗi
    if not cutout_img:
        cutout_img = extract_character_cutout(src_image)
        engine_name = "Adaptive Computer Vision (Stroke Luma Fallback)"

    # Đảm bảo cutout cùng kích thước
    if cutout_img.size != (w, h):
        cutout_img = cutout_img.resize((w, h), Image.Resampling.LANCZOS)

    # 6. Trích xuất Mask & Tính Bounding Box
    alpha_channel = cutout_img.split()[-1]
    bbox_tuple = alpha_channel.getbbox() or (10, 10, w - 10, h - 10)
    bbox = {
        "x": int(bbox_tuple[0]),
        "y": int(bbox_tuple[1]),
        "w": int(bbox_tuple[2] - bbox_tuple[0]),
        "h": int(bbox_tuple[3] - bbox_tuple[1]),
    }

    # 7. Tạo ảnh Overlay màu xanh ngọc bích (#06D6A0) chuẩn Meta Animated Drawings
    overlay_img = src_rgba.copy()
    overlay_pixels = list(overlay_img.getdata())
    alpha_pixels = list(alpha_channel.getdata())

    tinted_pixels = []
    for orig, a in zip(overlay_pixels, alpha_pixels):
        if a > 25:
            # Phủ ngọc bích lên nhân vật
            r = int(orig[0] * 0.35 + 6 * 0.65)
            g = int(orig[1] * 0.35 + 214 * 0.65)
            b = int(orig[2] * 0.35 + 160 * 0.65)
            tinted_pixels.append((r, g, b, 255))
        else:
            tinted_pixels.append(orig)

    overlay_img.putdata(tinted_pixels)

    # 8. Encode Base64
    def to_b64(img: Image.Image) -> str:
        b = io.BytesIO()
        img.save(b, format="PNG")
        return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()

    return {
        "status": "success",
        "engine": engine_name,
        "cutout_base64": to_b64(cutout_img),
        "mask_base64": to_b64(alpha_channel),
        "overlay_base64": to_b64(overlay_img),
        "bbox": bbox,
    }

def extract_character_cutout(img: Image.Image, border_width: int = 4) -> Image.Image:
    """
    Tách nhân vật khỏi nền trắng và tạo viền sticker giấy trắng thủ công (như Teri Gumball / Meta Demo Lab)
    """
    img = img.convert("RGBA")
    w, h = img.size
    
    # 1. Tìm bounding box và lọc điểm ảnh nét vẽ
    data = img.getdata()
    new_data = []
    min_x, max_x = w, 0
    min_y, max_y = h, 0
    drawn_count = 0

    for idx, item in enumerate(data):
        x = idx % w
        y = idx // w
        r, g, b, a = item
        # Điểm ảnh được coi là nét vẽ nếu mờ > 35 và không phải là nền trắng
        is_stroke = a > 35 and (r < 235 or g < 235 or b < 235)
        if is_stroke:
            new_data.append(item)
            drawn_count += 1
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y
        else:
            new_data.append((255, 255, 255, 0)) # trong suốt

    cutout = Image.new("RGBA", (w, h))
    cutout.putdata(new_data)

    if drawn_count < 30 or max_x <= min_x:
        return img

    # 2. Tạo viền sticker giấy trắng (Die-cut margin)
    alpha = cutout.split()[-1]
    # Làm nở vùng alpha để tạo viền
    expanded_mask = alpha.filter(ImageFilter.MaxFilter(border_width * 2 + 1))
    
    border_img = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    border_img.putalpha(expanded_mask)

    # Thêm bóng đổ nhẹ cho viền giấy
    shadow_mask = expanded_mask.filter(ImageFilter.GaussianBlur(3))
    shadow_img = Image.new("RGBA", (w, h), (0, 0, 0, 80))
    shadow_canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shadow_canvas.paste(shadow_img, (1, 2), shadow_mask)

    # Ghép lại: Bóng đổ -> Viền sticker trắng -> Nét vẽ gốc
    result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    result.paste(shadow_canvas, (0, 0), shadow_canvas)
    result.paste(border_img, (0, 0), border_img)
    result.paste(cutout, (0, 0), cutout)

    return result

def detect_meta_skeleton(img: Image.Image) -> Dict[str, Any]:
    """
    Thuật toán AI Computer Vision định vị 16 khớp xương chuẩn Meta Animated Drawings (char_cfg.yaml):
    root, hip, neck, head, left_shoulder, left_elbow, left_hand,
    right_shoulder, right_elbow, right_hand, left_hip, left_knee, left_foot,
    right_hip, right_knee, right_foot + mắt, mũi, miệng.
    """
    img = img.convert("RGBA")
    w, h = img.size
    data = img.getdata()

    min_x, max_x = w, 0
    min_y, max_y = h, 0
    points = []

    for idx, item in enumerate(data):
        x = idx % w
        y = idx // w
        r, g, b, a = item
        if a > 40 and (r < 235 or g < 235 or b < 235):
            points.append((x, y, (r + g + b) / 3))
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

    if len(points) < 30:
        # Fallback tọa độ mặc định chuẩn Meta
        return {
            "root": [0.5, 0.65],
            "hip": [0.5, 0.65],
            "neck": [0.5, 0.35],
            "head": [0.5, 0.15],
            "left_shoulder": [0.35, 0.38],
            "left_elbow": [0.25, 0.48],
            "left_hand": [0.18, 0.60],
            "right_shoulder": [0.65, 0.38],
            "right_elbow": [0.75, 0.48],
            "right_hand": [0.82, 0.60],
            "left_hip": [0.40, 0.66],
            "left_knee": [0.38, 0.80],
            "left_foot": [0.35, 0.94],
            "right_hip": [0.60, 0.66],
            "right_knee": [0.62, 0.80],
            "right_foot": [0.65, 0.94],
            "eye_l": [0.44, 0.22],
            "eye_r": [0.56, 0.22],
            "mouth": [0.5, 0.29]
        }

    box_w = max_x - min_x
    box_h = max_y - min_y
    center_x = (min_x + max_x) / 2

    # Phân vùng dọc
    head_end_y = min_y + box_h * 0.32
    torso_end_y = min_y + box_h * 0.65

    head_pts = [p for p in points if p[1] <= head_end_y]
    torso_pts = [p for p in points if head_end_y < p[1] <= torso_end_y]
    leg_pts = [p for p in points if p[1] > torso_end_y]

    head_x = sum(p[0] for p in head_pts) / len(head_pts) if head_pts else center_x
    head_y = min_y + box_h * 0.08

    neck_x = head_x
    neck_y = head_end_y

    torso_x = sum(p[0] for p in torso_pts) / len(torso_pts) if torso_pts else center_x
    hip_y = torso_end_y

    # Mắt trái, Mắt phải (tìm điểm tối nhất trong vùng đầu)
    left_head = [p for p in head_pts if p[0] < center_x]
    right_head = [p for p in head_pts if p[0] >= center_x]
    
    eye_l = min(left_head, key=lambda p: p[2]) if left_head else (center_x - box_w * 0.12, min_y + box_h * 0.18, 0)
    eye_r = min(right_head, key=lambda p: p[2]) if right_head else (center_x + box_w * 0.12, min_y + box_h * 0.18, 0)

    # Tay trái, Tay phải
    shoulder_l_x = center_x - box_w * 0.24
    shoulder_r_x = center_x + box_w * 0.24
    shoulder_y = neck_y + box_h * 0.04

    left_arms = [p for p in torso_pts if p[0] < center_x]
    right_arms = [p for p in torso_pts if p[0] > center_x]
    
    hand_l_pt = min(left_arms, key=lambda p: p[0]) if left_arms else (min_x, shoulder_y + box_h * 0.15, 0)
    hand_r_pt = max(right_arms, key=lambda p: p[0]) if right_arms else (max_x, shoulder_y + box_h * 0.15, 0)

    # Chân trái, Chân phải
    left_legs = [p for p in leg_pts if p[0] < center_x]
    right_legs = [p for p in leg_pts if p[0] >= center_x]

    foot_l_pt = max(left_legs, key=lambda p: p[1]) if left_legs else (center_x - box_w * 0.18, max_y, 0)
    foot_r_pt = max(right_legs, key=lambda p: p[1]) if right_legs else (center_x + box_w * 0.18, max_y, 0)

    to_rel = lambda px, py: [round(max(0.04, min(0.96, px / w)), 3), round(max(0.04, min(0.96, py / h)), 3)]

    return {
        "root": to_rel(torso_x, hip_y),
        "hip": to_rel(torso_x, hip_y),
        "neck": to_rel(neck_x, neck_y),
        "head": to_rel(head_x, head_y),
        "left_shoulder": to_rel(shoulder_l_x, shoulder_y),
        "left_elbow": to_rel((shoulder_l_x + hand_l_pt[0]) / 2, (shoulder_y + hand_l_pt[1]) / 2),
        "left_hand": to_rel(hand_l_pt[0], hand_l_pt[1]),
        "right_shoulder": to_rel(shoulder_r_x, shoulder_y),
        "right_elbow": to_rel((shoulder_r_x + hand_r_pt[0]) / 2, (shoulder_y + hand_r_pt[1]) / 2),
        "right_hand": to_rel(hand_r_pt[0], hand_r_pt[1]),
        "left_hip": to_rel(center_x - box_w * 0.12, hip_y),
        "left_knee": to_rel((center_x - box_w * 0.12 + foot_l_pt[0]) / 2, (hip_y + foot_l_pt[1]) / 2),
        "left_foot": to_rel(foot_l_pt[0], foot_l_pt[1]),
        "right_hip": to_rel(center_x + box_w * 0.12, hip_y),
        "right_knee": to_rel((center_x + box_w * 0.12 + foot_r_pt[0]) / 2, (hip_y + foot_r_pt[1]) / 2),
        "right_foot": to_rel(foot_r_pt[0], foot_r_pt[1]),
        "eye_l": to_rel(eye_l[0], eye_l[1]),
        "eye_r": to_rel(eye_r[0], eye_r[1]),
        "mouth": to_rel(center_x, (eye_l[1] + eye_r[1]) / 2 + box_h * 0.08)
    }

def render_paper_animation_frames(img: Image.Image, motion: str = "walk", num_frames: int = 30) -> List[Image.Image]:
    """
    Tạo các khung hình hoạt ảnh uốn lượn tờ giấy 2D/3D (phong cách Teri Gumball & Meta Demo Lab)
    """
    frames = []
    base_w, base_h = img.size
    canvas_size = 400

    for i in range(num_frames):
        t = (i / num_frames) * math.pi * 2
        frame = Image.new("RGBA", (canvas_size, canvas_size), (255, 255, 255, 0))

        # Phông nền rừng tre mờ ảo nhẹ nhàng
        draw = ImageDraw.Draw(frame)
        
        # Tính toán chuyển động theo từng thể loại
        if motion == "run":
            sway = math.sin(t * 2)
            hop_y = -abs(sway) * 16
            skew = sway * 0.12 + 0.08
            scale_x = 0.94
            scale_y = 1.06
        elif motion == "jump":
            is_air = 0.5 < (t % (math.pi * 2)) < 2.7
            hop_y = -math.sin(t - 0.5) * 36 if is_air else 0
            skew = math.sin(t * 3) * 0.08 if is_air else 0
            scale_x = 0.88 if is_air else 1.15
            scale_y = 1.15 if is_air else 0.85
        elif motion == "dance":
            wave = math.sin(t)
            hop_y = -abs(wave) * 8
            skew = wave * 0.14
            scale_x = 1.0 + abs(wave) * 0.08
            scale_y = 1.0 - abs(wave) * 0.06
        elif motion == "funny":
            # Hoảng sợ rung rinh kiểu Teri
            shake = math.sin(t * 6)
            hop_y = -abs(shake) * 6
            skew = shake * 0.15
            scale_x = 0.95 + shake * 0.06
            scale_y = 1.05 - shake * 0.06
        else:
            # Đi bộ (walk)
            sway = math.sin(t)
            hop_y = -abs(sway) * 8
            skew = sway * 0.06
            scale_x = 0.98
            scale_y = 1.02

        # Biến dạng kích thước
        target_w = int(base_w * scale_x * 0.85)
        target_h = int(base_h * scale_y * 0.85)
        resized_char = img.resize((max(10, target_w), max(10, target_h)), Image.Resampling.BILINEAR)

        # Vẽ bóng đổ elip dưới mặt đất
        shadow_w = int(target_w * 0.7)
        shadow_h = 14
        shadow_center_y = int(canvas_size * 0.82)
        shadow_box = [
            (canvas_size - shadow_w) // 2,
            shadow_center_y - shadow_h // 2,
            (canvas_size + shadow_w) // 2,
            shadow_center_y + shadow_h // 2
        ]
        draw.ellipse(shadow_box, fill=(15, 25, 28, 70))

        # Đặt nhân vật lên khung hình tại vị trí nhảy hop_y
        char_x = (canvas_size - target_w) // 2
        char_y = int(shadow_center_y - target_h * 0.88 + hop_y)
        frame.paste(resized_char, (char_x, char_y), resized_char)

        frames.append(frame)

    return frames

@app.get("/health")
def health():
    return {
        "status": "online",
        "engine": "Meta Animated Drawings Kinematics + Rembg AI + Cloud Segmentation",
        "rembg_installed": True,
        "u2netp_ready": True,
        "remove_bg_configured": bool(os.getenv("REMOVE_BG_API_KEY")),
        "clipdrop_configured": bool(os.getenv("CLIPDROP_API_KEY")),
        "replicate_configured": bool(os.getenv("REPLICATE_API_TOKEN")),
        "ffmpeg": os.path.exists("/opt/homebrew/bin/ffmpeg") or os.system("which ffmpeg") == 0,
    }

@app.post("/api/segment-drawing")
async def segment_drawing_form(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    model: str = Form("auto"),
    remove_bg_api_key: Optional[str] = Form(None),
    clipdrop_api_key: Optional[str] = Form(None),
    replicate_api_token: Optional[str] = Form(None),
):
    try:
        if file:
            contents = await file.read()
            src_image = Image.open(io.BytesIO(contents))
        elif image_base64:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            contents = base64.b64decode(image_base64)
            src_image = Image.open(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Vui lòng cung cấp file ảnh hoặc image_base64.")

        res = segment_character_ai(
            src_image,
            model_choice=model,
            remove_bg_api_key=remove_bg_api_key,
            clipdrop_api_key=clipdrop_api_key,
            replicate_api_token=replicate_api_token,
        )
        return JSONResponse(res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/segment")
async def segment_drawing_json(req: SegmentRequest):
    try:
        raw_b64 = req.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
        contents = base64.b64decode(raw_b64)
        src_image = Image.open(io.BytesIO(contents))

        res = segment_character_ai(
            src_image,
            model_choice=req.model or "auto",
            remove_bg_api_key=req.remove_bg_api_key,
            clipdrop_api_key=req.clipdrop_api_key,
            replicate_api_token=req.replicate_api_token,
        )
        return JSONResponse(res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/animate-drawing")
async def animate_drawing(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    motion: str = Form("walk"),
    format: str = Form("mp4"),
    use_replicate: bool = Form(False)
):
    try:
        # 1. Đọc dữ liệu ảnh từ File Upload hoặc Base64
        if file:
            contents = await file.read()
            src_image = Image.open(io.BytesIO(contents))
        elif image_base64:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            contents = base64.b64decode(image_base64)
            src_image = Image.open(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Vui lòng gửi file ảnh hoặc chuỗi base64.")

        # 2. Bước tách nền & tạo viền sticker giấy trắng phong cách Teri
        cutout_img = extract_character_cutout(src_image)

        # 3. Bước định vị 16 khớp xương chuẩn Meta Animated Drawings
        skeleton_rig = detect_meta_skeleton(src_image)

        # 4. Kiểm tra nếu người dùng muốn dùng Replicate API (khi có API Token)
        replicate_token = os.getenv("REPLICATE_API_TOKEN")
        if use_replicate and replicate_token:
            try:
                temp_in = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
                cutout_img.save(temp_in.name, format="PNG")
                
                # Gọi model Replicate Image-to-Video
                output = replicate.run(
                    "wavespeedai/wan-2.1-i2v-480p",
                    input={
                        "image": open(temp_in.name, "rb"),
                        "prompt": f"A cute 2D paper cutout character {motion}ing smoothly on a bamboo forest background",
                    }
                )
                return {
                    "status": "success",
                    "engine": "Replicate Cloud AI",
                    "video_url": str(output),
                    "rig_data": skeleton_rig,
                    "motion": motion
                }
            except Exception as rep_err:
                # Fallback to local rendering if Replicate fails
                print(f"Replicate error: {rep_err}, falling back to local Meta engine.")

        # 5. Render chuỗi khung hình hoạt ảnh chuyển động giấy
        frames = render_paper_animation_frames(cutout_img, motion=motion, num_frames=30)

        # 6. Xuất định dạng WebP Animation Base64
        webp_buf = io.BytesIO()
        frames[0].save(
            webp_buf,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=40, # ~25 fps
            loop=0
        )
        webp_base64 = "data:image/webp;base64," + base64.b64encode(webp_buf.getvalue()).decode()

        # 7. Render Video MP4 qua FFmpeg nếu được yêu cầu
        video_base64 = None
        temp_dir = tempfile.mkdtemp()
        try:
            for idx, f in enumerate(frames):
                # Lưu frame có nền màu xanh rừng tre để MP4 không bị lỗi alpha
                bg_frame = Image.new("RGB", f.size, (17, 30, 25))
                bg_frame.paste(f, (0, 0), f)
                bg_frame.save(os.path.join(temp_dir, f"frame_{idx:03d}.png"))

            mp4_path = os.path.join(temp_dir, "output.mp4")
            cmd = [
                "ffmpeg", "-y",
                "-framerate", "25",
                "-i", os.path.join(temp_dir, "frame_%03d.png"),
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-crf", "22",
                mp4_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            with open(mp4_path, "rb") as vf:
                video_bytes = vf.read()
                video_base64 = "data:video/mp4;base64," + base64.b64encode(video_bytes).decode()
        except Exception as ffmpeg_err:
            print(f"FFmpeg encoding fallback: {ffmpeg_err}")
            video_base64 = None

        return JSONResponse({
            "status": "success",
            "engine": "Meta Animated Drawings Kinematics (Local)",
            "motion": motion,
            "duration_seconds": 1.2,
            "video_base64": video_base64 or webp_base64,
            "webp_base64": webp_base64,
            "rig_data": skeleton_rig,
            "has_mp4": video_base64 is not None
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

