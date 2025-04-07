import os
import cv2
import numpy as np
from sklearn.model_selection import train_test_split
from collections import defaultdict

# Configuration
TARGET_SIZE = (256, 256)
TARGET_CROPS = ['rice', 'wheat', 'maize']  # Add other crops as needed
MIN_SAMPLES = 500  # Minimum samples per class
OUTPUT_DIR = 'processed_plantvillage'

def load_and_filter_dataset(base_path):
    class_counts = defaultdict(int)
    image_paths = []
    labels = []
    
    for split in ['train', 'validation']:
        split_path = os.path.join(base_path, split)
        for crop_dir in os.listdir(split_path):
            if not any(crop in crop_dir.lower() for crop in TARGET_CROPS):
                continue
                
            class_path = os.path.join(split_path, crop_dir)
            if not os.path.isdir(class_path):
                continue
                
            for img_file in os.listdir(class_path):
                if img_file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    img_path = os.path.join(class_path, img_file)
                    image_paths.append(img_path)
                    labels.append(crop_dir)
                    class_counts[crop_dir] += 1
    
    return image_paths, labels, class_counts

def process_images(image_paths, labels):
    processed_images = []
    processed_labels = []
    
    for img_path, label in zip(image_paths, labels):
        try:
            # Read and resize image
            img = cv2.imread(img_path)
            img = cv2.resize(img, TARGET_SIZE)
            
            # Convert to RGB and normalize
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = img / 255.0
            
            processed_images.append(img)
            processed_labels.append(label)
        except Exception as e:
            print(f"Error processing {img_path}: {str(e)}")
    
    return np.array(processed_images), np.array(processed_labels)

def balance_dataset(images, labels, min_samples):
    unique_labels = np.unique(labels)
    balanced_images = []
    balanced_labels = []
    
    for label in unique_labels:
        label_indices = np.where(labels == label)[0]
        if len(label_indices) > min_samples:
            selected_indices = np.random.choice(label_indices, min_samples, replace=False)
        else:
            selected_indices = label_indices
            
        balanced_images.extend(images[selected_indices])
        balanced_labels.extend(labels[selected_indices])
    
    return np.array(balanced_images), np.array(balanced_labels)

def save_processed_dataset(images, labels, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    for i, (img, label) in enumerate(zip(images, labels)):
        class_dir = os.path.join(output_dir, label)
        os.makedirs(class_dir, exist_ok=True)
        img_path = os.path.join(class_dir, f'img_{i}.jpg')
        cv2.imwrite(img_path, cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2BGR))

def main():
    dataset_path = os.path.expanduser('~/Desktop/plantdisease')
    
    print("Loading and filtering dataset...")
    image_paths, labels, class_counts = load_and_filter_dataset(dataset_path)
    print(f"Found {len(image_paths)} images across {len(class_counts)} classes")
    print("Class distribution:", class_counts)
    
    print("\nProcessing images...")
    images, labels = process_images(image_paths, labels)
    
    print("\nBalancing dataset...")
    balanced_images, balanced_labels = balance_dataset(images, labels, MIN_SAMPLES)
    print(f"Final balanced dataset: {len(balanced_images)} images")
    
    print("\nSaving processed dataset...")
    save_processed_dataset(balanced_images, balanced_labels, OUTPUT_DIR)
    print(f"Processing complete. Dataset saved to {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
