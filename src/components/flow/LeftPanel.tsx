
import React, { useState, useRef } from 'react';
import { NodeType } from '../HistoricalNode';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Resizable } from 're-resizable';
import Draggable from 'react-draggable';

export interface LeftPanelProps {
  onFitView: () => void;
  onDownloadPDF: () => void;
  onAddNode: (type: NodeType) => void;
  onAnalyzeText: (text: string) => Promise<void>;
  onAutoLayout: () => void;
  onMixedLayout: () => void;
  distributeNodesEvenly: () => void;
  additionalButtons?: { label: string; onClick: () => void }[];
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  onFitView,
  onDownloadPDF,
  onAddNode,
  onAnalyzeText,
  onAutoLayout,
  onMixedLayout,
  distributeNodesEvenly,
  additionalButtons,
}) => {
  const [text, setText] = useState('');
  const [width, setWidth] = useState(250);
  const [height, setHeight] = useState(400);
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const dragRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = () => {
    if (text.trim()) {
      onAnalyzeText(text);
      setText('');
    }
  };

  const handleResize = (e: any, direction: any, ref: any, d: any) => {
    setWidth((prevWidth) => prevWidth + d.width);
    setHeight((prevHeight) => prevHeight + d.height);
  };

  const handleDragStop = (e: any, data: any) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable
      nodeRef={dragRef}
      handle=".drag-handle"
      defaultPosition={{ x: position.x, y: position.y }}
      onStop={handleDragStop}
    >
      <div ref={dragRef} style={{ position: 'absolute', zIndex: 1000 }}>
        <div className="drag-handle bg-gray-100 px-3 py-2 text-sm font-medium border-b border-gray-200 cursor-move">
          اسحب للتحريك
        </div>
        <Resizable
          size={{ width, height }}
          minWidth={200}
          minHeight={300}
          maxWidth={400}
          maxHeight={600}
          onResize={handleResize}
          onResizeStop={handleResize}
          enable={{
            top: false,
            right: true,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: false,
            topLeft: false,
          }}
        >
          <div className="rounded-lg bg-white p-4 shadow-lg" style={{ width: '100%', height: '100%' }}>
            <div className="mb-4 space-y-2">
              <Button onClick={onFitView} variant="outline" className="w-full">
                تكبير/تصغير المخطط
              </Button>
              <Button onClick={onDownloadPDF} variant="outline" className="w-full">
                تحميل PDF
              </Button>
            </div>

            <div className="mb-4 space-y-2">
              <Button onClick={onAutoLayout} variant="outline" className="w-full">
                ترتيب تلقائي
              </Button>
              <Button onClick={onMixedLayout} variant="outline" className="w-full">
                ترتيب مختلط
              </Button>
              {additionalButtons?.map((button, index) => (
                <Button key={index} onClick={button.onClick} variant="outline" className="w-full">
                  {button.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">إضافة عنصر جديد</h3>
              <div className="grid grid-cols-2 gap-1">
                <Button onClick={() => onAddNode('event')} variant="outline" size="sm">
                  حدث 📅
                </Button>
                <Button onClick={() => onAddNode('person')} variant="outline" size="sm">
                  شخصية 👤
                </Button>
                <Button onClick={() => onAddNode('cause')} variant="outline" size="sm">
                  سبب ⚡
                </Button>
                <Button onClick={() => onAddNode('political')} variant="outline" size="sm">
                  سياسي 🏛️
                </Button>
                <Button onClick={() => onAddNode('economic')} variant="outline" size="sm">
                  اقتصادي 💰
                </Button>
                <Button onClick={() => onAddNode('social')} variant="outline" size="sm">
                  اجتماعي 👥
                </Button>
                <Button onClick={() => onAddNode('cultural')} variant="outline" size="sm">
                  ثقافي 🎭
                </Button>
                <Button onClick={() => onAddNode('term')} variant="outline" size="sm">
                  مصطلح 📖
                </Button>
                <Button onClick={() => onAddNode('date')} variant="outline" size="sm">
                  تاريخ ⏰
                </Button>
                <Button onClick={() => onAddNode('goal')} variant="outline" size="sm">
                  هدف 🎯
                </Button>
                <Button onClick={() => onAddNode('indicator')} variant="outline" size="sm">
                  مؤشر 📊
                </Button>
                <Button onClick={() => onAddNode('country')} variant="outline" size="sm">
                  دولة 🌍
                </Button>
                <Button onClick={() => onAddNode('other')} variant="outline" size="sm">
                  آخر ❔
                </Button>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h3 className="font-medium">تحليل النص</h3>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="أدخل النص للتحليل..."
                className="mb-2"
                dir="rtl"
              />
              <Button onClick={handleAnalyze} className="w-full" disabled={!text.trim()}>
                تحليل
              </Button>
            </div>
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
};
