import os
import re
import torch
import joblib
import numpy as np
from pathlib import Path
from flask import Flask, render_template, request, jsonify
from transformers import BertTokenizer, BertModel

app = Flask(__name__)

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Configure device (M1 GPU support if available)
device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
print(f"Using device: {device}")

# PHQ-9 questions
phq9_questions = [
    "How often have you been bothered by feeling down, depressed, or hopeless over the last 2 weeks?",
    "How often have you had little interest or pleasure in doing things over the last 2 weeks?",
    "How often have you had trouble falling or staying asleep, or sleeping too much over the last 2 weeks?",
    "How often have you been feeling tired or having little energy over the last 2 weeks?",
    "How often have you had poor appetite or overeating over the last 2 weeks?",
    "How often have you felt bad about yourself — or that you are a failure or have let yourself or your family down over the last 2 weeks?",
    "How often have you had trouble concentrating on things, such as reading the newspaper or watching television over the last 2 weeks?",
    "How often have you been moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual over the last 2 weeks?",
    "How often have you had thoughts that you would be better off dead or of hurting yourself in some way over the last 2 weeks?"
]

# Load models and tokenizer
print("Loading models...")
try:
    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    bert_model = BertModel.from_pretrained("bert-base-uncased").to(device)
    clf = joblib.load(BASE_DIR / "models" / "bert_rf_model.pkl")
    label_encoder = joblib.load(BASE_DIR / "models" / "label_encoder.pkl")
    print("Models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")
    import sys
    sys.exit(1)

# Generate BERT embeddings
def get_bert_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = bert_model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy().reshape(1, -1)

# Route for home page
@app.route('/')
def index():
    return render_template('Mindease.html', questions=phq9_questions)

# Prediction endpoint
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Fetch and validate responses
        responses = [request.form.get(f'q{i+1}', '').strip() for i in range(9)]

        for i, resp in enumerate(responses):
            if not resp:
                return jsonify({
                    'error': f'Please answer question {i+1}',
                    'question': i+1
                }), 400

        # Combine and clean text
        combined_text = " ".join([f"Question {i+1}: {resp}" for i, resp in enumerate(responses)])
        cleaned_text = re.sub(r"[^a-zA-Z\s]", "", combined_text.lower())

        # Get prediction
        embedding = get_bert_embedding(cleaned_text)
        pred_label = clf.predict(embedding)[0]
        severity = label_encoder.inverse_transform([pred_label])[0]

        # Descriptions and recommendations
        severity_descriptions = {
            "Minimal": "Your responses suggest minimal signs of depression. Continue practicing self-care and monitor your mood regularly.",
            "Mild": "Your responses indicate mild symptoms of depression. Consider talking to someone you trust about how you're feeling.",
            "Moderate": "Your responses suggest moderate depression symptoms. Professional support may be beneficial at this stage.",
            "Moderately Severe": "Your responses indicate moderately severe depression. We recommend consulting a mental health professional.",
            "Severe": "Your responses suggest severe depression symptoms. Please seek professional help as soon as possible."
        }

        recommendations = {
            "Minimal": ["Practice regular self-care activities", "Maintain social connections", "Engage in physical activity"],
            "Mild": ["Consider talking to a counselor", "Try mood tracking apps", "Practice mindfulness techniques"],
            "Moderate": ["Schedule an appointment with your doctor", "Explore therapy options", "Consider joining a support group"],
            "Moderately Severe": ["Contact a mental health professional immediately", "Discuss treatment options with your doctor", "Reach out to trusted friends or family"],
            "Severe": ["Seek professional help immediately", "Contact a crisis helpline if needed", "Reach out to your support network"]
        }

        return jsonify({
            'severity': severity,
            'description': severity_descriptions.get(severity, "No description available"),
            'recommendations': recommendations.get(severity, [])
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': 'An error occurred during processing. Please try again.'}), 500

# Do NOT run in production with this — use Gunicorn instead
if __name__ == '__main__':
    app.run(port=5001, use_reloader=False)
