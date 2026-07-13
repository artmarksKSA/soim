import { useEffect, useRef, useState } from 'react';
import { FabricImage, Canvas, Rect, Textbox } from 'fabric';

interface TemplateEditorProps {
  articleTitle: string;
  articleSummary: string;
  articleImages: string[];
  onTemplateSave?: (data: string) => void;
  onLoadTemplate?: (file: File) => void;
}

function TemplateEditor({ articleTitle, articleSummary, articleImages, onTemplateSave, onLoadTemplate }: TemplateEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [fontSizeTitle, setFontSizeTitle] = useState(48);
  const [fontSizeSummary, setFontSizeSummary] = useState(32);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: '#0f0f0f',
    });
    fabricCanvasRef.current = canvas;

    renderCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [articleTitle, articleSummary, articleImages, selectedImageIndex, currentFont, fontSizeTitle, fontSizeSummary]);

  const renderCanvas = (canvas: Canvas) => {
    canvas.clear();

    // Background gradient
    const bg = new Rect({
      left: 0,
      top: 0,
      width: 1080,
      height: 1080,
      fill: 'rgba(15, 15, 15, 1)',
    });
    canvas.add(bg);

    // Article image if available
    if (articleImages.length > 0 && articleImages[selectedImageIndex]) {
      FabricImage.fromURL(articleImages[selectedImageIndex]).then((img) => {
        // Cover the entire canvas
        const imgRatio = img.width / img.height;
        const canvasRatio = 1;
        let newWidth, newHeight;

        if (imgRatio > canvasRatio) {
          newHeight = 1080;
          newWidth = imgRatio * newHeight;
        } else {
          newWidth = 1080;
          newHeight = newWidth / imgRatio;
        }

        img.set({
          scaleX: newWidth / img.width,
          scaleY: newHeight / img.height,
          originX: 'center',
          originY: 'center',
          left: 1080 / 2,
          top: 1080 / 2,
          opacity: 0.6,
        });
        canvas.add(img);

        // Overlay gradient
        const overlay = new Rect({
          left: 0,
          top: 0,
          width: 1080,
          height: 1080,
          fill: 'rgba(0, 0, 0, 0.4)',
        });
        canvas.add(overlay);

        addTextElements(canvas);
      }).catch(() => {
        addTextElements(canvas);
      });
    } else {
      addTextElements(canvas);
    }
  };

  const addTextElements = (canvas: Canvas) => {
    // Title text (bottom center)
    const titleBox = new Textbox(articleTitle, {
      left: 50,
      top: 400,
      width: 980,
      fontSize: fontSizeTitle,
      fill: '#ffffff',
      textAlign: 'center',
      fontFamily: currentFont,
      fontWeight: 'bold',
      selectable: true,
    });
    canvas.add(titleBox);

    // Summary text
    const summaryBox = new Textbox(articleSummary, {
      left: 50,
      top: 650,
      width: 980,
      fontSize: fontSizeSummary,
      fill: '#dddddd',
      textAlign: 'center',
      fontFamily: currentFont,
      selectable: true,
    });
    canvas.add(summaryBox);

    canvas.renderAll();
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;
    const dataURL = fabricCanvasRef.current.toDataURL({
      multiplier: 2,
      format: 'png',
      quality: 1,
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `soim-post-${Date.now()}.png`;
    link.click();
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const fontName = file.name.replace(/\.[^/.]+$/, "");

    const fontFace = new FontFace(fontName, `url(${url})`);
    fontFace.load().then((loadedFace) => {
      document.fonts.add(loadedFace);
      setCurrentFont(fontName);
    });
  };

  const handleTemplateSave = () => {
    if (!fabricCanvasRef.current) return;
    const json = fabricCanvasRef.current.toJSON();
    onTemplateSave?.(JSON.stringify(json));
  };

  return (
    <div className="template-editor">
      <div className="editor-controls">
        <div className="control-group">
          <label>صور المقال</label>
          {articleImages.length > 0 ? (
            <div className="image-selector">
              {articleImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIndex(i)}
                  className={`image-btn ${selectedImageIndex === i ? 'active' : ''}`}
                >
                  <img src={img} alt={`صورة ${i + 1}`} />
                </button>
              ))}
            </div>
          ) : (
            <p>لا توجد صور في المقال</p>
          )}
        </div>

        <div className="control-group">
          <label>الخط</label>
          <select
            value={currentFont}
            onChange={(e) => setCurrentFont(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px' }}
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>
          <input
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFontUpload}
            style={{ marginTop: '0.5rem' }}
          />
        </div>

        <div className="control-group">
          <label>حجم خط العنوان: {fontSizeTitle}</label>
          <input
            type="range"
            min="24"
            max="80"
            value={fontSizeTitle}
            onChange={(e) => setFontSizeTitle(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>حجم خط الخلاصة: {fontSizeSummary}</label>
          <input
            type="range"
            min="16"
            max="48"
            value={fontSizeSummary}
            onChange={(e) => setFontSizeSummary(Number(e.target.value))}
          />
        </div>

        <div className="control-group actions">
          <button onClick={handleDownload} className="primary-btn">
            تحميل الصورة
          </button>
          <button onClick={handleTemplateSave} className="secondary-btn">
            حفظ القالب
          </button>
          {onLoadTemplate && (
            <label className="secondary-btn">
              تحميل قالب
              <input
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && onLoadTemplate(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

export default TemplateEditor;
