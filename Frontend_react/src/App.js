import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from './App.module.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [vehicleCounts, setVehicleCounts] = useState({});
  const [originalImagePreview, setOriginalImagePreview] = useState(null);

  const handleFileChange = event => {
    setSelectedFile(event.target.files[0]);
    setOriginalImagePreview(URL.createObjectURL(event.target.files[0]));
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProcessedImage(response.data.processedImage);
      setVehicleCounts(response.data.vehicleCounts); 
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <>
      <nav className={`navbar navbar-expand-lg ${styles['navbar']}`}>
      <a className={`navbar-brand ${styles['navbar-brand-text']}`} href="#">Image Processor</a>
      </nav>
      <div className="container mt-4">
        <h2 className={`h2 ${styles['h2']}`}>Upload Image</h2>
        <input type="file" onChange={handleFileChange} className= {`form-control-file ${styles['choose']}`} />
        <button onClick={handleUpload} className={`btn btn-primary mt-2 ${styles['button']}`}>proceed</button>
        
        {/* Original Image Display */}
         {originalImagePreview && (
            <div className={styles.imageContainer}> {/* Apply imageContainer class */}
              <h5>Original Image</h5>
              <img src={originalImagePreview} alt="Original" className={styles.imagePreview} />
            </div>
          )}

          {/* Processed Image Display */}
          {processedImage && (
            <div className={styles.imageContainer}> {/* Apply imageContainer class */}
              <h5>Processed Image</h5>
              <img src={`data:image/jpeg;base64,${processedImage}`} alt="Processed" className={styles.imagePreview} />
            </div>
          )}
        {/* Vehicle Counts Display */}
        {Object.keys(vehicleCounts).length > 0 && (
          <div className={styles.count} >
            <h5>Vehicle Counts</h5>
            <ul>
              {Object.entries(vehicleCounts).map(([vehicleType, count]) => (
                <li key={vehicleType}>{`${vehicleType}: ${count}`}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}

export default App;