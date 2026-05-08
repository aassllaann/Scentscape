import kagglehub

# Download latest version
path = kagglehub.dataset_download("nandini1999/perfume-recommendation-dataset")

print("Path to dataset files:", path)