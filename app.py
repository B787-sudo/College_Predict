from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import pandas as pd
import joblib
import os
import time
import requests
import google.genai as genai
from google.genai import types
from flask_socketio import SocketIO, emit
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "fallback_secret")

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client[os.getenv('MONGO_DB', 'college_db')]
users_col = db['users']
posts_col = db['posts']

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Google OAuth Config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Container for model and encoders
assets = {}

def load_all_assets():
    """Safely load all pickle files from disk"""
    paths = {
        'model': 'models/college_predictor_rf.pkl',
        'le_college': 'encoders/le_college.pkl',
        'le_course': 'encoders/le_course.pkl',
        'le_seattype': 'encoders/le_seattype.pkl',
        'le_prob': 'encoders/le_prob.pkl',
        'ui_data': 'encoders/ui_data.pkl'
    }
    timeout = 10
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            if not all(os.path.exists(p) for p in paths.values()):
                time.sleep(1)
                continue
            return {k: joblib.load(p) for k, p in paths.items()}
        except Exception as e:
            print(f"Retrying asset load: {e}")
            time.sleep(2)
    return None

# Initial load
assets = load_all_assets()

# --- Auth Routes ---
@app.route('/login')
def login():
    return render_template('login.html', google_client_id=GOOGLE_CLIENT_ID)

@app.route('/callback', methods=['POST'])
def callback():
    token = request.form.get('idtoken')
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        google_id = idinfo['sub']
        name = idinfo['name']
        email = idinfo['email']
        picture = idinfo.get('picture', '')

        # Store in MongoDB
        user = users_col.find_one({"google_id": google_id})
        
        if not user:
            result = users_col.insert_one({
                "google_id": google_id,
                "name": name,
                "email": email,
                "profile_pic": picture,
                "created_at": datetime.utcnow()
            })
            user_id = str(result.inserted_id)
        else:
            user_id = str(user['_id'])
        
        session['user_id'] = user_id
        session['user_name'] = name
        session['user_pic'] = picture
        
        return jsonify({"status": "success"})
    except ValueError:
        return jsonify({"status": "error"}), 400

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- Middleware: Enforce Login ---
@app.before_request
def enforce_login():
    # List of routes that don't require login
    public_routes = ['login', 'callback', 'static']
    if request.endpoint not in public_routes and 'user_id' not in session:
        return redirect(url_for('login'))

# --- Prediction Routes ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predictor')
def predictor():
    global assets
    if not assets: assets = load_all_assets()
    if not assets: return "Models not found. Run 'python train_model.py' first."
    
    ui_data = assets['ui_data']
    return render_template('predictor.html', 
                          courses=ui_data['Courses'], 
                          categories=ui_data['SeatTypes'],
                          regions=["All Regions"] + ui_data['Regions'])

@app.route('/predict', methods=['POST'])
def predict():
    try:
        global assets
        if not assets: assets = load_all_assets()
        
        m, lc, lco, ls, lp, ud = (
            assets['model'], assets['le_college'], assets['le_course'],
            assets['le_seattype'], assets['le_prob'], assets['ui_data']
        )
        
        data = request.json
        p_val = float(data.get('percentile', 0))
        selected_course = data['course']
        selected_category = data['category']
        selected_region = data['region']
        
        mapping = ud['Mapping']
        base_colleges = mapping.get((selected_course, selected_category), [])
        
        if not base_colleges:
            return jsonify([])

        if selected_region != "All Regions":
            base_colleges = [c for c in base_colleges if c['Region'] == selected_region]

        if not base_colleges:
            return jsonify([])

        available_college_names = [c['College Name'] for c in base_colleges]
        
        # Encoders
        course_idx = lco.transform([selected_course])[0]
        cat_idx = ls.transform([selected_category])[0]
        college_indices = lc.transform(available_college_names)
        
        X_input = pd.DataFrame({
            'College': college_indices,
            'Course': [course_idx] * len(college_indices),
            'SeatType': [cat_idx] * len(college_indices),
            'Percentile': [p_val] * len(college_indices)
        })
        
        preds = m.predict(X_input)
        pred_labels = lp.inverse_transform(preds)
        
        results = []
        for i, (name, pred) in enumerate(zip(available_college_names, pred_labels.tolist())):
            results.append({
                "college": name,
                "region": base_colleges[i].get('Region', 'N/A'),
                "probability": pred,
                "cutoff_percentile": float(base_colleges[i].get('Percentile', 0)),
                "cutoff_rank": int(base_colleges[i].get('Cutoff Rank', 0))
            })
        
        order = {'High': 0, 'Medium': 1, 'Low': 2}
        results.sort(key=lambda x: order.get(x['probability'], 3))
        
        return jsonify(results)
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500

# --- Community Routes ---
@app.route('/community')
def community_page():
    return render_template('community.html')

@app.route('/api/posts', methods=['GET', 'POST'])
def handle_posts():
    if request.method == 'POST':
        if 'user_id' not in session: return jsonify({"error": "Unauthorized"}), 401
        data = request.json
        posts_col.insert_one({
            "user_id": session['user_id'],
            "user_name": session['user_name'],
            "user_pic": session['user_pic'],
            "query": data['query'],
            "timestamp": datetime.utcnow()
        })
        return jsonify({"status": "posted"})
    
    # Fetch posts and join with user data if needed (here we store user_pic in post for efficiency)
    posts = list(posts_col.find().sort("timestamp", -1))
    formatted_posts = [{
        "user_name": p['user_name'],
        "query": p['query'],
        "timestamp": p['timestamp'].strftime("%d %b, %H:%M"),
        "profile_pic": p.get('user_pic', '')
    } for p in posts]
    
    return jsonify(formatted_posts)

# --- Chat Routes ---
@app.route('/chat')
def chat_page():
    return render_template('chat.html')

@socketio.on('message')
def handle_message(data):
    # Broadcast message to all connected clients except sender (handled in JS)
    emit('message', data, broadcast=True, include_self=False)

# --- AI Support Routes ---
@app.route('/api/ai_support', methods=['POST'])
def ai_support():
    if 'user_id' not in session: 
        return jsonify({"error": "Login required"}), 401
    
    user_query = request.json.get('query')
    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    try:
        # System prompt to focus on Maharashtra Admissions
        prompt = f"""
        You are an expert admission counselor for Engineering colleges in Maharashtra. 
        Your goal is to help students with queries about MHT-CET, CAP rounds, seat allotments, 
        Top colleges like COEP, VJTI, SPIT, and branch selections.
        
        Question: {user_query}
        
        Provide a concise, helpful, and professional response. If the question is not about 
        admissions or engineering colleges in Maharashtra, politely guide them back to the topic.
        """
        response = gemini_client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt
        )
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"Gemini error: {e}")
        return jsonify({"error": "AI service temporarily unavailable"}), 500

if __name__ == '__main__':
    # Using use_reloader=False to avoid WinError 10038 on Windows dev systems with SocketIO
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True, use_reloader=False)
