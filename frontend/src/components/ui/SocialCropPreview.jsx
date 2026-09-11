import { useRef } from "react";
import "./SocialCropPreview.css";

function SocialCropPreview({ imageUrl, focusX, focusY, onChange }) {
  const previewRef = useRef(null);

  const updateFocus = (event) => {
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;

    onChange({
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    });
  };

  if (!imageUrl) return null;

  return (
    <section className="social-crop-preview">
      <div>
        <h3>Prévia da publicação</h3>
        <p>Arraste a imagem para definir o centro do recorte.</p>
      </div>
      <div
        ref={previewRef}
        className="social-crop-preview-frame"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFocus(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFocus(event);
        }}
      >
        <img
          src={imageUrl}
          alt="Prévia do enquadramento para redes sociais"
          style={{ objectPosition: `${focusX * 100}% ${focusY * 100}%` }}
        />
        <span className="social-crop-preview-mark" style={{ left: `${focusX * 100}%`, top: `${focusY * 100}%` }} />
      </div>
    </section>
  );
}

export default SocialCropPreview;