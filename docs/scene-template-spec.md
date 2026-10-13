# Scene template specification

## 14. Đặc tả tái sử dụng cảnh và thay brand
Nguồn tham chiếu: file người dùng cung cấp Pasted markdown(3).md — cảnh 12, end card Megane.ai, 2,2 giây. Đây là prompt tham khảo, chưa phải bằng chứng hình ảnh về video gốc. Không khẳng định đã xem Doks.ai hoặc frame cuối cảnh 11.

### 14.1. Ba lớp dữ liệu bắt buộc
1. Scene Blueprint: loại cảnh, layout, camera, timeline, transition, continuity, style. Có ID/version và bằng chứng frame/timecode.
2. Brand Bindings: logo, màu, font, chữ, CTA, screenshots; có khóa biến toàn dự án và override từng cảnh.
3. Render Manifest: snapshot đã duyệt của hai lớp trên, asset hashes, model settings, clip IDs và hiệu ứng. Mỗi export truy ngược được manifest.

Không chỉ lưu một đoạn prompt dài. Prompt tiếng Anh là đầu ra biên dịch từ ba lớp; UI sửa biến, không yêu cầu người dùng tìm/thay tên brand thủ công trong hàng nghìn chữ.

| Biến thay được | Kiểu dữ liệu | Quy tắc khi đổi |
|---|---|---|
| brand.name | string | Chính xác spelling/case; không tự thêm domain |
| brand.logo | asset ID + intrinsic ratio | Giữ vùng chứa logo; bảo toàn tỷ lệ, không kéo méo |
| brand.primary/background/accent/textMuted | color tokens | Re-render layer liên quan; nền AI có thể phải regenerate |
| brand.font.heading/body | font asset + weight | Cần font có quyền dùng; kiểm tra thiếu glyph và text overflow |
| scene.headline/body/cta | string | Giữ layout envelope; fit theo giới hạn font size, quá dài yêu cầu sửa |
| scene.productScreenshot | asset ID | Crop/contain có preview; không tự bịa nội dung sản phẩm |
| scene.decorativeSymbol | asset/template ID | Dùng vector/asset, không dựa vào glyph ngôi sao tùy font |
| scene.timing | frame intervals | Được sửa có chủ đích; mặc định giữ nhịp mẫu |
| scene.lockedConstraints | rules | Không cho brand swap tự thay camera/timeline/layout đã khóa |

Agency một người vẫn cần nhiều brand kit, đặt tên khách hàng, duplicate project rồi chọn brand mới. Chưa cần mời thành viên/team billing.

### 14.2. Ví dụ cấu trúc cảnh 12 (đặc tả, chưa phải mã triển khai)
```json
{
  "schema_version": "0.2",
  "scene_id": "scene_12",
  "kind": "end_card",
  "canvas": {"width": 1920, "height": 1080, "fps": 30},
  "duration_frames": 66,
  "render_mode": "compositor",
  "bindings": {
    "logo": "brand.logo",
    "wordmark": "brand.name",
    "primary": "brand.primary",
    "background": "brand.background",
    "cta_font": "brand.font.body",
    "cta_color": "brand.textMuted",
    "cta_text": "scene.cta"
  },
  "editable_paths": ["bindings", "scene.cta"],
  "locked": ["camera", "logo_transform", "timeline", "layout"],
  "continuity": {
    "source_scene": "scene_11",
    "source_version": "REQUIRED_APPROVED_VERSION",
    "source_frame": "last_composited_frame",
    "inherit_layers": ["logo", "background", "halo"],
    "missing_source_action": "block_or_request_user_approved_keyframe"
  },
  "layout": {
    "logo": {"transform": "inherit_previous_scene"},
    "cta": {"align": "center_below_logo", "gap_px": 36, "font_size_px": 26},
    "sparkle": {"position": "left_of_cta", "height_px": 12}
  },
  "timeline": [
    {"start_frame": 0, "end_frame_exclusive": 3, "action": "inherit_hold"},
    {"start_frame": 3, "end_frame_exclusive": 9, "action": "cta_fade_slide", "opacity": [0,1], "y_offset_px": [6,0], "easing": "ease_out"},
    {"start_frame": 9, "end_frame_exclusive": 60, "action": "hold"},
    {"start_frame": 60, "end_frame_exclusive": 66, "action": "stable_final_hold"}
  ],
  "exit": "none_end_video",
  "audio": "none",
  "quality_checks": ["exact_brand_text", "exact_cta", "no_logo_transform_change", "no_fade_out", "frame_count_66"]
}
```
Các số 36px, 26px, 12px, 6px là lựa chọn nằm trong khoảng prompt mẫu, chưa đo từ video. Renderer quy định easing bằng hàm/curve cụ thể trong version để kết quả lặp lại được. CTA reveal dùng khoảng frame [3,9), trạng thái fully visible từ frame 9; không nhập timeline giây và frame mâu thuẫn.

