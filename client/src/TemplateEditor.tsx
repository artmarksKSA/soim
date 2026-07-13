import { useEffect, useRef, useState } from 'react';
import { FabricImage, Canvas, Rect, Textbox } from 'fabric';

interface TemplateEditorProps {
  articleTitle: string;
  articleSummary: string;
  articleImage: string;
}

function TemplateEditor({ articleTitle, articleSummary, articleImage }: TemplateEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: '#1a1a1a',
    });
    fabricCanvasRef.current = canvas;

    // Background rectangle
    const background = new Rect({
      left: 0,
      top: 0,
      width: 1080,
      height: 1080,
      fill: '#0a0a0a',
    });
    canvas.add(background);

    // Article image
    if (articleImage) {
      FabricImage.fromURL(articleImage).then((img) => {
        img.scaleToWidth(1080);
        img.set({
          left: 0,
          top: 0,
          opacity: 0.7,
        });
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.sendBackwards(img); // Make sure background is behind image
        canvas.renderAll();
      });
    }

    // Title textbox
    const titleText = new Textbox(articleTitle, {
      left: 50,
      top: 50,
      width: 980,
      fontSize: 48,
      fill: 'white',
      textAlign: 'center',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      selectable: true,
    });
    canvas.add(titleText);

    // Summary textbox
    const summaryText = new Textbox(articleSummary, {
      left: 50,
      top: 500,
      width: 980,
      fontSize: 32,
      fill: 'white',
      textAlign: 'center',
      fontFamily: 'Arial',
      selectable: true,
    });
    canvas.add(summaryText);

    canvas.renderAll();

    return () => {
      canvas.dispose();
    };
  }, [articleTitle, articleSummary, articleImage]);

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'post.png';
    link.click();
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ border: '1px solid #3a3a3a', maxWidth: '100%' }} />
      <button onClick={handleDownload} style={{ marginTop: '1rem' }}>
        تحميل الصورة
      </button>
    </div>
  );
}

export default TemplateEditor;
