import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

export default function OCRCamera() {
  const webcamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const captureAndSend = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot(); // data:image/jpeg;base64,...
    setPreview(imageSrc);
    setLoading(true);

    // Option A: send as form-data (recommended)
    const blob = await (await fetch(imageSrc)).blob();
    const fd = new FormData();
    fd.append("image", blob, "capture.jpg");

    try {
      const res = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      setOcrResult(data);
    } catch (err) {
      console.error("OCR request failed", err);
      setOcrResult({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }, [webcamRef]);

  return (
    <div className="ocr-container">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={640}
        height={480}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={captureAndSend}>Capture & OCR</button>
      </div>

      {loading && <div>Processing…</div>}
      {preview && (
        <div>
          <h4>Preview</h4>
          <img src={preview} alt="preview" style={{ maxWidth: 320 }} />
        </div>
      )}

      {ocrResult && (
        <div>
          <h4>OCR Extracted</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(ocrResult.extracted, null, 2)}
          </pre>

          <h5>Raw Lines</h5>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
            {JSON.stringify(ocrResult.raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
