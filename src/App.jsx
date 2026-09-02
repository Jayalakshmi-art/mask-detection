import React, { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';

const MODEL_URL = '/model/';
const MIN_CONFIDENCE = 70;

const statusFor = (label) => {
  const value = label.toLowerCase().replace(/[ _-]/g, '');
  if (value.includes('improper') || value.includes('incorrect') || value.includes('wrong')) {
    return { title: 'Mask worn improperly', tone: 'warning', detail: 'Please cover both your nose and mouth.' };
  }
  if (value.includes('without') || value.includes('nomask') || value.includes('no mask')) {
    return { title: 'No mask detected', tone: 'danger', detail: 'Please wear a mask before proceeding.' };
  }
  if (value.includes('mask')) {
    return { title: 'Mask worn correctly', tone: 'success', detail: 'Thank you for keeping your mask on.' };
  }
  return { title: label, tone: 'neutral', detail: 'Live detection is active.' };
};

export default function App() {
  const previewRef = useRef(null);
  const frameRef = useRef(null);
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState(null);

  const stopCamera = () => {
    cancelAnimationFrame(frameRef.current);
    webcamRef.current?.stop();
    webcamRef.current = null;
    previewRef.current?.replaceChildren();
    setIsRunning(false);
  };

  const predict = async () => {
    if (!webcamRef.current || !modelRef.current) return;
    webcamRef.current.update();
    const results = await modelRef.current.predict(webcamRef.current.canvas);
    const best = results.reduce((highest, item) =>
      item.probability > highest.probability ? item : highest,
    );
    setPrediction({
      label: best.className,
      confidence: Math.round(best.probability * 100),
      scores: results.map((item) => ({
        label: item.className,
        confidence: Math.round(item.probability * 100),
      })),
    });
    frameRef.current = requestAnimationFrame(predict);
  };

  const startCamera = async () => {
    setError('');
    setPrediction(null);
    setIsLoading(true);
    try {
      if (!modelRef.current) {
        modelRef.current = await tmImage.load(`${MODEL_URL}model.json`, `${MODEL_URL}metadata.json`);
      }
      // Match Teachable Machine's own 224 × 224 mirrored webcam input.
      // This avoids changing the framing/orientation the model was trained on.
      const webcam = new tmImage.Webcam(224, 224, true);
      await webcam.setup({ facingMode: 'user' });
      await webcam.play();
      webcam.canvas.className = 'webcam-canvas';
      previewRef.current.replaceChildren(webcam.canvas);
      webcamRef.current = webcam;
      setIsRunning(true);
      frameRef.current = requestAnimationFrame(predict);
    } catch (caughtError) {
      console.error(caughtError);
      const message = caughtError?.name === 'NotAllowedError'
        ? 'Camera access was blocked. Allow access in your browser and try again.'
        : 'Could not start detection. Ensure your exported Teachable Machine files are in public/model.';
      setError(message);
      stopCamera();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => () => stopCamera(), []);

  const result = prediction
    ? prediction.confidence >= MIN_CONFIDENCE
      ? statusFor(prediction.label)
      : {
          title: 'Unable to confirm mask status',
          tone: 'neutral',
          detail: `Keep your face in the frame and improve lighting (confidence below ${MIN_CONFIDENCE}%).`,
        }
    : null;

  return (
    <main className="app-shell">
      <section className="detector-card" aria-labelledby="page-title">
        <header className="header">
          <div className="brand-mark" aria-hidden="true">⌁</div>
          <div>
            <p className="eyebrow">AI safety scanner</p>
            <h1 id="page-title">MaskCheck</h1>
          </div>
          <span className={`camera-state ${isRunning ? 'active' : ''}`}>
            <i /> {isRunning ? 'Camera live' : 'Camera off'}
          </span>
        </header>

        <div className="camera-panel">
          <div className="camera-preview" ref={previewRef} aria-label="Live camera preview" />
          {!isRunning && <div className="camera-placeholder"><span>⌾</span><p>Ready to scan</p></div>}
          {isRunning && <div className="scan-frame" aria-hidden="true"><b /><b /><b /><b /></div>}
        </div>

        {error && <p className="error" role="alert">{error}</p>}

        <section className={`result ${result?.tone || ''}`} aria-live="polite">
          <div className="result-icon">{result?.tone === 'success' ? '✓' : result?.tone === 'danger' ? '!' : result?.tone === 'warning' ? '!' : '⌁'}</div>
          <div>
            <p className="result-label">{result ? result.title : 'Awaiting camera input'}</p>
            <p className="result-detail">{result ? result.detail : 'Start the camera to receive a live result.'}</p>
          </div>
          {prediction && <strong>{prediction.confidence}%</strong>}
        </section>

        {prediction && (
          <section className="confidence-panel" aria-label="Live prediction confidence">
            <p>Live model confidence</p>
            {prediction.scores.map((score) => (
              <div className="confidence-row" key={score.label}>
                <span>{score.label}</span>
                <div className="confidence-track" aria-hidden="true">
                  <i style={{ width: `${score.confidence}%` }} />
                </div>
                <strong>{score.confidence}%</strong>
              </div>
            ))}
          </section>
        )}

        <button className="primary-button" onClick={isRunning ? stopCamera : startCamera} disabled={isLoading}>
          {isLoading ? 'Loading model…' : isRunning ? 'Stop detection' : 'Start detection'}
        </button>
        <p className="privacy-note">Your camera feed stays in this browser. No images are uploaded.</p>
      </section>
    </main>
  );
}
