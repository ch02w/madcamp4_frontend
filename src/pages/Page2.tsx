import React, { useState, useEffect, useRef } from 'react';
import CRDTCanvas from '../components/CRDTCanvas';
import socketService from '../services/SocketService';
import { SketchPicker, ColorResult } from 'react-color';
import ThreeView from '../components/ThreeView';
import Timer from '../components/Timer';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import html2canvas from 'html2canvas';
import NFTMintingModal from '../components/NFTMintingModal';
import './Page2.css';
import { useNavigate } from 'react-router-dom';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

interface CRDTCanvasProps {
  pause: boolean;
  selectedColor: string;
  onCanvasClick: () => void;
  onCanvasUpdate: (canvasStates: CanvasState[]) => void; // Add this callback to update the canvas state
}

const Page2: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [pause, setPause] = useState<boolean>(false);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [selectedColor, setSelectedColor] = useState<string>('black');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [canvasStates, setCanvasStates] = useState<CanvasState[]>(Array(6).fill({}));
  const [showDownloadButton, setShowDownloadButton] = useState<boolean>(false);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintingURL, setMintingURL] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);  // Reference to the canvas container
  const navigate = useNavigate();

  useEffect(() => {
    socketService.on('remainingTime', (time: number) => {
      setRemainingTime(time);
      setPause(time <= 30000);
      setShowDownloadButton(time <= 30000);
    });

    socketService.on('canvasState', (state: { colors: string[], data: CanvasState[] }) => {
      setCanvasStates(state.data);
    });

    socketService.on('clearCanvas', () => {
      setCanvasStates(Array(6).fill({})); // Clear the canvas states
    });

    return () => {
      socketService.off('remainingTime');
      socketService.off('canvasState');
      socketService.off('clearCanvas');
    };
  }, []);

  const handleColorChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
  };

  const generateGLB = () => {
    const scene = new THREE.Scene();
    const materialArray = canvasStates.map((canvasState) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        Object.entries(canvasState).forEach(([key, { value }]) => {
          const [_, x, y] = key.split('-');
          ctx.fillStyle = `#${value.toString(16).padStart(6, '0')}`;
          ctx.fillRect(parseInt(x), parseInt(y), 10, 10);
        });
      }
      const texture = new THREE.CanvasTexture(canvas);
      return new THREE.MeshBasicMaterial({ map: texture });
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      materialArray[0], // Front (z+)
      materialArray[1], // Back (z-)
      materialArray[2], // Top (y+)
      materialArray[3], // Bottom (y-)
      materialArray[4], // Left (x-)
      materialArray[5], // Right (x+)
    ];
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          saveArrayBuffer(result, 'canvas.glb');
        } else {
          console.error('Unexpected result format from GLTFExporter');
        }
      },
      (error) => console.error('An error occurred during parsing', error),
      { binary: true }
    );
  };

  const saveArrayBuffer = (buffer: ArrayBuffer, filename: string) => {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }));
    link.download = filename;
    link.click();
    document.body.removeChild(link);
  };

  const exportToPNG = async () => {
    if (canvasRef.current) {
      const canvas = await html2canvas(canvasRef.current);
      const pngData = canvas.toDataURL('image/png');
      setMintingURL(pngData);
      setIsMinting(true);
    }
  };

  const handleCanvasClick = () => {
  };

  const handleCanvasUpdate = (updatedCanvasStates: CanvasState[]) => {
    setCanvasStates(updatedCanvasStates);
  };

  const handleCloseModal = () => {
    setIsMinting(false);
  };

  return (
    <div className="page-container" style={{ ...backgroundStyle }}>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <Timer remainingTime={remainingTime} />
      </div>
      <div className="content" style={{marginTop: '50px'}}>
        <div className="canvas-wrapper" ref={canvasRef}>
          <CRDTCanvas pause={pause} selectedColor={selectedColor} onCanvasClick={handleCanvasClick} onCanvasUpdate={handleCanvasUpdate} />
        </div>
        <div className="color-picker-wrapper">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="color-picker-button"
          >
            {showColorPicker ? 'Hide Color Picker' : 'Show Color Picker'}
          </button>
          {showColorPicker && (
            <div className="color-picker">
              <SketchPicker color={selectedColor} onChangeComplete={handleColorChange} />
            </div>
          )}
          {showDownloadButton && (
            <>
              <button onClick={generateGLB} className="download-button">
                Download GLB
              </button>
              <button onClick={exportToPNG} className="download-button">
                Export to PNG
              </button>
            </>
          )}
        </div>
        <NFTMintingModal isOpen={isMinting} onClose={handleCloseModal} url={mintingURL} />
        <div className="threeview-wrapper">
          <ThreeView canvasStates={canvasStates} />
        </div>
      </div>
    </div>
  );
};

export default Page2;
