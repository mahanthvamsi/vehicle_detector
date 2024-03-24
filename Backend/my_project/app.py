from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import DetrImageProcessor, DetrForObjectDetection
from PIL import Image
import torch
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load DETR model and processor
processor = DetrImageProcessor.from_pretrained("facebook/detr-resnet-50", revision="no_timm")
model = DetrForObjectDetection.from_pretrained("facebook/detr-resnet-50", revision="no_timm")

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        # Read the image file with OpenCV
        in_memory_file = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(in_memory_file, cv2.IMREAD_COLOR)
        
        # Convert BGR (OpenCV) image to RGB (PIL)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image with DETR
        inputs = processor(images=Image.fromarray(rgb_image), return_tensors="pt")
        outputs = model(**inputs)
        
        # Convert outputs to COCO API format, filter by threshold
        target_sizes = torch.tensor([image.shape[:2]])
        results = processor.post_process_object_detection(outputs, target_sizes=target_sizes, threshold=0.9)[0]

        # Initialize a dictionary to count vehicles
        vehicle_counts = {}
        
        # Draw bounding boxes on the image using OpenCV and count vehicles
        for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
            box = box.int().tolist()
            cv2.rectangle(image, (box[0], box[1]), (box[2], box[3]), (255, 0, 0), 2)
            label_name = model.config.id2label[label.item()]
            if label_name in vehicle_counts:
                vehicle_counts[label_name] += 1
            else:
                vehicle_counts[label_name] = 1

        # Convert the OpenCV image with boxes back to base64 to send as JSON
        _, buffer = cv2.imencode('.jpg', image)
        img_str = base64.b64encode(buffer).decode()

        # Prepare and return the response with both the processed image and vehicle counts
        response_data = {
            'processedImage': img_str,
            'vehicleCounts': vehicle_counts
        }
        return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
