// import { useEffect, useRef } from 'react';
// import * as mpFaceMesh from '@mediapipe/face_mesh';
// import { Camera } from '@mediapipe/camera_utils';

// const useEmotionDetection = (videoRef, canvasRef, emotionDisplayRef, isRunning, onEmotionsCollected) => {
//   const emotionQueue = useRef([]);
//   const isProcessing = useRef(false);

//   useEffect(() => {
//     if (!isRunning || !videoRef.current || !canvasRef.current) return;

//     const faceMesh = new mpFaceMesh.FaceMesh({
//       locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//     });

//     faceMesh.setOptions({
//       maxNumFaces: 1,
//       refineLandmarks: false,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     faceMesh.onResults(async (results) => {
//       const canvasCtx = canvasRef.current.getContext('2d');
//       canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

//       if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && !isProcessing.current) {
//         const landmarks = results.multiFaceLandmarks[0];
//         const flatLandmarks = landmarks.flatMap(pt => [pt.x, pt.y, pt.z]);

//         try {
//           isProcessing.current = true;
//           const response = await fetch('http://localhost:5000/detect_emotion', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ landmarks: flatLandmarks }),
//           });

//           const data = await response.json();
//           if (data.emotion) {
//             emotionDisplayRef.current.innerText = `Emotion: ${data.emotion}`;
//             emotionQueue.current.push(data.emotion);
//             if (emotionQueue.current.length >= 4) {
//               onEmotionsCollected([...emotionQueue.current]);
//               emotionQueue.current = [];
//             }
//           } else {
//             emotionDisplayRef.current.innerText = `Emotion: ${data.error || 'N/A'}`;
//             console.error('Server response:', data);
//           }
//         } catch (error) {
//           console.error('Emotion detection failed:', error);
//           emotionDisplayRef.current.innerText = 'Emotion: Error';
//         } finally {
//           isProcessing.current = false;
//         }
//       }
//     });

//     const camera = new Camera(videoRef.current, {
//       onFrame: async () => {
//         await faceMesh.send({ image: videoRef.current });
//       },
//       width: 640,
//       height: 480,
//     });

//     camera.start();

//     return () => {
//       camera.stop();
//     };
//   }, [isRunning, videoRef, canvasRef, emotionDisplayRef, onEmotionsCollected]);

//   return emotionQueue.current;
// };

// export default useEmotionDetection;
import { useEffect, useRef } from 'react';
import * as mpFaceMesh from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { API_BASE_URL } from '../../config';

const useEmotionDetection = (videoRef, canvasRef, emotionDisplayRef, isRunning, onEmotionsCollected) => {
  const emotionQueue = useRef([]);
  const isProcessing = useRef(false);

  useEffect(() => {
    console.log('🔍 useEmotionDetection: useEffect triggered. isRunning:', isRunning, 'videoRef ready:', !!videoRef.current, 'canvasRef ready:', !!canvasRef.current);
    if (!isRunning || !videoRef.current || !canvasRef.current) return;

    const faceMesh = new mpFaceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(async (results) => {
      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        console.log('👤 useEmotionDetection: Face landmarks detected!');
        if (!isProcessing.current) {
          const landmarks = results.multiFaceLandmarks[0];
          const flatLandmarks = landmarks.flatMap(pt => [pt.x, pt.y, pt.z]);

          try {
            isProcessing.current = true;
            console.log('📡 useEmotionDetection: Sending landmarks to backend...');
            const response = await fetch(`${API_BASE_URL}/child/detect-emotion`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('child_token')}`, // Include JWT token
              },
              body: JSON.stringify({ landmarks: flatLandmarks }),
            });

            const data = await response.json();
            console.log('📩 useEmotionDetection: Backend response:', data);
            if (data.emotion) {
              emotionDisplayRef.current.innerText = `Emotion: ${data.emotion}`;
              emotionQueue.current.push(data.emotion);
              if (emotionQueue.current.length >= 4) {
                onEmotionsCollected([...emotionQueue.current]);
                emotionQueue.current = [];
              }
            } else {
              emotionDisplayRef.current.innerText = `Emotion: ${data.error || 'N/A'}`;
              console.error('Server response:', data);
            }
          } catch (error) {
            console.error('Emotion detection failed:', error);
            emotionDisplayRef.current.innerText = 'Emotion: Error';
          } finally {
            isProcessing.current = false;
          }
        }
      } else {
        // No face detected
        // console.log('❌ useEmotionDetection: No face detected in frame');
      }
    });

    console.log('📹 useEmotionDetection: Starting camera...');
    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        // console.log('📸 useEmotionDetection: Camera frame capture');
        await faceMesh.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start()
      .then(() => console.log('✅ useEmotionDetection: Camera stream started successfully'))
      .catch(err => console.error('❌ useEmotionDetection: Camera start error:', err));

    return () => {
      console.log('🧹 useEmotionDetection: Stopping camera and cleaning up');
      camera.stop();
    };
  }, [isRunning, videoRef, canvasRef, emotionDisplayRef, onEmotionsCollected]);

  return emotionQueue.current;
};

export default useEmotionDetection;