### 14.3. Pattern prompt đầu ra
Mỗi cảnh đều có các mục này; compiler tự bỏ phần không áp dụng nhưng không bỏ continuity hoặc exact text checks:

```text
SCENE {{scene.number}} — {{scene.title}}
BRAND: {{brand.name}}
PRODUCT CONTEXT: {{brand.product_description}}

VIDEO FORMAT
Canvas {{canvas.width}}x{{canvas.height}}, {{canvas.aspect_ratio}}.
Final timeline: {{canvas.fps}} fps, {{scene.duration_frames}} frames.
Target scene duration: {{scene.duration_seconds}} seconds.
Provider output settings are defined separately from final export settings.

REFERENCE AND PURPOSE
Reference interval: {{scene.reference_interval}}.
Preserve the approved pacing, relative layout and motion: {{scene.reference_rules}}.
Scene purpose: {{scene.purpose}}.

CONTINUITY CONTRACT
Start from {{scene.previous_approved_frame}} when available.
Preserve: {{scene.inherit_elements}}.
Do not reconstruct locked elements: {{scene.locked_elements}}.
If the continuity input is missing, stop preparation and request it.

BRAND REPLACEMENTS
Logo asset: {{brand.logo_asset}}.
Colors: {{brand.color_tokens}}.
Typography assets and weights: {{brand.fonts}}.
Exact visible text: {{scene.text_items}}.
Product screenshots: {{scene.product_assets}}.

LAYOUT AND VISUAL HIERARCHY
{{scene.elements_with_positions_sizes_spacing_and_z_order}}
Respect the approved layout envelope for longer replacement text/logos.

TIMELINE
{{scene.timecoded_actions_and_holds}}

MOTION AND CAMERA
{{scene.motion_paths_easing_amplitude}}
{{scene.camera_rules}}

BACKGROUND AND LIGHTING
{{scene.background_description}}
{{scene.lighting_limits}}

FINAL FRAME AND NEXT SCENE
{{scene.final_frame_composition}}
{{scene.exit_or_continuation_rules}}

EXACT TEXT AND ASSET RULES
{{scene.verbatim_text_and_asset_requirements}}

FORBIDDEN CHANGES
{{scene.negative_constraints}}

RENDER OWNERSHIP
AI-generated layers: {{scene.ai_layers}}.
Composited layers: {{scene.precise_layers}}.
Do not bake composited text/logo into the AI background.
Audio: none for v1.

VALIDATION SUMMARY
{{scene.acceptance_checks}}
```
Không gửi placeholder chưa resolve cho provider. Compiler báo thiếu logo/font/continuity rõ ràng. Trong chế độ hybrid, master prompt mô tả cả cảnh nhưng AI subprompt chỉ mô tả lớp AI; compositor manifest sở hữu chữ/logo/timing chính xác để tránh chữ lặp hai lần.

### 14.4. Cách dựng tiết kiệm cảnh mẫu
Cảnh 12 chủ yếu là hold + CTA fade/slide, vì vậy ưu tiên dựng thuần compositor từ layer hoặc frame đã duyệt của cảnh 11, không gọi Omni mới. Nếu chỉ có ảnh phẳng đã chứa logo cũ, không thể đổi brand an toàn chỉ bằng thay biến; cần nền sạch/layer tách hoặc tái dựng và duyệt trước.
Logo/background/halo được kế thừa từ phiên bản cảnh 11 sau brand swap. Đổi brand ở cảnh 12 đơn lẻ khi các layer này đang khóa sẽ bị chặn hoặc yêu cầu cập nhật từ cảnh 11. Không chèn logo mới đè lên logo cũ rồi coi là hoàn tất.
Đối với cảnh phức tạp cần Omni: giữ style/layout targets, tạo AI clip rồi compositor đặt chữ/logo riêng. Camera di chuyển phức tạp có thể cần tracking/plane transform; nếu template không hỗ trợ thì chuyển review, không hứa mọi cảnh khớp pixel.

### 14.5. Chất lượng và độ phân giải
Tài liệu model hiện ghi 3–10 giây/clip ở 24 fps; tài liệu Omni mô tả 1080p/4K dùng upscaling. Final export 30 fps không biến chuyển động AI thành native 30 fps: cần resample/interpolation và review artifact. Với cảnh 2,2 giây, compositor dựng đúng 66 frame; nếu dùng AI phải tạo clip theo giới hạn provider rồi trim, tính chi phí theo clip đã tạo.
1080p final có text/UI native 1920×1080, footage AI có thể upscale. Ghi metadata resolution_origin cho từng layer và final export; không quảng cáo toàn video là native AI 1080p.
Nguồn: https://ai.google.dev/gemini-api/docs/models/gemini-omni-flash và https://ai.google.dev/gemini-api/docs/omni

