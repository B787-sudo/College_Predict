# 🎯 MHT-CET College Predictor

An AI-powered web application that predicts the probability of admission to various colleges based on MHT-CET cutoff ranks.

## 🚀 Features
- **AI Recommendation**: Uses a Random Forest Classifier trained on historical cutoff data.
- **Dynamic Prediction**: Predicts 'High', 'Medium', or 'Low' probability based on rank, course, and category.
- **Extensive Database**: Covers 330+ colleges and 90+ courses across Maharashtra.
- **Premium UI**: Built with Streamlit for a fast and interactive user experience.

## 📁 Directory Structure
- `Dataset/`: Contains the original CET DATA.csv.
- `models/`: Stores the trained Random Forest model.
- `encoders/`: Stores LabelEncoders for categorical features.
- `train_model.py`: Script to train the model and generate encoders.
- `app.py`: The Streamlit web application.
- `requirements.txt`: Python dependencies.

## 🛠️ Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Train the Model**:
   (The model and encoders should be generated from the dataset first)
   ```bash
   python train_model.py
   ```

3. **Run the Web Application**:
   ```bash
   streamlit run app.py
   ```

## 📊 Logic
The model classifies probability into:
- **High**: Student rank is significantly better (lower) than the historical cutoff.
- **Medium**: Student rank is close to the historical cutoff.
- **Low**: Student rank is higher than the historical cutoff.

## ⚠️ Disclaimer
Predictions are based on historical data and provide approximate likelihood. Actual admission results depend on year-to-year competition and official seat allotment.
